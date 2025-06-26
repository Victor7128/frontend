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

  // ✅ ESTADOS DE LOADING SEPARADOS
  let loading = true;           // Para filtros principales (píxeles + ruido)
  let loadingOCR = false;       // Para filtro OCR independiente
  let loadingRuido = false;
  let error = null;
  let errorOCR = null;          // Error específico para OCR

  const API_BASE_URL = "http://127.0.0.1:8000";

  onMount(async () => {
    // ✅ CARGAR FILTROS PRINCIPALES (sin OCR)
    await cargarDatos();
    
    // ✅ CARGAR OCR DE FORMA INDEPENDIENTE (no bloquea la UI)
    setTimeout(() => {
      filtro_ocr_independiente();
    }, 500); // Pequeño delay para que se muestren primero los otros filtros
  });

  // ✅ FUNCIÓN PRINCIPAL SIN OCR
  async function cargarDatos() {
    loading = true;
    error = null;
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return (window.location.href = "/");
      }

      // ✅ SOLO CARGAR PÍXELES Y RUIDO
      await Promise.all([filtro_pixeles(), filtro_ruido()]);
      
      const porcentajePixeles = extractPercentage(filtroPixeles.porcentaje);
      const porcentajeRuido = extractPercentage(filtroRuido.porcentaje_veracidad);

      sessionStorage.setItem("porcentajePixeles", porcentajePixeles.toString());
      sessionStorage.setItem("porcentajeRuido", porcentajeRuido.toString());
      
      // ✅ DISPARAR EVENTO SIN ESPERAR OCR
      window.dispatchEvent(new Event("filtrosActualizados"));
      
    } catch (err) {
      error = "Error al cargar los datos de análisis";
      console.error("💥 Error en cargarDatos:", err);
    } finally {
      loading = false; // ✅ UI se libera inmediatamente
    }
  }

  // ✅ FILTRO OCR COMPLETAMENTE INDEPENDIENTE
  async function filtro_ocr_independiente() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    if (!uploadedImage) {
      console.warn("⚠️ No hay imagen disponible para filtro OCR");
      filtroOCR = {
        porcentaje: 0,
        nombre: "Filtro OCR (Sin imagen)",
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

      // ✅ TIMEOUT PARA EVITAR CUELGUE INDEFINIDO
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 segundos timeout

      const apiResponse = await fetch(`${API_BASE_URL}/ocr`, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ 
          detail: `Error HTTP ${apiResponse.status}` 
        }));
        throw new Error(errorData.detail || `Error HTTP ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      if (typeof result.porcentaje === 'number' && result.porcentaje >= 0) {
        filtroOCR = {
          porcentaje: Math.round(result.porcentaje * 100) / 100,
          nombre: "Filtro OCR",
        };
        
        // ✅ GUARDAR PORCENTAJE OCR Y DISPARAR EVENTO
        const porcentajeOCR = extractPercentage(filtroOCR.porcentaje);
        sessionStorage.setItem("porcentajeOCR", porcentajeOCR.toString());
        window.dispatchEvent(new Event("filtrosActualizados"));
        
        console.log("✅ Filtro OCR completado:", filtroOCR.porcentaje);
      } else {
        throw new Error("Respuesta inválida del servidor");
      }

    } catch (err) {
      console.error("💥 Error en filtro OCR:", err);
      
      if (err.name === 'AbortError') {
        errorOCR = "Timeout: El servidor OCR no responde";
        filtroOCR.nombre = "Filtro OCR (Timeout)";
      } else {
        errorOCR = err.message;
        filtroOCR.nombre = "Filtro OCR (Error)";
      }
      
      filtroOCR = {
        ...filtroOCR,
        porcentaje: 0,
      };

      // ✅ GUARDAR 0 EN CASO DE ERROR
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
        console.warn("⚠️ Error en filtro_pixeles:", text);
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
      const cleaned = value.replace('%', '').trim();
      const parsed = parseFloat(cleaned);
      const result = isNaN(parsed) ? 0 : parsed;
      return result;
    }
    return 0;
  }

  // ✅ RECARGAR TODOS LOS FILTROS
  async function recargarAnalisis() {
    await cargarDatos();
    setTimeout(() => {
      filtro_ocr_independiente();
    }, 100);
  }

  // ✅ RECARGAR SOLO OCR
  async function recargarOCR() {
    await filtro_ocr_independiente();
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
      <!-- Gráficos de filtros -->
      <div
        class="flex justify-around w-full bg-white/10 p-4 rounded-lg backdrop-blur-sm"
      >
        <!-- ✅ FILTRO OCR CON ESTADO INDEPENDIENTE -->
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
            titulo={filtroOCR.nombre}
          />
          
          <div class="mt-2 text-center">
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
            {:else}
              <p class="text-white/75 text-xs">Palabras clave</p>
            {/if}
          </div>
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
                class="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"
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