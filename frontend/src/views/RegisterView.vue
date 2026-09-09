<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api";

const router = useRouter();
const form = reactive({ name: "", email: "", password: "" });
const loading = ref(false);
const message = ref("");
const messageType = ref("info");
const showPassword = ref(false);
const registered = ref(false);

async function register() {
  loading.value = true;
  message.value = "";
  messageType.value = "info";

  try {
    await api.register(form);
    registered.value = true;
    form.name = "";
    form.email = "";
    form.password = "";
  } catch (err) {
    message.value = err.message || "No se pudo completar el registro";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <section v-if="registered" class="card auth-card">
      <div class="success-panel">
        <span class="success-check">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <h1 class="success-title">¡Registro exitoso!</h1>
        <p class="success-sub">
          Tu cuenta fue creada correctamente. Ya puedes iniciar sesión para
          registrar tus documentos.
        </p>
        <RouterLink to="/login" class="btn btn-primary">
          Iniciar sesión
        </RouterLink>
      </div>
    </section>

    <section v-else class="card auth-card">
      <div class="auth-head">
        <span class="auth-logo">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>
        </span>
        <h1 class="auth-title">Crear cuenta</h1>
        <p class="auth-sub">Regístrate para utilizar la Mesa de Partes Virtual.</p>
      </div>

      <form @submit.prevent="register">
        <div class="field">
          <label class="label" for="name">Nombre completo</label>
          <input
            id="name"
            v-model.trim="form.name"
            class="input"
            type="text"
            autocomplete="name"
            placeholder="Tu nombre y apellidos"
            required
          />
        </div>

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
              autocomplete="new-password"
              placeholder="Crea una contraseña segura"
              minlength="6"
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
          {{ loading ? "Registrando..." : "Registrarme" }}
        </button>
      </form>

      <div v-if="message" class="alert" :class="`is-${messageType}`" style="margin-top: 18px" role="status">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
        <span>{{ message }}</span>
      </div>

      <div class="auth-links">
        <span>¿Ya tienes cuenta?</span>
        <RouterLink to="/login">Iniciar sesión</RouterLink>
      </div>
    </section>
  </main>
</template>