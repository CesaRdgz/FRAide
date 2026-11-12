<script lang="ts">
  import { app } from '../estado/app.svelte';
  import { TAMANOS_TEXTO } from '../lib/tipos';
</script>

<div class="selector" role="radiogroup" aria-label="Tamaño de la letra">
  {#each TAMANOS_TEXTO as [valor, nombre] (valor)}
    {@const elegido = Math.abs(app.ajustes.tamanoTexto - valor) < 0.01}
    <button type="button" role="radio" aria-checked={elegido} class:elegido onclick={() => app.guardarAjustes({ tamanoTexto: valor })}>
      <span class="aa fr" style:font-size="{1.1 * valor}rem">Aa</span>
      <span class="peq">{nombre}</span>
    </button>
  {/each}
</div>

<style>
  .selector { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
  button {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; min-height: 4.6rem;
    border-radius: var(--r-m); border: 1px solid var(--borde); background: var(--papel); cursor: pointer; padding: 0.4rem;
  }
  button.elegido { border: 2px solid var(--primario); background: var(--primario-suave); color: var(--sobre-primario-suave); }
  .aa { line-height: 1; }
</style>
