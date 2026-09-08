<template>
  <main class="auth-page">
    <section class="auth-card">
    <h1>Seguimiento de trámite</h1>
    <p>Consulta el estado de tu trámite con tu código de seguimiento.</p>
    <form @submit.prevent="trackDocument">
      <label for="tracking-code">Código de seguimiento</label>
      <input id="tracking-code" v-model="trackingCode" type="text" required />
      <button type="submit" :disabled="loading">
        {{ loading ? "Consultando..." : "Consultar" }}
      </button>
    </form>
    <p v-if="message" class="error-message" role="alert">{{ message }}</p>
    <article v-if="document" class="document-card">
      <p><strong>Código:</strong> {{ document.tracking_code }}</p>
      <p><strong>Asunto:</strong> {{ document.subject }}</p>
      <p><strong>Estado:</strong> {{ document.status }}</p>
      <p><strong>Creado:</strong> {{ formatDate(document.created_at) }}</p>
      <p><strong>Actualizado:</strong> {{ formatDate(document.updated_at) }}</p>
    </article>
    <RouterLink to="/">Volver al inicio</RouterLink>
    </section>
  </main>
</template>

<script setup>
import { ref } from "vue";

const trackingCode = ref("");
const document = ref(null);
const loading = ref(false);
const message = ref("");

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function trackDocument() {
  loading.value = true;
  document.value = null;
  message.value = "";

  try {
    const response = await fetch(
      `http://localhost:3000/api/documents/track/${encodeURIComponent(trackingCode.value.trim())}`
    );
    const data = await response.json();

    if (!response.ok) {
      message.value = data.message || "No se encontró el documento";
      return;
    }

    document.value = data.document;
  } catch {
    message.value = "No se pudo conectar con el servidor";
  } finally {
    loading.value = false;
  }
}
</script>
