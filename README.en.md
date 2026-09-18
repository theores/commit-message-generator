# Commit Message Generator

English | [简体中文](./README.md)

![Version](https://img.shields.io/visual-studio-marketplace/v/theores.commit-message-generator?style=flat-square)
![Downloads](https://img.shields.io/visual-studio-marketplace/d/theores.commit-message-generator?style=flat-square)

AI-powered VS Code extension that analyzes Git diffs and generates Conventional Commits messages through OpenAI-compatible APIs.

## ✨ Key Features

- **Streaming Generation**: Streams AI output into the SCM input and supports cancellation from either the stop button or progress notification.
- **Smart Change Selection**: Uses staged changes when present; otherwise analyzes unstaged changes and untracked text files.
- **Generation Progress**: Shows repository, diff collection, API request, and generation stages with cancellation support.
- **Auto-Staging**: Optionally runs `git add .` before generation.
- **Multi-root Support**: Tracks generation state per repository and prompts for a repository when it cannot be determined automatically.
- **OpenAI Compatibility**: Supports DeepSeek and self-hosted OpenAI-compatible services with workspace-specific endpoints and models.
- **Customization**: Supports 19+ output languages, custom templates, and additional instructions.
- **Performance Controls**: Compacts lockfile diffs and limits request size to reduce latency and token usage.
- **Token Tracking**: Tracks, copies, and resets recent and cumulative token usage.

## 🚀 Quick Start

1. **Install**: Search for `Commit Message Generator` in the VS Code Marketplace.
2. **Configure**:
   - Set `service.apiKey`
   - Set `service.baseURL` (Defaults to DeepSeek)
3. **Generate**:
   - If changes are staged, only the staged diff is analyzed.
   - If the staging area is empty, unstaged changes and untracked text files are analyzed.
   - When `commit.autoStage` is enabled, all changes are staged before generation.
4. **Commit**: Review and commit your changes.

> Git diffs are sent to the configured AI service. Make sure the service meets your code security and privacy requirements.

## 🧭 Commands

- `Generate Commit Message`: Generate a message for the selected Git repository.
- `Stop Generation`: Stop the active generation task.
- `Select Available Model`: Fetch and select a model from the configured API service.
- `Show Token Usage Statistics`: View and copy token usage statistics.
- `Reset Token Usage Statistics`: Reset historical usage statistics.

## ⚙️ Configuration Reference

Search for `commit-message-generator` in VS Code settings:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `commit-message-generator.service.apiKey` | `""` | **Required**. API key for the configured AI service. |
| `commit-message-generator.service.baseURL` | `https://api.deepseek.com` | OpenAI-compatible API URL. Supports HTTP, HTTPS, and workspace-specific values. |
| `commit-message-generator.service.model` | `deepseek-chat` | Model used for generation. It can also be changed with the model selection command. |
| `commit-message-generator.format.outputLanguage` | `简体中文` | Language used for the descriptive parts of generated messages. |
| `commit-message-generator.ui.showProgress` | `true` | Show a cancellable progress notification during generation. |
| `commit-message-generator.commit.autoStage` | `false` | Stage all repository changes before generation. |
| `commit-message-generator.commit.template` | `""` | Custom template supporting `{type}`, `{scope}`, and `{subject}`. |
| `commit-message-generator.commit.customPrompt` | `""` | Additional commit conventions or generation constraints. |
| `commit-message-generator.commit.maxDiffLength` | `50000` | Maximum diff characters sent to the AI service, from 10,000 to 1,000,000. |

## ⚠️ Notes

- Diffs exceeding `commit.maxDiffLength` are truncated and produce a warning.
- Lockfile contents are compacted to change metadata to reduce request size. Lockfile-only changes may produce a more general message.
- The original SCM input is restored when generation fails or is cancelled.
- API errors include HTTP status, error codes, and request IDs while redacting API keys.

## 📜 License

[MIT License](LICENSE) © 2026 theores
