<script lang="ts">
  import { Dropzone } from "flowbite-svelte";
  import { onMount } from "svelte";

  let files: FileList | null = null;
  let imageUrl: string | null = null;
  let showError = false;
  let errorMessage = "";
  let loading = false;

  const API_BASE_URL = "http://127.0.0.1:8000";

  onMount(() => {
    showError = false;
  });

  async function verifyYapeTransaction(file: File) {
    loading = true;
    showError = false;

    try {
      const imageDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/filter_yape`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorDetail = "Error al verificar la imagen";
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch {
          errorDetail = (await response.text()) || errorDetail;
        }
        handleError(errorDetail);
        return;
      }
      sessionStorage.setItem("uploadedImage", await imageDataPromise);
      window.location.href = "/resultados";
    } catch (error) {
      handleError("Error al procesar la imagen. Por favor, inténtalo de nuevo.");
    } finally {
      loading = false;
    }
  }

  function handleError(message: string) {
    showError = true;
    errorMessage = message;
    setTimeout(() => (showError = false), 5000);
  }

  function isImageFile(file: File) {
    return file.type.startsWith("image/");
  }

  $: if (files && files.length > 0) {
    const file = files[0];
    if (!isImageFile(file)) {
      handleError(`${file.name} no es una imagen.`);
      imageUrl = null;
      files = null;
    } else {
      setTimeout(() => verifyYapeTransaction(file), 100);
      setTimeout(() => files = null, 1000);
    }
  }
</script>

<div class="p-4 w-full">
  {#if showError}
    <div class="alert-error">{errorMessage}</div>
  {/if}

  {#if loading}
    <div class="loading-indicator">
      <p>Verificando transacción Yape...</p>
    </div>
  {:else}
    <Dropzone
      bind:files
      accept="image/*"
      multiple={false}
      class="my-dropzone text-black/75"
    >
      <div class="content-center p-6">
        <p>Haz clic o arrastra para subir una imagen de transacción Yape</p>
      </div>
    </Dropzone>
  {/if}
</div>

<style>
  :global(.my-dropzone) {
    border: 2px dashed #e2e8f0;
    border-radius: 1rem;
    background: #f8fafc;
  }
  :global(.my-dropzone:hover) {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
  .alert-error {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    background: #fee2e2;
    color: #991b1b;
  }
  .loading-indicator {
    text-align: center;
    padding: 2rem;
    background: #f8fafc;
    border-radius: 1rem;
    border: 2px dashed #e2e8f0;
  }
</style>
