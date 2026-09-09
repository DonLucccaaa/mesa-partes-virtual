<script setup>
import { onMounted, ref } from "vue";
import { api, formatDate, getStoredUser } from "../api";
import StatusBadge from "../components/StatusBadge.vue";

const documents = ref([]);
const loading = ref(true);
const error = ref("");
const userName = getStoredUser()?.name || "Usuario";

async function loadDocuments() {
  loading.value = true;
  error.value = "";

  try {
    const data = await api.myDocuments();
    documents.value = data.documents;
  } catch (err) {
    error.value = err.message || "No se pudieron cargar los documentos";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDocuments);
</script>

<template>
  <main class="page">
    <div class="container">
      <div class="page-head">
        <div>
          <h1 class="page-title">Mis documentos</h1>
          <p class="page-subtitle">
            Hola, {{ userName }}. Estos son tus trámites registrados.
          </p>
        </div>
        <RouterLink to="/documents/new" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nuevo documento
        </RouterLink>
      </div>

      <div v-if="loading" class="loading-pane">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>

      <div v-else-if="error" class="alert is-error" role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        <span>{{ error }}</span>
      </div>

      <section v-else-if="documents.length === 0" class="card empty-state">
        <span class="empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
        </span>
        <h2 class="empty-title">Aún no tienes documentos</h2>
        <p class="empty-body">
          Registra tu primer documento adjuntando un PDF y recibe tu código de
          seguimiento al instante.
        </p>
        <RouterLink to="/documents/new" class="btn btn-primary">
          Registrar un documento
        </RouterLink>
      </section>

      <section v-else class="doc-list">
        <RouterLink
          v-for="document in documents"
          :key="document.id"
          :to="`/documents/${document.id}`"
          class="doc-row"
        >
          <div>
            <h2 class="doc-row-title">{{ document.subject }}</h2>
            <div class="doc-row-meta">
              <span class="chip">{{ document.tracking_code }}</span>
              <span>{{ document.document_type }}</span>
              <span>·</span>
              <span>{{ formatDate(document.created_at) }}</span>
            </div>
          </div>
          <div class="doc-row-side">
            <StatusBadge :status="document.status" />
            <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </RouterLink>
      </section>
    </div>
  </main>
</template>