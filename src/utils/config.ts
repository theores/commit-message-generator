import { ConfigurationTarget, workspace } from 'vscode'
import { EXTENSION_ID } from './constants'

/**
 * 服务配置接口
 */
export interface ServiceConfig {
  apiKey: string
  baseURL: string
  model: string
}

/**
 * 格式配置接口
 */
export interface FormatConfig {
  outputLanguage: string
}

export interface UiConfig {
  showProgress: boolean
}

/**
 * 提交消息配置接口
 */
export interface CommitConfig {
  /** 是否自动暂存所有更改 */
  autoStage: boolean
  /** 自定义日志模板 */
  template: string
  /** 额外的自定义生成提示语 */
  customPrompt: string
  /** 发送给模型的最大 Diff 字符数 */
  maxDiffLength: number
}

class ConfigManager {
  private readonly section = EXTENSION_ID

  /**
   * 获取配置项的值
   * @param key 配置键，如 'service.apiKey'（不包含扩展 ID 前缀）
   * @param defaultValue 默认值，当配置项不存在时返回
   * @returns 配置项的值
   */
  get<T>(key: string, defaultValue?: T): T {
    return workspace.getConfiguration(this.section).get<T>(key, defaultValue as T)
  }

  /**
   * 更新配置项
   * @param key 配置键
   * @param value 新值
   * @param target 配置目标
   */
  async update<T>(
    key: string,
    value: T,
    target: ConfigurationTarget = ConfigurationTarget.Global,
  ): Promise<void> {
    await workspace.getConfiguration(this.section).update(key, value, target)
  }

  /**
   * 获取服务相关配置
   */
  getServiceConfig(): ServiceConfig {
    return {
      apiKey: this.get<string>('service.apiKey', ''),
      baseURL: this.get<string>('service.baseURL', 'https://api.deepseek.com'),
      model: this.get<string>('service.model', 'deepseek-chat'),
    }
  }

  /**
   * 获取格式相关配置
   */
  getFormatConfig(): FormatConfig {
    return {
      outputLanguage: this.get<string>('format.outputLanguage', '简体中文'),
    }
  }

  getUiConfig(): UiConfig {
    return {
      showProgress: this.get<boolean>('ui.showProgress', true),
    }
  }

  /**
   * 获取提交消息相关配置
   */
  getCommitConfig(): CommitConfig {
    return {
      autoStage: this.get<boolean>('commit.autoStage', false),
      template: this.get<string>('commit.template', ''),
      customPrompt: this.get<string>('commit.customPrompt', ''),
      maxDiffLength: this.get<number>('commit.maxDiffLength', 50000),
    }
  }
}

export const config = new ConfigManager()
