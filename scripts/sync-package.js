const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

function sync() {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'package.base.json'), 'utf8'))
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.metadata.json'), 'utf8'))
  const contributes = JSON.parse(fs.readFileSync(path.join(root, 'package.contributes.json'), 'utf8'))
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

  const newPkg = {
    ...base,
    ...metadata,
    contributes,
    scripts: pkg.scripts,
    devDependencies: pkg.devDependencies,
  }

  const pkgPath = path.join(root, 'package.json')
  fs.writeFileSync(
    pkgPath,
    `${JSON.stringify(newPkg, null, 2)}\n`,
    'utf8',
  )

  console.log('Synced package.json. Running lint fix to ensure correct key order...')

  try {
    // Run eslint fix only on package.json to avoid excessive time
    execSync('npx eslint package.json --fix', { cwd: root, stdio: 'inherit' })
    console.log('Successfully synced and formatted package.json.')
  }
  catch {
    console.warn('Lint fix on package.json failed, but file was synced.')
  }
}

sync()
