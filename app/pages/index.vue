<script setup lang="ts">
import { formatDuration } from '#shared/utils/format'
import { getTodayTotalMs } from '#shared/utils/reports'

definePageMeta({ layout: 'default' })

const store = useTimeTrackerStore()
const { isRunning, elapsedMs, startTimer } = useTimer()

const todayTotal = computed(() => {
  void elapsedMs.value
  return formatDuration(getTodayTotalMs(store))
})
const recentEntries = computed(() => store.sortedEntries.slice(0, 5))
</script>

<template>
  <div>
    <h1 class="page-title">Главная</h1>
    <p class="page-subtitle">Сегодня: {{ todayTotal }}</p>

    <ActiveTimer />

    <div v-if="!isRunning" class="card" style="margin-top: 1rem;">
      <h2 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem;">Быстрый старт</h2>
      <div v-if="store.tasks.length === 0" class="empty-state" style="padding: 1.5rem;">
        <p>Создайте проект и задачу, чтобы начать трекинг.</p>
        <NuxtLink to="/projects" class="btn btn--primary">Перейти к проектам</NuxtLink>
      </div>
      <div v-else>
        <div
          v-for="task in store.tasks.slice(0, 8)"
          :key="task.id"
          class="list-item"
        >
          <span
            class="list-item__color"
            :style="{ background: store.getProjectById(task.projectId)?.color }"
          />
          <div class="list-item__content">
            <div class="list-item__title">{{ task.name }}</div>
            <div class="list-item__meta">{{ store.getProjectById(task.projectId)?.name }}</div>
          </div>
          <button class="btn btn--primary btn--sm" @click="startTimer(task.id)">
            Старт
          </button>
        </div>
      </div>
    </div>

    <div v-if="recentEntries.length > 0" class="card" style="margin-top: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <h2 style="font-size: 1rem; font-weight: 600;">Последние записи</h2>
        <NuxtLink to="/entries" class="btn btn--ghost btn--sm">Все записи</NuxtLink>
      </div>
      <TimeEntryList :entries="recentEntries" :deletable="false" />
    </div>
  </div>
</template>
