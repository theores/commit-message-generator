import type { ChatCompletionMessageParam } from 'openai/resources'
import { config } from './utils/config'
import { COMMIT_FORMAT } from './utils/constants'

/**
 * 生成 commit 消息提示词
 * @param diff Git diff 内容
 * @returns 聊天消息数组
 */
export async function generateCommitPrompt(
  diff: string,
): Promise<ChatCompletionMessageParam[]> {
  const formatConfig = config.getFormatConfig()
  const commitConfig = config.getCommitConfig()

  const trimmedDiff = diff.trim() || '[empty diff provided]'

  // 构建语言提示
  const isChinese = formatConfig.outputLanguage.includes('中文')
  const languageNote = isChinese ? ' 请在中文与英文或数字之间保留空格。' : ''

  // 构建提交类型列表
  const commitTypes = [
    { type: 'feat', description: 'new feature', emoji: '✨' },
    { type: 'fix', description: 'bug fix', emoji: '🐛' },
    { type: 'docs', description: 'documentation', emoji: '📚' },
    { type: 'style', description: 'formatting / code style', emoji: '💄' },
    { type: 'refactor', description: 'code refactoring', emoji: '♻️' },
    { type: 'perf', description: 'performance improvement', emoji: '⚡' },
    { type: 'test', description: 'testing', emoji: '✅' },
    { type: 'build', description: 'build system', emoji: '📦' },
    { type: 'ci', description: 'CI configuration', emoji: '👷' },
    { type: 'chore', description: 'maintenance', emoji: '🔧' },
    { type: 'revert', description: 'revert previous commit', emoji: '⏪' },
  ]

  const commitTypesList = commitTypes
    .map(({ type, description, emoji }) => {
      const prefix = commitConfig.enableEmojiPrefix ? `${emoji} ` : ''
      return `  - ${prefix}${type}: ${description}`
    })
    .join('\n')

  const emojiInstruction = commitConfig.enableEmojiPrefix
    ? 'Prefix the subject with the matching emoji from the list above.'
    : 'Do not prefix the subject with emojis.'

  // 自定义提示
  const commitCustomPrompt = commitConfig.customPrompt.trim()

  const systemContent = `You are a professional git commit message generator.
Your task is to generate a concise and descriptive commit message based on the provided git diff.

CRITICAL: The output MUST be in ${formatConfig.outputLanguage}.${languageNote} ONLY technical terms (commit types like feat/fix, code identifiers, file paths) remain in English.

## Rules for Generate Commit Message

Format: type(scope): subject

Subject line rules:
- Follow Conventional Commits specification
- Structure: type(scope): subject
- Supported types:
${commitTypesList}
- ${emojiInstruction}
- Use imperative mood (e.g., "add" not "added" or "adds")
- Max ${COMMIT_FORMAT.MAX_SUBJECT_LENGTH} characters
- No period at the end
- Lowercase first letter after colon
- Be specific and concise about WHAT changed
- Write in ${formatConfig.outputLanguage}

Body rules (optional, add only when needed):
- Separate from subject with ONE blank line
- MUST use bullet point format: each line starts with "- "
- Wrap at ${COMMIT_FORMAT.MAX_BODY_LINE_LENGTH} characters per line
- Explain WHY the change was made, not HOW
- Include context, motivation, or consequences
- Write in ${formatConfig.outputLanguage}

When to include body:
- Complex changes needing explanation
- Breaking changes (BREAKING CHANGE: ...)
- Multiple related changes
- Important context or reasoning

When to skip body:
- Simple, self-explanatory changes
- Single-line fixes
- Trivial updates${commitCustomPrompt
  ? `

Additional commit guidance:
${commitCustomPrompt}`
  : ''}

Return ONLY the commit message text. No markdown fences, no extra explanation.`

  return [
    {
      role: 'system',
      content: systemContent,
    } satisfies ChatCompletionMessageParam,
    {
      role: 'user',
      content: trimmedDiff,
    } satisfies ChatCompletionMessageParam,
  ]
}
