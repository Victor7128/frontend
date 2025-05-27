<script>
  import { onMount } from "svelte";
  import Graphics from "./Graphics.svelte";

  let filtroFuente = {
    porcentaje: 0,
    coincidencias: 0,
    nombre: "Filtro de Fuente",
  };

  let transferenciaEstilo = {
    porcentaje: 5,
    coincidencias: 0,
    nombre: "Transferencia de Estilo",
  };

  let otroFiltro = { porcentaje: 5, coincidencias: 0, nombre: "Otro Filtro" };

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
      await filtro_fuente();
    } catch (err) {
      error = "Error al cargar los datos de análisis";
      console.error(err);
    } finally {
      loading = false;
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
        headers: {},
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log("📊 Datos recibidos:", data);
        filtroFuente = {
          porcentaje: data.porcentaje ?? filtroFuente.porcentaje,
          coincidencias: data.coincidencias ?? filtroFuente.coincidencias,
          nombre: data.plantilla ?? filtroFuente.nombre,
        };
      } else {
        const text = await apiResponse.text();
        console.error("💥 API Error:", text);
      }
    } catch (err) {
      console.error("💥 Error en filtro_fuente:", err);
    }
  }

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
    <div class="w-full h-full flex justify-around items-center">
      <div class="overflow-hidden">
        <Graphics
          color1="#4c56af"
          color2="#af4ca8"
          porcentaje={filtroFuente.porcentaje}
          titulo={filtroFuente.nombre}
        />
        <p class="text-white/75">{filtroFuente.coincidencias} coincidencias</p>
      </div>
    </div>
  {/if}
</div>
