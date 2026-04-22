import { commands, ConfigurationTarget, l10n, window } from 'vscode'
import { generateCommitPrompt } from './prompts'
import { AbortManager } from './utils/abort-manager'
import { config } from './utils/config'
import { getUserFriendlyErrorMessage, shouldSilenceError } from './utils/error-handler'
import { getDiffStaged, getRepo, stageAll } from './utils/git'
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
async function generateCommit(context?: any) {
  const controller = abortManager.createController()

  // 开始一个新的 token 统计会话
  tokenTracker.startSession()

  try {
    logger.info('Starting commit generation workflow')

    // 验证配置
    const validation = validateConfig([
      { key: 'service.apiKey', required: true, errorMessage: l10n.t('API Key is required. Please configure it in settings.') },
      { key: 'service.baseURL', required: true, errorMessage: l10n.t('Base URL is required. Please configure it in settings.') },
      { key: 'service.model', required: true, errorMessage: l10n.t('Model is required. Please configure it in settings.') },
    ])
    if (!validation.isValid) {
      window.showErrorMessage(validation.error!)
      return
    }

    // 获取仓库
    const repo = await getRepo(context)
    const commitConfig = config.getCommitConfig()

    // 自动暂存逻辑
    if (commitConfig.autoStage) {
      logger.info('Auto-staging changes...')
      await stageAll(repo)
    }

    // 获取暂存区的 diff
    const diff = await getDiffStaged(repo)
    if (!diff) {
      logger.info('No staged changes found')
      window.showInformationMessage(l10n.t('No staged changes to commit.'))
      return
    }

    logger.debug('Retrieved staged changes', { diffLength: diff.length })

    // 获取 SCM 输入框
    const scmInputBox = repo.inputBox
    if (!scmInputBox) {
      throw new Error(l10n.t('Unable to find SCM input box.'))
    }

    // 设置正在生成的上下文（切换图标）
    await commands.executeCommand('setContext', 'commit-message-generator.isGenerating', true)

    // 清空输入框以便流式填入（可选，或者在末尾追加）
    scmInputBox.value = ''

    const prompts = await generateCommitPrompt(diff)

    // 执行流式生成
    const apiResult = await ChatGPTStreamAPI(
      prompts,
      (chunk) => {
        scmInputBox.value += chunk
      },
      { signal: controller.signal },
    )

    // 记录 token 使用信息
    if (apiResult.usage) {
      tokenTracker.updateUsage(apiResult.usage)
    }

    logger.info('Commit message generated successfully')
  }
  catch (error: unknown) {
    if (shouldSilenceError(error)) {
      logger.info('Generation cancelled by user')
      return
    }

    logger.error('Failed to generate commit message', error)
    window.showErrorMessage(getUserFriendlyErrorMessage(error))
  }
  finally {
    // 重置状态
    await commands.executeCommand('setContext', 'commit-message-generator.isGenerating', false)
    tokenTracker.endSession()
    abortManager.clear(controller)
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
      window.showErrorMessage(validation.error!)
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

    const items: any[] = []
    if (currentStats) {
      items.push(
        { label: l10n.t('Current Operation'), kind: -1 }, // Separator
        { label: l10n.t('Total Tokens: {0}', currentStats.totalTokens) },
        { label: l10n.t('Prompt Tokens: {0}', currentStats.promptTokens) },
        { label: l10n.t('Completion Tokens: {0}', currentStats.completionTokens) },
      )
    }

    items.push(
      { label: l10n.t('Cumulative Statistics'), kind: -1 },
      { label: l10n.t('Total Operations: {0}', historicalStats.operationCount) },
      { label: l10n.t('Total Tokens: {0}', historicalStats.totalTokens) },
    )

    await window.showQuickPick(items, { title: l10n.t('Usage Statistics') })
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
