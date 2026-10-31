<script setup lang="ts">
const { loggedIn, fetch: fetchSession } = useUserSession()
const store = useTimeTrackerStore()

await fetchSession()

const { refresh: refreshStore } = await useAsyncData(
  'time-tracker-store',
  async () => {
    if (!loggedIn.value) return null
    return store.fetchStore()
  },
  { server: false, watch: [loggedIn] },
)

watch(loggedIn, async (isLoggedIn) => {
  if (!isLoggedIn) {
    store.reset()
    return
  }
  if (!store.loaded) {
    await refreshStore()
  }
})
</script>

<template>
  <NuxtPwaManifest />
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
