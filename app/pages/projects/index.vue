<script setup lang="ts">
import { PROJECT_COLORS } from '#shared/utils/format'

definePageMeta({ layout: 'default' })

const store = useTimeTrackerStore()

const showModal = ref(false)
const saving = ref(false)
const newName = ref('')
const newColor = ref(PROJECT_COLORS[0])

async function createProject() {
  if (saving.value || !newName.value.trim()) return
  saving.value = true
  try {
    await store.addProject(newName.value, newColor.value)
    newName.value = ''
    newColor.value = PROJECT_COLORS[store.projects.length % PROJECT_COLORS.length]
    showModal.value = false
  }
  finally {
    saving.value = false
  }
}

async function deleteProject(id: string) {
  if (!confirm('Удалить проект и все его задачи?')) return
  await store.deleteProject(id)
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
      <h1 class="page-title">Проекты</h1>
      <button class="btn btn--primary" @click="showModal = true">
        + Новый проект
      </button>
    </div>
    <p class="page-subtitle">Управление проектами и задачами</p>

    <div v-if="store.projects.length === 0" class="empty-state">
      <p>Нет проектов. Создайте первый проект.</p>
      <button class="btn btn--primary" @click="showModal = true">
        Создать проект
      </button>
    </div>

    <div v-else class="projects-grid">
      <div v-for="project in store.projects" :key="project.id" class="project-wrapper">
        <ProjectCard :project="project" />
        <button
          class="btn btn--ghost btn--sm project-delete"
          title="Удалить проект"
          @click.prevent="deleteProject(project.id)"
        >
          ✕
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h2 class="modal__title">Новый проект</h2>
          <form @submit.prevent="createProject">
            <div class="form-group">
              <label class="form-label" for="project-name">Название</label>
              <input
                id="project-name"
                v-model="newName"
                class="form-input"
                placeholder="Название проекта"
                autofocus
                required
              >
            </div>
            <div class="form-group">
              <label class="form-label">Цвет</label>
              <div class="color-picker">
                <button
                  v-for="color in PROJECT_COLORS"
                  :key="color"
                  type="button"
                  class="color-picker__swatch"
                  :class="{ 'color-picker__swatch--active': newColor === color }"
                  :style="{ background: color }"
                  @click="newColor = color"
                />
              </div>
            </div>
            <div class="modal__actions">
              <button type="button" class="btn btn--secondary" @click="showModal = false">
                Отмена
              </button>
              <button type="submit" class="btn btn--primary" :disabled="saving">
                Создать
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.project-wrapper {
  position: relative;
}

.project-delete {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  opacity: 0;
  transition: opacity 0.15s;
}

.project-wrapper:hover .project-delete,
.project-wrapper:focus-within .project-delete {
  opacity: 1;
}

@media (max-width: 768px) {
  .project-delete {
    opacity: 1;
  }
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.color-picker__swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s;
}

.color-picker__swatch--active {
  border-color: var(--text-primary);
  transform: scale(1.15);
}
</style>
