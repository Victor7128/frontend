<script>
    import { onMount } from "svelte";

    const API_BASE_URL = "http://127.0.0.1:8000";

    let isLoading = false;
    let result = null;
    let error = null;

    // Variable reactiva para verificar si hay imagen disponible
    $: hasImage =
        typeof window !== "undefined" &&
        sessionStorage?.getItem("uploadedImage") != null;

    // Función para convertir base64 a blob
    async function base64ToBlob(base64String) {
        const response = await fetch(base64String);
        return response.blob();
    }

    // Función para procesar imagen automáticamente
    async function processImage() {
        const uploadedImage = sessionStorage.getItem("uploadedImage");
        if (!uploadedImage) {
            console.warn("⚠️ No hay imagen disponible para análisis de logo");
            return;
        }

        isLoading = true;
        error = null;
        result = null;

        try {
            const blob = await base64ToBlob(uploadedImage);
            const formData = new FormData();
            formData.append("file", blob, "logo_image.jpg");
            const controller = new AbortController();

            const apiResponse = await fetch(`${API_BASE_URL}/logo`, {
                method: "POST",
                body: formData,
                signal: controller.signal,
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse
                    .json()
                    .catch(() => ({ detail: "Error desconocido" }));
                throw new Error(
                    errorData.detail || `Error HTTP ${apiResponse.status}`,
                );
            }
            result = await apiResponse.json();
        } catch (err) {
            console.error("💥 Error en análisis de logo:", err);
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    // Función para obtener el color basado en el porcentaje
    function getPercentageColor(percentage) {
        if (percentage <= 15) return "text-green-400";
        if (percentage <= 30) return "text-yellow-400";
        if (percentage <= 50) return "text-orange-400";
        return "text-red-400";
    }

    // Función para obtener el color de fondo del círculo
    function getPercentageBgColor(percentage) {
        if (percentage <= 15) return "border-green-400/50 bg-green-500/10";
        if (percentage <= 30) return "border-yellow-400/50 bg-yellow-500/10";
        if (percentage <= 50) return "border-orange-400/50 bg-orange-500/10";
        return "border-red-400/50 bg-red-500/10";
    }

    // Función para obtener mensaje de estado
    function getStatusMessage(percentage) {
        if (percentage <= 15) return "Logo en posición correcta";
        if (percentage <= 30) return "Ligera desviación del logo";
        if (percentage <= 50) return "Desviación moderada del logo";
        return "Logo fuera de posición";
    }

    // Ejecutar automáticamente cuando hay imagen
    $: if (hasImage && !isLoading && !result && !error) {
        processImage();
    }

    // Limpiar resultados cuando cambia la imagen
    $: if (!hasImage) {
        result = null;
        error = null;
    }
</script>

<div class="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
    <div class="flex items-center justify-between mb-2">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                Análisis de Logo
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

    {#if hasImage && result}
        <div class="space-y-6">
            {#if result.logo_detectado}
                <div class="flex items-center justify-between gap-6">
                    <!-- Lado izquierdo: Círculo y mensaje -->
                    <div class="flex flex-col items-center">
                        <div
                            class="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 {getPercentageBgColor(
                                result.porcentaje_cambio_minimo,
                            )} mb-3"
                        >
                            <div class="text-center">
                                <div
                                    class="text-2xl font-bold {getPercentageColor(
                                        result.porcentaje_cambio_minimo,
                                    )}"
                                >
                                    {result.porcentaje_cambio_minimo}%
                                </div>
                                <div class="text-xs text-white/75 mt-1">
                                    Desviación
                                </div>
                            </div>
                        </div>
                        <p class="text-white/75 text-sm text-center">
                            {getStatusMessage(result.porcentaje_cambio_minimo)}
                        </p>
                    </div>

                    <!-- Lado derecho: Información adicional compacta -->
                    <div class="bg-white/5 rounded-lg p-3 flex-1 max-w-xs">
                        <div class="text-sm text-white/60 mb-3">
                            Plantilla: <span class="text-white font-medium"
                                >{result.mejor_coincidencia.plantilla}</span
                            >
                        </div>

                        {#if result.mejor_coincidencia.detalles}
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                {#each Object.entries(result.mejor_coincidencia.detalles) as [lado, detalle]}
                                    <div
                                        class="bg-white/10 rounded p-2 text-center"
                                    >
                                        <div class="text-white/60 mb-1 text-xs">
                                            {lado}
                                        </div>
                                        <div class="text-white font-medium">
                                            {Math.abs(
                                                detalle.cambio_porcentaje,
                                            )}%
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            {:else}
                <!-- Logo no detectado -->
                <div class="text-center">
                    <div
                        class="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-red-400/50 bg-red-500/10 mb-3"
                    >
                        <svg
                            class="w-10 h-10 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h3 class="text-red-400 font-medium mb-2">
                        Logo No Detectado
                    </h3>
                    <p class="text-white/60 text-sm">
                        No se pudo encontrar el logo en la imagen
                    </p>
                </div>
            {/if}
        </div>
    {:else if hasImage && isLoading}
        <!-- Estado de carga -->
        <div class="text-center py-8">
            <div
                class="w-12 h-12 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            ></div>
            <h3 class="text-gray-400 text-lg font-medium mb-2">
                Analizando logo...
            </h3>
            <p class="text-gray-500 text-sm">
                Procesando imagen y comparando con plantillas
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
                Sube una imagen para que se analice automáticamente
            </p>
        </div>
    {/if}
</div>
