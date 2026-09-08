<template>
  <main class="home">
    <h1>Dashboard de usuario</h1>
    <p>Consulta tus documentos registrados.</p>
    <RouterLink to="/documents/new">Registrar un documento</RouterLink>
    <p v-if="loading">Cargando documentos...</p>
    <p v-else-if="message" class="error-message">{{ message }}</p>
    <p v-else-if="documents.length === 0">Aún no tienes documentos registrados.</p>
    <div v-else class="document-list">
      <article v-for="document in documents" :key="document.id" class="document-card">
        <h2>{{ document.subject }}</h2>
        <p><strong>Código:</strong> {{ document.tracking_code }}</p>
        <p><strong>Tipo:</strong> {{ document.document_type }}</p>
        <p><strong>Estado:</strong> {{ document.status }}</p>
        <p><strong>Creado:</strong> {{ formatDate(document.created_at) }}</p>
        <RouterLink :to="`/documents/${document.id}`">Ver detalle</RouterLink>
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

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function loadDocuments() {
  try {
    const response = await fetch("http://localhost:3000/api/documents/my", {
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

onMounted(loadDocuments);
</script>
