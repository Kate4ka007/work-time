import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Store, Project, Task, TimeEntry } from '../types/store'

export type ReportPeriod = 'day' | 'week' | 'month'

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

export function buildReport(store: Store, options: ReportOptions): ReportResult {
  const { start, end, projectId, excludedTaskIds } = options
  const project = store.projects.find(p => p.id === projectId)
  const projectTaskIds = new Set(
    store.tasks.filter(t => t.projectId === projectId).map(t => t.id),
  )

  const allEntriesInRange = filterEntriesInRange(store.entries, start, end)
    .filter(e => projectTaskIds.has(e.taskId))
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

  const projectDurationMs = totalMs
  const rows: ProjectReportRow[] = project && projectDurationMs > 0
    ? [{
        project,
        durationMs: projectDurationMs,
        percentage: 100,
      }]
    : []

  const tasks: TaskReportRow[] = store.tasks
    .filter(task => task.projectId === projectId)
    .map((task) => {
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

export function getTodayTotalMs(store: Store): number {
  const { start, end } = getPeriodRange('day')
  return filterEntriesInRange(store.entries, start, end)
    .reduce((sum, e) => sum + e.durationMs, 0)
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
