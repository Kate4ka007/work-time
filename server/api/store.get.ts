export default defineEventHandler(async (event) => {
  const userId = await requireStoreUserId(event)
  return await readStore(userId)
})
