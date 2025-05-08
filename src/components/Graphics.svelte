<script lang="ts">
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  let data = { porcentaje: 50 };
  export let size = 200;
  export let strokeWidth = 20;
  export let duration = 800;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Solo medio arco

  const animated = tweened(0, { duration, easing: cubicOut });

  $: if (data?.porcentaje !== undefined) {
    animated.set(Math.max(0, Math.min(100, data.porcentaje)));
  }

  $: dashOffset = circumference * (1 - $animated / 100);

  // Calcula el path para medio arco (de izquierda a derecha)
  function describeArc(cx: number, cy: number, r: number) {
    const start = {
      x: cx - r,
      y: cy,
    };
    const end = {
      x: cx + r,
      y: cy,
    };
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  }
</script>

<svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
  <!-- Fondo -->
  <path
    d={describeArc(size / 2, size / 2, radius)}
    stroke="#e0e0e0"
    stroke-width={strokeWidth}
    fill="none"
  />
  <!-- Arco animado -->
  <path
    d={describeArc(size / 2, size / 2, radius)}
    stroke="#4CAF50"
    stroke-width={strokeWidth}
    fill="none"
    stroke-dasharray={circumference}
    stroke-dashoffset={dashOffset}
    style="transition: stroke-dashoffset {duration}ms cubic-bezier(0.55, 0, 0.1, 1);"
  />
  <!-- Texto centrado -->
  <text
    x="50%"
    y="90%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-size="1.5em"
    fill="#333"
  >
    {#if $animated}<tspan>{$animated.toFixed(0)}%</tspan>{/if}
  </text>
</svg>

<style>
  svg {
    display: block;
    margin: auto;
  }
</style>
