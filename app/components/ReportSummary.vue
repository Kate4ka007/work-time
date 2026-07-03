<script setup lang="ts">
import type { ReportResult } from '#shared/utils/reports'
import { formatDuration } from '#shared/utils/format'

defineProps<{
  report: ReportResult
}>()
</script>

<template>
  <div>
    <div class="report-header">
      <h2 class="report-header__period">{{ report.periodLabel }}</h2>
      <div class="report-header__total">
        Всего: <strong>{{ formatDuration(report.totalMs) }}</strong>
      </div>
    </div>

    <div v-if="report.rows.length === 0" class="empty-state">
      <p>Нет данных за выбранный период.</p>
    </div>

    <div v-else class="report-rows">
      <div v-for="row in report.rows" :key="row.project.id" class="report-row">
        <div class="report-row__header">
          <span class="list-item__color" :style="{ background: row.project.color }" />
          <span class="report-row__name">{{ row.project.name }}</span>
          <span class="report-row__duration">{{ formatDuration(row.durationMs) }}</span>
          <span class="report-row__pct">{{ row.percentage.toFixed(0) }}%</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-bar__fill"
            :style="{ width: `${row.percentage}%`, background: row.project.color }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.report-header__period {
  font-size: 1.125rem;
  font-weight: 600;
}

.report-header__total {
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

.report-header__total strong {
  color: var(--text-primary);
}

.report-rows {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-row__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.9375rem;
}

.report-row__name {
  flex: 1;
  font-weight: 500;
}

.report-row__duration {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.report-row__pct {
  color: var(--text-muted);
  font-size: 0.8125rem;
  width: 2.5rem;
  text-align: right;
}
</style>
