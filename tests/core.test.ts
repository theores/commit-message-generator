import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { AbortManager } from '../src/utils/abort-manager'
import { sanitizeCommitMessage } from '../src/utils/commit-message'
import { prepareDiff } from '../src/utils/diff'
import { isPathInside, isSamePath } from '../src/utils/path'

test('路径匹配不会混淆同名前缀目录', () => {
  const root = path.resolve('workspace', 'app')
  const sibling = path.resolve('workspace', 'app2')

  assert.equal(isPathInside(root, sibling), false)
  assert.equal(isPathInside(root, path.join(root, 'src', 'index.ts')), true)
  assert.equal(isSamePath(root, path.join(root, '.')), true)
})

test('Diff 超限时保留配置长度并添加截断标记', () => {
  const result = prepareDiff('a'.repeat(200), 100)

  assert.equal(result.truncated, true)
  assert.equal(result.content.length, 100)
  assert.match(result.content, /Diff truncated/)
})

test('锁文件只保留变更元数据', () => {
  const diff = `diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
index 111..222 100644
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -1 +1 @@
-old dependency
+new dependency
diff --git a/src/index.ts b/src/index.ts
--- a/src/index.ts
+++ b/src/index.ts
@@ -1 +1 @@
-old code
+new code`
  const result = prepareDiff(diff, 10000)

  assert.equal(result.compactedFiles, 1)
  assert.doesNotMatch(result.content, /old dependency/)
  assert.match(result.content, /new code/)
})

test('提交信息清理 Markdown 围栏和说明前缀', () => {
  const content = '```text\nCommit Message: feat(core): add validation\n```'

  assert.equal(sanitizeCommitMessage(content), 'feat(core): add validation')
})

test('只有当前生成任务可以完成全局状态', () => {
  const manager = new AbortManager()
  const first = manager.createController()
  const second = manager.createController()

  assert.equal(first.signal.aborted, true)
  assert.equal(manager.complete(first), false)
  assert.equal(manager.complete(second), true)
})
