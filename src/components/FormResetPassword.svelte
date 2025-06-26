<script>
  import { onMount } from "svelte";

  const API_BASE_URL = "http://127.0.0.1:8000";

  let email = "";
  let token = "";
  let newPassword = "";
  let confirmPassword = "";
  let step = "request";
  let loading = false;
  let error = null;
  let message = "";

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (tokenParam) {
      token = tokenParam;
      step = "reset";
    }
  });

  async function requestReset() {
    loading = true;
    error = null;

    try {
      const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail?.message || "Error al solicitar restablecimiento",
        );
      }

      message = data.message;

      if (data.debug_token) {
        token = data.debug_token;
        step = "reset";
      } else {
        step = "emailSent";
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function resetPassword() {
    if (newPassword !== confirmPassword) {
      error = "Las contraseñas no coinciden";
      return;
    }

    loading = true;
    error = null;

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail?.message || "Error al restablecer contraseña",
        );
      }

      message = data.message;
      step = "success";
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div
  class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
>
  <div
    class="max-w-md w-full space-y-8 border border-white/75 p-8 rounded-2xl shadow-md"
  >
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-white/75">
        {#if step === "request"}
          Restablecer contraseña
        {:else if step === "emailSent"}
          Revisa tu correo
        {:else if step === "reset"}
          Crea una nueva contraseña
        {:else if step === "success"}
          ¡Contraseña restablecida!
        {/if}
      </h2>
      <p class="mt-2 text-center text-sm text-white/75">
        {#if step === "request"}
          Ingresa tu correo electrónico
        {:else if step === "emailSent"}
          Revizando si existe el Correo
        {:else if step === "reset"}
          Por favor ingresa tu nueva contraseña
        {:else if step === "success"}
          Ya puedes iniciar sesión con tu nueva contraseña
        {/if}
      </p>
    </div>

    {#if error}
      <div class="bg-black border border-red-800 rounded-md p-4 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if message && !error}
      <div class="bg-black border border-green-800 p-4 my-4 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-500">{message}</p>
          </div>
        </div>
      </div>
    {/if}

    <form
      class="mt-8 space-y-6"
      on:submit|preventDefault={step === "request"
        ? requestReset
        : resetPassword}
    >
      {#if step === "request"}
        <div>
          <div>
            <input
              id="email"
              name="email"
              type="email"
              required
              bind:value={email}
              class="appearance-none block w-full px-3 py-2 border border-white/75 rounded-md shadow-sm placeholder-white/75 text-white/75"
              placeholder="correo@ejemplo.com"
              autocomplete="off"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            class="group relative w-full flex justify-center py-2 px-4 border text-sm font-medium rounded-md text-black bg-white/75 hover:bg-black hover:text-white/75 hover:border-white/75 transition-all ease-in duration-200 cursor-pointer"
          >
            {loading ? "Enviando..." : "Verificar correo"}
          </button>
        </div>
      {:else if step === "emailSent"}
        <div>
          <p class="text-center text-white/75 mb-4">Vuelve a intentarlo</p>

          <button
            type="button"
            on:click={() => (step = "request")}
            class="group relative w-full flex justify-center py-2 px-4 border text-black bg-white/75 hover:bg-black hover:text-white/75 hover:border-white/75 transition-all ease-in duration-200 cursor-pointer rounded-md"
          >
            Volver
          </button>
        </div>
      {:else if step === "reset"}
        <div>
          <label
            for="new-password"
            class="block text-sm font-medium text-white/75"
          >
            Nueva contraseña
          </label>
          <div class="mt-1">
            <input
              id="new-password"
              name="new-password"
              type="password"
              required
              bind:value={newPassword}
              class="appearance-none block w-full px-3 py-2 border border-white/75 rounded-md placeholder-white/75 text-white/75"
              placeholder="••••••••"
              minlength="8"
              autocomplete="off"
            />
          </div>
        </div>

        <div>
          <div>
            <label
              for="new-password"
              class="block text-sm font-medium text-white/75"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              bind:value={confirmPassword}
              class="appearance-none block w-full px-3 py-2 border border-white/75 rounded-md placeholder-white/75 text-white/75"
              placeholder="••••••••"
              minlength="8"
              autocomplete="off"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            class="group relative w-full flex justify-center py-2 px-4 border text-sm font-medium rounded-md text-black bg-white/75 hover:bg-black hover:text-white/75 hover:border-white/75 transition-all ease-in duration-200 cursor-pointer"
          >
            {loading ? "Procesando..." : "Restablecer contraseña"}
          </button>
        </div>
      {:else if step === "success"}
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <p class="mt-2 text-base text-white/75">
            Tu contraseña ha sido restablecida exitosamente.
          </p>
          <p class="mt-1 text-sm text-white/75">
            Serás redirigido a la página de inicio de sesión en unos segundos...
          </p>
          <div class="mt-5">
            <a
              href="/login"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white/75 hover:text-white transition-all ease-in duration-200"
            >
              Ir a iniciar sesión
            </a>
          </div>
        </div>
      {/if}
    </form>

    {#if step === "request" || step === "reset"}
      <div class="mt-4 text-center">
        <a
          href="/"
          class="font-medium text-white/75 hover:text-white transition-all ease-in duration-200"
        >
          Volver a iniciar sesión
        </a>
      </div>
    {/if}
  </div>
</div>
