<script lang="ts">
  const API_BASE_URL = "https://backend-qab1.onrender.com";
  let email = "";
  let username = "";
  let name = "";
  let password = "";
  let confirmPassword = "";
  let error = "";
  let loading = false;
  let success = false;

  async function submit() {
    // Limpiar estado previo
    error = "";
    success = false;
    loading = true;

    // Validaciones básicas
    if (password !== confirmPassword) {
      error = "Las contraseñas no coinciden";
      loading = false;
      return;
    }

    if (password.length < 8) {
      error = "La contraseña debe tener al menos 8 caracteres";
      loading = false;
      return;
    }

    try {
      // Llamada al endpoint /register
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.detail?.message || "Error al registrar usuario";
        return;
      }

      // Registro exitoso
      success = true;
      // Limpiar formulario
      email = username = name = password = confirmPassword = "";

      // Redirigir al login sin hash
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
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

<div class="bg-white p-8 rounded-lg shadow-lg w-96 max-w-full">
  <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">
    Crear cuenta
  </h1>

  {#if error}
    <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {error}
    </div>
  {/if}

  {#if success}
    <div
      class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
    >
      ¡Registro exitoso! Redirigiendo al inicio de sesión...
    </div>
  {/if}

  <form on:submit|preventDefault={submit} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1"
        >Email</label
      >
      <input
        id="email"
        type="email"
        bind:value={email}
        placeholder="correo@ejemplo.com"
        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>

    <div>
      <label for="username" class="block text-sm font-medium text-gray-700 mb-1"
        >Nombre de usuario</label
      >
      <input
        id="username"
        type="text"
        bind:value={username}
        placeholder="usuario123"
        minlength="3"
        maxlength="50"
        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>

    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1"
        >Nombre completo</label
      >
      <input
        id="name"
        type="text"
        bind:value={name}
        placeholder="Tu nombre"
        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1"
        >Contraseña</label
      >
      <input
        id="password"
        type="password"
        bind:value={password}
        placeholder="Contraseña (mín. 8 caracteres)"
        minlength="8"
        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>

    <div>
      <label
        for="confirmPassword"
        class="block text-sm font-medium text-gray-700 mb-1"
        >Confirmar contraseña</label
      >
      <input
        id="confirmPassword"
        type="password"
        bind:value={confirmPassword}
        placeholder="Confirma tu contraseña"
        class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
    >
      {#if loading}<span>Registrando...</span>{:else}<span>Crear cuenta</span
        >{/if}
    </button>

    <div class="text-center mt-4">
      <span class="text-gray-600">¿Ya tienes cuenta?</span>
      <a href="/" class="ml-1 text-blue-600 hover:text-blue-800 underline"
        >Inicia sesión</a
      >
    </div>
  </form>
</div>
