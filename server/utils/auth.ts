import type { H3Event } from 'h3'

export function isEmailAllowed(email: string | null | undefined, allowedEmails: string): boolean {
  if (!allowedEmails.trim()) return true
  if (!email) return false
  const list = allowedEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return list.includes(email.toLowerCase())
}

export async function denyAccess(event: H3Event, reason = 'access_denied') {
  await clearUserSession(event)
  return sendRedirect(event, `/login?error=${reason}`)
}
