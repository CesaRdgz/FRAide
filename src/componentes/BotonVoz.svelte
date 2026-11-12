<script lang="ts">
  import Icono from './Icono.svelte';
  import { voz } from '../estado/voz.svelte';

  let { texto, tam = '1.25rem', lento = false }: { texto: string; tam?: string; lento?: boolean } = $props();
</script>

{#if voz.disponible}
  <button
    class="btn-icono"
    type="button"
    title="Escuchar"
    aria-label="Escuchar «{texto}»"
    onclick={(e) => {
      e.stopPropagation();
      voz.hablar(texto, lento);
    }}
  >
    <Icono nombre="altavoz" {tam} />
  </button>
{/if}
