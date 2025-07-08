<script>
  import InfoOcr from "../components/Info_ocr.svelte";
  import { onMount } from "svelte";
  let promedioFinal = 0;
  let mensajeVeracidad = "";

  function cargarPromedio() {
    promedioFinal = parseFloat(sessionStorage.getItem("promedioFinal")) || 0;
    actualizarMensajeVeracidad();
  }

  function actualizarMensajeVeracidad() {
    if (promedioFinal >= 95) {
      mensajeVeracidad =
        "✅ El comprobante parece auténtico. No se detectan inconsistencias significativas.";
    } else if (promedioFinal >= 90) {
      mensajeVeracidad =
        "⚠️ El comprobante presenta ligeras inconsistencias. Se recomienda validar manualmente la información. Motivo de alerta: ";
    } else {
      mensajeVeracidad =
        "❌ El comprobante presenta inconsistencias importantes. No se recomienda confiar en su veracidad. Motivo de alerta: ";
    }
  }

  onMount(() => {
    cargarPromedio();
    window.addEventListener("filtrosActualizados", cargarPromedio);
    return () => {
      window.removeEventListener("filtrosActualizados", cargarPromedio);
    };
  });
</script>

<div class="text-white/75 max-w-sm bg-white/10 p-3 rounded-lg backdrop-blur-sm">
  <h2 class="text-lg font-bold">Recomendación</h2>
  <p>{mensajeVeracidad}</p>
  <InfoOcr />
</div>
