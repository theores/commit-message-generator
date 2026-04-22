import type * as vscode from 'vscode'
import { commands } from 'vscode'
import * as Commands from './commands'
import { COMMANDS } from './utils/constants'
import { logger } from './utils/logger'
import { tokenTracker } from './utils/token-tracker'

/**
 * 扩展激活函数
 * @param context 扩展上下文，用于管理扩展的生命周期
 */
export function activate(context: vscode.ExtensionContext) {
  logger.info('Commit Message Generator extension activated')

  // 初始化 Token 状态栏并加载持久化数据
  const statusBarItem = tokenTracker.initialize(context)
  context.subscriptions.push(statusBarItem)

  // 注册命令
  context.subscriptions.push(
    // 生成 commit 消息
    commands.registerCommand(
      COMMANDS.GENERATE_COMMIT,
      (context?: any) => Commands.generateCommit(context),
    ),
    // 停止生成
    commands.registerCommand(
      COMMANDS.STOP_GENERATION,
      Commands.stopGeneration,
    ),
    // 选择可用模型
    commands.registerCommand(
      COMMANDS.SELECT_AVAILABLE_MODEL,
      Commands.selectAvailableModel,
    ),
    // 显示 Token 统计
    commands.registerCommand(
      COMMANDS.SHOW_TOKEN_STATS,
      Commands.showTokenStats,
    ),
    // 重置 Token 统计
    commands.registerCommand(
      COMMANDS.RESET_TOKEN_STATS,
      Commands.resetTokenStats,
    ),
  )
}

/**
 * 扩展注销函数
 */
export async function deactivate() {
  logger.info('Commit Message Generator extension deactivating')

  // 确保 token 统计数据已保存
  await tokenTracker.ensureSaved()

  tokenTracker.dispose()
  logger.dispose()
}
