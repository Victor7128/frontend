<script>
  import { onMount } from "svelte";
  import {
    getCurrentUser,
    logout,
    logoutAll,
    isAuthenticated,
  } from "../services/authService";

  let user = null;
  let loading = true;
  let error = null;
  let showDropdown = false;

  onMount(async () => {
    try {
      if (!isAuthenticated()) {
        window.location.href = "/";
        return;
      }

      user = await getCurrentUser();
      loading = false;
    } catch (err) {
      console.error("Error al cargar usuario:", err);
      error = "No se pudo cargar la información del usuario";
      loading = false;

      localStorage.removeItem("access_token");
      localStorage.removeItem("session_id");
      window.location.href = "/";
    }
  });

  async function handleLogoutAll() {
    try {
      await logoutAll();
      window.location.href = "/";
    } catch (err) {
      error = "Error al cerrar todas las sesiones";
    }
  }

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  async function goToChangePassword() {
    try {
      await logout();
      console.log("Sesión cerrada correctamente");
      window.location.href = "/change-password";
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      error = "No se pudo cerrar la sesión para cambiar la contraseña";
      setTimeout(() => {
        window.location.href = "/change-password";
      }, 1000);
    }
  }

  function handleClickOutside(event) {
    const dropdown = document.getElementById("user-dropdown");
    const userButton = document.getElementById("user-button");

    if (
      showDropdown &&
      dropdown &&
      userButton &&
      !dropdown.contains(event.target) &&
      !userButton.contains(event.target)
    ) {
      showDropdown = false;
    }
  }

  onMount(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  });
</script>

<svelte:window on:click={handleClickOutside} />

<header
  class="relative w-full flex justify-between items-center pt-5 px-5"
>
  <a href="/dashboard" class="text-3xl font-semibold text-white/75">FraudVision</a>

  {#if loading}
    <div class="text-center py-4">
      <p>Cargando información del usuario...</p>
    </div>
  {:else if error}
    <div
      class="bg-red-100 border border-red-800 text-red-500 px-4 py-3 rounded mb-4"
    >
      {error}
    </div>
  {:else if user}
    <div class="relative">
      <button
        id="user-button"
        on:click={toggleDropdown}
        class="flex items-center space-x-2 focus:outline-none transition-all ease-in duration-200 cursor-pointer"
      >
        <div
          class="w-10 h-10 rounded-full overflow-hidden border-2 border-white/75 hover:border-white transition-all ease-in duration-200"
        >
          <img
            src="/user.png"
            alt="Imagen de usuario"
            class="w-full h-full object-cover"
          />
        </div>
      </button>

      {#if showDropdown}
        <div
          id="user-dropdown"
          class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
        >
          <div class="px-4 py-2 text-sm text-black/75 border-b border-gray-200">
            <span class="font-medium">{user.username}</span>
          </div>
          <button
            on:click={goToChangePassword}
            class="block w-full text-left px-4 py-2 text-sm text-black/75 hover:bg-gray-100 transition-all ease-in duration-200 cursor-pointer"
          >
            Cambiar contraseña
          </button>
          <button
            on:click={handleLogoutAll}
            class="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 transition-all ease-in duration-200 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      {/if}
    </div>
  {/if}
</header>
