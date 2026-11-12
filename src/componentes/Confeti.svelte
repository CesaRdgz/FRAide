<script lang="ts">
  // Lluvia corta de papelitos con los colores del cuaderno (solo decorativa).
  const COLORES = ['#243b7a', '#b0473d', '#3e7a5b', '#cc7a1f', '#6b4a8a'];
  const piezas = Array.from({ length: 70 }, (_, i) => ({
    x: Math.random() * 100,
    retraso: Math.random() * 0.6,
    duracion: 1.8 + Math.random() * 1.4,
    giro: Math.random() * 720 - 360,
    color: COLORES[i % COLORES.length],
    ancho: 6 + Math.random() * 6,
  }));
</script>

<div class="confeti" aria-hidden="true">
  {#each piezas as p, i (i)}
    <span
      style:left="{p.x}%"
      style:background={p.color}
      style:width="{p.ancho}px"
      style:animation-delay="{p.retraso}s"
      style:animation-duration="{p.duracion}s"
      style:--giro="{p.giro}deg"
    ></span>
  {/each}
</div>

<style>
  .confeti { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 50; }
  span { position: absolute; top: -20px; height: 12px; border-radius: 2px; animation: caer linear forwards; }
  @keyframes caer {
    to { transform: translateY(105vh) rotate(var(--giro)); opacity: 0.6; }
  }
</style>
