<script setup lang="ts">
import type { Task } from '#shared/types/store'
import { formatDuration } from '#shared/utils/format'
import { getTaskTotalMs } from '#shared/utils/reports'

const props = defineProps<{
  tasks: Task[]
  activeTaskId?: string | null
}>()

const emit = defineEmits<{
  start: [taskId: string]
  stop: []
  delete: [taskId: string]
}>()

const store = useTimeTrackerStore()

function taskTotal(taskId: string) {
  return formatDuration(getTaskTotalMs(store, taskId))
}
</script>

<template>
  <div v-if="tasks.length === 0" class="empty-state">
    <p>Нет задач. Добавьте первую задачу.</p>
  </div>
  <div v-else>
    <div
      v-for="task in tasks"
      :key="task.id"
      class="list-item"
    >
      <div class="list-item__content">
        <div class="list-item__title">{{ task.name }}</div>
        <div class="list-item__meta">{{ taskTotal(task.id) }}</div>
      </div>
      <div class="list-item__actions">
        <button
          v-if="activeTaskId === task.id"
          class="btn btn--danger btn--sm"
          @click="emit('stop')"
        >
          Стоп
        </button>
        <button
          v-else
          class="btn btn--primary btn--sm"
          :disabled="!!activeTaskId"
          @click="emit('start', task.id)"
        >
          Старт
        </button>
        <button
          class="btn btn--ghost btn--sm"
          title="Удалить"
          @click="emit('delete', task.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
