import type { CancellationToken, Progress } from 'vscode'
import type { GitRepository, RepoContext } from './utils/git'
import { commands, ConfigurationTarget, env, l10n, ProgressLocation, window } from 'vscode'
import { generateCommitPrompt } from './prompts'
import { AbortManager } from './utils/abort-manager'
import { sanitizeCommitMessage } from './utils/commit-message'
import { config } from './utils/config'
import { CONTEXT_KEYS } from './utils/constants'
import { prepareDiff } from './utils/diff'
import { getUserFriendlyErrorMessage, shouldSilenceError } from './utils/error-handler'
import { checkConflicts, getDiff, getDiffStaged, getRepo, stageAll } from './utils/git'
import { logger, validateConfig } from './utils/index'
import { ChatGPTStreamAPI, getAvailableModels } from './utils/openai'
import { tokenTracker } from './utils/token-tracker'

/**
 * AbortController 管理器实例
 */
const abortManager = new AbortManager()

/**
 * 生成 commit 消息命令
 * @param context SCM 上下文或其他触发对象
 */
async function generateCommit(context?: RepoContext) {
  if (!config.getUiConfig().showProgress) {
    return runGenerateCommit(context)
  }

  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: l10n.t('Generating commit message'),
      cancellable: true,
    },
    (progress, token) => runGenerateCommit(context, progress, token),
  )
}

async function runGenerateCommit(
  context?: RepoContext,
  progress?: Progress<{ message?: string, increment?: number }>,
  cancellationToken?: CancellationToken,
) {
  // 立即终止之前的任何待处理请求，防止内容重叠
  abortManager.abortAll()

  const controller = abortManager.createController()
  const cancellationDisposable = cancellationToken?.onCancellationRequested(() => controller.abort())
  let generatingRepositoryUri = context?.rootUri?.toString()
  let generatingStatePromise: Thenable<unknown> = generatingRepositoryUri
    ? commands.executeCommand('setContext', CONTEXT_KEYS.GENERATING_REPOSITORY_URIS, [generatingRepositoryUri])
    : Promise.resolve()
  tokenTracker.startSession()
  let scmInputBox: GitRepository['inputBox']
  let originalInput = ''
  let generationCompleted = false
  let updateTimer: ReturnType<typeof setTimeout> | undefined

  try {
    logger.info('Starting commit generation workflow')
    progress?.report({ message: l10n.t('Preparing generation...'), increment: 5 })

    // 验证配置
    const validation = validateConfig([
      { key: 'service.apiKey', required: true, errorMessage: l10n.t('API Key is required. Please configure it in settings.') },
      { key: 'service.baseURL', required: true, errorMessage: l10n.t('Base URL is required. Please configure it in settings.') },
      { key: 'service.model', required: true, errorMessage: l10n.t('Model is required. Please configure it in settings.') },
    ])
    if (!validation.isValid) {
      const action = l10n.t('Go to Settings')
      window.showErrorMessage(validation.error!, action).then((selection) => {
        if (selection === action) {
          commands.executeCommand('workbench.action.openSettings', 'commit-message-generator')
        }
      })
      return
    }

    progress?.report({ message: l10n.t('Checking Git repository...'), increment: 10 })
    const repo = await getRepo(context)
    const resolvedRepositoryUri = repo.rootUri.toString()
    if (resolvedRepositoryUri !== generatingRepositoryUri) {
      generatingRepositoryUri = resolvedRepositoryUri
      generatingStatePromise = commands.executeCommand(
        'setContext',
        CONTEXT_KEYS.GENERATING_REPOSITORY_URIS,
        [generatingRepositoryUri],
      )
    }
    const commitConfig = config.getCommitConfig()
    progress?.report({ message: l10n.t('Collecting code changes...'), increment: 15 })

    let conflictMessage: string | null
    let diff: string

    if (commitConfig.autoStage) {
      conflictMessage = await checkConflicts(repo)
      if (!conflictMessage) {
        logger.info('Auto-staging changes...')
        await stageAll(repo)
      }
      diff = conflictMessage ? '' : await getDiffStaged(repo)
    }
    else {
      [conflictMessage, diff] = await Promise.all([
        checkConflicts(repo),
        getDiffStaged(repo),
      ])
    }

    if (conflictMessage) {
      window.showErrorMessage(conflictMessage)
      return
    }

    // 如果暂存区为空，尝试获取工作区的 diff
    if (!diff) {
      logger.info('No staged changes found, checking unstaged changes...')
      diff = await getDiff(repo, commitConfig.maxDiffLength)
    }

    if (!diff) {
      logger.info('No changes found in workspace')
      window.showInformationMessage(l10n.t('No changes to commit.'))
      return
    }

    const preparedDiff = prepareDiff(diff, commitConfig.maxDiffLength)
    diff = preparedDiff.content

    if (preparedDiff.truncated) {
      window.showWarningMessage(l10n.t('The diff was truncated to {0} characters to improve speed and avoid exceeding the model context limit.', commitConfig.maxDiffLength))
    }

    progress?.report({ message: l10n.t('Preparing AI request...'), increment: 20 })

    // 获取 SCM 输入框
    scmInputBox = repo.inputBox
    if (!scmInputBox) {
      throw new Error(l10n.t('Unable to find SCM input box.'))
    }
    originalInput = scmInputBox.value

    const prompts = generateCommitPrompt(diff)
    progress?.report({ message: l10n.t('Waiting for AI service...'), increment: 20 })

    // 执行流式生成
    let generatedText = ''
    let receivedFirstChunk = false
    const flushGeneratedText = () => {
      updateTimer = undefined
      if (abortManager.isCurrent(controller) && !controller.signal.aborted) {
        scmInputBox!.value = generatedText
      }
    }
    const apiResult = await ChatGPTStreamAPI(
      prompts,
      (chunk) => {
        if (!abortManager.isCurrent(controller) || controller.signal.aborted) {
          return
        }
        generatedText += chunk
        if (!receivedFirstChunk) {
          receivedFirstChunk = true
          progress?.report({ message: l10n.t('Generating commit message...'), increment: 20 })
        }
        if (!updateTimer) {
          updateTimer = setTimeout(flushGeneratedText, 40)
        }
      },
      { signal: controller.signal },
    )

    if (updateTimer) {
      clearTimeout(updateTimer)
      updateTimer = undefined
    }

    if (!abortManager.isCurrent(controller) || controller.signal.aborted) {
      return
    }

    const finalContent = sanitizeCommitMessage(apiResult.content)
    if (finalContent) {
      scmInputBox.value = finalContent
    }

    // 记录 token 使用信息
    if (apiResult.usage) {
      tokenTracker.updateUsage(apiResult.usage)
    }

    generationCompleted = true
    progress?.report({ message: l10n.t('Generation complete'), increment: 10 })
    logger.info('Commit message generated successfully')
  }
  catch (error: unknown) {
    if (abortManager.isCurrent(controller) && scmInputBox && !generationCompleted) {
      scmInputBox.value = originalInput
    }

    if (shouldSilenceError(error)) {
      logger.info('Generation cancelled by user')
      return
    }

    logger.error('Failed to generate commit message', error)
    window.showErrorMessage(getUserFriendlyErrorMessage(error))
  }
  finally {
    cancellationDisposable?.dispose()
    if (updateTimer) {
      clearTimeout(updateTimer)
    }

    if (abortManager.complete(controller)) {
      tokenTracker.endSession()
      await Promise.resolve(generatingStatePromise)
        .catch((error: unknown) => logger.warn('Failed to set generation context', error))
      await commands.executeCommand('setContext', CONTEXT_KEYS.GENERATING_REPOSITORY_URIS, [])
    }
  }
}

/**
 * 停止生成命令
 */
async function stopGeneration() {
  logger.info('Stopping generation...')
  abortManager.abortAll()
}

/**
 * 选择可用模型命令
 */
async function selectAvailableModel() {
  try {
    logger.info('Fetching available models')

    const validation = validateConfig([
      { key: 'service.apiKey', required: true, errorMessage: l10n.t('API Key is required. Please configure it in settings.') },
      { key: 'service.baseURL', required: true, errorMessage: l10n.t('Base URL is required. Please configure it in settings.') },
    ])
    if (!validation.isValid) {
      const action = l10n.t('Go to Settings')
      window.showErrorMessage(validation.error!, action).then((selection) => {
        if (selection === action) {
          commands.executeCommand('workbench.action.openSettings', 'commit-message-generator')
        }
      })
      return
    }

    const models = await getAvailableModels()
    if (!models.length) {
      window.showWarningMessage(l10n.t('No models available from current API configuration.'))
      return
    }

    const currentModel = config.get<string>('service.model')
    const items = models.map(model => ({
      label: model,
      description: model === currentModel ? l10n.t('Current') : undefined,
    }))

    const picked = await window.showQuickPick(items, {
      title: l10n.t('Select Model'),
      placeHolder: l10n.t('Please select a model to generate commit messages.'),
      matchOnDescription: true,
    })

    if (picked) {
      await config.update('service.model', picked.label, ConfigurationTarget.Global)
      window.showInformationMessage(l10n.t('Model updated to {0}.', picked.label))
    }
  }
  catch (error: unknown) {
    logger.error('Failed to select model', error)
    window.showErrorMessage(getUserFriendlyErrorMessage(error))
  }
}

/**
 * 显示 Token 使用统计命令
 */
async function showTokenStats() {
  try {
    const currentStats = tokenTracker.getCurrentStats()
    const historicalStats = tokenTracker.getHistoricalStats()

    if (!historicalStats) {
      window.showInformationMessage(l10n.t('No usage records'))
      return
    }

    const items: string[] = []
    if (currentStats) {
      items.push(
        `【${l10n.t('Last Operation')}】`,
        `${l10n.t('Total Tokens')}: ${currentStats.totalTokens}`,
        `${l10n.t('Prompt Tokens')}: ${currentStats.promptTokens}`,
        `${l10n.t('Completion Tokens')}: ${currentStats.completionTokens}`,
        '',
      )
    }

    items.push(
      `【 ${l10n.t('Cumulative Statistics')}】`,
      `${l10n.t('Total Operations')}: ${historicalStats.operationCount}`,
      `${l10n.t('Total Tokens')}: ${historicalStats.totalTokens}`,
    )

    const message = items.join('\n')
    const copyLabel = l10n.t('Copy')
    const okLabel = l10n.t('OK')

    // 使用 MessageItem 对象并设置 isCloseAffordance 为 true，
    // 这样 VS Code 就不会再额外添加一个“取消”按钮了。
    const selection = await window.showInformationMessage<{ title: string, isCloseAffordance?: boolean }>(
      message,
      { modal: true },
      { title: copyLabel },
      { title: okLabel, isCloseAffordance: true },
    )

    if (selection?.title === copyLabel) {
      await env.clipboard.writeText(message)
      window.showInformationMessage(l10n.t('Statistics copied to clipboard'))
    }
  }
  catch (error: unknown) {
    logger.error('Failed to show token stats', error)
    window.showErrorMessage(getUserFriendlyErrorMessage(error))
  }
}

/**
 * 重置 Token 使用统计命令
 */
async function resetTokenStats() {
  try {
    const confirmed = await window.showWarningMessage(
      l10n.t('Are you sure you want to reset all Token usage statistics?'),
      { modal: true },
      l10n.t('Reset'),
    )

    if (confirmed) {
      await tokenTracker.reset()
      window.showInformationMessage(l10n.t('Token usage statistics have been reset'))
    }
  }
  catch (error: unknown) {
    logger.error('Failed to reset token stats', error)
    window.showErrorMessage(getUserFriendlyErrorMessage(error))
  }
}

export {
  generateCommit,
  resetTokenStats,
  selectAvailableModel,
  showTokenStats,
  stopGeneration,
}
