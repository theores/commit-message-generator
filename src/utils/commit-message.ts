export function sanitizeCommitMessage(content: string): string {
  return content
    .trim()
    .replace(/^```(?:text)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/^(?:commit message|提交信息|提交日志)\s*[:：]\s*/i, '')
    .trim()
}
