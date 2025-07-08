<script>
    import { onMount } from "svelte";
    let error = null;
    let porcentajes = {
        ocr: 0,
        pixeles: 0,
        ruido: 0,
        histograma: 0,
    };
    let promedioFinal = 0;
    let hasImage = false;
    let allReady = false;

    // Nuevo: contador de advertencias
    let advertenciasCount = 0;

    onMount(() => {
        checkForImage();
        cargarPorcentajes();
        cargarAdvertencias();
    });

    function cargarPorcentajes() {
        const ocr = parseFloat(sessionStorage.getItem("porcentajeOCR")) || 0;
        const pixeles =
            parseFloat(sessionStorage.getItem("porcentajePixeles")) || 0;
        const ruido =
            parseFloat(sessionStorage.getItem("porcentajeRuido")) || 0;
        const histograma =
            parseFloat(sessionStorage.getItem("porcentajeHistograma")) || 0;

        porcentajes = { ocr, pixeles, ruido, histograma };
        allReady = pixeles > 0 && ruido > 0 && histograma > 0;

        const valores = [pixeles, ruido, histograma, ocr].filter((v) => v > 0);
        if (valores.length > 0) {
            let promedio =
                Math.round(
                    (valores.reduce((a, b) => a + b, 0) / valores.length) * 100,
                ) / 100;
            // Restar 10 por cada advertencia
            promedio -= 10 * advertenciasCount;
            if (promedio < 0) promedio = 0;
            promedioFinal = Math.round(promedio * 100) / 100;
            sessionStorage.setItem("promedioFinal", promedioFinal.toString());
        } else {
            promedioFinal = 0;
        }
    }

    function cargarAdvertencias() {
        let advCount = 0;
        if (typeof window !== "undefined") {
            advCount = parseInt(sessionStorage.getItem("advertencias_ocr")) || 0;
        }
        advertenciasCount = advCount;
    }

    async function checkForImage() {
        const uploadedImage = sessionStorage.getItem("uploadedImage");
        hasImage = !!uploadedImage;
        if (hasImage) {
            cargarAdvertencias();
            cargarPorcentajes();
        }
    }

    async function handleStorageChange() {
        await checkForImage();
        cargarAdvertencias();
        cargarPorcentajes();
    }

    onMount(() => {
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("imageUploaded", handleStorageChange);
        window.addEventListener("filtrosActualizados", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("imageUploaded", handleStorageChange);
            window.removeEventListener(
                "filtrosActualizados",
                handleStorageChange,
            );
        };
    });

    function getPercentageColor(percentage) {
        if (percentage >= 95) return "text-green-400";
        if (percentage >= 90) return "text-orange-400";
        return "text-red-400";
    }

    function getPercentageBgColor(percentage) {
        if (percentage >= 95) return "bg-green-500/20 border-green-500/30";
        if (percentage >= 90) return "bg-orange-500/20 border-orange-500/30";
        return "bg-red-500/20 border-red-500/30";
    }

    function getMensajeVeracidad(percentage) {
        if (percentage >= 95) {
            return {
                text: "Comprobante auténtico",
                class: "text-green-400",
            };
        } else if (percentage >= 90) {
            return {
                text: "Comprobante sospechoso",
                class: "text-orange-400",
            };
        } else {
            return {
                text: "Comprobante alterado",
                class: "text-red-400",
            };
        }
    }
</script>

<div class="bg-white/10 p-3 rounded-lg backdrop-blur-sm h-full">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <svg
                    class="w-6 h-6 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                </svg>
                Resultado Final
            </h2>
        </div>
    </div>

    {#if error}
        <div
            class="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3"
        >
            <svg
                class="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <div>
                <h3 class="text-red-400 font-medium">Error en el análisis</h3>
                <p class="text-red-300/80 text-sm">{error}</p>
            </div>
        </div>
    {/if}

    {#if hasImage && allReady}
        <div class="space-y-6">
            <div class="text-center">
                <div
                    class="inline-flex items-center justify-center w-36 h-36 rounded-full border-4 {getPercentageBgColor(
                        promedioFinal,
                    )} mb-4"
                >
                    <div class="text-center">
                        <div
                            class="text-4xl font-bold {getPercentageColor(
                                promedioFinal,
                            )}"
                        >
                            {promedioFinal}%
                        </div>
                        <div class="text-xs text-white/75 mt-1">Promedio</div>
                    </div>
                </div>
                <div class="flex justify-center">
                    {#if promedioFinal > 0}
                        {#key promedioFinal}
                            {@const mensaje =
                                getMensajeVeracidad(promedioFinal)}
                            <div
                                class={`px-4 py-2 font-semibold text-base ${mensaje.class}`}
                            >
                                {mensaje.text}
                            </div>
                        {/key}
                    {/if}
                </div>
            </div>
        </div>
    {:else if hasImage}
        <!-- Estado de carga/esperando resultados -->
        <div class="text-center py-8">
            <div
                class="w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            ></div>
            <h3 class="text-gray-400 text-lg font-medium mb-2">
                Procesando análisis...
            </h3>
            <p class="text-gray-500 text-sm">
                Esperando resultados de los filtros
            </p>
        </div>
    {:else}
        <!-- Estado sin imagen -->
        <div class="text-center py-8">
            <svg
                class="w-16 h-16 text-gray-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
            </svg>
            <h3 class="text-gray-400 text-lg font-medium mb-2">
                Sin imagen para analizar
            </h3>
            <p class="text-gray-500 text-sm">
                Sube una imagen de Yape para que se analice automáticamente
            </p>
        </div>
    {/if}
</div>