import path from 'node:path'
import process from 'node:process'

function normalizePath(value: string): string {
  const normalized = path.normalize(path.resolve(value))
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized
}

export function isSamePath(left: string, right: string): boolean {
  return normalizePath(left) === normalizePath(right)
}

export function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(normalizePath(parent), normalizePath(candidate))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}
