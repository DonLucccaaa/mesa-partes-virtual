<template>
  <main class="home">
    <h1>Panel administrativo</h1>
    <p v-if="statsMessage" class="error-message">{{ statsMessage }}</p>
    <div v-else class="stats-grid">
      <article v-for="card in statCards" :key="card.label" class="stat-card">
        <strong>{{ card.label }}</strong>
        <span>{{ stats[card.key] }}</span>
      </article>
    </div>
    <p v-if="loading">Cargando documentos...</p>
    <p v-else-if="message" class="error-message">{{ message }}</p>
    <p v-else-if="documents.length === 0">No hay documentos registrados.</p>
    <div v-else class="document-list">
      <article v-for="document in documents" :key="document.id" class="document-card">
        <h2>{{ document.subject }}</h2>
        <p><strong>Código:</strong> {{ document.tracking_code }}</p>
        <p><strong>Ciudadano:</strong> {{ document.citizen_name }}</p>
        <p><strong>Tipo:</strong> {{ document.document_type }}</p>
        <p><strong>Estado:</strong> {{ document.status }}</p>
        <p><strong>Creado:</strong> {{ formatDate(document.created_at) }}</p>
        <RouterLink :to="`/admin/documents/${document.id}`">Ver detalle</RouterLink>
      </article>
    </div>
    <LogoutButton />
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import LogoutButton from "../components/LogoutButton.vue";

const documents = ref([]);
const loading = ref(true);
const message = ref("");
const stats = ref({
  total: 0,
  recibido: 0,
  en_revision: 0,
  atendido: 0,
  rechazado: 0,
});
const statsMessage = ref("");
const statCards = [
  { key: "total", label: "Total de documentos" },
  { key: "recibido", label: "RECIBIDO" },
  { key: "en_revision", label: "EN_REVISION" },
  { key: "atendido", label: "ATENDIDO" },
  { key: "rechazado", label: "RECHAZADO" },
];

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function loadDocuments() {
  try {
    const response = await fetch("http://localhost:3000/api/admin/documents", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    const data = await response.json();

    if (!response.ok) {
      message.value = data.message || "No se pudieron cargar los documentos";
      return;
    }

    documents.value = data.documents;
  } catch {
    message.value = "No se pudo conectar con el servidor";
  } finally {
    loading.value = false;
  }
}

async function loadStats() {
  try {
    const response = await fetch("http://localhost:3000/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    const data = await response.json();

    if (!response.ok) {
      statsMessage.value = data.message || "No se pudieron cargar las estadísticas";
      return;
    }

    stats.value = data.stats;
  } catch {
    statsMessage.value = "No se pudo conectar con el servidor";
  }
}

onMounted(() => {
  loadDocuments();
  loadStats();
});
</script>
