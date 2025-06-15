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

  let loading = true;
  let loadingSSIM = false;
  let loadingRuido = false;
  let error = null;

  const API_BASE_URL = "https://backend-qab1.onrender.com";

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
      await Promise.all([filtro_pixeles(), filtro_ruido()]);

      const porcentajePixeles = filtroPixeles.porcentaje
        ? parseFloat(filtroPixeles.porcentaje)
        : 0;
      const porcentajeRuido = filtroRuido.porcentaje_veracidad
        ? parseFloat(filtroRuido.porcentaje_veracidad.replace("%", ""))
        : 0;

      sessionStorage.setItem("porcentajePixeles", porcentajePixeles.toString());
      sessionStorage.setItem("porcentajeRuido", porcentajeRuido.toString());

      window.dispatchEvent(new Event("filtrosActualizados"));
    } catch (err) {
      error = "Error al cargar los datos de análisis";
      console.error(err);
    } finally {
      loading = false;
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
      const base64Data = uploadedImage.split(",")[1];
      const mimeType = uploadedImage.split(",")[0].split(":")[1].split(";")[0];

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const apiResponse = await fetch(
        `${API_BASE_URL}/filtro_ruido_detallado`,
        {
          method: "POST",
          body: formData,
        },
      );

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
      sessionStorage.setItem(
        "porcentajeRuido",
        filtroRuido.porcentaje_veracidad.toString(),
      );
    } catch (err) {
      console.error("💥 Error en filtro_ruido:", err);
      filtroRuido.nombre = "Filtro de Ruido (Error)";
    } finally {
      loadingRuido = false;
    }
  }

  async function filtro_pixeles() {
    try {
      const uploadedImage = sessionStorage.getItem("uploadedImage");
      if (!uploadedImage) {
        return;
      }
      const base64Data = uploadedImage.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_pixeles`, {
        method: "POST",
        body: formData,
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        filtroPixeles = {
          porcentaje: data.porcentaje ?? filtroPixeles.porcentaje,
          coincidencias: data.coincidencias ?? filtroPixeles.coincidencias,
          nombre: data.plantilla ?? filtroPixeles.nombre,
        };
        sessionStorage.setItem(
          "porcentajePixeles",
          filtroPixeles.porcentaje.toString(),
        );
      } else {
        const text = await apiResponse.text();
        console.error("💥 API Error filtro pixeles:", text);
      }
    } catch (err) {
      console.error("💥 Error en filtro_pixeles:", err);
    }
  }

  async function recargarAnalisis() {
    await cargarDatos();
  }

  function extractPercentage(percentageString) {
    if (!percentageString) return 0;
    return parseFloat(percentageString.replace("%", ""));
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
        <!-- Filtro SSIM -->
        <div class="relative">
          <Graphics
            color1="#FC7656"
            color2="#FCC656"
            porcentaje={0}
            titulo={"Filtro Fuente"}
          />

          <div class="mt-2 text-center">
            <p class="text-white/75 text-xs">
              {0} comparadas
            </p>
            <p class="text-white/75 text-xs">
              {0} coincidencias
            </p>
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
