import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { accessSync, constants } from 'node:fs'
import { dirname, join, basename } from 'node:path'
import type { H3Event } from 'h3'
import { z } from 'zod'
import type { Store } from '#shared/types/store'
import { createEmptyStore } from '#shared/types/store'

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

const writeLocks = new Map<string, Promise<void>>()

function resolveDataDir(): string {
  const cwd = process.cwd()
  const isOutputDir = basename(cwd) === '.output'

  const candidates = isOutputDir
    ? [join(cwd, '..', 'data'), join(cwd, 'data')]
    : [join(cwd, 'data'), join(cwd, '..', 'data')]

  for (const dir of candidates) {
    try {
      accessSync(dir, constants.F_OK)
      return dir
    }
    catch {
      // try next candidate
    }
  }

  return isOutputDir ? join(cwd, '..', 'data') : join(cwd, 'data')
}

function sanitizeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function getUsersDir(): string {
  return join(resolveDataDir(), 'users')
}

function getStorePath(userId: string): string {
  return join(getUsersDir(), `${sanitizeUserId(userId)}.json`)
}

function getLegacyStorePath(): string {
  return join(resolveDataDir(), 'tasks.json')
}

async function migrateLegacyStore(userId: string): Promise<Store | null> {
  try {
    const raw = await readFile(getLegacyStorePath(), 'utf-8')
    const parsed = storeSchema.parse(JSON.parse(raw))
    await writeStore(userId, parsed)
    return parsed
  }
  catch {
    return null
  }
}

export async function readStore(userId: string): Promise<Store> {
  const path = getStorePath(userId)
  try {
    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw)
    return storeSchema.parse(parsed)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const migrated = await migrateLegacyStore(userId)
      if (migrated) return migrated

      const empty = createEmptyStore()
      await writeStore(userId, empty)
      return empty
    }
    throw error
  }
}

export async function writeStore(userId: string, store: Store): Promise<Store> {
  const validated = storeSchema.parse(store)
  const path = getStorePath(userId)
  const dir = dirname(path)
  const tempPath = `${path}.tmp`

  const task = async () => {
    await mkdir(dir, { recursive: true })
    await writeFile(tempPath, JSON.stringify(validated, null, 2), 'utf-8')
    await rename(tempPath, path)
  }

  const previous = writeLocks.get(userId) ?? Promise.resolve()
  const next = previous.then(task, task)
  writeLocks.set(userId, next)
  await next
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
