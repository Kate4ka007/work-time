export default defineNuxtPlugin(() => {
  const apiFetch = import.meta.server
    ? useRequestFetch()
    : <T>(url: string, options?: Parameters<typeof $fetch>[1]) =>
        $fetch<T>(url, { credentials: 'include', ...options })

  return {
    provide: {
      apiFetch,
    },
  }
})
