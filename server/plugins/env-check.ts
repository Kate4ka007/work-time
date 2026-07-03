import { config } from 'dotenv'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'

function loadEnvFromProjectRoot() {
  const cwd = process.cwd()
  const candidates = [
    join(cwd, '.env'),
    basename(cwd) === '.output' ? join(cwd, '..', '.env') : null,
  ].filter((p): p is string => p !== null)

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      config({ path: envPath })
      return
    }
  }
}

loadEnvFromProjectRoot()

export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig()

  if (!process.env.NUXT_SESSION_PASSWORD) {
    console.error(
      '\n[work-time] NUXT_SESSION_PASSWORD не задан.\n'
      + 'Создайте файл .env в корне проекта (см. .env.example).\n',
    )
  }

  if (!runtimeConfig.oauth?.google?.clientId || !runtimeConfig.oauth?.google?.clientSecret) {
    console.error(
      '\n[work-time] Google OAuth не настроен.\n'
      + 'Заполните NUXT_OAUTH_GOOGLE_CLIENT_ID и NUXT_OAUTH_GOOGLE_CLIENT_SECRET в .env\n',
    )
  }
})
