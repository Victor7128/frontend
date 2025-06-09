<script>
    import { onMount } from "svelte";

    // Estado reactivo
    let loading = false;
    let error = null;
    let porcentajes = {
        ssim: 0,
        pixeles: 0,
        ruido: 0,
    };
    let promedioFinal = 0;
    let hasImage = false;

    // Verificar si hay imagen en sessionStorage al montar el componente
    onMount(() => {
        checkForImage();
        cargarPorcentajes();
    });

    // Función para cargar los porcentajes desde sessionStorage
    function cargarPorcentajes() {
        const porcentajesGuardados =
            sessionStorage.getItem("filtrosPorcentajes");
        if (porcentajesGuardados) {
            try {
                const datos = JSON.parse(porcentajesGuardados);
                porcentajes = {
                    ssim: datos.ssim || 0,
                    pixeles: datos.pixeles || 0,
                    ruido: datos.ruido || 0,
                };

                // Calcular promedio
                promedioFinal =
                    Math.round(
                        ((porcentajes.ssim +
                            porcentajes.pixeles +
                            porcentajes.ruido) /
                            3) *
                            100,
                    ) / 100;
                // console.log(
                //     `${porcentajes.ssim} + ${porcentajes.pixeles} + ${porcentajes.ruido} = ${porcentajes.ssim + porcentajes.pixeles + porcentajes.ruido}`,
                // );
                // console.log(
                //     "Resultado de promediar porcentajes:",
                //     promedioFinal,
                // );
            } catch (error) {
                console.error("❌ Error al cargar porcentajes:", error);
            }
        }
    }

    // Función para verificar si hay imagen
    async function checkForImage() {
        const uploadedImage = sessionStorage.getItem("uploadedImage");
        hasImage = !!uploadedImage;

        // Si hay imagen, cargar porcentajes
        if (hasImage) {
            cargarPorcentajes();
        }
    }

    // Escuchar cambios en sessionStorage
    async function handleStorageChange() {
        await checkForImage();
        cargarPorcentajes();
    }

    // Listener para cambios en sessionStorage
    onMount(() => {
        window.addEventListener("storage", handleStorageChange);
        // También escuchar eventos personalizados para cambios en la misma pestaña
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

    // Función para obtener el color del porcentaje
    function getPercentageColor(percentage) {
        if (percentage >= 75) return "text-green-400";
        if (percentage >= 50) return "text-yellow-400";
        if (percentage >= 25) return "text-orange-400";
        return "text-red-400";
    }

    // Función para obtener el color de fondo del porcentaje
    function getPercentageBgColor(percentage) {
        if (percentage >= 75) return "bg-green-500/20 border-green-500/30";
        if (percentage >= 50) return "bg-yellow-500/20 border-yellow-500/30";
        if (percentage >= 25) return "bg-orange-500/20 border-orange-500/30";
        return "bg-red-500/20 border-red-500/30";
    }

    // Función para obtener mensaje de veracidad
    function getVeracityMessage(percentage) {
        if (percentage >= 80) return "✅ Imagen muy probablemente auténtica";
        if (percentage >= 60) return "✅ Imagen probablemente auténtica";
        if (percentage >= 40) return "⚠️ Algunos indicadores sospechosos";
        if (percentage >= 20) return "🔍 Alta probabilidad de manipulación";
        return "❌ Muy probable que sea falsa";
    }
</script>

<div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
    <!-- Header -->
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

    <!-- Error -->
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

    <!-- Resultados -->
    {#if hasImage && (porcentajes.ssim > 0 || porcentajes.pixeles > 0 || porcentajes.ruido > 0)}
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

                <p class="text-white/75">
                    {getVeracityMessage(promedioFinal)}
                </p>
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
