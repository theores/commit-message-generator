import type { ChatCompletionMessageParam } from 'openai/resources'
import { config } from './utils/config'

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

  // 构建提交类型说明（仅作为 AI 参考，如果用户有自定义模板则优先遵循模板）
  const commitTypes = [
    { type: 'feat', description: 'new feature' },
    { type: 'fix', description: 'bug fix' },
    { type: 'docs', description: 'documentation' },
    { type: 'style', description: 'formatting / code style' },
    { type: 'refactor', description: 'code refactoring' },
    { type: 'perf', description: 'performance improvement' },
    { type: 'test', description: 'testing' },
    { type: 'build', description: 'build system' },
    { type: 'ci', description: 'CI configuration' },
    { type: 'chore', description: 'maintenance' },
    { type: 'revert', description: 'revert previous commit' },
  ]

  const commitTypesList = commitTypes
    .map(({ type, description }) => `  - ${type}: ${description}`)
    .join('\n')

  const userTemplate = commitConfig.template.trim()
  const commitCustomPrompt = commitConfig.customPrompt.trim()

  const systemContent = `You are a professional git commit message generator.
Your task is to generate a professional, concise and descriptive commit message based on the provided git diff.
You MUST analyze ALL changed files in the diff and summarize the key changes for each relevant part.

## Commit Message Standards

Format: type(scope): subject

Allowed Types:
${commitTypesList}

Subject line rules:
- Follow Conventional Commits specification.
- Use imperative mood (e.g., "add" not "added").
- Max 72 characters.
- Lowercase first letter after colon.

Body rules:
- Use bullet point format: each line starts with "- ".
- Explain WHY the change was made, not HOW.

${userTemplate
  ? `## CUSTOM TEMPLATE
You MUST follow this template strictly:
${userTemplate}
(Note: Replace variables like {type}, {scope}, {subject} with actual content)`
  : ''}
${commitCustomPrompt
  ? `
## ADDITIONAL CONSTRAINTS
${commitCustomPrompt}`
  : ''}

## CRITICAL RULES
1. **CONVENTIONAL COMMITS SPEC**: The \`type\` and \`scope\` MUST follow the specification using **technical identifiers in English** (e.g., \`feat(ui)\`, \`fix(core)\`). Never translate these technical terms.
2. **LANGUAGE FOR DESCRIPTIONS**: All descriptive parts (the \`subject\` after the colon, and the \`body\` bullet points) MUST be written in **${formatConfig.outputLanguage}**.
3. **DO NOT EXPLAIN**: Output ONLY the final commit message.
4. **THOROUGH ANALYSIS**: Ensure every significant change in the diff is reflected in the body.

Return ONLY the commit message text. No markdown fences, no conversational filler.`

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
