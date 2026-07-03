export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/')) return
  if (path.startsWith('/api/_auth')) return

  await requireUserSession(event)
})
