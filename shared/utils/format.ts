export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}ч ${minutes.toString().padStart(2, '0')}м`
  }
  if (minutes > 0) {
    return `${minutes}м ${seconds.toString().padStart(2, '0')}с`
  }
  return `${seconds}с`
}

export function formatDurationHms(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds]
    .map(n => n.toString().padStart(2, '0'))
    .join(':')
}

export function generateId(): string {
  return crypto.randomUUID()
}

export const PROJECT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
]
