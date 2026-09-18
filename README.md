# Commit Message Generator

[English](./README.en.md) | 简体中文

![Version](https://img.shields.io/visual-studio-marketplace/v/theores.commit-message-generator?style=flat-square)
![Downloads](https://img.shields.io/visual-studio-marketplace/d/theores.commit-message-generator?style=flat-square)

基于 AI 的 VS Code Git 提交信息生成工具，分析 Git Diff 并通过 OpenAI 兼容接口生成符合 Conventional Commits 规范的提交信息。

## ✨ 核心特性

- **流式生成**：AI 输出实时填入 SCM 输入框，可通过停止按钮或进度通知随时取消。
- **智能选择变更**：存在暂存内容时仅分析暂存区；暂存区为空时分析未暂存及未跟踪的文本文件。
- **生成进度**：显示仓库检查、变更收集、AI 请求和生成状态，默认开启并支持取消。
- **自动暂存**：可在生成前自动执行 `git add .`，适合希望一次处理全部变更的工作流。
- **多仓库支持**：在 Multi-root Workspace 中按仓库独立显示生成状态，无法确定仓库时提供选择列表。
- **OpenAI 兼容**：支持 DeepSeek 以及用户自行部署的 OpenAI 兼容服务，可按工作区配置不同端点和模型。
- **高度定制**：支持 19+ 输出语言、自定义提交模板及额外生成指令。
- **性能控制**：压缩锁文件 Diff，并提供 Diff 长度上限以控制响应时间和 Token 消耗。
- **Token 追踪**：记录最近一次及历史累计 Token 使用量，支持复制和重置统计。

## 🚀 快速上手

1. **安装**：在 VS Code 市场搜索并安装 `Commit Message Generator`。
2. **配置**：
   - 设置 `service.apiKey`
   - 设置 `service.baseURL` (默认为 DeepSeek)
3. **生成提交信息**：
   - 如果已经暂存部分文件，点击仓库标题栏的 ✨ 图标后只会分析这些暂存内容。
   - 如果暂存区为空，则会分析当前仓库的未暂存变更和未跟踪文本文件。
   - 开启 `commit.autoStage` 后，会先自动暂存全部变更，再生成提交信息。
4. **提交**：核对 AI 生成的内容并提交。

> 代码 Diff 会发送到你配置的 AI 服务，请确认该服务符合你的代码安全与隐私要求。

## 🧭 常用命令

- `Generate Commit Message`：为当前 Git 仓库生成提交信息。
- `Stop Generation`：停止当前仓库的生成任务。
- `Select Available Model`：从当前 API 服务获取并切换模型。
- `Show Token Usage Statistics`：查看并复制 Token 使用统计。
- `Reset Token Usage Statistics`：重置历史统计。

## ⚙️ 配置说明

在 VS Code 设置中搜索 `commit-message-generator` 即可配置：

| 配置项 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `commit-message-generator.service.apiKey` | `""` | **必需**。AI 服务 API 密钥。 |
| `commit-message-generator.service.baseURL` | `https://api.deepseek.com` | OpenAI 兼容 API 地址，支持 HTTP、HTTPS 和工作区级配置。 |
| `commit-message-generator.service.model` | `deepseek-chat` | 使用的模型，也可通过“选择可用模型”命令切换。 |
| `commit-message-generator.format.outputLanguage` | `简体中文` | 提交信息描述部分的输出语言。 |
| `commit-message-generator.ui.showProgress` | `true` | 生成时显示可取消的进度通知。 |
| `commit-message-generator.commit.autoStage` | `false` | 生成前自动暂存当前仓库全部变更。 |
| `commit-message-generator.commit.template` | `""` | 自定义模板，支持 `{type}`、`{scope}`、`{subject}`。 |
| `commit-message-generator.commit.customPrompt` | `""` | 额外的提交规范或生成约束。 |
| `commit-message-generator.commit.maxDiffLength` | `50000` | 发送给 AI 服务的最大 Diff 字符数，范围为 10,000–1,000,000。 |

## ⚠️ 使用说明

- 超过 `commit.maxDiffLength` 的 Diff 会被截断，并在生成时显示提示。
- 锁文件只保留变更元数据，以减少请求体积；若只修改锁文件，生成结果可能较概括。
- 生成失败或取消时会恢复生成前的 SCM 输入框内容。
- API 错误提示会包含 HTTP 状态、错误码和请求 ID，API Key 会被脱敏。

## 📜 许可证

[MIT License](LICENSE) © 2026 theores
