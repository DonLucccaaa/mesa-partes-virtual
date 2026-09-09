<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { authState, logout } from "../api";
import { initials } from "../api";

const route = useRoute();
const user = computed(() => authState.user);
const homeDestination = computed(() =>
  user.value?.role === "ADMIN" ? "/admin" : "/dashboard"
);
const menuOpen = ref(false);

const navLinks = computed(() => {
  const authenticated = Boolean(user.value?.role);

  if (user.value?.role === "ADMIN") {
    return [
      { to: "/admin", label: "Panel", icon: "dashboard" },
      { to: "/track", label: "Seguimiento", icon: "search" },
    ];
  }

  if (user.value?.role === "USER") {
    return [
      { to: "/dashboard", label: "Mis documentos", icon: "folder" },
      { to: "/documents/new", label: "Nuevo documento", icon: "plus" },
      { to: "/track", label: "Seguimiento", icon: "search" },
    ];
  }

  return [
    { to: "/", label: "Inicio", icon: "home" },
    { to: "/track", label: "Consultar trámite", icon: "search" },
    { to: "/login", label: "Iniciar sesión", icon: "login" },
    { to: "/register", label: "Crear cuenta", icon: "user" },
  ];
});

function isActive(to) {
  if (to === "/" && route.path !== "/") return false;
  return route.path === to || route.path.startsWith(`${to}/`);
}

function handleLogout() {
  logout();
  menuOpen.value = false;
  window.location.href = "/login";
}
</script>

<template>
  <header class="nav">
    <div class="container nav-row">
      <RouterLink :to="user ? homeDestination : '/'" class="nav-brand" @click="menuOpen = false">
        <span class="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="m9 15 2 2 4-4" />
          </svg>
        </span>
        <span>Mesa de Partes Virtual</span>
      </RouterLink>

      <nav class="nav-links" :class="{ 'is-open': menuOpen }" aria-label="Navegación principal">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ 'is-active': isActive(link.to) }"
          @click="menuOpen = false"
        >
          <svg v-if="link.icon === 'home'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/></svg>
          <svg v-else-if="link.icon === 'folder'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h6"/></svg>
          <svg v-else-if="link.icon === 'plus'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          <svg v-else-if="link.icon === 'search'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <svg v-else-if="link.icon === 'login'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>
          <svg v-else-if="link.icon === 'user'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <svg v-else-if="link.icon === 'dashboard'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
          {{ link.label }}
        </RouterLink>

        <template v-if="user">
          <span class="nav-divider" aria-hidden="true"></span>
          <span class="nav-user" :title="user.email">
            <span class="avatar">{{ initials(user.name) }}</span>
            <span class="nav-user-name">{{ user.name }}</span>
          </span>
          <a class="nav-link" href="#" @click.prevent="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
            Cerrar sesión
          </a>
        </template>
      </nav>

      <button
        class="nav-toggle"
        type="button"
        aria-label="Abrir menú"
        aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <svg v-if="!menuOpen" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  </header>
</template>