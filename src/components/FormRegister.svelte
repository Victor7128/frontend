<script lang="ts">
  const API_BASE_URL = "http://127.0.0.1:8000";
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

<div class="p-8 rounded-lg border border-white/75 w-96 max-w-full">
  <h1 class="text-2xl font-bold mb-6 text-center text-white/75">
    Crear cuenta
  </h1>

  {#if error}
    <div
      class="mb-4 p-3 bg-black border border-red-800 text-red-500 rounded-md text-center"
    >
      {error}
    </div>
  {/if}

  {#if success}
    <div
      class="mb-4 p-3 border border-green-800 text-green-500 text-center rounded-md"
    >
      ¡Registro exitoso! Redirigiendo al inicio de sesión...
    </div>
  {/if}

  <form on:submit|preventDefault={submit} class="space-y-4">
    <div>
      <label for="email" class="block text-sm font-medium text-white/75 mb-1"
        >Correo Electonico</label
      >
      <input
        id="email"
        type="email"
        bind:value={email}
        placeholder="correo@ejemplo.com"
        class="w-full p-3 border border-white/75 text-white/75 rounded-md"
        required
        autocomplete="off"
      />
    </div>

    <div>
      <label for="username" class="block text-sm font-medium text-white/75 mb-1"
        >Nombre de usuario</label
      >
      <input
        id="username"
        type="text"
        bind:value={username}
        placeholder="usuario123"
        minlength="3"
        maxlength="50"
        class="w-full p-3 border border-white/75 text-white/75 rounded-md"
        required
        autocomplete="off"
      />
    </div>

    <div>
      <label for="name" class="block text-sm font-medium text-white/75 mb-1"
        >Nombre completo</label
      >
      <input
        id="name"
        type="text"
        bind:value={name}
        placeholder="Alfredo Pérez"
        class="w-full p-3 border border-white/75 text-white/75 rounded-md"
        required
        autocomplete="off"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-white/75 mb-1"
        >Contraseña</label
      >
      <input
        id="password"
        type="password"
        bind:value={password}
        placeholder="Contraseña (mín. 8 caracteres)"
        minlength="8"
        class="w-full p-3 border border-white/75 text-white/75 rounded-md"
        required
        autocomplete="off"
      />
    </div>

    <div>
      <label
        for="confirmPassword"
        class="block text-sm font-medium text-white/75 mb-1"
        >Confirmar contraseña</label
      >
      <input
        id="confirmPassword"
        type="password"
        bind:value={confirmPassword}
        placeholder="Confirma tu contraseña"
        class="w-full p-3 border border-white/75 text-white/75 rounded-md"
        required
        autocomplete="off"
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-white/75 text-black p-3 rounded-md border hover:bg-black hover:text-white/75 transition-all ease-in duration-200 cursor-pointer"
    >
      {#if loading}<span>Registrando...</span>{:else}<span>Crear cuenta</span
        >{/if}
    </button>

    <div class="text-center mt-4">
      <span class="text-white/75">¿Ya tienes cuenta?</span>
      <a href="/" class="ml-1 text-white/75 hover:text-white underline transition-all ease-in duration-200"
        >Inicia sesión</a
      >
    </div>
  </form>
</div>
