<script>
  import { onMount } from "svelte";
  import { getCurrentUser, logout, logoutAll } from "../services/authService";

  let user = null;
  let loading = true;
  let error = null;

  // Cargar datos del usuario al montar el componente
  onMount(async () => {
    try {
      user = await getCurrentUser();
      loading = false;
    } catch (err) {
      error = "No se pudo cargar la información del usuario";
      loading = false;

      // Si hay un error de autenticación, redirigir al login
      if (err.message === "No autenticado") {
        window.location.href = "/login";
      }
    }
  });

  // Función para cerrar sesión
  async function handleLogout() {
    try {
      await logout();
      window.location.href = "/login";
    } catch (err) {
      error = "Error al cerrar sesión";
    }
  }

  // Función para cerrar todas las sesiones
  async function handleLogoutAll() {
    try {
      await logoutAll();
      window.location.href = "/login";
    } catch (err) {
      error = "Error al cerrar todas las sesiones";
    }
  }
</script>

<div class="bg-white p-6 rounded-lg shadow-md">
  {#if loading}
    <div class="text-center py-4">
      <p>Cargando información del usuario...</p>
    </div>
  {:else if error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
      {error}
    </div>
  {:else if user}
    <div class="space-y-4">
      <div class="flex items-center justify-center mb-4">
        <div
          class="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center"
        >
          <span class="text-2xl font-bold text-blue-600"
            >{user.name.charAt(0).toUpperCase()}</span
          >
        </div>
      </div>

      <div class="text-center mb-4">
        <h2 class="text-xl font-bold">{user.name}</h2>
        <p class="text-gray-600">@{user.username}</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span class="font-medium">Email:</span>
          <span>{user.email}</span>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
          <span class="font-medium">ID:</span>
          <span class="text-xs text-gray-500">{user.id}</span>
        </div>
      </div>

      <div class="pt-4 space-y-3">
        <a
          href="/change-password"
          class="block w-full text-center py-2 px-4 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
        >
          Cambiar contraseña
        </a>

        <button
          on:click={handleLogout}
          class="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Cerrar sesión
        </button>

        <button
          on:click={handleLogoutAll}
          class="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Cerrar todas las sesiones
        </button>
      </div>
    </div>
  {/if}
</div>
