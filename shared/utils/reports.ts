import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Store, Project, Task, TimeEntry } from '../types/store'

export const ALL_PROJECTS_ID = 'all'

export type ReportPeriod = 'day' | 'yesterday' | 'week' | 'month'

export interface ProjectReportRow {
  project: Project
  durationMs: number
  percentage: number
}

export interface TaskReportRow {
  task: Task
  project: Project
  durationMs: number
  percentage: number
}

export interface ReportOptions {
  start: Date
  end: Date
  projectId: string
  excludedTaskIds?: ReadonlySet<string>
}

export interface ReportResult {
  periodLabel: string
  rangeStart: Date
  rangeEnd: Date
  totalMs: number
  rows: ProjectReportRow[]
  tasks: TaskReportRow[]
}

export function getPeriodRange(period: ReportPeriod, referenceDate: Date = new Date()) {
  switch (period) {
    case 'day':
      return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) }
    case 'yesterday': {
      const day = subDays(referenceDate, 1)
      return { start: startOfDay(day), end: endOfDay(day) }
    }
    case 'week':
      return {
        start: startOfWeek(referenceDate, { locale: ru, weekStartsOn: 1 }),
        end: endOfWeek(referenceDate, { locale: ru, weekStartsOn: 1 }),
      }
    case 'month':
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) }
  }
}

export function formatReportRangeLabel(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const startStr = fmt.format(start)
  const endStr = fmt.format(end)
  if (startStr === endStr) return startStr
  return `${startStr} — ${endStr}`
}

export function periodToDateStrings(period: ReportPeriod, referenceDate: Date = new Date()) {
  const { start, end } = getPeriodRange(period, referenceDate)
  return {
    dateFrom: format(start, 'yyyy-MM-dd'),
    dateTo: format(end, 'yyyy-MM-dd'),
  }
}

function filterEntriesInRange(entries: TimeEntry[], start: Date, end: Date): TimeEntry[] {
  return entries.filter((entry) => {
    const startedAt = parseISO(entry.startedAt)
    return isWithinInterval(startedAt, { start, end })
  })
}

function tasksInReportScope(store: Store, projectId: string): Task[] {
  if (projectId === ALL_PROJECTS_ID) return store.tasks
  return store.tasks.filter(t => t.projectId === projectId)
}

export function buildReport(store: Store, options: ReportOptions): ReportResult {
  const { start, end, projectId, excludedTaskIds } = options
  const scopedTasks = tasksInReportScope(store, projectId)
  const scopedTaskIds = new Set(scopedTasks.map(t => t.id))
  const taskById = new Map(scopedTasks.map(t => [t.id, t]))

  const allEntriesInRange = filterEntriesInRange(store.entries, start, end)
    .filter(e => scopedTaskIds.has(e.taskId))
  const includedEntries = allEntriesInRange.filter(e => !excludedTaskIds?.has(e.taskId))

  const fullDurationByTask = new Map<string, number>()
  for (const entry of allEntriesInRange) {
    fullDurationByTask.set(entry.taskId, (fullDurationByTask.get(entry.taskId) ?? 0) + entry.durationMs)
  }

  const durationByTask = new Map<string, number>()
  for (const entry of includedEntries) {
    durationByTask.set(entry.taskId, (durationByTask.get(entry.taskId) ?? 0) + entry.durationMs)
  }

  const totalMs = [...durationByTask.values()].reduce((sum, ms) => sum + ms, 0)

  const durationByProjectId = new Map<string, number>()
  for (const entry of includedEntries) {
    const task = taskById.get(entry.taskId)
    if (!task) continue
    durationByProjectId.set(
      task.projectId,
      (durationByProjectId.get(task.projectId) ?? 0) + entry.durationMs,
    )
  }

  const rows: ProjectReportRow[] = [...durationByProjectId.entries()]
    .map(([pid, durationMs]) => {
      const project = store.projects.find(p => p.id === pid)
      if (!project || durationMs <= 0) return null
      return {
        project,
        durationMs,
        percentage: totalMs > 0 ? (durationMs / totalMs) * 100 : 0,
      }
    })
    .filter((row): row is ProjectReportRow => row !== null)
    .sort((a, b) => b.durationMs - a.durationMs)

  const tasks: TaskReportRow[] = scopedTasks
    .map((task) => {
      const project = store.projects.find(p => p.id === task.projectId)
      if (!project) return null
      const durationMs = fullDurationByTask.get(task.id) ?? 0
      if (durationMs === 0) return null
      const includedMs = durationByTask.get(task.id) ?? 0
      return {
        task,
        project,
        durationMs,
        percentage: totalMs > 0 ? (includedMs / totalMs) * 100 : 0,
      }
    })
    .filter((row): row is TaskReportRow => row !== null)
    .sort((a, b) => b.durationMs - a.durationMs)

  return {
    periodLabel: formatReportRangeLabel(start, end),
    rangeStart: start,
    rangeEnd: end,
    totalMs,
    rows,
    tasks,
  }
}

export function reportRangeFromDates(dateFrom: string, dateTo: string): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) return null
  if (dateFrom > dateTo) return null
  const start = startOfDay(parseISO(dateFrom))
  const end = endOfDay(parseISO(dateTo))
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null
  return { start, end }
}

export function getTodayTotalMs(store: Store, now = Date.now()): number {
  const { start, end } = getPeriodRange('day', new Date(now))
  let total = filterEntriesInRange(store.entries, start, end)
    .reduce((sum, e) => sum + e.durationMs, 0)
  if (store.activeTimer) {
    const startedAt = parseISO(store.activeTimer.startedAt)
    if (!Number.isNaN(startedAt.getTime()) && isWithinInterval(startedAt, { start, end })) {
      total += Math.max(0, now - startedAt.getTime())
    }
  }
  return total
}

export function getProjectTotalMs(store: Store, projectId: string): number {
  const taskIds = new Set(store.tasks.filter(t => t.projectId === projectId).map(t => t.id))
  return store.entries
    .filter(e => taskIds.has(e.taskId))
    .reduce((sum, e) => sum + e.durationMs, 0)
}

export function getTaskTotalMs(store: Store, taskId: string): number {
  return store.entries
    .filter(e => e.taskId === taskId)
    .reduce((sum, e) => sum + e.durationMs, 0)
}
