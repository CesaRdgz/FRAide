<script lang="ts">
  import type { Snippet } from 'svelte';
  let { titulo, texto, children }: { titulo: string; texto: string; children?: Snippet } = $props();
</script>

<div class="vacio tarjeta plana">
  <h2>{titulo}</h2>
  <p class="tenue">{texto}</p>
  {#if children}<div class="fila envuelve" style="justify-content:center">{@render children()}</div>{/if}
</div>

<style>
  .vacio { text-align: center; padding: 2.5rem 1.5rem; max-width: 34rem; margin: 2rem auto; }
  h2 { margin-bottom: 0.5rem; }
</style>
