<script setup>
import { computed, onMounted, ref } from "vue";
import { api, formatDate, getStoredUser } from "../api";
import StatusBadge from "../components/StatusBadge.vue";
import StatCard from "../components/StatCard.vue";

const documents = ref([]);
const loading = ref(true);
const error = ref("");
const stats = ref({ total: 0, recibido: 0, en_revision: 0, atendido: 0, rechazado: 0 });
const search = ref("");
const adminName = getStoredUser()?.name || "Administrador";

const statCards = computed(() => [
  { key: "total", label: "Total", accent: "var(--slate-600)", value: stats.value.total },
  { key: "recibido", label: "Recibidos", accent: "var(--recibido-fg)", value: stats.value.recibido },
  { key: "en_revision", label: "En revisión", accent: "var(--revision-fg)", value: stats.value.en_revision },
  { key: "atendido", label: "Atendidos", accent: "var(--atendido-fg)", value: stats.value.atendido },
  { key: "rechazado", label: "Rechazados", accent: "var(--rechazado-fg)", value: stats.value.rechazado },
]);

const filteredDocuments = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return documents.value;
  return documents.value.filter((doc) =>
    [doc.subject, doc.tracking_code, doc.document_type, doc.status, doc.citizen_name]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
});

async function loadDocuments() {
  loading.value = true;
  error.value = "";

  try {
    const [docsData, statsData] = await Promise.all([
      api.adminDocuments(),
      api.adminStats(),
    ]);
    documents.value = docsData.documents;
    stats.value = statsData.stats;
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
          <h1 class="page-title">Panel administrativo</h1>
          <p class="page-subtitle">
            Bienvenido, {{ adminName }}. Gestiona y da seguimiento a todos los trámites.
          </p>
        </div>
      </div>

      <div v-if="error" class="alert is-error" style="margin-bottom: 24px" role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        <span>{{ error }}</span>
      </div>

      <div v-if="loading" class="loading-pane">
        <div class="skeleton" style="min-height: 90px"></div>
        <div class="skeleton" style="min-height: 90px"></div>
        <div class="skeleton" style="min-height: 90px"></div>
      </div>

      <template v-else>
        <div class="stat-grid" style="margin-bottom: 28px">
          <StatCard
            v-for="card in statCards"
            :key="card.key"
            :label="card.label"
            :value="card.value"
            :accent="card.accent"
          />
        </div>

        <section class="card">
          <div class="card-header">
            <h2 class="card-title">Documentos registrados</h2>
            <div class="input-group" style="width: 260px">
              <input
                v-model="search"
                class="input"
                type="search"
                placeholder="Buscar por código, asunto, ciudadano…"
              />
            </div>
          </div>

          <div v-if="filteredDocuments.length === 0" class="empty-state">
            <span class="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <h3 class="empty-title">Sin resultados</h3>
            <p class="empty-body">
              No se encontraron documentos{{ search ? ` para “${search}”` : " registrados" }}.
            </p>
          </div>

          <div v-else class="doc-list">
            <RouterLink
              v-for="document in filteredDocuments"
              :key="document.id"
              :to="`/admin/documents/${document.id}`"
              class="doc-row"
            >
              <div>
                <h2 class="doc-row-title">{{ document.subject }}</h2>
                <div class="doc-row-meta">
                  <span class="chip">{{ document.tracking_code }}</span>
                  <span>{{ document.document_type }}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>{{ document.citizen_name }}</span>
                  <span>·</span>
                  <span>{{ formatDate(document.created_at) }}</span>
                </div>
              </div>
              <div class="doc-row-side">
                <StatusBadge :status="document.status" />
                <svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>