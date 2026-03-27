import { spawnSync } from 'node:child_process'

const baseEnv = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--no-deprecation --max-old-space-size=8000',
}

function runYarnScript(script) {
  const result = spawnSync('yarn', [script], {
    env: baseEnv,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }
}

if (process.env.DATABASE_URL) {
  console.log('Running Payload migrations before build...')
  runYarnScript('migrate')
} else {
  console.log('Skipping Payload migrations because DATABASE_URL is not set.')
}

console.log('Running Next.js build...')
runYarnScript('build:next')
