<script setup lang="ts">
const store = useTimeTrackerStore()
const { isOnline } = useOfflineQueue()

onMounted(() => {
  if (isOnline.value) {
    store.syncPending()
  }
})

watch(isOnline, (online) => {
  if (online) store.syncPending()
})
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar__logo">
        <span>⏱</span> Work Time
      </div>
      <NuxtLink to="/" class="sidebar__nav-link">
        <span>🏠</span> Главная
      </NuxtLink>
      <NuxtLink to="/projects" class="sidebar__nav-link">
        <span>📁</span> Проекты
      </NuxtLink>
      <NuxtLink to="/entries" class="sidebar__nav-link">
        <span>📋</span> Записи
      </NuxtLink>
      <NuxtLink to="/reports" class="sidebar__nav-link">
        <span>📊</span> Отчёты
      </NuxtLink>
      <ClientOnly>
        <PwaInstallButton />
      </ClientOnly>
      <ClientOnly>
        <UserMenu />
      </ClientOnly>
    </aside>
    <main class="main-content">
      <div v-if="store.error" class="status-bar status-bar--warning">
        <span class="status-dot status-dot--offline" />
        {{ store.error }}
      </div>
      <div v-else-if="store.syncing" class="status-bar">
        <span class="status-dot" />
        Сохранение...
      </div>
      <div v-else-if="!isOnline" class="status-bar status-bar--warning">
        <span class="status-dot status-dot--offline" />
        Офлайн-режим
      </div>
      <slot />
    </main>
  </div>
</template>
