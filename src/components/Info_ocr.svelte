<script>
  import { onMount } from "svelte";

  const API_BASE_URL = "http://127.0.0.1:8000";

  let isLoading = false;
  let result = null;
  let error = null;

  $: hasImage =
    typeof window !== "undefined" &&
    sessionStorage?.getItem("uploadedImage") != null;

  // Mostrar advertencia de monto
  $: advertenciaMonto = result && result.monto_fuera_rango
    ? "⚠️ El monto detectado supera S/ 500. Verifica que el comprobante sea válido."
    : "";

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
</script>

<!-- Compacto para flex horizontal -->
<div class="w-full bg-white/10 rounded-lg backdrop-blur-sm px-3 py-2 flex flex-col items-center shadow-sm">
  {#if error}
    <div class="bg-red-500/20 border border-red-500/30 rounded-lg p-2 w-full text-xs text-red-400 mb-1 flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>Error: {error}</span>
    </div>
  {/if}

  <!-- Advertencia monto fuera de rango si aplica -->
  {#if advertenciaMonto}
    <div class="bg-yellow-400/20 border border-yellow-400/40 rounded p-2 w-full text-xs text-yellow-800 mb-1 flex items-center gap-2">
      <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      <span>{advertenciaMonto}</span>
    </div>
  {/if}

  {#if hasImage && result}
    <div class="w-full flex flex-col gap-1 text-xs text-white/80 mt-1">
      <div class="flex justify-between">
        <span class="font-semibold">Nro. Op.:</span>
        <span class="truncate max-w-[110px] text-right text-white">{result.nro_operacion || "No detectado"}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-semibold">Fecha/Hora:</span>
        <span class="truncate max-w-[110px] text-right text-white">{result.fecha_hora || "No detectada"}</span>
      </div>
      <div class="flex justify-between">
        <span class="font-semibold">Receptor:</span>
        <span class="truncate max-w-[110px] text-right text-white">{result.receptor || "No detectado"}</span>
      </div>
    </div>
  {:else if hasImage && isLoading}
    <div class="w-full text-center py-2">
      <div class="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
      <span class="text-xs text-blue-200">Procesando...</span>
    </div>
  {:else}
    <div class="w-full text-center py-2">
      <svg class="w-7 h-7 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <span class="text-gray-400 text-xs">No hay imagen</span>
    </div>
  {/if}
</div>