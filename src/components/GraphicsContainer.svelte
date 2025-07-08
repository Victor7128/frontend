<script>
  import { onMount } from "svelte";
  import Graphics from "./Graphics.svelte";
  import Histograma from "./Histograma.svelte";
  import InfoOcr from "./Info_ocr.svelte";

  let filtroPixeles = {
    porcentaje: 0,
    advertencia: "",
    coincidencias: 0,
    nombre: "Filtro de Píxeles",
  };

  let filtroRuido = {
    porcentaje_nitidez: "0%",
    advertencia: "",
    nombre: "Filtro de Ruido",
  };

  let filtroOCR = {
    porcentaje: 0,
    advertencia: "",
    nombre: "Filtro Palabras Clave",
  };

  let loading = true;
  let loadingOCR = false;
  let loadingRuido = false;
  let loadingPixeles = false;
  let error = null;
  let errorOCR = null;
  let errorPixeles = null;

  const API_BASE_URL = "http://127.0.0.1:8000";

  onMount(async () => {
    await cargarDatos();
    setTimeout(() => {
      filtro_ocr_independiente();
    }, 500);
  });

  async function cargarDatos() {
    loading = true;
    error = null;
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return (window.location.href = "/");
      }

      await Promise.all([filtro_pixeles(), filtro_ruido()]);

      const porcentajePixeles = extractPercentage(filtroPixeles.porcentaje);
      const porcentajeRuido = extractPercentage(filtroRuido.porcentaje_nitidez);

      sessionStorage.setItem("porcentajePixeles", porcentajePixeles.toString());
      sessionStorage.setItem("porcentajeRuido", porcentajeRuido.toString());

      window.dispatchEvent(new Event("filtrosActualizados"));
    } catch (err) {
      error = "Error al cargar los datos de análisis";
      console.error("💥 Error en cargarDatos:", err);
    } finally {
      loading = false;
    }
  }

  async function filtro_ocr_independiente() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    if (!uploadedImage) {
      console.warn("⚠️ No hay imagen disponible para filtro OCR");
      filtroOCR = {
        porcentaje: 0,
        advertencia: "",
        nombre: "Filtro Palabras Clave",
      };
      return;
    }

    loadingOCR = true;
    errorOCR = null;

    try {
      const blob = await base64ToBlob(uploadedImage);
      const formData = new FormData();
      formData.append("file", blob, "yape_image.jpg");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000);

      const apiResponse = await fetch(`${API_BASE_URL}/ocr`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({
          detail: `Error HTTP ${apiResponse.status}`,
        }));
        throw new Error(errorData.detail || `Error HTTP ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      if (typeof result.porcentaje === "number" && result.porcentaje >= 0) {
        filtroOCR = {
          porcentaje: Math.round(result.porcentaje * 100) / 100,
          advertencia: result.advertencia || "",
          nombre: "Filtro Palabras Clave",
        };
        const porcentajeOCR = extractPercentage(filtroOCR.porcentaje);
        sessionStorage.setItem("porcentajeOCR", porcentajeOCR.toString());
        window.dispatchEvent(new Event("filtrosActualizados"));
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err) {
      console.error("💥 Error en filtro OCR:", err);

      if (err.name === "AbortError") {
        errorOCR = "Timeout: El servidor OCR no responde";
        filtroOCR.nombre = "Filtro OCR (Timeout)";
      } else {
        errorOCR = err.message;
        filtroOCR.nombre = "Filtro OCR (Error)";
      }

      filtroOCR = {
        ...filtroOCR,
        porcentaje: 0,
        advertencia: "",
      };
      sessionStorage.setItem("porcentajeOCR", "0");
      window.dispatchEvent(new Event("filtrosActualizados"));
    } finally {
      loadingOCR = false;
    }
  }

  async function filtro_ruido() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    if (!uploadedImage) {
      console.error("❌ No hay imagen en sessionStorage para filtro ruido");
      return;
    }

    loadingRuido = true;
    try {
      const blob = await base64ToBlob(uploadedImage);
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_ruido`, {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || "Error en el análisis de nitidez");
      }

      const result = await apiResponse.json();
      filtroRuido = {
        porcentaje_nitidez:
          typeof result.porcentaje_nitidez === "number"
            ? `${result.porcentaje_nitidez}%`
            : result.porcentaje_nitidez || "0%",
        advertencia: result.advertencia || "",
        nombre: "Filtro de Ruido",
      };
    } catch (err) {
      console.error("💥 Error en filtro_ruido:", err);
      filtroRuido = {
        porcentaje_nitidez: "0%",
        advertencia: err.message || "Error desconocido",
        nombre: "Filtro de Ruido (Error)",
      };
    } finally {
      loadingRuido = false;
    }
  }

  async function filtro_pixeles() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    loadingPixeles = true;
    errorPixeles = null;
    try {
      if (!uploadedImage) {
        errorPixeles = "No hay imagen cargada";
        filtroPixeles = {
          porcentaje: 0,
          advertencia: "No hay imagen cargada",
          coincidencias: 0,
          nombre: "Filtro de Píxeles",
        };
        return;
      }

      const blob = await base64ToBlob(uploadedImage);
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_pixeles`, {
        method: "POST",
        body: formData,
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        filtroPixeles = {
          porcentaje: data.porcentaje_coincidencia ?? 0,
          advertencia: data.advertencia || "",
          coincidencias: data.coincidencias ?? 0,
          nombre: "Filtro de Píxeles",
        };
      } else {
        const errorData = await apiResponse.json().catch(() => ({
          detail: `Error HTTP ${apiResponse.status}`,
        }));
        errorPixeles = errorData.detail || "Error al analizar píxeles";
        filtroPixeles = {
          porcentaje: 0,
          advertencia: errorPixeles,
          coincidencias: 0,
          nombre: "Filtro de Píxeles (Error)",
        };
      }
    } catch (err) {
      console.error("💥 Error en filtro_pixeles:", err);
      errorPixeles = err.message;
      filtroPixeles = {
        porcentaje: 0,
        advertencia: err.message || "Error desconocido",
        coincidencias: 0,
        nombre: "Filtro de Píxeles (Error)",
      };
    } finally {
      loadingPixeles = false;
    }
  }

  function extractPercentage(value) {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const cleaned = value.replace("%", "").trim();
      const parsed = parseFloat(cleaned);
      const result = isNaN(parsed) ? 0 : parsed;
      return result;
    }
    return 0;
  }

  async function recargarAnalisis() {
    await cargarDatos();
    setTimeout(() => {
      filtro_ocr_independiente();
    }, 100);
  }

  async function recargarOCR() {
    await filtro_ocr_independiente();
  }

  async function recargarPixeles() {
    await filtro_pixeles();
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

  function colorAdvertencia(advertencia) {
    if (!advertencia) return "";
    if (/alterad/i.test(advertencia)) return "text-red-400";
    if (/sospechoso/i.test(advertencia)) return "text-yellow-400";
    if (/aut[eé]ntic/i.test(advertencia)) return "text-green-400";
    return "text-gray-300";
  }
</script>

<div class="flex h-full flex-col gap-4">
  {#if loading}
    <div class="flex items-center justify-center h-full">
      <div class="text-white/75">Cargando análisis principal...</div>
    </div>
  {:else if error}
    <div class="flex flex-col items-center justify-center h-full gap-4">
      <div class="text-red-400">{error}</div>
      <button
        on:click={recargarAnalisis}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Reintentar
      </button>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
      <div
        class="flex justify-around w-full bg-white/10 p-4 rounded-lg backdrop-blur-sm"
      >
        <!-- OCR -->
        <div class="relative">
          {#if loadingOCR}
            <div
              class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10"
            >
              <div
                class="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
          {/if}

          <Graphics
            color1="#FC7656"
            color2="#FCC656"
            porcentaje={filtroOCR.porcentaje}
            titulo={"Filtro Palabras"}
          />

          <div class="mt-2 text-center">
            {#if filtroOCR.advertencia}
              <p
                class={`text-xs mb-1 font-bold ${colorAdvertencia(filtroOCR.advertencia)}`}
              >
                {filtroOCR.advertencia}
              </p>
            {/if}
            {#if errorOCR}
              <p class="text-red-400 text-xs mb-1">Error OCR</p>
              <button
                on:click={recargarOCR}
                class="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Reintentar
              </button>
            {:else if loadingOCR}
              <p class="text-orange-400 text-xs">Cargando...</p>
            {/if}
          </div>
        </div>

        <!-- Filtro de Píxeles -->
        <div class="relative">
          {#if loadingPixeles}
            <div
              class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10"
            >
              <div
                class="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
          {/if}

          <Graphics
            color1="#4c56af"
            color2="#af4ca8"
            porcentaje={extractPercentage(filtroPixeles.porcentaje)}
            titulo={filtroPixeles.nombre}
          />
          <div class="mt-2 text-center">
            {#if filtroPixeles.advertencia}
              <p
                class={`text-xs font-bold ${colorAdvertencia(filtroPixeles.advertencia)}`}
              >
                {filtroPixeles.advertencia}
              </p>
            {/if}
            {#if errorPixeles}
              <p class="text-red-400 text-xs mb-1">Error Píxeles</p>
              <button
                on:click={recargarPixeles}
                class="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Reintentar
              </button>
            {/if}
          </div>
        </div>

        <!-- Filtro de Ruido -->
        <div class="relative">
          {#if loadingRuido}
            <div
              class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10"
            >
              <div
                class="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
          {/if}

          <Graphics
            color1="#5CF283"
            color2="#5CF2E9"
            porcentaje={extractPercentage(filtroRuido.porcentaje_nitidez)}
            titulo={filtroRuido.nombre}
          />

          <div class="mt-2 text-center">
            {#if filtroRuido.advertencia}
              <p
                class={`text-xs font-bold ${colorAdvertencia(filtroRuido.advertencia)}`}
              >
                {filtroRuido.advertencia}
              </p>
            {/if}
          </div>
        </div>
      </div>
      <Histograma />
    </div>
  {/if}
</div>
