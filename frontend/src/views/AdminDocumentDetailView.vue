<template>
  <main class="home">
    <p><RouterLink to="/admin">Volver al panel</RouterLink></p>
    <p v-if="loading">Cargando documento...</p>
    <p v-else-if="message && !document" class="error-message">{{ message }}</p>
    <template v-else-if="document">
      <h1>{{ document.subject }}</h1>
      <p><strong>Código:</strong> {{ document.tracking_code }}</p>
      <p><strong>Ciudadano:</strong> {{ document.citizen.name }}</p>
      <p><strong>Correo:</strong> {{ document.citizen.email }}</p>
      <p><strong>Tipo:</strong> {{ document.document_type }}</p>
      <p><strong>Descripción:</strong> {{ document.description }}</p>
      <p><strong>Estado actual:</strong> {{ document.status }}</p>
      <p><strong>Observación:</strong> {{ document.observation || "Sin observaciones" }}</p>
      <p><strong>Creado:</strong> {{ formatDate(document.created_at) }}</p>
      <p><strong>Actualizado:</strong> {{ formatDate(document.updated_at) }}</p>
      <button v-if="document.has_file" type="button" @click="openPdf">Ver PDF</button>
      <h2>Historial de estados</h2>
      <p v-if="historyMessage" class="error-message">{{ historyMessage }}</p>
      <p v-else-if="history.length === 0">No hay historial disponible.</p>
      <ol v-else class="status-history">
        <li v-for="entry in history" :key="entry.id">
          <strong>{{ entry.status }}</strong>
          <span>{{ formatDate(entry.changed_at) }}</span>
          <span v-if="entry.observation">Observación: {{ entry.observation }}</span>
          <span v-if="entry.changed_by">Administrador: {{ entry.changed_by }}</span>
        </li>
      </ol>

      <form class="status-form" @submit.prevent="updateStatus">
        <label for="status">Nuevo estado</label>
        <select id="status" v-model="status" required>
          <option v-for="option in statuses" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <label for="observation">Observación</label>
        <textarea id="observation" v-model="observation" rows="4" />
        <button type="submit" :disabled="saving">
          {{ saving ? "Guardando..." : "Actualizar estado" }}
        </button>
      </form>
      <p v-if="message" :class="messageType" role="status">{{ message }}</p>
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
const saving = ref(false);
const message = ref("");
const messageType = ref("");
const history = ref([]);
const historyMessage = ref("");
const status = ref("");
const observation = ref("");
const statuses = ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"];

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function loadDocument() {
  try {
    const response = await fetch(
      `http://localhost:3000/api/admin/documents/${route.params.id}`,
      { headers: authHeaders() }
    );
    const data = await response.json();

    if (!response.ok) {
      message.value = data.message || "No se pudo cargar el documento";
      return;
    }

    async function loadHistory() {
      try {
        const response = await fetch(
          `http://localhost:3000/api/admin/documents/${route.params.id}/history`,
          { headers: authHeaders() }
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

    document.value = data.document;
    status.value = data.document.status;
    observation.value = data.document.observation || "";
  } catch {
    message.value = "No se pudo conectar con el servidor";
  } finally {
    loading.value = false;
  }
}

async function openPdf() {
  const response = await fetch(
    `http://localhost:3000/api/admin/documents/${route.params.id}/file`,
    { headers: authHeaders() }
  );

  if (!response.ok) {
    message.value = "No se pudo abrir el PDF";
    messageType.value = "error-message";
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
}

async function updateStatus() {
  saving.value = true;
  message.value = "";
  messageType.value = "";

  try {
    const response = await fetch(
      `http://localhost:3000/api/admin/documents/${route.params.id}/status`,
      {
        method: "PATCH",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status.value,
          observation: observation.value,
        }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      message.value = data.message || "No se pudo actualizar el estado";
      messageType.value = "error-message";
      return;
    }

    message.value = data.message;
    messageType.value = "success-message";
    await loadDocument();
    await loadHistory();
  } catch {
    message.value = "No se pudo conectar con el servidor";
    messageType.value = "error-message";
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadDocument();
  if (document.value) {
    await loadHistory();
  }
});
</script>
