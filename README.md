# Work Time

Индивидуальный трекер времени на **Nuxt 4 + Vue 3** с хранением данных в `data/tasks.json`.

## Возможности

- Иерархия **проекты → задачи**
- Учёт времени через **таймер** (старт/стоп) и **ручной ввод**
- **Отчёты** за день / неделю / месяц по проектам
- **Тёмная тема** (основной режим)
- **PWA** — установка как приложение, офлайн-кэш и локальное сохранение
- **Google OAuth** — вход через Google, защита API и страниц
- UI на **русском языке**

## Настройка Google OAuth

1. Скопируйте `.env.example` → `.env`
2. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **OAuth 2.0 Client ID** (Web application)
3. **Authorized redirect URI:** `http://localhost:3000/auth/google` (для production — ваш домен)
4. Заполните в `.env`:
   - `NUXT_OAUTH_GOOGLE_CLIENT_ID`
   - `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`
   - `NUXT_ALLOWED_EMAILS` — ваш Google-email (через запятую, если несколько)
   - `NUXT_SESSION_PASSWORD` — минимум 32 символа

## Запуск

```bash
npm install
npm run dev
```

Приложение: http://localhost:3000

## Сборка

```bash
npm run build
npm run preview
```

`preview` загружает `.env` из корня проекта. Для разработки удобнее:

```bash
npm run dev
```

## Данные

У каждого авторизованного пользователя свой файл:

`data/users/{googleId}.json` (локально) или ключ в **Vercel KV** (на Vercel).

При первом входе, если есть старый `data/tasks.json`, данные автоматически переносятся в файл пользователя.

### Деплой на Vercel

1. **Storage → Create Database → KV** — подключите к проекту (появятся `KV_REST_API_URL` и `KV_REST_API_TOKEN`)
2. Добавьте переменные из `.env.example` в Vercel → Settings → Environment Variables
3. В Google Console добавьте redirect URI: `https://ваш-домен.vercel.app/auth/google`
4. Пересоберите проект после добавления KV

Без KV на Vercel `/api/store` вернёт 500 — файловая система serverless read-only.

API (требуется сессия):

- `GET /api/store` — получить данные текущего пользователя
- `PUT /api/store` — сохранить данные текущего пользователя

## Стек

- Nuxt 4, Vue 3, TypeScript
- Pinia
- Nitro (server API)
- @vite-pwa/nuxt
- nuxt-auth-utils
- date-fns, zod
