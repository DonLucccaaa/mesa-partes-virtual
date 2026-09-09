<script setup>
import { statusMeta } from "../status";
import { formatDate } from "../api";

defineProps({
  history: { type: Array, default: () => [] },
});
</script>

<template>
  <ol v-if="history.length > 0" class="timeline">
    <li v-for="entry in history" :key="entry.id" class="timeline-item">
      <span class="timeline-dot" :class="statusMeta(entry.status).cls" aria-hidden="true"></span>
      <div class="timeline-head">
        <span class="timeline-status">{{ statusMeta(entry.status).label }}</span>
        <span class="timeline-date">{{ formatDate(entry.changed_at) }}</span>
      </div>
      <p v-if="entry.observation" class="timeline-body">
        {{ entry.observation }}
      </p>
      <p v-if="entry.changed_by" class="timeline-by">por {{ entry.changed_by }}</p>
    </li>
  </ol>
  <p v-else class="muted small">No hay historial disponible.</p>
</template>