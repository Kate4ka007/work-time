<script setup lang="ts">
const { user } = useUserSession()
const imageError = ref(false)

const initial = computed(() => {
  const name = user.value?.name?.trim() || user.value?.email?.trim() || '?'
  return name.charAt(0).toUpperCase()
})

watch(() => user.value?.avatar, () => {
  imageError.value = false
})
</script>

<template>
  <div v-if="user" class="user-menu">
    <img
      v-if="user.avatar && !imageError"
      :src="user.avatar"
      :alt="user.name ?? 'Аватар'"
      class="user-menu__avatar"
      referrerpolicy="no-referrer"
      @error="imageError = true"
    >
    <div
      v-else
      class="user-menu__avatar user-menu__avatar--fallback"
      :title="user.name ?? user.email"
    >
      {{ initial }}
    </div>
    <div class="user-menu__info">
      <div class="user-menu__name">{{ user.name }}</div>
      <div class="user-menu__email">{{ user.email }}</div>
    </div>
    <a href="/auth/logout" class="btn btn--ghost btn--sm user-menu__logout" title="Выйти">
      Выйти
    </a>
  </div>
</template>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.user-menu__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.user-menu__avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
}

.user-menu__info {
  flex: 1;
  min-width: 0;
}

.user-menu__name {
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu__email {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu__logout {
  flex-shrink: 0;
  font-size: 0.75rem;
}
</style>
