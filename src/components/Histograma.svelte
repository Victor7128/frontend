<script>
  import { onMount } from "svelte";
  import Chart from "chart.js/auto";

  let chart;
  let canvas;
  let error = "";
  let cargando = true;
  let porcentajeHistograma = null;
  let similitud = null;
  let advertencia = null;

  const API_BASE_URL = "http://127.0.0.1:8000";

  async function loadData() {
    const uploadedImage = sessionStorage.getItem("uploadedImage");
    if (!uploadedImage) {
      error = "No hay imagen en sessionStorage";
      cargando = false;
      return { rojo: [], verde: [], azul: [] };
    }
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

      const apiResponse = await fetch(`${API_BASE_URL}/histograma`, {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(
          errorData.detail || "Error en el análisis de histograma",
        );
      }

      const result = await apiResponse.json();
      porcentajeHistograma = result.similitud
        ? parseFloat(result.similitud)
        : 0;
      advertencia = result.advertencia || null;
      sessionStorage.setItem(
        "porcentajeHistograma",
        porcentajeHistograma?.toString(),
      );
      window.dispatchEvent(new Event("filtrosActualizados"));

      return {
        rojo: result.r,
        verde: result.g,
        azul: result.b,
      };
    } catch (err) {
      error = "No se pudo cargar el histograma: " + err.message;
      porcentajeHistograma = null;
      advertencia = null;
      return { rojo: [], verde: [], azul: [] };
    } finally {
      cargando = false;
    }
  }

  function colorAdvertenciaHistograma(advertencia) {
    if (!advertencia) return "";
    if (/sospechoso/i.test(advertencia)) return "text-yellow-400";
    if (/alterad/i.test(advertencia)) return "text-orange-400";
    if (/aut[eé]ntic/i.test(advertencia)) return "text-green-400";
    return "text-gray-300";
  }

  onMount(async () => {
    const histograma = await loadData();
    if (
      histograma.rojo?.length &&
      histograma.verde?.length &&
      histograma.azul?.length &&
      canvas
    ) {
      chart = new Chart(canvas, {
        type: "bar",
        data: {
          labels: Array.from({ length: 256 }, (_, i) => i),
          datasets: [
            {
              label: "Rojo",
              data: histograma.rojo,
              backgroundColor: "rgba(255,99,132,0.6)",
              borderRadius: 4,
              barPercentage: 1.2,
              categoryPercentage: 1.0,
            },
            {
              label: "Verde",
              data: histograma.verde,
              backgroundColor: "rgba(75,192,192,0.6)",
              borderRadius: 4,
              barPercentage: 1.2,
              categoryPercentage: 1.0,
            },
            {
              label: "Azul",
              data: histograma.azul,
              backgroundColor: "rgba(54,162,235,0.6)",
              borderRadius: 4,
              barPercentage: 1.2,
              categoryPercentage: 1.0,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: "rgba(255,255,255,0.75)",
                font: {
                  size: 16,
                  weight: "bold",
                  family: "'Inter', sans-serif",
                },
              },
            },
            title: {
              display: true,
              text: "Histograma de Colores",
              color: "rgba(255,255,255,0.85)",
              font: { size: 24, weight: "bold", family: "'Inter', sans-serif" },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "rgba(255,255,255,0.75)",
                font: { family: "'Inter', sans-serif" },
              },
              grid: {
                color: "rgba(255,255,255,0.11)",
                lineWidth: 2,
                borderDash: [4, 2],
              },
            },
            y: {
              ticks: {
                color: "rgba(255,255,255,0.75)",
                font: { family: "'Inter', sans-serif" },
              },
              grid: {
                color: "rgba(255,255,255,0.11)",
                lineWidth: 2,
                borderDash: [4, 2],
              },
            },
          },
        },
      });
    } else {
      error = "El histograma llegó vacío o con error.";
    }
    return () => chart && chart.destroy();
  });
</script>

<div
  class="w-full h-auto mx-auto text-white/75 bg-white/10 p-4 rounded-lg backdrop-blur-sm"
>
  {#if cargando}
    <p class="text-center font-bold mb-2">Cargando histograma...</p>
  {:else if error}
    <p class="text-center font-bold text-red-200">{error}</p>
  {/if}

  <canvas bind:this={canvas} class="w-full bg-transparent text-white/75"
  ></canvas>

  {#if porcentajeHistograma !== null}
    <div class="w-full mb-2 text-center">
      <span
        class="inline-block font-bold text-2xl text-white/75 rounded px-3 py-1"
      >
        Similitud: {porcentajeHistograma}%
      </span>
    </div>
    {#if advertencia}
      <div class="w-full mb-3 text-center">
        <span
          class={`inline-block font-bold text-sm rounded px-3 py-1 ${colorAdvertenciaHistograma(advertencia)}`}
        >
          {advertencia}
        </span>
      </div>
    {/if}
  {/if}
</div>
