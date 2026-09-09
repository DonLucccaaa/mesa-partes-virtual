<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
  accent: { type: String, default: "var(--primary-500)" },
});
</script>

<template>
  <article class="stat-card" :style="{ '--accent': accent }">
    <span class="stat-label">{{ label }}</span>
    <span class="stat-value">{{ value }}</span>
  </article>
</template>