<template>
  <main class="auth-page">
    <section class="auth-card">
    <h1>Nuevo documento</h1>
    <p>Adjunta un PDF para iniciar tu trámite.</p>

    <form @submit.prevent="submitDocument">
      <label for="subject">Asunto</label>
      <input id="subject" v-model="form.subject" type="text" required />

      <label for="document-type">Tipo de documento</label>
      <input id="document-type" v-model="form.document_type" type="text" required />

      <label for="description">Descripción</label>
      <textarea id="description" v-model="form.description" rows="5" required />

      <label for="file">Archivo PDF</label>
      <input
        id="file"
        ref="fileInput"
        type="file"
        accept="application/pdf,.pdf"
        required
        @change="selectFile"
      />

      <button type="submit" :disabled="loading">
        {{ loading ? "Registrando..." : "Registrar documento" }}
      </button>
    </form>

    <p v-if="message" :class="messageType" role="status">{{ message }}</p>
    <p v-if="trackingCode" class="success-message">
      Código de seguimiento: <strong>{{ trackingCode }}</strong>
    </p>

    <LogoutButton />
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue";
import LogoutButton from "../components/LogoutButton.vue";

const form = reactive({
  subject: "",
  document_type: "",
  description: "",
});
const fileInput = ref(null);
const file = ref(null);
const loading = ref(false);
const message = ref("");
const messageType = ref("");
const trackingCode = ref("");

function selectFile(event) {
  file.value = event.target.files[0] || null;
}

async function submitDocument() {
  if (!file.value) {
    message.value = "Debes seleccionar un archivo PDF";
    messageType.value = "error-message";
    return;
  }

  loading.value = true;
  message.value = "";
  messageType.value = "";
  trackingCode.value = "";

  const data = new FormData();
  data.append("subject", form.subject);
  data.append("document_type", form.document_type);
  data.append("description", form.description);
  data.append("file", file.value);

  try {
    const response = await fetch("http://localhost:3000/api/documents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: data,
    });
    const result = await response.json();

    if (!response.ok) {
      message.value = result.message || "No se pudo registrar el documento";
      messageType.value = "error-message";
      return;
    }

    message.value = result.message;
    messageType.value = "success-message";
    trackingCode.value = result.document.tracking_code;
    form.subject = "";
    form.document_type = "";
    form.description = "";
    file.value = null;
    fileInput.value.value = "";
  } catch {
    message.value = "No se pudo conectar con el servidor";
    messageType.value = "error-message";
  } finally {
    loading.value = false;
  }
}
</script>
