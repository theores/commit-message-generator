const TRUNCATION_MARKER = '\n\n[Diff truncated because it exceeded the configured size limit.]'
const LOCKFILE_MARKER = '[Lockfile content omitted; dependency resolution metadata changed.]'
const LOCKFILE_PATTERN = /(?:^|\/)(?:bun\.lockb?|npm-shrinkwrap\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i

export interface PreparedDiff {
  content: string
  truncated: boolean
  compactedFiles: number
}

export function prepareDiff(diff: string, maxLength: number): PreparedDiff {
  const { content: compactedDiff, compactedFiles } = compactLockfileDiffs(diff)

  if (compactedDiff.length <= maxLength) {
    return { content: compactedDiff, truncated: false, compactedFiles }
  }

  const contentLength = Math.max(0, maxLength - TRUNCATION_MARKER.length)
  return {
    content: `${compactedDiff.slice(0, contentLength)}${TRUNCATION_MARKER}`,
    truncated: true,
    compactedFiles,
  }
}

function compactLockfileDiffs(diff: string): { content: string, compactedFiles: number } {
  let compactedFiles = 0
  const sections = diff.split(/(?=^diff --git )/m)
  const content = sections.map((section) => {
    const header = section.match(/^diff --git a\/(.+?) b\/(.+)$/m)
    const filePath = header?.[2]
    if (!filePath || !LOCKFILE_PATTERN.test(filePath)) {
      return section
    }

    compactedFiles++
    const metadata = section
      .split('\n')
      .filter(line => /^(?:diff --git|index |new file mode|deleted file mode|--- |\+\+\+ )/.test(line))
      .join('\n')
    return `${metadata}\n${LOCKFILE_MARKER}\n`
  }).join('')

  return { content, compactedFiles }
}
