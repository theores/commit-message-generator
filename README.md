# Commit Message Generator

[![GitHub last commit](https://img.shields.io/github/last-commit/joygqz/commit-message-generator?style=flat-square)](https://github.com/joygqz/commit-message-generator)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/joygqz.commit-message-generator?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-message-generator)

AI 驱动的 Git 提交消息生成器，专注、纯粹、高效。

## ✨ 特性

- 🤖 **AI 驱动** - 兼容 OpenAI、DeepSeek 等 OpenAI 兼容 API
- ⚡ **实时生成** - 流式生成提交消息，支持随时取消
- 📦 **自动暂存** - 支持生成前自动执行 `git add .`
- 🌐 **多语言** - 支持 19+ 种语言生成符合规范的提交消息
- 🎨 **高度自定义** - 支持 Emoji、自定义提示词、模型切换
- 📊 **使用统计** - 内置 Token 使用统计与追踪

## 🚀 快速开始

1. 从 [VS Code 市场](https://marketplace.visualstudio.com/items?itemName=joygqz.commit-message-generator) 安装
2. 配置 API（设置）：
   - `commit-message-generator.service.apiKey` - 你的 API 密钥
   - `commit-message-generator.service.baseURL` - API 端点（默认：`https://api.deepseek.com`）
3. 选择模型：运行 `Commit Message Generator: 选择可用模型`
4. 暂存更改并点击源代码管理面板标题栏的 ✨ 图标

## 📋 使用方法

1. **暂存更改**：在 VS Code 源代码管理面板中暂存你的代码改动。
2. **生成消息**：点击标题栏的 ✨ 图标，AI 将根据 diff 内容实时生成提交消息。
3. **停止生成**：如果需要中断，点击 ⏹ 图标即可停止，并保留已生成的内容。
4. **提交代码**：核对消息后，直接在 SCM 面板完成提交。

**主要命令：**

- `Commit Message Generator: 生成提交日志` - 分析暂存更改并生成消息
- `Commit Message Generator: 选择可用模型` - 浏览和切换 AI 模型
- `Commit Message Generator: 显示 Token 使用统计` - 查看 Token 使用历史
- `Commit Message Generator: 重置 Token 使用统计` - 清空统计数据

## ⚙️ 配置

### 必需设置

```jsonc
{
  "commit-message-generator.service.apiKey": "sk-...", // 你的 API 密钥
  "commit-message-generator.service.baseURL": "https://api.deepseek.com", // API 端点
  "commit-message-generator.service.model": "deepseek-chat" // 模型名称
}
```

### 可选设置

- `commit.autoStage` - 是否在生成前自动暂存所有更改 (git add .)
- `commit.enableEmojiPrefix` - 在提交类型前添加表情符号（如 ✨ feat）
- `commit.customPrompt` - 追加到 AI 系统提示词中的自定义指令
- `format.outputLanguage` - 消息生成的语言（默认：简体中文）

## 🌍 支持的语言

English, 简体中文, 繁體中文, 日本語, 한국어, Deutsch, Français, Italiano, Nederlands, Português, Tiếng Việt, Español, Svenska, Русский, Bahasa, Polski, Türkçe, ไทย, Čeština

## 💖 支持

如果这个项目对你的工作流程有帮助，可以考虑支持作者：

[![赞助](https://img.shields.io/badge/Sponsor-Support_Author-946ce6?style=for-the-badge&logo=github-sponsors)](https://afdian.com/a/joygqz)
