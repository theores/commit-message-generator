# Commit Message Generator

English | [简体中文](./README.md)

![Version](https://img.shields.io/visual-studio-marketplace/v/theores.commit-message-generator?style=flat-square)
![Downloads](https://img.shields.io/visual-studio-marketplace/d/theores.commit-message-generator?style=flat-square)

AI-powered VS Code extension that analyzes Git diffs and generates structured commit messages following Conventional Commits standards.

## ✨ Key Features

- **Streaming Output**: Real-time message filling into SCM input with ⏹ instant abort support.
- **Deep Analysis**: Intent-aware Diff analysis, summarizing multi-file and multi-line changes.
- **Auto-Staging**: Support for `autoStage`. When enabled, clicking the ✨ icon will automatically run `git add .`, eliminating the need for manual staging.
- **High Customization**: 19+ languages supported, optional Emoji prefixes, and custom System Prompts.
- **Multi-root Support**: Seamlessly handles Multi-root Workspaces by identifying the active repository.
- **Token Tracking**: Built-in usage statistics for both current operations and historical totals.

## 🚀 Quick Start

1. **Install**: Search for `Commit Message Generator` in the VS Code Marketplace.
2. **Configure**:
   - Set `service.apiKey`
   - Set `service.baseURL` (Defaults to DeepSeek)
3. **Generate**:
   - **Method A (Default)**: **Stage** your changes manually (click `+`), then click the ✨ icon in the SCM title bar.
   - **Method B (Recommended)**: Enable `commit.autoStage`. Simply edit your code and **click the ✨ icon directly**. The extension will stage all changes and generate the message for you.
4. **Commit**: Review and commit your changes.

## ⚙️ Configuration Reference

Search for `commit-message-generator` in VS Code settings:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `service.apiKey` | `""` | **Required**. Your AI service API Key. |
| `service.baseURL` | `DeepSeek API` | OpenAI-compatible API endpoint. |
| `service.model` | `deepseek-chat` | Use "Select Available Model" command to switch. |
| `format.outputLanguage` | `简体中文` | Target language for generated messages. |
| `commit.autoStage` | `false` | **Highly Recommended**. Automatically stage all changes before generation. |
| `commit.enableEmojiPrefix` | `false` | Add semantic icons (e.g., ✨ feat, 🐛 fix). |
| `commit.customPrompt` | `""` | Additional instructions for AI generation. |

## 📜 License

[MIT License](LICENSE) © 2026 theores
