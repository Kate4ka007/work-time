export default defineNuxtPlugin(() => {
  localStorage.removeItem('vite-pwa:hide-install')

  const canInstall = ref(false)
  const isInstalled = ref(false)

  function updateInstalled() {
    isInstalled.value =
      window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  }

  updateInstalled()

  // Не вызываем preventDefault — тогда Chrome показывает иконку в адресной строке
  window.addEventListener('beforeinstallprompt', () => {
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    canInstall.value = false
    isInstalled.value = true
  })

  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) isInstalled.value = true
  })

  return {
    provide: {
      pwaInstall: {
        canInstall,
        isInstalled,
      },
    },
  }
})
