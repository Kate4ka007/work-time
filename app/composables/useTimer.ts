import { useTimeTrackerStore } from '~/stores/timeTracker'

export function useTimer() {
  const store = useTimeTrackerStore()
  const now = ref(Date.now())
  let interval: ReturnType<typeof setInterval> | null = null

  const isRunning = computed(() => store.activeTimer !== null)

  const elapsedMs = computed(() => {
    if (!store.activeTimer) return 0
    return now.value - new Date(store.activeTimer.startedAt).getTime()
  })

  const activeTask = computed(() => {
    if (!store.activeTimer) return null
    return store.tasks.find(t => t.id === store.activeTimer!.taskId) ?? null
  })

  const activeProject = computed(() => {
    if (!activeTask.value) return null
    return store.projects.find(p => p.id === activeTask.value!.projectId) ?? null
  })

  function startTicking() {
    if (interval) return
    interval = setInterval(() => { now.value = Date.now() }, 1000)
  }

  function stopTicking() {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  watch(isRunning, (running) => {
    if (running) startTicking()
    else stopTicking()
  }, { immediate: true })

  onUnmounted(() => stopTicking())

  return {
    isRunning,
    elapsedMs,
    activeTask,
    activeProject,
    startTimer: store.startTimer,
    stopTimer: store.stopTimer,
  }
}
