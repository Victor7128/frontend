<script>
  import { onMount } from "svelte";
  import Graphics from "./Graphics.svelte";
  import Histograma from "./Histograma.svelte";

  let filtroPixeles = {
    porcentaje: 0,
    coincidencias: 0,
    nombre: "Filtro de Píxeles",
  };

  let filtroRuido = {
    porcentaje_veracidad: "0%",
    similitud_promedio: "0%",
    mejor_similitud: "0%",
    plantilla_coincidente: "Ninguna",
    caracteristicas_detectadas: {
      area_morada: "0%",
      densidad_bordes: "0",
      forma_rectangular: false,
    },
    nombre: "Filtro de Ruido",
  };

  let filtroOCR = {
    porcentaje: 0,
    nombre: "Filtro OCR",
  };

  let loading = true;
  let loadingOCR = false;
  let loadingRuido = false;
  let error = null;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

  onMount(async () => {
    await cargarDatos();
  });

  async function cargarDatos() {
    loading = true;
    error = null;
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return (window.location.href = "/");
      }

      await Promise.all([filtro_pixeles(), filtro_ruido(), filtro_ocr()]);
      const porcentajePixeles = extractPercentage(filtroPixeles.porcentaje);
      const porcentajeRuido = extractPercentage(filtroRuido.porcentaje_veracidad);
      const porcentajeOCR = extractPercentage(filtroOCR.porcentaje);

      sessionStorage.setItem("porcentajePixeles", porcentajePixeles.toString());
      sessionStorage.setItem("porcentajeRuido", porcentajeRuido.toString());
      sessionStorage.setItem("porcentajeOCR", porcentajeOCR.toString());
      window.dispatchEvent(new Event("filtrosActualizados"));
    } catch (err) {
      error = "Error al cargar los datos de análisis";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function filtro_ocr() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    if (!uploadedImage) {
      console.warn("⚠️ No hay imagen disponible para filtro OCR");
      return;
    }

    loadingOCR = true;

    try {
      const blob = await base64ToBlob(uploadedImage);
      const formData = new FormData();
      formData.append("file", blob, "yape_image.jpg");
      const controller = new AbortController();

      const apiResponse = await fetch(`${API_BASE_URL}/ocr`, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(errorData.detail || `Error HTTP ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      if (typeof result.porcentaje === 'number' && result.porcentaje >= 0) {
        filtroOCR = {
          porcentaje: Math.round(result.porcentaje * 100) / 100,
          nombre: "Filtro OCR",
        };        
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err) {
      console.error("💥 Error en filtro OCR:", err);
      
      filtroOCR = {
        porcentaje: 0,
        nombre: "Filtro OCR",
      };
      
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

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_ruido_detallado`, {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.detail || "Error en el análisis de ruido");
      }

      const result = await apiResponse.json();
      filtroRuido = {
        porcentaje_veracidad: result.porcentaje_veracidad || "0%",
        similitud_promedio: result.similitud_promedio || "0%",
        mejor_similitud: result.mejor_similitud || "0%",
        plantilla_coincidente: result.plantilla_coincidente || "Ninguna",
        caracteristicas_detectadas: result.caracteristicas_detectadas || {
          area_morada: "0%",
          densidad_bordes: "0",
          forma_rectangular: false,
        },
        nombre: "Filtro de Ruido",
      };
    } catch (err) {
      console.error("💥 Error en filtro_ruido:", err);
      filtroRuido.nombre = "Filtro de Ruido (Error)";
    } finally {
      loadingRuido = false;
    }
  }

  async function filtro_pixeles() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    try {
      if (!uploadedImage) {
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
          porcentaje: data.porcentaje ?? 0,
          coincidencias: data.coincidencias ?? 0,
          nombre: data.plantilla ?? "Filtro de Píxeles",
        };
      } else {
        const text = await apiResponse.text();
      }
    } catch (err) {
      console.error("💥 Error en filtro_pixeles:", err);
    }
  }

  function extractPercentage(value) {    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      // Remover % y convertir a número
      const cleaned = value.replace('%', '').trim();
      const parsed = parseFloat(cleaned);
      const result = isNaN(parsed) ? 0 : parsed;
      return result;
    }
    return 0;
  }

  async function recargarAnalisis() {
    await cargarDatos();
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
</script>

<div class="flex h-full flex-col gap-4">
  {#if loading}
    <div class="flex items-center justify-center h-full">
      <div class="text-white/75">Cargando análisis...</div>
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
      <!-- Gráficos de filtros -->
      <div
        class="flex justify-around w-full bg-white/10 p-4 rounded-lg backdrop-blur-sm"
      >
        <!-- Filtro OCR -->
        <div class="relative">
          <Graphics
            color1="#FC7656"
            color2="#FCC656"
            porcentaje={filtroOCR.porcentaje}
            titulo={filtroOCR.nombre}
          />
          <p class="text-white/75 mt-2 text-xs text-center">Palabras clave</p>
        </div>

        <!-- Filtro de Píxeles -->
        <div>
          <Graphics
            color1="#4c56af"
            color2="#af4ca8"
            porcentaje={filtroPixeles.porcentaje}
            titulo={filtroPixeles.nombre}
          />
          <p class="text-white/75 mt-2 text-xs text-center">
            {filtroPixeles.coincidencias} Coincidencias
          </p>
        </div>

        <!-- Filtro de Ruido -->
        <div class="relative">
          {#if loadingRuido}
            <div
              class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10"
            >
              <div
                class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
            </div>
          {/if}

          <Graphics
            color1="#5CF283"
            color2="#5CF2E9"
            porcentaje={extractPercentage(filtroRuido.porcentaje_veracidad)}
            titulo={filtroRuido.nombre}
          />

          <div class="mt-2 text-center">
            <p class="text-white/75 text-xs">
              Similitud: {filtroRuido.similitud_promedio}
            </p>
            <p class="text-white/75 text-xs">
              Plantilla: {filtroRuido.plantilla_coincidente}
            </p>
          </div>
        </div>
      </div>
      <Histograma />
    </div>
  {/if}
</div>
