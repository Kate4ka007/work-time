<script setup lang="ts">
import { formatDurationHms } from '#shared/utils/format'

const { isRunning, elapsedMs, activeTask, activeProject, stopTimer } = useTimer()
</script>

<template>
  <div v-if="isRunning" class="card active-timer">
    <div class="active-timer__label">Активный таймер</div>
    <div v-if="activeProject && activeTask" class="active-timer__task">
      <span class="list-item__color" :style="{ background: activeProject.color }" />
      {{ activeProject.name }} / {{ activeTask.name }}
    </div>
    <div class="timer-display">{{ formatDurationHms(elapsedMs) }}</div>
    <button class="btn btn--danger" @click="stopTimer">
      Остановить
    </button>
  </div>
</template>

<style scoped>
.active-timer {
  text-align: center;
  padding: 2rem;
}

.active-timer__label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.active-timer__task {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9375rem;
}

.active-timer .btn {
  margin-top: 1.5rem;
}
</style>
