<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Crear cuenta</h1>
      <p>Regístrate para utilizar la Mesa de Partes Virtual.</p>

      <form @submit.prevent="register">
        <label for="name">Nombre</label>
        <input id="name" v-model="form.name" type="text" autocomplete="name" required />

        <label for="email">Correo</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
        />

        <label for="password">Contraseña</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          required
        />

        <button type="submit" :disabled="loading">
          {{ loading ? "Registrando..." : "Registrarme" }}
        </button>
      </form>

      <p v-if="message" :class="messageType" role="status">{{ message }}</p>

      <RouterLink to="/">Volver al inicio</RouterLink>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue";

const form = reactive({
  name: "",
  email: "",
  password: "",
});
const loading = ref(false);
const message = ref("");
const messageType = ref("");

async function register() {
  loading.value = true;
  message.value = "";
  messageType.value = "";

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok) {
      message.value = data.message || "No se pudo completar el registro";
      messageType.value = "error-message";
      return;
    }

    message.value = data.message;
    messageType.value = "success-message";
    form.name = "";
    form.email = "";
    form.password = "";
  } catch {
    message.value = "No se pudo conectar con el servidor";
    messageType.value = "error-message";
  } finally {
    loading.value = false;
  }
}
</script>
