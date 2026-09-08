<template>
  <main class="home">
    <p><RouterLink to="/dashboard">Volver a mis documentos</RouterLink></p>
    <p v-if="loading">Cargando documento...</p>
    <p v-else-if="message" class="error-message">{{ message }}</p>
    <template v-else-if="document">
      <h1>{{ document.subject }}</h1>
      <p><strong>Código:</strong> {{ document.tracking_code }}</p>
      <p><strong>Tipo:</strong> {{ document.document_type }}</p>
      <p><strong>Estado:</strong> {{ document.status }}</p>
      <p><strong>Descripción:</strong> {{ document.description }}</p>
      <p><strong>Observación:</strong> {{ document.observation || "Sin observaciones" }}</p>
      <p><strong>Creado:</strong> {{ formatDate(document.created_at) }}</p>
      <p><strong>Actualizado:</strong> {{ formatDate(document.updated_at) }}</p>
      <button v-if="document.has_file" type="button" @click="openPdf">
        Ver PDF
      </button>
      <h2>Historial de estados</h2>
      <p v-if="historyMessage" class="error-message">{{ historyMessage }}</p>
      <p v-else-if="history.length === 0">No hay historial disponible.</p>
      <ol v-else class="status-history">
        <li v-for="entry in history" :key="entry.id">
          <strong>{{ entry.status }}</strong>
          <span>{{ formatDate(entry.changed_at) }}</span>
          <span v-if="entry.observation">Observación: {{ entry.observation }}</span>
        </li>
      </ol>
    </template>
    <LogoutButton />
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import LogoutButton from "../components/LogoutButton.vue";

const route = useRoute();
const document = ref(null);
const loading = ref(true);
const message = ref("");
const history = ref([]);
const historyMessage = ref("");

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function loadDocument() {
  try {
    const response = await fetch(`http://localhost:3000/api/documents/${route.params.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    const data = await response.json();

    if (!response.ok) {
      message.value = data.message || "No se pudo cargar el documento";
      return;
    }

    document.value = data.document;
  } catch {
    message.value = "No se pudo conectar con el servidor";
  } finally {
    loading.value = false;
  }
}

async function openPdf() {
  const response = await fetch(
    `http://localhost:3000/api/documents/${route.params.id}/file`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    }
  );

  if (!response.ok) {
    message.value = "No se pudo abrir el PDF";
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
}

async function loadHistory() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/documents/${route.params.id}/history`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }
    );
    const data = await response.json();

    if (!response.ok) {
      historyMessage.value = data.message || "No se pudo cargar el historial";
      return;
    }

    history.value = data.history;
  } catch {
    historyMessage.value = "No se pudo conectar con el servidor";
  }
}

onMounted(async () => {
  await loadDocument();
  if (document.value) {
    await loadHistory();
  }
});
</script>
