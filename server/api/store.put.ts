export default defineEventHandler(async (event) => {
  const userId = await requireStoreUserId(event)
  const body = await readBody(event)
  return await writeStore(userId, body)
})
