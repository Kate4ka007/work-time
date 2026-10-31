<script setup lang="ts">
import type { ReportPeriod } from '#shared/utils/reports'
import { ALL_PROJECTS_ID, buildReport, periodToDateStrings, reportRangeFromDates } from '#shared/utils/reports'

definePageMeta({ layout: 'default' })

const store = useTimeTrackerStore()

const period = ref<ReportPeriod>('week')
const initialDates = periodToDateStrings('week')
const dateFrom = ref(initialDates.dateFrom)
const dateTo = ref(initialDates.dateTo)
const selectedProjectId = ref('')
const excludedTaskIds = ref<Set<string>>(new Set())

watch(() => store.projects, (projects) => {
  if (!selectedProjectId.value && projects.length > 0) {
    selectedProjectId.value = projects[0].id
  }
  if (
    selectedProjectId.value
    && selectedProjectId.value !== ALL_PROJECTS_ID
    && !projects.some(p => p.id === selectedProjectId.value)
  ) {
    selectedProjectId.value = projects[0]?.id ?? ''
  }
}, { immediate: true })

const selectedProject = computed(() =>
  store.projects.find(p => p.id === selectedProjectId.value) ?? null,
)

function applyPeriod(p: ReportPeriod) {
  period.value = p
  const dates = periodToDateStrings(p)
  dateFrom.value = dates.dateFrom
  dateTo.value = dates.dateTo
  excludedTaskIds.value = new Set()
}

const fallbackRange = periodToDateStrings('day')

const reportRange = computed(() => reportRangeFromDates(dateFrom.value, dateTo.value))

const emptyReport = computed(() => {
  const range = reportRange.value ?? reportRangeFromDates(fallbackRange.dateFrom, fallbackRange.dateTo)
    ?? { start: new Date(), end: new Date() }
  return {
    periodLabel: '',
    rangeStart: range.start,
    rangeEnd: range.end,
    totalMs: 0,
    rows: [],
    tasks: [],
  }
})

const report = computed(() => {
  if (!selectedProjectId.value || !reportRange.value) return emptyReport.value
  return buildReport(store, {
    ...reportRange.value,
    projectId: selectedProjectId.value,
    excludedTaskIds: excludedTaskIds.value,
  })
})

function resetTaskFilter() {
  excludedTaskIds.value = new Set()
}

watch([dateFrom, dateTo], resetTaskFilter)
watch(selectedProjectId, resetTaskFilter)

function onDateChange() {
  if (dateFrom.value > dateTo.value) {
    dateTo.value = dateFrom.value
  }
}

function toggleTask(taskId: string, included: boolean) {
  const next = new Set(excludedTaskIds.value)
  if (included) {
    next.delete(taskId)
  }
  else {
    next.add(taskId)
  }
  excludedTaskIds.value = next
}
</script>

<template>
  <div>
    <h1 class="page-title">Отчёты</h1>
    <p class="page-subtitle">Сводка по времени</p>

    <div v-if="store.projects.length === 0" class="empty-state">
      <p>Нет проектов. Создайте проект, чтобы смотреть отчёты.</p>
      <NuxtLink to="/projects" class="btn btn--primary">Перейти к проектам</NuxtLink>
    </div>

    <template v-else>
      <PeriodSelector :model-value="period" @update:model-value="applyPeriod" />

      <div class="card report-filters">
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" for="report-project">Проект</label>
          <select id="report-project" v-model="selectedProjectId" class="form-select">
            <option :value="ALL_PROJECTS_ID">Все проекты</option>
            <option v-for="project in store.projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="report-date-from">От</label>
            <input
              id="report-date-from"
              v-model="dateFrom"
              type="date"
              class="form-input"
              @change="onDateChange"
            >
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="report-date-to">До</label>
            <input
              id="report-date-to"
              v-model="dateTo"
              type="date"
              class="form-input"
              :min="dateFrom"
              @change="onDateChange"
            >
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 1rem;">
        <div v-if="selectedProject" class="section-header">
          <span class="list-item__color" :style="{ background: selectedProject.color }" />
          <h2 class="section-title">{{ selectedProject.name }}</h2>
        </div>
        <ReportSummary :report="report" />
      </div>

      <div class="card" style="margin-top: 1rem;">
        <h2 class="section-title">Задачи</h2>
        <p class="section-hint">Снимите галочку, чтобы исключить задачу из отчёта</p>
        <ReportTaskList
          :tasks="report.tasks"
          :excluded-task-ids="excludedTaskIds"
          :show-project="selectedProjectId === ALL_PROJECTS_ID"
          @toggle="toggleTask"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.report-filters {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0;
}

.section-hint {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}
</style>
