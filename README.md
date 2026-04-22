# Commit Message Generator

[English](./README.en.md) | 简体中文

![Version](https://img.shields.io/visual-studio-marketplace/v/theores.commit-message-generator?style=flat-square)
![Downloads](https://img.shields.io/visual-studio-marketplace/d/theores.commit-message-generator?style=flat-square)

基于 AI 的 VS Code Git 提交日志生成工具，深度解析代码变更，自动生成符合 Conventional Commits 规范的描述。

## ✨ 核心特性

- **流式填充**：AI 生成内容实时填入 SCM 输入框，支持 ⏹ 随时中断。
- **深度解析**：分析暂存区 Diff 意图，支持多文件、多行变更的逻辑汇总。
- **自动暂存**：支持配置 `autoStage`。开启后，点击生成图标将自动执行 `git add .`。
- **高度定制**：内置 19+ 语言支持，支持**自定义日志模板**及额外的生成指令。
- **多工作区**：完美支持 Multi-root Workspaces，自动识别操作仓库。
- **Token 追踪**：内置消耗统计，支持实时查看及历史累计数据。

## 🚀 快速上手

1. **安装**：在 VS Code 市场搜索并安装 `Commit Message Generator`。
2. **配置**：
   - 设置 `service.apiKey`
   - 设置 `service.baseURL` (默认为 DeepSeek)
3. **生成日志**：
   - **方式 A (默认)**：在 SCM 面板点击 `+` 号**暂存**更改，然后点击标题栏的 ✨ 图标。
   - **方式 B (推荐)**：开启 `commit.autoStage` 配置。你只需修改代码，然后**直接点击 ✨ 图标**，插件会自动为你完成暂存并生成日志。
4. **提交**：核对 AI 生成的内容并提交。

## ⚙️ 配置说明

在 VS Code 设置中搜索 `commit-message-generator` 即可配置：

| 配置项 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `service.apiKey` | `""` | **必需**。你的 AI 服务 API 密钥。 |
| `service.baseURL` | `DeepSeek API` | 兼容 OpenAI 格式的端点。 |
| `service.model` | `deepseek-chat` | 推荐通过“选择可用模型”命令动态拉取并切换。 |
| `format.outputLanguage` | `简体中文` | 生成提交信息的语言（支持 19+ 种）。 |
| `commit.autoStage` | `false` | **强烈推荐**。开启后，点击 ✨ 图标前无需手动暂存更改。 |
| `commit.template` | `""` | 自定义提交日志模板。支持 `{type}`, `{scope}`, `{subject}` 变量。 |
| `commit.customPrompt` | `""` | 额外的 AI 生成指令。例如：“遵循团队特定的提交规范”。 |

## 📜 许可证

[MIT License](LICENSE) © 2026 theores
