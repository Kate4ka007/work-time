<script setup lang="ts">
import type { Project } from '#shared/types/store'
import { formatDuration } from '#shared/utils/format'
import { getProjectTotalMs } from '#shared/utils/reports'

const props = defineProps<{
  project: Project
}>()

const store = useTimeTrackerStore()
const totalMs = computed(() => getProjectTotalMs(store, props.project.id))
const taskCount = computed(() => store.getTasksByProject(props.project.id).length)
</script>

<template>
  <NuxtLink :to="`/projects/${project.id}`" class="card project-card">
    <div class="project-card__header">
      <span class="list-item__color" :style="{ background: project.color }" />
      <div class="list-item__content">
        <div class="list-item__title">{{ project.name }}</div>
        <div class="list-item__meta">
          {{ taskCount }} {{ taskCount === 1 ? 'задача' : taskCount < 5 ? 'задачи' : 'задач' }}
          · {{ formatDuration(totalMs) }}
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.project-card {
  display: block;
  transition: border-color 0.15s, transform 0.15s;
  cursor: pointer;
}

.project-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.project-card__header {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
