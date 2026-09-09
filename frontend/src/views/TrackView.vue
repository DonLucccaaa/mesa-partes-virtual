<script setup>
import { ref } from "vue";
import { api, formatDate } from "../api";
import StatusBadge from "../components/StatusBadge.vue";

const trackingCode = ref("");
const document = ref(null);
const loading = ref(false);
const error = ref("");
const searched = ref(false);

async function trackDocument() {
  loading.value = true;
  error.value = "";
  searched.value = true;
  document.value = null;

  try {
    const data = await api.track(trackingCode.value);
    document.value = data.document;
  } catch (err) {
    error.value = err.message || "No se encontró el documento";
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
          <h1 class="page-title">Seguimiento de trámite</h1>
          <p class="page-subtitle">
            Consulta el estado de tu trámite con tu código de seguimiento.
          </p>
        </div>
      </div>

      <section class="card" style="max-width: 640px">
        <form @submit.prevent="trackDocument">
          <div class="field" style="margin-bottom: 14px">
            <label class="label" for="tracking-code">Código de seguimiento</label>
            <input
              id="tracking-code"
              v-model="trackingCode"
              class="input big-input"
              type="text"
              placeholder="MP-DEMO-0002"
              autocomplete="off"
              required
            />
          </div>
          <button class="btn btn-primary" type="submit" style="width: 100%" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            {{ loading ? "Consultando..." : "Consultar trámite" }}
          </button>
        </form>

        <div v-if="error" class="alert is-error track-result" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          <span>{{ error }}</span>
        </div>

        <article v-if="document" class="card surface-soft track-result" style="padding: 20px">
          <div class="card-header" style="margin-bottom: 0">
            <h2 class="card-title" style="font-size: 16px">{{ document.subject }}</h2>
            <StatusBadge :status="document.status" />
          </div>
          <dl class="detail-grid" style="margin-top: 14px">
            <div class="detail-item">
              <dt class="detail-label">Código</dt>
              <dd class="detail-value"><span class="chip">{{ document.tracking_code }}</span></dd>
            </div>
            <div class="detail-item">
              <dt class="detail-label">Estado</dt>
              <dd class="detail-value">{{ document.status }}</dd>
            </div>
            <div class="detail-item">
              <dt class="detail-label">Fecha de registro</dt>
              <dd class="detail-value">{{ formatDate(document.created_at) }}</dd>
            </div>
            <div class="detail-item">
              <dt class="detail-label">Última actualización</dt>
              <dd class="detail-value">{{ formatDate(document.updated_at) }}</dd>
            </div>
          </dl>
          <p class="small muted" style="margin-top: 12px">
            Esta consulta es pública y no expone datos personales ni archivos.
          </p>
        </article>
      </section>
    </div>
  </main>
</template>