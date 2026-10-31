import { defineStore } from 'pinia'
import type { Store, Project, Task, TimeEntry } from '#shared/types/store'
import { createEmptyStore } from '#shared/types/store'
import { generateId, PROJECT_COLORS } from '#shared/utils/format'
import {
  savePendingStore,
  clearPendingStore,
  loadPendingStore,
  currentStoreUserId,
} from '~/composables/useOfflineQueue'

function apiFetch<T>(url: string, options?: FetchOptions<'json'>) {
  return useNuxtApp().$apiFetch<T>(url, options)
}

function snapshotStore(store: Store): Store {
  return JSON.parse(JSON.stringify({
    projects: store.projects,
    tasks: store.tasks,
    entries: store.entries,
    activeTimer: store.activeTimer,
  })) as Store
}

function fetchStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  if ('statusCode' in error && typeof error.statusCode === 'number') return error.statusCode
  if ('status' in error && typeof error.status === 'number') return error.status
  return undefined
}

function isRetryablePersistError(error: unknown): boolean {
  const status = fetchStatus(error)
  return status === undefined || status === 0 || status >= 500
}

let persistQueue: Promise<unknown> = Promise.resolve()
let persistGeneration = 0

function enqueuePersist<T>(task: () => Promise<T>): Promise<T | undefined> {
  const generation = persistGeneration
  const run = persistQueue.then(
    () => generation === persistGeneration ? task() : Promise.resolve(undefined),
    () => generation === persistGeneration ? task() : Promise.resolve(undefined),
  )
  persistQueue = run.then(() => undefined, () => undefined)
  return run
}

export const useTimeTrackerStore = defineStore('timeTracker', {
  state: (): Store & { loaded: boolean; syncing: boolean; error: string | null } => ({
    ...createEmptyStore(),
    loaded: false,
    syncing: false,
    error: null,
  }),

  getters: {
    getProjectById: state => (id: string) => state.projects.find(p => p.id === id),
    getTasksByProject: state => (projectId: string) =>
      state.tasks.filter(t => t.projectId === projectId),
    getEntriesByTask: state => (taskId: string) =>
      state.entries
        .filter(e => e.taskId === taskId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    sortedEntries: state =>
      [...state.entries].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      ),
  },

  actions: {
    hydrate(data: Store) {
      this.projects = data.projects
      this.tasks = data.tasks
      this.entries = data.entries
      this.activeTimer = data.activeTimer
      this.loaded = true
    },

    reset() {
      persistGeneration += 1
      const empty = createEmptyStore()
      this.projects = empty.projects
      this.tasks = empty.tasks
      this.entries = empty.entries
      this.activeTimer = empty.activeTimer
      this.loaded = false
      this.syncing = false
      this.error = null
    },

    async fetchStore() {
      return enqueuePersist(async () => {
        if (import.meta.client && navigator.onLine) {
          await this.flushPendingUnlocked()
          const pending = await loadPendingStore<Store>()
          if (pending) {
            this.hydrate(pending)
            this.error = 'Офлайн — показаны локальные данные'
            return pending
          }
        }

        try {
          const data = await apiFetch<Store>('/api/store')
          const pending = import.meta.client ? await loadPendingStore<Store>() : null
          if (pending) {
            this.hydrate(pending)
            this.error = 'Офлайн — показаны локальные данные'
            return pending
          }
          this.hydrate(data)
          this.error = null
          return data
        }
        catch (e) {
          if (fetchStatus(e) === 401) {
            this.reset()
            this.error = 'Сессия истекла'
            return null
          }
          if (import.meta.client) {
            const pending = await loadPendingStore<Store>()
            if (pending) {
              this.hydrate(pending)
              this.error = 'Офлайн — показаны локальные данные'
              return pending
            }
          }
          this.error = 'Не удалось загрузить данные'
          return null
        }
      })
    },

    async persist() {
      return enqueuePersist(async () => {
        const payload = snapshotStore(this)

        if (import.meta.client && !navigator.onLine) {
          await savePendingStore(payload)
          this.error = 'Офлайн — изменения сохранены локально'
          return payload
        }

        this.syncing = true
        try {
          await apiFetch<Store>('/api/store', {
            method: 'PUT',
            body: payload,
          })
          const latest = snapshotStore(this)
          if (JSON.stringify(latest) !== JSON.stringify(payload)) {
            await savePendingStore(latest)
          }
          else {
            await clearPendingStore()
          }
          this.error = null
          return payload
        }
        catch (e) {
          if (fetchStatus(e) === 401) {
            this.reset()
            this.error = 'Сессия истекла'
            throw e
          }
          if (import.meta.client && isRetryablePersistError(e)) {
            await savePendingStore(snapshotStore(this))
            this.error = 'Офлайн — изменения сохранены локально'
            return payload
          }
          if (import.meta.client) {
            this.error = 'Не удалось сохранить данные'
            return payload
          }
          throw e
        }
        finally {
          this.syncing = false
        }
      })
    },

    async flushPendingUnlocked() {
      if (!import.meta.client || !navigator.onLine || !currentStoreUserId()) return
      const pending = await loadPendingStore<Store>()
      if (!pending) return
      this.syncing = true
      try {
        await apiFetch<Store>('/api/store', {
          method: 'PUT',
          body: pending,
        })
        await clearPendingStore()
        this.hydrate(pending)
        this.error = null
      }
      catch (e) {
        if (fetchStatus(e) === 401) {
          this.reset()
          this.error = 'Сессия истекла'
          return
        }
        if (isRetryablePersistError(e)) {
          this.hydrate(pending)
          this.error = 'Офлайн — показаны локальные данные'
          return
        }
        this.error = 'Не удалось синхронизировать данные'
      }
      finally {
        this.syncing = false
      }
    },

    async syncPending() {
      if (!import.meta.client || !navigator.onLine) return
      return enqueuePersist(() => this.flushPendingUnlocked())
    },

    async addProject(name: string, color?: string) {
      const project: Project = {
        id: generateId(),
        name: name.trim(),
        color: color ?? PROJECT_COLORS[this.projects.length % PROJECT_COLORS.length],
        createdAt: new Date().toISOString(),
      }
      this.projects.push(project)
      await this.persist()
      return project
    },

    async updateProject(id: string, data: Partial<Pick<Project, 'name' | 'color'>>) {
      const project = this.projects.find(p => p.id === id)
      if (!project) return
      if (data.name !== undefined) project.name = data.name.trim()
      if (data.color !== undefined) project.color = data.color
      await this.persist()
    },

    async deleteProject(id: string) {
      const taskIds = this.tasks.filter(t => t.projectId === id).map(t => t.id)
      this.projects = this.projects.filter(p => p.id !== id)
      this.tasks = this.tasks.filter(t => t.projectId !== id)
      this.entries = this.entries.filter(e => !taskIds.includes(e.taskId))
      if (this.activeTimer && taskIds.includes(this.activeTimer.taskId)) {
        this.activeTimer = null
      }
      await this.persist()
    },

    async addTask(projectId: string, name: string) {
      const task: Task = {
        id: generateId(),
        projectId,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      }
      this.tasks.push(task)
      await this.persist()
      return task
    },

    async updateTask(id: string, name: string) {
      const task = this.tasks.find(t => t.id === id)
      if (!task) return
      task.name = name.trim()
      await this.persist()
    },

    async deleteTask(id: string) {
      this.tasks = this.tasks.filter(t => t.id !== id)
      this.entries = this.entries.filter(e => e.taskId !== id)
      if (this.activeTimer?.taskId === id) {
        this.activeTimer = null
      }
      await this.persist()
    },

    async startTimer(taskId: string) {
      if (this.activeTimer) {
        await this.stopTimer()
      }
      this.activeTimer = { taskId, startedAt: new Date().toISOString() }
      await this.persist()
    },

    async stopTimer() {
      if (!this.activeTimer) return
      const endedAt = new Date()
      const startedAt = new Date(this.activeTimer.startedAt)
      const durationMs = Math.max(0, endedAt.getTime() - startedAt.getTime())
      const entry: TimeEntry = {
        id: generateId(),
        taskId: this.activeTimer.taskId,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        durationMs,
        source: 'timer',
      }
      this.entries.push(entry)
      this.activeTimer = null
      await this.persist()
      return entry
    },

    async addManualEntry(data: {
      taskId: string
      startedAt: string
      endedAt: string
      note?: string
    }) {
      const start = new Date(data.startedAt)
      let end = new Date(data.endedAt)
      if (end < start) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
      }
      if (end <= start) throw new Error('Время окончания должно быть позже начала')

      const entry: TimeEntry = {
        id: generateId(),
        taskId: data.taskId,
        startedAt: start.toISOString(),
        endedAt: end.toISOString(),
        durationMs: end.getTime() - start.getTime(),
        note: data.note?.trim() || undefined,
        source: 'manual',
      }
      this.entries.push(entry)
      await this.persist()
      return entry
    },

    async updateEntry(id: string, data: Partial<Pick<TimeEntry, 'startedAt' | 'endedAt' | 'note'>>) {
      const entry = this.entries.find(e => e.id === id)
      if (!entry) return

      if (data.startedAt) entry.startedAt = data.startedAt
      if (data.endedAt) entry.endedAt = data.endedAt
      if (data.note !== undefined) entry.note = data.note.trim() || undefined

      const start = new Date(entry.startedAt)
      const end = new Date(entry.endedAt)
      if (end <= start) throw new Error('Время окончания должно быть позже начала')
      entry.durationMs = end.getTime() - start.getTime()
      await this.persist()
    },

    async deleteEntry(id: string) {
      this.entries = this.entries.filter(e => e.id !== id)
      await this.persist()
    },
  },
})
