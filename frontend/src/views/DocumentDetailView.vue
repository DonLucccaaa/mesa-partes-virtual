<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api, formatDate, openPdfBlob } from "../api";
import StatusBadge from "../components/StatusBadge.vue";
import StatusTimeline from "../components/StatusTimeline.vue";

const route = useRoute();
const document = ref(null);
const loading = ref(true);
const error = ref("");
const history = ref([]);

async function loadDocument() {
  try {
    const data = await api.getDocument(route.params.id);
    document.value = data.document;
    const historyData = await api.getDocumentHistory(route.params.id);
    history.value = historyData.history;
  } catch (err) {
    error.value = err.message || "No se pudo cargar el documento";
  } finally {
    loading.value = false;
  }
}

async function openPdf() {
  try {
    const response = await api.getDocumentPdf(route.params.id);
    await openPdfBlob(response);
  } catch (err) {
    error.value = err.message || "No se pudo abrir el PDF";
  }
}

onMounted(loadDocument);
</script>

<template>
  <main class="page">
    <div class="container" style="max-width: 880px">
      <p style="margin-bottom: 18px">
        <RouterLink to="/dashboard" class="btn btn-ghost btn-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Volver a mis documentos
        </RouterLink>
      </p>

      <div v-if="loading" class="loading-pane">
        <div class="skeleton"></div>
      </div>

      <div v-else-if="error" class="alert is-error" role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        <span>{{ error }}</span>
      </div>

      <template v-else-if="document">
        <section class="card pad-lg">
          <div class="card-header">
            <div style="min-width: 0">
              <h1 class="page-title" style="font-size: 24px; margin-bottom: 6px">
                {{ document.subject }}
              </h1>
              <span class="chip">{{ document.tracking_code }}</span>
            </div>
            <StatusBadge :status="document.status" />
          </div>

          <dl class="detail-grid" style="margin-top: 20px">
            <div class="detail-item">
              <dt class="detail-label">Tipo de documento</dt>
              <dd class="detail-value">{{ document.document_type }}</dd>
            </div>
            <div class="detail-item">
              <dt class="detail-label">Fecha de registro</dt>
              <dd class="detail-value">{{ formatDate(document.created_at) }}</dd>
            </div>
            <div v-if="document.updated_at" class="detail-item">
              <dt class="detail-label">Última actualización</dt>
              <dd class="detail-value">{{ formatDate(document.updated_at) }}</dd>
            </div>
            <div class="detail-item">
              <dt class="detail-label">Estado</dt>
              <dd class="detail-value">{{ document.status }}</dd>
            </div>
            <div v-if="document.description" class="detail-item">
              <dt class="detail-label">Descripción</dt>
              <dd class="detail-value">{{ document.description }}</dd>
            </div>
          </dl>

          <div v-if="document.observation" class="alert is-info" style="margin-top: 20px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <div>
              <strong>Observación:</strong> {{ document.observation }}
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap">
            <button
              v-if="document.has_file"
              type="button"
              class="btn btn-secondary"
              @click="openPdf"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
              Ver PDF
            </button>
          </div>
        </section>

        <section class="card" style="margin-top: 20px">
          <p class="section-label">Historial de estados</p>
          <StatusTimeline :history="history" />
        </section>
      </template>
    </div>
  </main>
</template>