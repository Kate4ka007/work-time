export default defineNuxtPlugin(() => {
  async function handleUnauthorized() {
    if (!import.meta.client) return
    const store = useTimeTrackerStore()
    store.reset()
    const { clear, loggedIn } = useUserSession()
    if (loggedIn.value) await clear()
    if (useRoute().path !== '/login') {
      await navigateTo('/login')
    }
  }

  const apiFetch = import.meta.server
    ? useRequestFetch()
    : <T>(url: string, options?: Parameters<typeof $fetch>[1]) =>
        $fetch<T>(url, {
          credentials: 'include',
          ...options,
          onResponseError({ response }) {
            if (response.status === 401) {
              return handleUnauthorized()
            }
          },
        })

  return {
    provide: {
      apiFetch,
    },
  }
})
