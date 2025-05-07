<script lang="ts">
  import { onMount } from "svelte";
  import { validateToken } from "../services/authService";

  const API_BASE_URL = "https://backend-qab1.onrender.com";
  let identifier = "";
  let password = "";
  let error = "";
  let loading = false;
  let checkingAuth = true;

  export let access_token = "";
  export let token_type = "";
  export let session_id = "";

  onMount(async () => {
    const token = localStorage.getItem("access_token");
    const sessionId = localStorage.getItem("session_id");

    if (token && sessionId) {
      access_token = token;
      token_type = "Bearer";
      session_id = sessionId;

      // Verificamos si el token es válido antes de redirigir
      try {
        const isValid = await validateToken();
        if (isValid) {
          window.location.href = "/dashboard";
          return;
        } else {
          // Si el token no es válido, lo eliminamos
          localStorage.removeItem("access_token");
          localStorage.removeItem("session_id");
        }
      } catch (err) {
        console.error("Error validando token:", err);
        // Si hay error al validar, también eliminamos
        localStorage.removeItem("access_token");
        localStorage.removeItem("session_id");
      }
    }

    // Si llegamos aquí, el usuario no está autenticado o el token es inválido
    checkingAuth = false;
  });

  async function submit() {
    error = "";
    loading = true;

    try {
      const formData = new URLSearchParams();
      formData.append("username", identifier);
      formData.append("password", password);
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.detail?.message || "Error de autenticación";
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("session_id", data.session_id);
      window.location.href = "/dashboard";
    } catch (e) {
      error =
        e instanceof TypeError && e.message === "Failed to fetch"
          ? "No se pudo conectar con el servidor. Revisa tu red o configuración CORS."
          : e instanceof Error
            ? e.message
            : "Ha ocurrido un error desconocido";
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white p-8 rounded-2xl shadow-lg w-96 max-w-full">
  <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">
    Iniciar Sesión
  </h1>

  {#if checkingAuth}
    <div class="text-center py-4">
      <p>Comprobando autenticación...</p>
    </div>
  {:else}
    {#if error}
      <div
        class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
      >
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={submit} class="space-y-4">
      <div>
        <label
          for="identifier"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Email o nombre de usuario
        </label>
        <input
          id="identifier"
          type="text"
          bind:value={identifier}
          placeholder="Email o nombre de usuario"
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label
          for="password"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Contraseña"
          class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div class="text-right">
        <a
          href="/reset-password"
          class="text-sm text-blue-600 hover:text-blue-800"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {#if loading}
          <span>Cargando...</span>
        {:else}
          <span>Iniciar Sesión</span>
        {/if}
      </button>

      <div class="text-center mt-4">
        <span class="text-gray-600">¿No tienes cuenta?</span>
        <a
          href="/register"
          class="ml-1 text-blue-600 hover:text-blue-800 underline"
        >
          Regístrate
        </a>
      </div>
    </form>
  {/if}
</div>
