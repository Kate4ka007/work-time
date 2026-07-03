<script setup lang="ts">
const { $pwaInstall } = useNuxtApp()

const visible = computed(() =>
  import.meta.client && $pwaInstall && !$pwaInstall.isInstalled,
)

const hint = computed(() => {
  if ($pwaInstall?.canInstall) {
    return 'Установка доступна: нажмите значок «Установить» в адресной строке браузера (справа) или меню (⋮) → «Установить Work Time».'
  }
  return 'Для установки используйте Chrome или Edge. Откройте меню (⋮) → «Установить Work Time». Если иконки нет — поработайте на сайте 1–2 минуты и обновите страницу.'
})
</script>

<template>
  <div v-if="visible" class="pwa-install-wrap">
    <div class="pwa-install-info">
      <span class="pwa-install-icon">📲</span>
      <p class="pwa-install-hint">{{ hint }}</p>
    </div>
  </div>
</template>

<style scoped>
.pwa-install-wrap {
  margin-top: auto;
}

.pwa-install-info {
  display: flex;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}

.pwa-install-icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.pwa-install-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
</style>
