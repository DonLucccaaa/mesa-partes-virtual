<script setup>
import { onMounted, ref } from "vue";
import AppNav from "./components/AppNav.vue";
import { api } from "./api";

const conn = ref("checking");

async function checkHealth() {
  try {
    const result = await api.health();
    conn.value = result.status === "ok" ? "ok" : "ko";
  } catch {
    conn.value = "ko";
  }
}

onMounted(checkHealth);
</script>

<template>
  <div class="app-shell">
    <AppNav />
    <router-view />
    <footer class="app-footer">
      <div class="container">
        <div class="footer-row">
          <span class="brand">Mesa de Partes Virtual</span>
          <span>
            Registro, seguimiento y gestión documentaria institucional
          </span>
          <span class="conn-indicator" :title="conn === 'ok' ? 'Servidor conectado' : 'Servidor no disponible'">
            <span class="conn-dot" :class="`${conn === 'checking' ? '' : conn}`"></span>
            <span v-if="conn === 'ok'">Servidor en línea</span>
            <span v-else-if="conn === 'ko'">Servidor no disponible</span>
            <span v-else>Comprobando conexión…</span>
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>