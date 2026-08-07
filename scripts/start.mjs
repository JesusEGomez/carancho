import { spawnSync } from 'node:child_process'

const baseEnv = {
  ...process.env,
  NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--no-deprecation',
}

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

function runPnpmScript(script, options = {}) {
  const result = spawnSync(pnpmCommand, ['run', script], {
    env: baseEnv,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    ...options,
  })

  if (result.error?.code === 'ETIMEDOUT') {
    console.error(
      `\n"${script}" timed out after ${options.timeout}ms without stdin available.\n` +
        "This usually means Payload's migrate command is stuck on the interactive " +
        '"you ran in dev mode, data loss will occur" prompt — check for a stray ' +
        "batch -1 row in payload_migrations (dev-mode schema push) and resolve it manually.",
    )
    process.exit(1)
  }

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }
}

if (process.env.DATABASE_URL) {
  console.log('Running Payload migrations before start...')
  // Bounded so a stuck interactive prompt (e.g. dev-mode schema push marker)
  // fails the deploy loudly instead of hanging the container forever.
  runPnpmScript('migrate', { timeout: 60_000 })
} else {
  console.log('DATABASE_URL not set — skipping migrations.')
}

console.log('Starting Next.js server...')
runPnpmScript('start:next')
