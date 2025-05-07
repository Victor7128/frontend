<script lang="ts">
  import { Dropzone } from "flowbite-svelte";

  let files: FileList | null = null;
  let imageUrl: string | null = null;
  let showError = false;
  let errorMessage = "";

  function isImageFile(file: File) {
    return file.type.startsWith("image/");
  }

  // Cada vez que cambian los archivos seleccionados
  $: if (files && files.length > 0) {
    const file = files[0];
    if (!isImageFile(file)) {
      showError = true;
      errorMessage = `El archivo "${file.name}" no es una imagen.`;
      imageUrl = null;
      files = null;
      setTimeout(() => (showError = false), 5000);
    } else {
      imageUrl = URL.createObjectURL(file);
    }
  }

  function reset() {
    files = null;
    imageUrl = null;
  }
</script>

<div class="p-4 w-full">
  {#if showError}
    <div class="alert-error">¡Error! {errorMessage}</div>
  {/if}

  <Dropzone
    bind:files={files}
    accept="image/*"
    multiple={false}
    class="my-dropzone"
  >
    <div class="content-center p-6">
      {#if !files}
        <p>Haz clic o arrastra para subir una imagen</p>
      {:else}
        <p>Imagen seleccionada:</p>
        {#if imageUrl}
          <img src={imageUrl} alt="Preview" class="mt-4 rounded-lg max-w-full h-auto" />
          <button on:click={reset} class="mt-2 btn-secondary">
            Seleccionar otra
          </button>
        {/if}
      {/if}
    </div>
  </Dropzone>
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
  .btn-secondary {
    padding: .5rem 1rem;
    background: #3b82f6;
    color: white;
    border-radius: .375rem;
  }
</style>
