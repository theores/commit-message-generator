import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '.github/**',
    'dist/**',
    'out/**',
    'LATEST_CHANGELOG.md',
  ],
  overrides: {
    test: {
      'test/no-import-node-test': 'off',
    },
  },
})
