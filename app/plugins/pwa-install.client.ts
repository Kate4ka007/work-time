export default defineNuxtPlugin(() => {
  localStorage.removeItem('vite-pwa:hide-install')

  const pwaInstall = reactive({
    canInstall: false,
    isInstalled: false,
  })

  function updateInstalled() {
    pwaInstall.isInstalled =
      window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  }

  updateInstalled()

  // Не вызываем preventDefault — тогда Chrome показывает иконку в адресной строке
  window.addEventListener('beforeinstallprompt', () => {
    pwaInstall.canInstall = true
  })

  window.addEventListener('appinstalled', () => {
    pwaInstall.canInstall = false
    pwaInstall.isInstalled = true
  })

  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) pwaInstall.isInstalled = true
  })

  return {
    provide: {
      pwaInstall,
    },
  }
})
