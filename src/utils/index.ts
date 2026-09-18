import { config } from './config'

// 重新导出常用模块
export * from './error-handler'
export * from './logger'

/**
 * 验证配置项是否存在且非空
 * @param rules 验证规则数组，每项包含 key（配置键）、required（是否必需）和 errorMessage（错误消息）
 * @returns 验证结果，包含 isValid（是否通过）和 error（错误消息）
 */
export function validateConfig(
  rules: Array<{ key: string, required: boolean, errorMessage: string }>,
): { isValid: boolean, error?: string } {
  for (const rule of rules) {
    if (!rule.required) {
      continue
    }

    const value = config.get(rule.key)
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return {
        isValid: false,
        error: rule.errorMessage,
      }
    }
  }

  return { isValid: true }
}
