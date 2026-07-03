<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()

const errorMessages: Record<string, string> = {
  access_denied: 'У вас нет доступа к этому приложению.',
  oauth_failed: 'Не удалось войти через Google. Попробуйте снова.',
}

const errorText = computed(() => {
  const code = route.query.error as string | undefined
  if (!code) return null
  return errorMessages[code] ?? 'Ошибка авторизации.'
})
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-card__logo">⏱</div>
      <h1 class="login-card__title">Work Time</h1>
      <p class="login-card__subtitle">Учёт времени по проектам и задачам</p>

      <p v-if="errorText" class="login-card__error">{{ errorText }}</p>

      <a href="/auth/google" class="btn btn--google">
        <svg class="btn--google__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Войти через Google
      </a>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--bg-primary);
}

.login-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding: 2.5rem 2rem;
}

.login-card__logo {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.login-card__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.login-card__subtitle {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.login-card__error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.75rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.btn--google {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #fff;
  color: #1f1f1f;
  border-radius: var(--radius);
  font-weight: 500;
  font-size: 0.9375rem;
  text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s;
  border: 1px solid var(--border);
}

.btn--google:hover {
  background: #f8f8f8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn--google__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>
