<script setup lang="ts">
definePageMeta({ layout: 'default' })

const store = useTimeTrackerStore()
const showModal = ref(false)

async function deleteEntry(id: string) {
  if (!confirm('Удалить запись?')) return
  await store.deleteEntry(id)
}
</script>

<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
      <h1 class="page-title">Записи</h1>
      <button
        class="btn btn--primary"
        :disabled="store.tasks.length === 0"
        @click="showModal = true"
      >
        + Добавить вручную
      </button>
    </div>
    <p class="page-subtitle">История учёта времени</p>

    <div class="card">
      <TimeEntryList
        :entries="store.sortedEntries"
        deletable
        @delete="deleteEntry"
      />
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal">
          <h2 class="modal__title">Новая запись</h2>
          <TimeEntryForm
            @saved="showModal = false"
            @cancel="showModal = false"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
