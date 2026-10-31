<script setup lang="ts">
import type { TaskReportRow } from '#shared/utils/reports'
import { formatDuration } from '#shared/utils/format'

const props = defineProps<{
  tasks: TaskReportRow[]
  excludedTaskIds: ReadonlySet<string>
  showProject?: boolean
}>()

const emit = defineEmits<{
  toggle: [taskId: string, included: boolean]
}>()

function isIncluded(taskId: string) {
  return !props.excludedTaskIds.has(taskId)
}
</script>

<template>
  <div v-if="tasks.length === 0" class="empty-state">
    <p>Нет задач с записями за выбранный период.</p>
  </div>
  <ul v-else class="task-list">
    <li
      v-for="row in tasks"
      :key="row.task.id"
      class="task-list__item"
      :class="{ 'task-list__item--excluded': !isIncluded(row.task.id) }"
    >
      <label class="task-list__label">
        <input
          type="checkbox"
          class="task-list__checkbox"
          :checked="isIncluded(row.task.id)"
          @change="emit('toggle', row.task.id, ($event.target as HTMLInputElement).checked)"
        >
        <span class="list-item__color" :style="{ background: row.project.color }" />
        <span class="task-list__content">
          <span class="task-list__name">{{ row.task.name }}</span>
          <span v-if="showProject" class="task-list__project">{{ row.project.name }}</span>
        </span>
        <span class="task-list__duration">{{ formatDuration(row.durationMs) }}</span>
      </label>
    </li>
  </ul>
</template>

<style scoped>
.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.task-list__item {
  border-radius: var(--radius);
  transition: background 0.15s, opacity 0.15s;
}

.task-list__item:hover {
  background: var(--bg-hover);
}

.task-list__item--excluded {
  opacity: 0.5;
}

.task-list__label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  width: 100%;
}

.task-list__checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  flex-shrink: 0;
  cursor: pointer;
}

.task-list__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.task-list__project {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.task-list__name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-list__duration {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  font-size: 0.875rem;
  flex-shrink: 0;
}
</style>
