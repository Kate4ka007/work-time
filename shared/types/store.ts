export interface Project {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface Task {
  id: string
  projectId: string
  name: string
  createdAt: string
}

export type TimeEntrySource = 'timer' | 'manual'

export interface TimeEntry {
  id: string
  taskId: string
  startedAt: string
  endedAt: string
  durationMs: number
  note?: string
  source: TimeEntrySource
}

export interface ActiveTimer {
  taskId: string
  startedAt: string
}

export interface Store {
  projects: Project[]
  tasks: Task[]
  entries: TimeEntry[]
  activeTimer: ActiveTimer | null
}

export function createEmptyStore(): Store {
  return {
    projects: [],
    tasks: [],
    entries: [],
    activeTimer: null,
  }
}
