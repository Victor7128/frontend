<script lang="ts">
  import { onMount } from "svelte";
  import { validateToken } from "../services/authService";

  const API_BASE_URL = "http://127.0.0.1:8000";

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
      try {
        const isValid = await validateToken();
        if (isValid) {
          window.location.href = "/dashboard";
          return;
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("session_id");
        }
      } catch (err) {
        console.error("Error validando token:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("session_id");
      }
    }
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
          ? "No se pudo conectar con el servidor, posible error de red"
          : e instanceof Error
            ? e.message
            : "Ha ocurrido un error desconocido";
    } finally {
      loading = false;
    }
  }
</script>

<div class=" p-8 rounded-2xl shadow-lg w-96 max-w-full border border-white/75">
  <h1 class="text-2xl font-bold mb-6 text-center text-white/75">Iniciar Sesión</h1>

  {#if checkingAuth}
    <div class="text-center py-4 text-white/75">
      <p>Comprobando autenticación...</p>
    </div>
  {:else}
    {#if error}
      <div class="mb-4 p-3 border border-red-800 text-red-800 rounded">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={submit} class="space-y-4">
      <div>
        <input
          id="identifier"
          type="text"
          bind:value={identifier}
          placeholder="Email o nombre de usuario"
          class="w-full p-3 border border-white/75 rounded-md text-white/75 bg-transparent [&:-webkit-autofill]:bg-transparent"
          required
          autocomplete="off"
        />
      </div>

      <div>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Contraseña"
          class="w-full p-3 rounded-md border border-white/75 text-white/75 bg-transparent [&:-webkit-autofill]:bg-transparent"
          required
          autocomplete="off"
        />
      </div>

      <div class="text-right">
        <a
          href="/reset-password"
          class="text-sm text-white/75 hover:text-white transition-all ease-in duration-200"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        class="w-full bg-white/75 text-black border p-3 rounded-md hover:bg-black hover:text-white/75 hover:border-white/75  transition-all ease-in duration-200 cursor-pointer"
      >
        {#if loading}
          <span>Cargando...</span>
        {:else}
          <span>Iniciar Sesión</span>
        {/if}
      </button>

      <div class="text-center mt-4">
        <span class="text-white/75">¿No tienes cuenta?</span>
        <a
          href="/register"
          class="ml-1 text-white/75 hover:text-white transition-all ease-in duration-200 underline"
        >
          Regístrate
        </a>
      </div>
    </form>
  {/if}
</div>
