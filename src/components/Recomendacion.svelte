<script>
	import Recomendacion from './Recomendacion.svelte';
  import { onMount } from "svelte";
  let promedioFinal = 0;
  let mensajeVeracidad = "";

  function cargarPromedio() {
    promedioFinal = parseFloat(sessionStorage.getItem("promedioFinal")) || 0;
    actualizarMensajeVeracidad();
  }

  function actualizarMensajeVeracidad() {
    if (promedioFinal > 95) {
      mensajeVeracidad = "✅ Imagen muy probablemente auténtica. Puedes confiar en su veracidad.";
    } else if (promedioFinal > 90) {
      mensajeVeracidad = "⚠️ La imagen es mayormente confiable, pero existen algunos indicadores sospechosos. Revisa cuidadosamente.";
    } else if (promedioFinal > 85) {
      mensajeVeracidad = "❌ La imagen tiene varios indicadores de falsedad. Ten precaución antes de confiar.";
    } else {
      mensajeVeracidad = "❌ Imagen muy probablemente falsa. No confíes en su veracidad.";
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
</div>