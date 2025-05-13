<script lang="ts">
  import { Dropzone } from "flowbite-svelte";

  let files: FileList | null = null;
  let imageUrl: string | null = null;
  let showError = false;
  let errorMessage = "";
  let loading = false;

  function isImageFile(file: File) {
    return file.type.startsWith("image/");
  }

  async function handleImageUpload(file: File) {
    loading = true;    
    try {
      const reader = new FileReader();
      reader.onload = function() {
        sessionStorage.setItem('uploadedImage', reader.result as string);
        window.location.href = "/resultados";
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showError = true;
      errorMessage = "Error al procesar la imagen.";
      setTimeout(() => (showError = false), 5000);
    } finally {
      loading = false;
    }
  }

  $: if (files && files.length > 0) {
    const file = files[0];
    if (!isImageFile(file)) {
      showError = true;
      errorMessage = `${file.name} no es una imagen.`;
      imageUrl = null;
      files = null;
      setTimeout(() => (showError = false), 5000);
    } else {
      handleImageUpload(file);
    }
  }

  function reset() {
    files = null;
    imageUrl = null;
  }
</script>

<div class="p-4 w-full">
  {#if showError}
    <div class="alert-error">{errorMessage}</div>
  {/if}

  {#if loading}
    <div class="loading-indicator">
      <p>Procesando imagen...</p>
    </div>
  {:else}
    <Dropzone
      bind:files={files}
      accept="image/*"
      multiple={false}
      class="my-dropzone"
    >
      <div class="content-center p-6">
        <p>Haz clic o arrastra para subir una imagen</p>
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
    padding: .75rem 1rem;
    border-radius: .5rem;
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