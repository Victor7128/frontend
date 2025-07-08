<script>
    import { onMount } from "svelte";
    let filtroExif = {
        archivo: "",
        mensaje: "",
        editado: false,
        tiene_gps: false,
        info_imagen: {},
        exif: {},
        advertencia_formato: "", // Agregado
    };

    const API_BASE_URL = "http://127.0.0.1:8000";

    onMount(async () => {
        await filtro_exif();
    });

    async function filtro_exif() {
        try {
            const uploadedImage = sessionStorage.getItem("uploadedImage");
            if (!uploadedImage) {
                console.error("❌ No hay imagen en sessionStorage");
                return;
            }

            const base64Data = uploadedImage.split(",")[1];
            const mimeType = uploadedImage
                .split(",")[0]
                .split(":")[1]
                .split(";")[0];

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            const formData = new FormData();
            formData.append("file", blob, "image.jpg");

            const apiResponse = await fetch(`${API_BASE_URL}/filtro_exif`, {
                method: "POST",
                body: formData,
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                filtroExif = {
                    archivo: data.archivo || "Sin nombre",
                    mensaje: data.mensaje || "Análisis completado",
                    editado: data.editado || false,
                    tiene_gps: data.tiene_gps || false,
                    info_imagen: data.info_imagen || {},
                    exif: data.exif || {},
                    advertencia_formato: data.advertencia_formato || "", // Agregado
                };
            } else {
                const contentType = apiResponse.headers.get("content-type");
                let errorDetail = "Error desconocido";

                if (contentType && contentType.includes("application/json")) {
                    const errorData = await apiResponse.json();
                    errorDetail =
                        errorData.detail ||
                        errorData.message ||
                        "Error en el servidor";
                } else {
                    errorDetail = await apiResponse.text();
                }

                console.error("💥 API Error filtro EXIF:", {
                    status: apiResponse.status,
                    detail: errorDetail,
                });

                filtroExif = {
                    archivo: "image.jpg",
                    mensaje: `❌ Error ${apiResponse.status}: ${errorDetail}`,
                    editado: false,
                    tiene_gps: false,
                    info_imagen: {},
                    exif: {},
                    advertencia_formato: "",
                };
            }
        } catch (err) {
            filtroExif = {
                archivo: "image.jpg",
                mensaje: `❌ Error de conexión: ${err.message}`,
                editado: false,
                tiene_gps: false,
                info_imagen: {},
                exif: {},
                advertencia_formato: "",
            };
        }
    }
</script>

<div class="w-full mx-auto">
    <!-- Advertencia de formato solo si existe -->
    {#if filtroExif.advertencia_formato}
        <div class="mb-4 px-4 py-3 rounded bg-yellow-200/80 text-yellow-900 border-l-4 border-yellow-500 text-sm flex items-center gap-2">
            <svg class="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.366-.446.957-.538 1.403-.172.049.04.094.085.133.134l6.857 8.486c.329.407.261 1.012-.146 1.341-.049.04-.094.085-.133.134l-6.857 8.486c-.366.446-.957.538-1.403.172a1 1 0 01-.133-.134l-6.857-8.486a1 1 0 01.146-1.341c.049-.04.094-.085.133-.134l6.857-8.486zM11 12a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v2a1 1 0 01-1 1z" clip-rule="evenodd" />
            </svg>
            <span>{filtroExif.advertencia_formato}</span>
        </div>
    {/if}

    <div class="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
        <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                />
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Información Básica</h3>
        </div>
        <ul class="space-y-4 text-gray-700 dark:text-gray-300 text-base">
            {#if filtroExif.info_imagen?.format}
                <li class="border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div class="font-medium mb-1">Formato: {filtroExif.info_imagen.format}</div>
                </li>
            {/if}
            {#if filtroExif.info_imagen?.width && filtroExif.info_imagen?.height}
                <li class="border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div class="font-medium mb-1">Dimensiones: {filtroExif.info_imagen.width} × {filtroExif.info_imagen.height}</div>
                </li>
            {/if}
            {#if filtroExif.info_imagen?.mode}
                <li class="border-gray-100 dark:border-gray-800 pb-3">
                    <div class="font-medium mb-1">Modo: {filtroExif.info_imagen.mode}</div>
                </li>
            {/if}
        </ul>
    </div>
</div>