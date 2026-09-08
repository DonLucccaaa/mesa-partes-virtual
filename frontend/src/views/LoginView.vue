<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Iniciar sesión</h1>
      <p>Ingresa para acceder a las funcionalidades de tu rol.</p>

      <form @submit.prevent="login">
        <label for="email">Correo</label>
        <input id="email" v-model="form.email" type="email" autocomplete="email" required />

        <label for="password">Contraseña</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
        />

        <button type="submit" :disabled="loading">
          {{ loading ? "Ingresando..." : "Iniciar sesión" }}
        </button>
      </form>

      <p v-if="message" class="error-message" role="alert">{{ message }}</p>

      <RouterLink to="/register">Crear una cuenta</RouterLink>
      <RouterLink to="/">Volver al inicio</RouterLink>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const form = reactive({
  email: "",
  password: "",
});
const loading = ref(false);
const message = ref("");

async function login() {
  loading.value = true;
  message.value = "";

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok) {
      message.value = data.message || "No se pudo iniciar sesión";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    await router.push(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
  } catch {
    message.value = "No se pudo conectar con el servidor";
  } finally {
    loading.value = false;
  }
}
</script>
