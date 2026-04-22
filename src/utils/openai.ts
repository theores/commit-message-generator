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

  // 创建超时控制器
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

  if (signal) {
    signal.addEventListener('abort', () => timeoutController.abort(), { once: true })
  }

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: messages as ChatCompletionMessageParam[],
      temperature,
      stream: true,
      stream_options: { include_usage: true },
    }, { signal: timeoutController.signal })

    let fullContent = ''
    let usage: TokenUsage | undefined

    try {
      for await (const chunk of stream) {
        if (timeoutController.signal.aborted) {
          break
        }
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullContent += content
          onChunk(content)
        }

        if (chunk.usage) {
          const rawUsage = chunk.usage as any
          usage = {
            promptTokens: rawUsage.prompt_tokens || 0,
            completionTokens: rawUsage.completion_tokens || 0,
            totalTokens: rawUsage.total_tokens || 0,
            cachedTokens: rawUsage.prompt_tokens_details?.cached_tokens
              || rawUsage.prompt_cache_hit_tokens
              || 0,
          }
        }
      }
    }
    catch (error) {
      if (timeoutController.signal.aborted) {
        return { content: fullContent, usage }
      }
      throw error
    }

    return { content: fullContent, usage }
  }
  finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 调用 ChatGPT 非流式 API
 */
export async function ChatGPTAPI(
  messages: ChatCompletionMessageParam[],
  options: { signal?: AbortSignal, timeout?: number } = {},
): Promise<{ content: string, usage?: TokenUsage }> {
  const { signal, timeout = API_CONFIG.DEFAULT_TIMEOUT } = options
  const openai = createOpenAIApi()
  const { model } = config.getServiceConfig()
  const temperature = API_CONFIG.DEFAULT_TEMPERATURE

  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

  if (signal) {
    signal.addEventListener('abort', () => timeoutController.abort(), { once: true })
  }

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: messages as ChatCompletionMessageParam[],
      temperature,
      stream: false,
    }, { signal: timeoutController.signal })

    let usage: TokenUsage | undefined
    if (response.usage) {
      const rawUsage = response.usage as any
      usage = {
        promptTokens: rawUsage.prompt_tokens || 0,
        completionTokens: rawUsage.completion_tokens || 0,
        totalTokens: rawUsage.total_tokens || 0,
        cachedTokens: rawUsage.prompt_tokens_details?.cached_tokens
          || rawUsage.prompt_cache_hit_tokens
          || 0,
      }
    }

    return {
      content: response.choices[0]?.message?.content || '',
      usage,
    }
  }
  finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 获取可用的模型列表
 */
export async function getAvailableModels() {
  const openai = createOpenAIApi()
  const models = await openai.models.list()
  return models.data.map(model => model.id)
}
