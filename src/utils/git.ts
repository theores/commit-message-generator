import type { Uri } from 'vscode'
import * as fs from 'node:fs'
import path from 'node:path'
import simpleGit from 'simple-git'
import { extensions, l10n, window } from 'vscode'
import { isPathInside, isSamePath } from './path'

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
export interface RepoContext {
  rootUri?: Uri
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
    const resourcePath = context.rootUri.fsPath
    const exactRepo = gitApi.repositories.find(repo => isSamePath(repo.rootUri.fsPath, resourcePath))
    if (exactRepo) {
      return exactRepo
    }

    const matchingRepos = gitApi.repositories.filter(repo => isPathInside(repo.rootUri.fsPath, resourcePath))

    if (matchingRepos.length === 1) {
      return matchingRepos[0]
    }
  }

  // 如果没匹配到且只有一个仓库，直接返回
  if (gitApi.repositories.length === 1) {
    return gitApi.repositories[0]
  }

  const picked = await window.showQuickPick(
    gitApi.repositories.map(repo => ({
      label: path.basename(repo.rootUri.fsPath),
      description: repo.rootUri.fsPath,
      repo,
    })),
    {
      title: l10n.t('Select Git Repository'),
      placeHolder: l10n.t('Select the repository whose changes should be analyzed.'),
    },
  )

  if (!picked) {
    const error = new Error(l10n.t('Repository selection was cancelled.'))
    error.name = 'AbortError'
    throw error
  }

  return picked.repo
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
export async function getDiff(repo: GitRepository, maxLength = 100000): Promise<string> {
  const rootPath = repo.rootUri.fsPath
  const git = simpleGit(rootPath)
  const [diff, status] = await Promise.all([
    git.diff(['--no-ext-diff']),
    git.status(),
  ])
  const patches = [diff]
  let remainingLength = Math.max(0, maxLength - diff.length)

  for (const relativePath of status.not_added) {
    if (remainingLength <= 0) {
      break
    }

    const absolutePath = path.resolve(rootPath, relativePath)
    if (!isPathInside(rootPath, absolutePath)) {
      continue
    }

    const patch = await createUntrackedFilePatch(absolutePath, relativePath, remainingLength)
    if (!patch) {
      continue
    }

    patches.push(patch)
    remainingLength -= patch.length
  }

  return patches.filter(Boolean).join('\n')
}

async function createUntrackedFilePatch(
  absolutePath: string,
  relativePath: string,
  maxLength: number,
): Promise<string> {
  try {
    const stats = await fs.promises.stat(absolutePath)
    if (!stats.isFile()) {
      return ''
    }

    const normalizedPath = relativePath.replaceAll('\\', '/')
    const header = `diff --git a/${normalizedPath} b/${normalizedPath}\nnew file mode 100644\n--- /dev/null\n+++ b/${normalizedPath}\n`
    const availableLength = Math.max(0, Math.min(20000, maxLength - header.length))

    if (stats.size > availableLength) {
      return `${header}@@\n+[Untracked file content omitted because the file is too large.]`
    }

    const content = await fs.promises.readFile(absolutePath)
    if (content.includes(0)) {
      return `${header}Binary files differ`
    }

    const lines = content.toString('utf8').split('\n').map(line => `+${line}`).join('\n')
    return `${header}@@ -0,0 +1 @@\n${lines}`
  }
  catch {
    return ''
  }
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

  const rawMergeHeadPath = (await git.raw(['rev-parse', '--git-path', 'MERGE_HEAD'])).trim()
  const mergeHeadPath = path.isAbsolute(rawMergeHeadPath)
    ? rawMergeHeadPath
    : path.resolve(rootPath, rawMergeHeadPath)
  if (fs.existsSync(mergeHeadPath)) {
    return l10n.t('Merge in progress. Please finish the merge before generating a commit message.')
  }

  return null
}
