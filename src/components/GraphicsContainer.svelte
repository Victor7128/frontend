<script>
  import { onMount } from "svelte";
  import Graphics from "./Graphics.svelte";

  let filtroFuente = { porcentaje: 0, nombre: "" };
  let transferenciaEstilo = {
    porcentaje: 15,
    nombre: "Transferencia de Estilo",
  };
  let otroFiltro = { porcentaje: 30, nombre: "Otro Filtro" };

  let loading = true;
  let error = null;

  const API_BASE_URL = "https://backend-qab1.onrender.com";

  onMount(async () => {
    console.log("🚀 GraphicsContainer montado, iniciando carga...");
    await cargarDatos();
  });

  async function cargarDatos() {
    try {
      loading = true;
      error = null;
      console.log("📡 Iniciando carga de datos...");

      const token = localStorage.getItem("access_token");
      if (!token) {
        console.log("❌ No hay token, redirigiendo...");
        window.location.href = "/";
        return;
      }

      console.log("✅ Token encontrado, ejecutando análisis...");
      await Promise.all([filtro_fuente()]);
      console.log("🎉 Análisis completado!");
    } catch (err) {
      error = "Error al cargar los datos de análisis";
      console.error("💥 Error en cargarDatos:", err);
    } finally {
      loading = false;
      console.log("⏹️ Carga finalizada, loading =", loading);
    }
  }

  async function filtro_fuente() {
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

      const apiResponse = await fetch(`${API_BASE_URL}/filtro_fuente`, {
        method: "POST",
        body: formData,
        headers: {
        },
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("📊 Datos del backend:", data);
        const nuevoFiltroFuente = {
          porcentaje: data.porcentaje || 0,
          nombre: data.nombre || "Filtro de Fuente",
        };

        filtroFuente = nuevoFiltroFuente;
      } else {
        const errorText = await apiResponse.text();
        try {
          const errorData = JSON.parse(errorText);
          console.log("💥 Detalle del error:", errorData.detail);
        } catch {
          console.log("💥 Error no JSON:", errorText);
        }
      }
    } catch (err) {
      console.error("💥 Error en filtro_fuente:", err);
    }
  }

  // Función para recargar todos los análisis
  async function recargarAnalisis() {
    await cargarDatos();
  }
</script>

<div class="flex h-full flex-col justify-between items-center gap-4 py-2">
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
    <Graphics
      color1="#4c56af"
      color2="#af4ca8"
      porcentaje={filtroFuente.porcentaje}
      titulo={filtroFuente.nombre}
    />
    <Graphics
      color1="#52EBBA"
      color2="#52B7EB"
      porcentaje={transferenciaEstilo.porcentaje}
      titulo={transferenciaEstilo.nombre}
    />
    <Graphics
      color1="#EB6C52"
      color2="#EBC952"
      porcentaje={otroFiltro.porcentaje}
      titulo={otroFiltro.nombre}
    />
  {/if}
</div>
