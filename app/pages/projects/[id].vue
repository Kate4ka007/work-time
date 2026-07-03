<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const store = useTimeTrackerStore()
const { isRunning, startTimer, stopTimer } = useTimer()

const projectId = computed(() => route.params.id as string)
const project = computed(() => store.getProjectById(projectId.value))
const tasks = computed(() => store.getTasksByProject(projectId.value))

const newTaskName = ref('')
const showAddTask = ref(false)

async function addTask() {
  if (!newTaskName.value.trim()) return
  await store.addTask(projectId.value, newTaskName.value)
  newTaskName.value = ''
  showAddTask.value = false
}

async function deleteTask(id: string) {
  if (!confirm('Удалить задачу и все записи?')) return
  await store.deleteTask(id)
}

function handleStart(taskId: string) {
  startTimer(taskId)
}

function handleStop() {
  stopTimer()
}
</script>

<template>
  <div>
    <NuxtLink to="/projects" class="btn btn--ghost btn--sm" style="margin-bottom: 1rem; display: inline-flex;">
      ← Назад к проектам
    </NuxtLink>

    <template v-if="project">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
        <span class="list-item__color" :style="{ background: project.color, width: '16px', height: '16px' }" />
        <h1 class="page-title">{{ project.name }}</h1>
      </div>
      <p class="page-subtitle">Задачи проекта</p>

      <ActiveTimer />

      <div class="card" style="margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h2 style="font-size: 1rem; font-weight: 600;">Задачи</h2>
          <button class="btn btn--primary btn--sm" @click="showAddTask = true">
            + Задача
          </button>
        </div>

        <TaskList
          :tasks="tasks"
          :active-task-id="isRunning ? store.activeTimer?.taskId : null"
          @start="handleStart"
          @stop="handleStop"
          @delete="deleteTask"
        />
      </div>
    </template>

    <div v-else class="empty-state">
      <p>Проект не найден.</p>
      <NuxtLink to="/projects" class="btn btn--primary">К проектам</NuxtLink>
    </div>

    <Teleport to="body">
      <div v-if="showAddTask" class="modal-overlay" @click.self="showAddTask = false">
        <div class="modal">
          <h2 class="modal__title">Новая задача</h2>
          <form @submit.prevent="addTask">
            <div class="form-group">
              <label class="form-label" for="task-name">Название</label>
              <input
                id="task-name"
                v-model="newTaskName"
                class="form-input"
                placeholder="Название задачи"
                autofocus
                required
              >
            </div>
            <div class="modal__actions">
              <button type="button" class="btn btn--secondary" @click="showAddTask = false">
                Отмена
              </button>
              <button type="submit" class="btn btn--primary">
                Создать
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
