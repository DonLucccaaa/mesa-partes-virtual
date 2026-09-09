<script setup>
import { statusMeta } from "../status";

defineProps({
  status: { type: String, required: true },
});
</script>

<template>
  <span class="badge" :class="statusMeta(status).cls">
    {{ statusMeta(status).label }}
  </span>
</template>