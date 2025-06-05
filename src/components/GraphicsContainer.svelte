<script>
  import { onMount } from "svelte";
  import Graphics from "./Graphics.svelte";

  let filtroPixeles = {
    porcentaje: 0,
    coincidencias: 0,
    nombre: "Filtro de Pixeles",
  };

  let filtroExif = {
    archivo: "",
    mensaje: "",
    editado: false,
    tiene_gps: false,
    info_imagen: {},
    exif: {},
  };

  let filtroSSIM = {
    promedio_similitud: null,
    imagenes_comparadas: 0,
    imagenes_con_alta_coincidencia: 0
  };

  let loading = true;
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
      await Promise.all([filtro_pixeles(), filtro_exif(), filtro_SSIM()]);
    } catch (err) {
      error = "Error al cargar los datos de análisis";
      console.error(err);
    } finally {
      loading = false;
    }
  }

  async function filtro_exif() {
    try {
      const uploadedImage = sessionStorage.getItem("uploadedImage");
      if (!uploadedImage) {
        console.error("❌ No hay imagen en sessionStorage");
        return;
      }

      // Mejorar la conversión base64 a blob
      const base64Data = uploadedImage.split(",")[1];
      const mimeType = uploadedImage.split(",")[0].split(":")[1].split(";")[0]; // Extraer MIME type correcto

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType }); // Usar MIME type correcto

      console.log("📁 Blob creado:", {
        size: blob.size,
        type: blob.type,
      });

      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_exif`, {
        method: "POST",
        body: formData,
        headers: {}, // No añadir Content-Type manualmente con FormData
      });

      console.log("🌐 Response status:", apiResponse.status);

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("📊 Datos filtro EXIF completos:", data);

        filtroExif = {
          archivo: data.archivo || "Sin nombre",
          mensaje: data.mensaje || "Análisis completado",
          editado: data.editado || false,
          tiene_gps: data.tiene_gps || false,
          info_imagen: data.info_imagen || {},
          exif: data.exif || {},
        };
      } else {
        // Mejorar el manejo de errores
        const contentType = apiResponse.headers.get("content-type");
        let errorDetail = "Error desconocido";

        if (contentType && contentType.includes("application/json")) {
          const errorData = await apiResponse.json();
          errorDetail =
            errorData.detail || errorData.message || "Error en el servidor";
        } else {
          errorDetail = await apiResponse.text();
        }

        console.error("💥 API Error filtro EXIF:", {
          status: apiResponse.status,
          detail: errorDetail,
        });

        // Establecer valores por defecto más informativos
        filtroExif = {
          archivo: "image.jpg",
          mensaje: `❌ Error ${apiResponse.status}: ${errorDetail}`,
          editado: false,
          tiene_gps: false,
          info_imagen: {},
          exif: {},
        };
      }
    } catch (err) {
      console.error("💥 Error en filtro_exif:", err);
      filtroExif = {
        archivo: "image.jpg",
        mensaje: `❌ Error de conexión: ${err.message}`,
        editado: false,
        tiene_gps: false,
        info_imagen: {},
        exif: {},
      };
    }
  }

  async function filtro_SSIM() {
    try {
      const uploadedImage = sessionStorage.getItem("uploadedImage");
      if (!uploadedImage) {
        console.error("❌ No hay imagen en sessionStorage");
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

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_ssim`, {
        method: "POST",
        body: formData
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        filtroSSIM = {
          promedio_similitud: data.promedio_similitud,
          imagenes_comparadas: data.imagenes_comparadas,
          imagenes_con_alta_coincidencia: data.imagenes_con_alta_coincidencia
        };
      } else {
        console.error("💥 API Error filtro SSIM:", await apiResponse.text());
      }
    } catch (err) {
      console.error("💥 Error en filtro_SSIM:", err);
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
        headers: {},
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("📊 Datos filtro pixeles:", data);
        filtroPixeles = {
          porcentaje: data.porcentaje ?? filtroPixeles.porcentaje,
          coincidencias: data.coincidencias ?? filtroPixeles.coincidencias,
          nombre: data.plantilla ?? filtroPixeles.nombre,
        };
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

  function formatearExif(exifData) {
    const formatosImportantes = [
      "Make",
      "Model",
      "Software",
      "DateTimeOriginal",
    ];
    return Object.entries(exifData)
      .filter(([key]) => formatosImportantes.includes(key))
      .slice(0, 4);
  }
</script>

<div class="flex h-full flex-col gap-6 py-4">
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
    <!-- Contenedor principal con diseño vertical -->
    <div class="flex flex-col items-center gap-5 w-full max-w-4xl mx-auto">
      <!-- Gráfico de filtro de píxeles -->
      <div class="flex justify-around w-full">
        <div>
          <Graphics
            color1="#FC7656"
            color2="#FCC656"
            porcentaje={filtroSSIM.promedio_similitud}
            titulo={"Filtro SSIM"}
          />
          <p class="text-white/75 mt-2 text-sm">
            {filtroSSIM.imagenes_comparadas} Imagenes comparadas
          </p>
          <p class="text-white/75 mt-2 text-sm">
            {filtroSSIM.imagenes_con_alta_coincidencia} Con alta coincidencia
          </p>
        </div>
        <div>
          <Graphics
            color1="#4c56af"
            color2="#af4ca8"
            porcentaje={filtroPixeles.porcentaje}
            titulo={filtroPixeles.nombre}
          />
          <p class="text-white/75 mt-2 text-sm">
            {filtroPixeles.coincidencias} Coincidencias
          </p>
        </div>
      </div>

      <!-- Información del filtro EXIF organizada en tarjetas -->
      <div class="w-full max-w-3xl">
        <h2
          class="text-white font-bold text-xl mb-4 text-center flex items-center justify-start gap-2"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            />
          </svg>
          Análisis de Metadatos
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Tarjeta de Estado -->
          <div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3
              class="text-white/75 font-semibold mb-3 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
              Estado de la Imagen
            </h3>

            <div class="space-y-3">
              <div class="flex items-center gap-3">
                {#if filtroExif.editado}
                  <span class="w-3 h-3 bg-red-400 rounded-full"></span>
                  <span class="text-red-300 text-sm"
                    >Imagen editada detectada</span
                  >
                {:else}
                  <span class="w-3 h-3 bg-green-400 rounded-full"></span>
                  <span class="text-green-300 text-sm"
                    >Sin edición detectada</span
                  >
                {/if}
              </div>

              <div class="flex items-center gap-3">
                {#if filtroExif.tiene_gps}
                  <span class="w-3 h-3 bg-blue-400 rounded-full"></span>
                  <span class="text-blue-300 text-sm"
                    >Contiene ubicación GPS</span
                  >
                {:else}
                  <span class="w-3 h-3 bg-gray-400 rounded-full"></span>
                  <span class="text-gray-300 text-sm">Sin ubicación GPS</span>
                {/if}
              </div>
            </div>
          </div>

          <!-- Tarjeta de Información Básica -->
          <div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3
              class="text-white/75 font-semibold mb-3 flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
              Información Básica
            </h3>

            <div class="space-y-2 text-white/70 text-sm">
              {#if filtroExif.info_imagen?.format}
                <div class="flex justify-between">
                  <span class="font-medium">Formato:</span>
                  <span>{filtroExif.info_imagen.format}</span>
                </div>
              {/if}
              {#if filtroExif.info_imagen?.width && filtroExif.info_imagen?.height}
                <div class="flex justify-between">
                  <span class="font-medium">Dimensiones:</span>
                  <span
                    >{filtroExif.info_imagen.width} × {filtroExif.info_imagen
                      .height}</span
                  >
                </div>
              {/if}
              {#if filtroExif.info_imagen?.mode}
                <div class="flex justify-between">
                  <span class="font-medium">Modo:</span>
                  <span>{filtroExif.info_imagen.mode}</span>
                </div>
              {/if}
              {#if filtroExif.archivo}
                <div class="flex justify-between">
                  <span class="font-medium">Archivo:</span>
                  <span
                    class="truncate max-w-[100px]"
                    title={filtroExif.archivo}>{filtroExif.archivo}</span
                  >
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Sección de Metadatos EXIF (ancho completo si hay datos) -->
        {#if Object.keys(filtroExif.exif).length > 0}
          <div class="mt-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fill-rule="evenodd"
                  d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clip-rule="evenodd"
                />
              </svg>
              Metadatos de Cámara
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#each formatearExif(filtroExif.exif) as [key, value]}
                <div class="bg-white/5 p-3 rounded">
                  <div
                    class="text-white/60 text-xs uppercase tracking-wide mb-1"
                  >
                    {key}
                  </div>
                  <div class="text-white text-sm font-medium" title={value}>
                    {value.length > 30 ? value.substring(0, 30) + "..." : value}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Sección de Coordenadas GPS (si existen) -->
        {#if filtroExif.exif?.GPS}
          <div class="mt-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clip-rule="evenodd"
                />
              </svg>
              Ubicación GPS
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-white/5 p-3 rounded">
                <div class="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Latitud
                </div>
                <div class="text-white text-sm font-medium">
                  {filtroExif.exif.GPS.latitud}°
                </div>
              </div>
              <div class="bg-white/5 p-3 rounded">
                <div class="text-white/60 text-xs uppercase tracking-wide mb-1">
                  Longitud
                </div>
                <div class="text-white text-sm font-medium">
                  {filtroExif.exif.GPS.longitud}°
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Mensaje del análisis -->
        <div class="mt-4 bg-white/5 p-4 rounded-lg border-l-4 border-blue-400">
          <div class="text-white/60 text-xs uppercase tracking-wide mb-1">
            Resultado del Análisis
          </div>
          <div class="text-white/80 text-sm">
            {filtroExif.mensaje || "Sin datos EXIF disponibles"}
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
