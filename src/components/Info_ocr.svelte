<script>
  import { onMount } from "svelte";

  const API_BASE_URL = "http://127.0.0.1:8000";

  let isLoading = false;
  let result = null;
  let error = null;
  let isOpen = false;

  $: hasImage =
    typeof window !== "undefined" &&
    sessionStorage?.getItem("uploadedImage") != null;

  $: advertencias =
    result && result.advertencias
      ? result.advertencias.filter((a) => !!a)
      : [];

  $: advertenciasCount = advertencias.length;

  $: advertenciaMonto = advertencias.find((a) =>
    a.toLowerCase().includes("monto")
  );

  $: if (!isLoading && result !== null && typeof window !== "undefined") {
    sessionStorage.setItem(
      "advertencias_ocr",
      advertenciasCount > 0 ? advertenciasCount.toString() : "0"
    );
  }

  onMount(() => {
    if (hasImage) processImage();
  });

  // Vuelve a procesar si cambia la imagen
  $: if (hasImage && !isLoading && !result && !error) {
    processImage();
  }
  $: if (!hasImage) {
    result = null;
    error = null;
  }

  async function base64ToBlob(base64String) {
    const [header, base64Data] = base64String.split(",");
    const mimeType = header.split(":")[1].split(";")[0];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  async function processImage() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    if (!uploadedImage) {
      return;
    }

    isLoading = true;
    error = null;
    result = null;

    try {
      const blob = await base64ToBlob(uploadedImage);
      const formData = new FormData();
      formData.append("file", blob, "comprobante.jpg");
      const controller = new AbortController();

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_ocr`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse
          .json()
          .catch(() => ({ detail: "Error desconocido" }));
        throw new Error(errorData.detail || `Error HTTP ${apiResponse.status}`);
      }
      result = await apiResponse.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  // Helper para mostrar dato o fallback
  function display(key, fallback = "No detectado") {
    if (!result) return fallback;
    return (
      result[key] ||
      result[key.replace(/([A-Z])/g, "_$1").toLowerCase()] ||
      fallback
    );
  }
</script>

<style>
  .dropdown-arrow {
    transition: transform 0.25s;
  }
  .dropdown-arrow.open {
    transform: rotate(-180deg);
  }
  .dropdown-content {
    transition: opacity 0.20s, transform 0.20s;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .dropdown-content.closed {
    opacity: 0;
    transform: translateY(20px);
    pointer-events: none;
  }
</style>

<div class="w-full bg-white/10 rounded-lg backdrop-blur-sm px-3 py-2 flex flex-col items-center shadow-sm">
  {#if error}
    <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-2 w-full text-xs text-red-400 mb-1 flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>Error: {error}</span>
    </div>
  {/if}

  {#if advertencias.length > 0}
    <div class="w-full text-xs bg-red-800/20 text-red-500 rounded-lg mb-2 py-1 px-2 flex flex-col gap-1">
      {#each advertencias as adv}
        <div class="flex items-center gap-1">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{adv}</span>
        </div>
      {/each}
    </div>
  {/if}

  <button
    on:click={toggleDropdown}
    class="bg-white/75 text-black
                      hover:text-white/75 transition-all duration-200 text-xs rounded-lg hover:bg-black px-4 py-1 mt-1 flex items-center gap-2 select-none cursor-pointer"
    disabled={isLoading || !result}
    aria-expanded={isOpen}
    aria-controls="dropdown-ocr-info"
    type="button"
  >
    <span>Ver datos del comprobante</span>
    <svg class="dropdown-arrow w-4 h-4 {isOpen ? 'open' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
    </svg>
  </button>

  <div
    id="dropdown-ocr-info"
    class="dropdown-content {isOpen ? '' : 'closed'} w-full bg-white brightness-90 border rounded-lg mt-2 px-3 py-2 shadow-md flex flex-col gap-1"
    style="position: absolute; bottom: 110%; left: 0; z-index: 50; min-width: 230px;"
    aria-hidden={!isOpen}
  >
    {#if isLoading}
      <div class="w-full text-center py-2">
        <div class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-1 text-black/75"></div>
        <span class="text-xs text-blue-200">Procesando...</span>
      </div>
    {:else if result}
      <div class="flex justify-between">
        <span class="font-semibold text-black/75">Nro. Op.:</span>
        <span class="truncate max-w-[110px] text-right text-black/75">{display("codigo_operacion")}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-semibold text-black/75">Fecha:</span>
        <span class="truncate max-w-[110px] text-right text-black/75">{display("fecha")}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-semibold text-black/75">Hora:</span>
        <span class="truncate max-w-[110px] text-right text-black/75">{display("hora")}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-semibold text-black/75">Receptor:</span>
        <span class="truncate max-w-[110px] text-right text-black/75">{display("receptor")}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-semibold text-black/75">Monto:</span>
        <span class="truncate max-w-[110px] text-right text-black/75">S/ {display("monto")}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-semibold text-black/75">Destino:</span>
        <span class="truncate max-w-[110px] text-right text-black/75">{display("destino")}</span>
      </div>
      {#if result.comentario}
        <div class="flex flex-col mt-2">
          <span class="font-semibold text-black/75">Comentario:</span>
          <span class="text-black/75">{result.comentario}</span>
        </div>
      {/if}
    {:else}
      <div class="w-full text-center py-2">
        <span class="text-black/75 text-xs">Sin información OCR</span>
      </div>
    {/if}
  </div>
</div>