<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icono from './Icono.svelte';
  import { atras } from '../estado/ruta.svelte';

  let {
    titulo,
    subtitulo,
    volver = true,
    alVolver,
    acciones,
  }: { titulo: string; subtitulo?: string; volver?: boolean; alVolver?: () => void; acciones?: Snippet } = $props();
</script>

<header class="cabecera">
  {#if volver}
    <button class="btn-icono" type="button" aria-label="Volver" title="Volver (Esc)" onclick={() => (alVolver ? alVolver() : atras())}>
      <Icono nombre="atras" />
    </button>
  {/if}
  <div class="crece">
    <h1>{titulo}</h1>
    {#if subtitulo}<p class="tenue peq">{subtitulo}</p>{/if}
  </div>
  {#if acciones}<div class="fila">{@render acciones()}</div>{/if}
</header>

<style>
  .cabecera { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
  h1 { font-size: 1.6rem; }
  p { margin: 0.1rem 0 0; }
</style>
