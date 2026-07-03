export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch } = useUserSession()
  await fetch()

  if (to.path === '/login') {
    if (loggedIn.value) return navigateTo('/')
    return
  }

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
