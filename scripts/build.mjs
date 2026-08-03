import { spawnSync } from 'node:child_process'

const baseEnv = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--no-deprecation --max-old-space-size=8000',
}

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function runPnpmScript(script) {
  const result = spawnSync(pnpmCommand, ['run', script], {
    env: baseEnv,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }
}

const isVercel = process.env.VERCEL === '1'
const isPreviewDeployment = process.env.VERCEL_ENV === 'preview'

if (isVercel && process.env.DATABASE_URL && !isPreviewDeployment) {
  console.log('Running Payload migrations before build...')
  runPnpmScript('migrate')
} else if (isVercel && process.env.DATABASE_URL && isPreviewDeployment) {
  console.log('Skipping Payload migrations during Vercel preview build.')
} else {
  console.log('Skipping Payload migrations at build time — the start command runs them once the container has network access to the database.')
}

console.log('Running Next.js build...')
runPnpmScript('build:next')
