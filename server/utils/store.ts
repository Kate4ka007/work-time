import { readFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import type { H3Event } from 'h3'
import { z } from 'zod'
import type { Store } from '#shared/types/store'
import { createEmptyStore } from '#shared/types/store'
import { hasRedisStorage } from './storage-config'

const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  createdAt: z.string().datetime(),
})

const taskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
})

const entrySchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationMs: z.number().int().nonnegative(),
  note: z.string().max(1000).optional(),
  source: z.enum(['timer', 'manual']),
})

const activeTimerSchema = z.object({
  taskId: z.string().uuid(),
  startedAt: z.string().datetime(),
})

export const storeSchema = z.object({
  projects: z.array(projectSchema),
  tasks: z.array(taskSchema),
  entries: z.array(entrySchema),
  activeTimer: activeTimerSchema.nullable(),
})

export const storeWriteSchema = storeSchema.superRefine((store, ctx) => {
  const projectIds = new Set(store.projects.map(p => p.id))
  const taskIds = new Set(store.tasks.map(t => t.id))

  for (const task of store.tasks) {
    if (!projectIds.has(task.projectId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown projectId ${task.projectId}` })
    }
  }
  for (const entry of store.entries) {
    if (!taskIds.has(entry.taskId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown taskId ${entry.taskId}` })
    }
    const expected = new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime()
    if (expected < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Entry ended before it started' })
    }
    else if (entry.durationMs !== expected) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'durationMs does not match timestamps' })
    }
  }
  if (store.activeTimer && !taskIds.has(store.activeTimer.taskId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Unknown activeTimer.taskId ${store.activeTimer.taskId}` })
  }
})

const writeLocks = new Map<string, Promise<void>>()

function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function storeKey(userId: string): string {
  return `${sanitizeUserId(userId)}.json`
}

function usesKvStorage(): boolean {
  return hasRedisStorage()
}

function parseStore(raw: unknown): Store {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  return storeSchema.parse(parsed)
}

async function withUserLock(userId: string, task: () => Promise<void>): Promise<void> {
  const lockKey = sanitizeUserId(userId)
  const previous = writeLocks.get(lockKey) ?? Promise.resolve()
  const next = previous.then(task, task)
  writeLocks.set(lockKey, next)
  try {
    await next
  }
  finally {
    if (writeLocks.get(lockKey) === next) writeLocks.delete(lockKey)
  }
}

async function migrateLegacyStore(userId: string): Promise<Store | null> {
  if (usesKvStorage()) return null

  let migrated: Store | null = null
  await withUserLock('__legacy_migrate__', async () => {
    const legacyPath = join(process.cwd(), 'data', 'tasks.json')
    try {
      const raw = await readFile(legacyPath, 'utf-8')
      const parsed = storeSchema.parse(JSON.parse(raw))
      await writeStore(userId, parsed)
      await rename(legacyPath, `${legacyPath}.migrated`)
      migrated = parsed
    }
    catch {
      migrated = null
    }
  })
  return migrated
}

export async function readStore(userId: string): Promise<Store> {
  const storage = useStorage('store')
  const key = storeKey(userId)

  try {
    const raw = await storage.getItem(key)
    if (raw != null) return parseStore(raw)
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid store data',
      })
    }
    throw error
  }

  const migrated = await migrateLegacyStore(userId)
  if (migrated) return migrated

  const empty = createEmptyStore()
  await writeStore(userId, empty)
  return empty
}

export async function writeStore(userId: string, store: Store): Promise<Store> {
  let validated: Store
  try {
    validated = storeWriteSchema.parse(store)
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid store data',
      })
    }
    throw error
  }

  const key = storeKey(userId)
  const payload = JSON.stringify(validated, null, 2)

  await withUserLock(userId, async () => {
    await useStorage('store').setItem(key, payload)
  })
  return validated
}

export async function requireStoreUserId(event: H3Event): Promise<string> {
  const session = await requireUserSession(event)
  const userId = session.user?.googleId ?? session.user?.email
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return userId
}
