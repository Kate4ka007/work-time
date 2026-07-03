<script setup lang="ts">
import type { TimeEntry } from '#shared/types/store'
import { formatDuration } from '#shared/utils/format'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

defineProps<{
  entries: TimeEntry[]
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const store = useTimeTrackerStore()

function entryLabel(entry: TimeEntry) {
  const task = store.tasks.find(t => t.id === entry.taskId)
  const project = task ? store.getProjectById(task.projectId) : null
  const date = format(parseISO(entry.startedAt), 'd MMM yyyy, HH:mm', { locale: ru })
  const name = project && task ? `${project.name} / ${task.name}` : 'Неизвестная задача'
  return { name, date, project }
}

function sourceLabel(source: TimeEntry['source']) {
  return source === 'timer' ? 'Таймер' : 'Вручную'
}
</script>

<template>
  <div v-if="entries.length === 0" class="empty-state">
    <p>Записей пока нет.</p>
  </div>
  <div v-else>
    <div v-for="entry in entries" :key="entry.id" class="list-item">
      <span
        v-if="entryLabel(entry).project"
        class="list-item__color"
        :style="{ background: entryLabel(entry).project!.color }"
      />
      <div class="list-item__content">
        <div class="list-item__title">{{ entryLabel(entry).name }}</div>
        <div class="list-item__meta">
          {{ entryLabel(entry).date }}
          · {{ formatDuration(entry.durationMs) }}
          · {{ sourceLabel(entry.source) }}
          <template v-if="entry.note"> · {{ entry.note }}</template>
        </div>
      </div>
      <div class="list-item__actions">
        <button
          class="btn btn--ghost btn--sm"
          title="Удалить"
          @click="emit('delete', entry.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
