import type { ChatCompletionMessageParam } from 'openai/resources'
import OpenAI from 'openai'
import { config } from './config'
import { API_CONFIG } from './constants'

/**
 * 创建 OpenAI API 客户端实例
 */
export function createOpenAIApi(): OpenAI {
  const serviceConfig = config.getServiceConfig()

  return new OpenAI({
    apiKey: serviceConfig.apiKey,
    baseURL: serviceConfig.baseURL,
  })
}

/**
 * Token 使用统计接口
 */
export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens?: number
}

interface CompatibleUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_cache_hit_tokens?: number
  prompt_tokens_details?: {
    cached_tokens?: number
  }
}

export class RequestTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout} ms.`)
    this.name = 'RequestTimeoutError'
  }
}

function createAbortContext(signal: AbortSignal | undefined, timeout: number) {
  const controller = new AbortController()
  let timedOut = false

  const abortFromCaller = () => controller.abort(signal?.reason)
  if (signal?.aborted) {
    abortFromCaller()
  }
  else {
    signal?.addEventListener('abort', abortFromCaller, { once: true })
  }

  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) {
      timedOut = true
      controller.abort()
    }
  }, timeout)

  return {
    signal: controller.signal,
    throwIfAborted() {
      if (!controller.signal.aborted) {
        return
      }
      if (timedOut) {
        throw new RequestTimeoutError(timeout)
      }

      const error = new Error('Request was aborted.')
      error.name = 'AbortError'
      throw error
    },
    dispose() {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', abortFromCaller)
    },
  }
}

function normalizeUsage(rawUsage: CompatibleUsage): TokenUsage {
  return {
    promptTokens: rawUsage.prompt_tokens || 0,
    completionTokens: rawUsage.completion_tokens || 0,
    totalTokens: rawUsage.total_tokens || 0,
    cachedTokens: rawUsage.prompt_tokens_details?.cached_tokens
      || rawUsage.prompt_cache_hit_tokens
      || 0,
  }
}

/**
 * 调用 ChatGPT 流式 API
 * @param messages 聊天消息数组
 * @param onChunk 每次接收到内容块时的回调函数
 * @param options 可选配置对象
 * @param options.signal 可选的中止信号，用于取消请求
 * @param options.timeout 请求超时时间（毫秒），默认 60 秒
 */
export async function ChatGPTStreamAPI(
  messages: ChatCompletionMessageParam[],
  onChunk: (chunk: string) => void,
  options: { signal?: AbortSignal, timeout?: number } = {},
): Promise<{ content: string, usage?: TokenUsage }> {
  const { signal, timeout = API_CONFIG.DEFAULT_TIMEOUT } = options
  const openai = createOpenAIApi()
  const { model } = config.getServiceConfig()
  const temperature = API_CONFIG.DEFAULT_TEMPERATURE

  const abortContext = createAbortContext(signal, timeout)

  try {
    abortContext.throwIfAborted()
    const stream = await openai.chat.completions.create({
      model,
      messages: messages as ChatCompletionMessageParam[],
      temperature,
      stream: true,
      stream_options: { include_usage: true },
    }, { signal: abortContext.signal })

    let fullContent = ''
    let usage: TokenUsage | undefined

    try {
      for await (const chunk of stream) {
        abortContext.throwIfAborted()
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content)
        }

        if (chunk.usage) {
          usage = normalizeUsage(chunk.usage as CompatibleUsage)
        }
      }
    }
    catch (error) {
      abortContext.throwIfAborted()
      throw error
    }

    return { content: fullContent, usage }
  }
  finally {
    abortContext.dispose()
  }
}

/**
 * 获取可用的模型列表
 */
export async function getAvailableModels(
  options: { signal?: AbortSignal, timeout?: number } = {},
) {
  const openai = createOpenAIApi()
  const { signal, timeout = API_CONFIG.DEFAULT_TIMEOUT } = options
  const abortContext = createAbortContext(signal, timeout)

  try {
    abortContext.throwIfAborted()
    const models = await openai.models.list({ signal: abortContext.signal })
    return models.data.map(model => model.id)
  }
  catch (error) {
    abortContext.throwIfAborted()
    throw error
  }
  finally {
    abortContext.dispose()
  }
}
