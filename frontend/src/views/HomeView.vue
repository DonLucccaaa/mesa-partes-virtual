<script setup>
import { computed } from "vue";
import { authState } from "../api";
import StatusBadge from "../components/StatusBadge.vue";

const homeDestination = computed(() => {
  const role = authState.user?.role;
  return role === "ADMIN" ? "/admin" : "/dashboard";
});

const statuses = ["RECIBIDO", "EN_REVISION", "ATENDIDO", "RECHAZADO"];
</script>

<template>
  <main>
    <section class="hero">
      <div class="hero-inner">
        <span class="hero-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m12 2 9 5H3l9-5Z"/></svg>
          Gestión documentaria institucional
        </span>
        <h1 class="hero-title">
          Mesa de Partes <span class="accent">Virtual</span>
        </h1>
        <p class="hero-sub">
          Registra, consulta y da seguimiento a tus documentos oficiales desde
          un solo lugar. Transparencia y trazabilidad en cada trámite.
        </p>
        <div class="hero-actions">
          <RouterLink to="/register" class="btn btn-primary btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>
            Crear cuenta
          </RouterLink>
          <RouterLink to="/login" class="btn btn-secondary btn-lg">
            Iniciar sesión
          </RouterLink>
          <RouterLink v-if="authState.user" :to="homeDestination" class="btn btn-ghost btn-lg">
            Ir al panel
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </RouterLink>
        </div>
        <div class="hero-status-strip">
          <StatusBadge v-for="status in statuses" :key="status" :status="status" />
        </div>
      </div>
    </section>

    <div class="container">
      <div class="feature-grid">
        <article class="feature-card">
          <span class="feature-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>
          </span>
          <h3 class="feature-title">Registro de documentos</h3>
          <p class="feature-body">
            Sube tus documentos en PDF con un código de seguimiento único.
            Cada trámite queda registrado al instante con estado RECIBIDO.
          </p>
        </article>

        <article class="feature-card">
          <span class="feature-icon is-sky">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11l2 2 3.5-4"/></svg>
          </span>
          <h3 class="feature-title">Seguimiento en línea</h3>
          <p class="feature-body">
            Consulta el estado de tu trámite en tiempo real con tu código,
            sin necesidad de iniciar sesión.
          </p>
        </article>

        <article class="feature-card">
          <span class="feature-icon is-emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </span>
          <h3 class="feature-title">Gestión y auditoría</h3>
          <p class="feature-body">
            El área administrativa gestiona estados y observaciones, con
            historial y auditoría de cada acción realizada.
          </p>
        </article>
      </div>

      <section style="padding: 24px 0 40px; text-align: center">
        <RouterLink to="/track" class="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          ¿Ya tienes un código? Consulta tu trámite aquí
        </RouterLink>
      </section>
    </div>
  </main>
</template>