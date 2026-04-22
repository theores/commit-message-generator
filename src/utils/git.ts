import type { Uri } from 'vscode'
import * as fs from 'node:fs'
import simpleGit from 'simple-git'
import { extensions, l10n } from 'vscode'

/**
 * VS Code Git 扩展导出的仓库接口
 */
export interface GitRepository {
  rootUri: Uri
  inputBox?: {
    value: string
  }
}

interface GitApi {
  repositories: GitRepository[]
}

interface GitExtensionExports {
  getAPI: (version: number) => GitApi
}

/**
 * 仓库上下文接口，兼容 VS Code 传入的 SourceControl 或其它包含 rootUri 的对象
 */
interface RepoContext {
  rootUri?: Uri
}

function resolveRealPath(path: string): string {
  try {
    return fs.realpathSync(path)
  }
  catch {
    return path
  }
}

/**
 * 获取 Git 仓库实例
 * @param context 上下文对象（可选），用于精确定位仓库
 * @returns Git 仓库实例
 * @throws 如果 Git 扩展未找到或没有仓库则抛出错误
 */
export async function getRepo(context?: RepoContext): Promise<GitRepository> {
  const gitExtension = extensions.getExtension<GitExtensionExports>('vscode.git')
  if (!gitExtension || typeof gitExtension.exports?.getAPI !== 'function') {
    throw new Error(l10n.t('Git extension not found.'))
  }

  const gitApi = gitExtension.exports.getAPI(1)

  if (!gitApi?.repositories?.length) {
    throw new Error(l10n.t('No Git repositories found in the current workspace.'))
  }

  // 如果传入了上下文且包含 rootUri，则尝试精确匹配
  if (context?.rootUri) {
    const resourcePath = resolveRealPath(context.rootUri.fsPath)
    const matchedRepo = gitApi.repositories.find((repo) => {
      const repoPath = resolveRealPath(repo.rootUri.fsPath)
      return resourcePath.startsWith(repoPath) || repoPath.startsWith(resourcePath)
    })

    if (matchedRepo) {
      return matchedRepo
    }
  }

  // 如果没匹配到且只有一个仓库，直接返回
  if (gitApi.repositories.length === 1) {
    return gitApi.repositories[0]
  }

  // 兜底：返回第一个仓库（后续可在 commands 中增加 QuickPick 逻辑）
  return gitApi.repositories[0]
}

/**
 * 暂存所有更改 (git add .)
 * @param repo Git 仓库实例
 */
export async function stageAll(repo: GitRepository): Promise<void> {
  const rootPath = repo.rootUri.fsPath
  const git = simpleGit(rootPath)
  await git.add('.')
}

/**
 * 获取暂存区的 diff
 * @param repo Git 仓库实例
 * @returns 暂存区的 diff 内容
 */
export async function getDiffStaged(repo: GitRepository): Promise<string> {
  const rootPath = repo.rootUri.fsPath
  const git = simpleGit(rootPath)
  const diff = await git.diff(['--staged'])

  return diff || ''
}

/**
 * 获取工作区的 diff（未暂存）
 * @param repo Git 仓库实例
 * @returns 未暂存的 diff 内容
 */
export async function getDiff(repo: GitRepository): Promise<string> {
  const rootPath = repo.rootUri.fsPath
  const git = simpleGit(rootPath)
  const diff = await git.diff()

  return diff || ''
}

/**
 * 检查仓库是否存在冲突或正在合并
 * @param repo Git 仓库实例
 * @returns 冲突状态信息，null 表示无冲突
 */
export async function checkConflicts(repo: GitRepository): Promise<string | null> {
  const rootPath = repo.rootUri.fsPath
  const git = simpleGit(rootPath)
  const status = await git.status()

  if (status.conflicted.length > 0) {
    return l10n.t('There are unresolved conflicts. Please resolve them first.')
  }

  // 检查是否在合并中（通常通过 .git/MERGE_HEAD 存在与否判断，或者 status 包含相关信息）
  const mergeHeadPath = `${rootPath}/.git/MERGE_HEAD`
  if (fs.existsSync(mergeHeadPath)) {
    return l10n.t('Merge in progress. Please finish the merge before generating a commit message.')
  }

  return null
}
