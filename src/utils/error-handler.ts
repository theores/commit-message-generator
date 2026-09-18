import { l10n } from 'vscode'

/**
 * API 错误类型枚举
 */
enum ApiErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  NETWORK = 'network',
  INVALID_REQUEST = 'invalid_request',
  SERVER_ERROR = 'server_error',
  ABORT = 'abort',
  UNKNOWN = 'unknown',
}

/**
 * 错误信息接口
 */
interface ErrorInfo {
  type: ApiErrorType
  message: string
  originalError?: unknown
}

interface DetailedError extends Error {
  status?: number
  code?: string
  type?: string
  request_id?: string
  requestId?: string
}

function getErrorDetails(error: Error): string {
  const detailedError = error as DetailedError
  const details = [
    detailedError.status ? `HTTP ${detailedError.status}` : '',
    detailedError.code ? `code=${detailedError.code}` : '',
    detailedError.type ? `type=${detailedError.type}` : '',
    detailedError.request_id || detailedError.requestId
      ? `requestId=${detailedError.request_id || detailedError.requestId}`
      : '',
    error.message,
  ].filter(Boolean)

  return details
    .join(', ')
    .replace(/sk-[\w-]{8,}/gi, 'sk-***')
    .slice(0, 600)
}

function withDetails(message: string, error: Error): string {
  return `${message}\n${l10n.t('Error details: {0}', getErrorDetails(error))}`
}

/**
 * 分析错误类型和消息
 * @param error 原始错误对象
 * @returns 错误信息对象
 */
function analyzeError(error: unknown): ErrorInfo {
  if (!(error instanceof Error)) {
    return {
      type: ApiErrorType.UNKNOWN,
      message: l10n.t('An unknown error occurred: {0}', String(error)),
      originalError: error,
    }
  }

  const detailedError = error as DetailedError
  const errorMessage = error.message.toLowerCase()
  const status = detailedError.status

  // 检查中止错误
  if (error.name === 'AbortError') {
    return {
      type: ApiErrorType.ABORT,
      message: l10n.t('Request was cancelled.'),
      originalError: error,
    }
  }

  // 检查认证错误
  if (status === 401 || errorMessage.includes('unauthorized') || errorMessage.includes('invalid api key')) {
    return {
      type: ApiErrorType.AUTHENTICATION,
      message: withDetails(l10n.t('Invalid API key. Please check your configuration in settings.'), error),
      originalError: error,
    }
  }

  // 检查速率限制
  if (status === 429 || errorMessage.includes('rate limit')) {
    return {
      type: ApiErrorType.RATE_LIMIT,
      message: withDetails(l10n.t('Rate limit exceeded. Please try again later or check your API quota.'), error),
      originalError: error,
    }
  }

  // 检查超时错误
  if (error.name === 'RequestTimeoutError' || errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      type: ApiErrorType.TIMEOUT,
      message: withDetails(l10n.t('Request timeout. Please check your network connection and try again.'), error),
      originalError: error,
    }
  }

  // 检查网络错误
  if (errorMessage.includes('network') || errorMessage.includes('econnrefused') || errorMessage.includes('fetch failed')) {
    return {
      type: ApiErrorType.NETWORK,
      message: withDetails(l10n.t('Network error. Please check your internet connection and base URL configuration.'), error),
      originalError: error,
    }
  }

  // 检查无效请求
  if (status === 400 || errorMessage.includes('bad request') || errorMessage.includes('invalid')) {
    return {
      type: ApiErrorType.INVALID_REQUEST,
      message: withDetails(l10n.t('Invalid request. Please check your configuration or try again.'), error),
      originalError: error,
    }
  }

  // 检查服务器错误
  if ((status !== undefined && status >= 500) || errorMessage.includes('server error')) {
    return {
      type: ApiErrorType.SERVER_ERROR,
      message: withDetails(l10n.t('Server error. The API service may be temporarily unavailable. Please try again later.'), error),
      originalError: error,
    }
  }

  // 默认返回原始错误消息
  return {
    type: ApiErrorType.UNKNOWN,
    message: withDetails(l10n.t('An unexpected error occurred.'), error),
    originalError: error,
  }
}

/**
 * 获取用户友好的错误消息
 * @param error 原始错误对象
 * @returns 用户友好的错误消息字符串
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const errorInfo = analyzeError(error)
  return errorInfo.message
}

/**
 * 检查错误是否应该被静默处理（不显示给用户）
 * @param error 原始错误对象
 * @returns 如果应该静默则返回 true
 */
export function shouldSilenceError(error: unknown): boolean {
  const errorInfo = analyzeError(error)
  return errorInfo.type === ApiErrorType.ABORT
}
