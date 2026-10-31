<script setup lang="ts">
const props = defineProps<{
  defaultTaskId?: string
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const store = useTimeTrackerStore()

const taskId = ref(props.defaultTaskId ?? '')
const date = ref(new Date().toISOString().slice(0, 10))
const startTime = ref('09:00')
const endTime = ref('10:00')
const note = ref('')
const error = ref('')
const saving = ref(false)

const taskOptions = computed(() =>
  store.tasks.map(t => ({
    value: t.id,
    label: `${store.getProjectById(t.projectId)?.name ?? '?'} / ${t.name}`,
  })),
)

async function submit() {
  error.value = ''
  if (saving.value || !taskId.value) {
    if (!taskId.value) error.value = 'Выберите задачу'
    return
  }
  saving.value = true
  try {
    const startedAt = new Date(`${date.value}T${startTime.value}:00`).toISOString()
    const endedAt = new Date(`${date.value}T${endTime.value}:00`).toISOString()
    await store.addManualEntry({ taskId: taskId.value, startedAt, endedAt, note: note.value })
    emit('saved')
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <div class="form-group">
      <label class="form-label" for="entry-task">Задача</label>
      <select id="entry-task" v-model="taskId" class="form-select" required>
        <option value="" disabled>Выберите задачу</option>
        <option v-for="opt in taskOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label" for="entry-date">Дата</label>
      <input id="entry-date" v-model="date" type="date" class="form-input" required>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="entry-start">Начало</label>
        <input id="entry-start" v-model="startTime" type="time" class="form-input" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="entry-end">Конец</label>
        <input id="entry-end" v-model="endTime" type="time" class="form-input" required>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="entry-note">Заметка (необязательно)</label>
      <textarea id="entry-note" v-model="note" class="form-textarea" rows="2" />
    </div>

    <p v-if="error" style="color: var(--danger); font-size: 0.875rem; margin-bottom: 1rem;">
      {{ error }}
    </p>

    <div class="modal__actions">
      <button type="button" class="btn btn--secondary" @click="emit('cancel')">
        Отмена
      </button>
      <button type="submit" class="btn btn--primary" :disabled="saving">
        Сохранить
      </button>
    </div>
  </form>
</template>
