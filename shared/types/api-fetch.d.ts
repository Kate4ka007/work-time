declare module '#app' {
  interface NuxtApp {
    $apiFetch: typeof $fetch
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $apiFetch: typeof $fetch
  }
}

export {}
