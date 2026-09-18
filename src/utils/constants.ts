/**
 * 扩展标识符
 */
export const EXTENSION_ID = 'commit-message-generator'

/**
 * 扩展名称
 */
export const EXTENSION_NAME = 'Commit Message Generator'

/**
 * 命令 ID 常量集合
 */
export const COMMANDS = {
  /** 生成 commit 消息命令 */
  GENERATE_COMMIT: `${EXTENSION_ID}.generateCommit`,
  /** 停止生成命令 */
  STOP_GENERATION: `${EXTENSION_ID}.stopGeneration`,
  /** 选择可用模型命令 */
  SELECT_AVAILABLE_MODEL: `${EXTENSION_ID}.selectAvailableModel`,
  /** 显示 Token 统计命令 */
  SHOW_TOKEN_STATS: `${EXTENSION_ID}.showTokenStats`,
  /** 重置 Token 统计命令 */
  RESET_TOKEN_STATS: `${EXTENSION_ID}.resetTokenStats`,
} as const

export const CONTEXT_KEYS = {
  GENERATING_REPOSITORY_URIS: `${EXTENSION_ID}.generatingRepositoryUris`,
} as const

/**
 * API 配置常量
 */
export const API_CONFIG = {
  /** 默认请求超时时间（毫秒） */
  DEFAULT_TIMEOUT: 60000,
  /** 默认生成温度参数（保持生成内容的严谨性） */
  DEFAULT_TEMPERATURE: 0,
} as const
