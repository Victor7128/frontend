<script lang="ts">
  import { spring } from "svelte/motion";

  export let color1 = "#000";
  export let color2 = "#fff";
  export let porcentaje: number;
  export let size = 100;
  export let strokeWidth = 15;
  export let duration = 800;
  export let titulo: string;

  let radius = (size - strokeWidth) / 2;
  let circumference = 2 * Math.PI * radius;
  const outerRadius = radius + strokeWidth / 2 + 1; // +1px extra para el borde
  const borderWidth = 1;
  const innerBorderRadius = radius - strokeWidth / 2 - borderWidth / 2; // -1px extra para el borde

  const animated = spring(0, { stiffness: 0.15, damping: 0.4 });

  $: animated.set(Math.max(0, Math.min(100, porcentaje)));

  $: dashOffset = circumference * (1 - $animated / 100);

  const gradientId = `grad-${Math.random().toString(36).slice(2, 8)}`;

  function describeArc(cx: number, cy: number, r: number) {
    return `
    M ${cx} ${cy - r}
    A ${r} ${r} 0 1 1 ${cx} ${cy + r}
    A ${r} ${r} 0 1 1 ${cx} ${cy - r}
  `;
  }
</script>

<svg width={size} height={size} viewBox={`-2 -2 ${size + 4} ${size + 4}`}>
  <defs>
    <linearGradient id={gradientId}>
      <stop offset="0%" stop-color={color1} />
      <stop offset="100%" stop-color={color2} />
    </linearGradient>
  </defs>

  <!-- Fondo gris -->
  <path
    d={describeArc(size / 2, size / 2, outerRadius)}
    stroke="white"
    stroke-opacity="0.75"
    stroke-width="1"
    fill="none"
  />

  <!-- 2) Arco animado con gradiente -->
  <defs>
    <linearGradient id={gradientId}>
      <stop offset="0%" stop-color={color1} />
      <stop offset="100%" stop-color={color2} />
    </linearGradient>
  </defs>
  <path
    d={describeArc(size / 2, size / 2, radius)}
    stroke={`url(#${gradientId})`}
    stroke-width={strokeWidth}
    fill="none"
    stroke-linecap="round"
    stroke-dasharray={circumference}
    stroke-dashoffset={dashOffset}
    style={`transition: stroke-dashoffset ${duration}ms cubic-bezier(0.55,0,0.1,1);`}
  />

  <!-- 3) Borde interior -->
  <path
    d={describeArc(size / 2, size / 2, innerBorderRadius)}
    stroke="white"
    stroke-opacity="0.75"
    stroke-width={borderWidth}
    fill="none"
  />

  <!-- Arco animado -->
  <path
    d={describeArc(size / 2, size / 2, radius)}
    stroke={`url(#${gradientId})`}
    stroke-width={strokeWidth}
    fill="none"
    stroke-dasharray={circumference}
    stroke-dashoffset={dashOffset}
    style={`transition: stroke-dashoffset ${duration}ms cubic-bezier(0.55,0,0.1,1);`}
  />

  <!-- Texto central -->
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-size="1.3em"
    fill="#BFBFBF"
  >
    {#if $animated}
      <tspan class="text-base font-bold">{$animated.toFixed(2)}%</tspan>
    {/if}
  </text>
</svg>
<div class="text-center font-semibold text-white/75 pt-2">{titulo}</div>

<style>
  svg {
    display: block;
    margin: auto;
  }
</style>
