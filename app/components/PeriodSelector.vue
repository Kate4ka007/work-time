<script setup lang="ts">
import type { ReportPeriod } from '#shared/utils/reports'

defineProps<{
  modelValue: ReportPeriod
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ReportPeriod]
}>()

const options: { value: ReportPeriod; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
]
</script>

<template>
  <div class="period-selector">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="btn"
      :class="modelValue === opt.value ? 'btn--primary' : 'btn--secondary'"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.period-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
</style>
