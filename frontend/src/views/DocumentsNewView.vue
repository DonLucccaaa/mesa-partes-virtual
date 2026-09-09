<script setup>
import { reactive, ref } from "vue";
import { api } from "../api";
import StatusBadge from "../components/StatusBadge.vue";

const form = reactive({ subject: "", document_type: "", description: "" });
const fileInput = ref(null);
const file = ref(null);
const loading = ref(false);
const error = ref("");
const dragging = ref(false);
const result = ref(null);

function selectFile(event) {
  file.value = event.target.files[0] || null;
}

function onDrop(event) {
  dragging.value = false;
  const dropped = event.dataTransfer.files?.[0];
  if (dropped) {
    file.value = dropped;
    if (fileInput.value) fileInput.value.files = event.dataTransfer.files;
  }
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function submitDocument() {
  if (!file.value) {
    error.value = "Debes seleccionar un archivo PDF";
    return;
  }

  loading.value = true;
  error.value = "";

  const data = new FormData();
  data.append("subject", form.subject);
  data.append("document_type", form.document_type);
  data.append("description", form.description);
  data.append("file", file.value);

  try {
    const response = await api.createDocument(data);
    result.value = response.document;
    form.subject = "";
    form.document_type = "";
    form.description = "";
    file.value = null;
    if (fileInput.value) fileInput.value.value = "";
  } catch (err) {
    error.value = err.message || "No se pudo registrar el documento";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="page">
    <div class="container">
      <div class="page-head">
        <div>
          <h1 class="page-title">Nuevo documento</h1>
          <p class="page-subtitle">
            Adjunta un PDF para iniciar tu trámite.
          </p>
        </div>
        <RouterLink to="/dashboard" class="btn btn-ghost">Volver a mis documentos</RouterLink>
      </div>

      <div class="grid" style="max-width: 820px">
        <section v-if="result" class="card">
          <div class="success-panel">
            <span class="success-check">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </span>
            <h2 class="success-title">Documento registrado</h2>
            <p class="success-sub">
              Tu trámite fue registrado con el siguiente código de seguimiento.
            </p>
            <div class="tracking-big">{{ result.tracking_code }}</div>
            <StatusBadge :status="result.status" />
            <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px">
              <RouterLink :to="`/documents/${result.id}`" class="btn btn-primary">
                Ver mi documento
              </RouterLink>
              <RouterLink to="/dashboard" class="btn btn-secondary">
                Ir a mis documentos
              </RouterLink>
            </div>
          </div>
        </section>

        <section v-else class="card" style="padding: 32px">
          <form @submit.prevent="submitDocument">
            <div class="field">
              <label class="label" for="subject">Asunto</label>
              <input
                id="subject"
                v-model.trim="form.subject"
                class="input"
                type="text"
                placeholder="Ej.: Solicitud de constancia de estudios"
                maxlength="200"
                required
              />
            </div>

            <div class="grid grid-cols-2">
              <div class="field">
                <label class="label" for="document-type">Tipo de documento</label>
                <select id="document-type" v-model="form.document_type" class="select" required>
                  <option value="" disabled>Selecciona un tipo</option>
                  <option value="Solicitud">Solicitud</option>
                  <option value="Pedido">Pedido de información</option>
                  <option value="Recurso">Recurso administrativo</option>
                  <option value="Declaración">Declaración jurada</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label class="label" for="description">Descripción</label>
              <textarea
                id="description"
                v-model.trim="form.description"
                class="textarea"
                placeholder="Describe brevemente el motivo de tu trámite…"
                rows="4"
                required
              ></textarea>
            </div>

            <label
              class="dropzone"
              :class="{ 'is-dragover': dragging }"
              for="file-picker"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
            >
              <input
                id="file-picker"
                ref="fileInput"
                type="file"
                accept="application/pdf,.pdf"
                hidden
                @change="selectFile"
              />
              <span class="dropzone-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
              </span>
              <template v-if="file">
                <span class="dropzone-title">{{ file.name }}</span>
                <span class="dropzone-hint">
                  {{ formatBytes(file.size) }} · haz clic para cambiar
                </span>
              </template>
              <template v-else>
                <span class="dropzone-title">Arrastra tu PDF aquí o haz clic para seleccionar</span>
                <span class="dropzone-hint">PDF hasta 10 MB</span>
              </template>
            </label>

            <div v-if="file" class="file-selected" style="margin-top: 14px">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
              <div style="flex: 1">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">{{ formatBytes(file.size) }}</div>
              </div>
              <span class="chip">{{ file.type || "application/pdf" }}</span>
            </div>

            <button class="btn btn-primary btn-lg" type="submit" style="width: 100%; margin-top: 22px" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              {{ loading ? "Registrando..." : "Registrar documento" }}
            </button>
          </form>

          <div v-if="error" class="alert is-error" style="margin-top: 18px" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <span>{{ error }}</span>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>