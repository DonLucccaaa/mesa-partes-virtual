<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, storeAuth } from "../api";

const router = useRouter();
const route = useRoute();
const form = reactive({ email: "", password: "" });
const loading = ref(false);
const error = ref("");
const showPassword = ref(false);

async function login() {
  loading.value = true;
  error.value = "";

  try {
    const data = await api.login(form);
    storeAuth(data);

    const destination =
      route.query.redirect ||
      (data.user.role === "ADMIN" ? "/admin" : "/dashboard");
    await router.push(String(destination));
  } catch (err) {
    error.value = err.message || "No se pudo iniciar sesión";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="card card-screenpad auth-card">
      <div class="auth-head">
        <span class="auth-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
        </span>
        <h1 class="auth-title">Iniciar sesión</h1>
        <p class="auth-sub">Ingresa para acceder a las funcionalidades de tu rol.</p>
      </div>

      <form @submit.prevent="login">
        <div class="field">
          <label class="label" for="email">Correo electrónico</label>
          <input
            id="email"
            v-model.trim="form.email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="tucorreo@ejemplo.com"
            required
          />
        </div>

        <div class="field">
          <label class="label" for="password">Contraseña</label>
          <div class="input-group">
            <input
              id="password"
              v-model="form.password"
              class="input"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              class="input-suffix"
              :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
            </button>
          </div>
        </div>

        <button class="btn btn-primary" type="submit" style="width: 100%" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? "Ingresando..." : "Iniciar sesión" }}
        </button>
      </form>

      <div v-if="error" class="alert is-error" style="margin-top: 18px" role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        <span>{{ error }}</span>
      </div>

      <div class="auth-links">
        <span>¿No tienes cuenta?</span>
        <RouterLink to="/register">Crear una cuenta</RouterLink>
      </div>
    </section>
  </main>
</template>