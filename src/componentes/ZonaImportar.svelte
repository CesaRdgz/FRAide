<script lang="ts">
  import Icono from './Icono.svelte';
  import { app, type ResultadoImportacion } from '../estado/app.svelte';

  let { compacta = false }: { compacta?: boolean } = $props();

  let encima = $state(false);
  let resultados = $state<ResultadoImportacion[]>([]);
  let input: HTMLInputElement;

  export async function importar(archivos: File[]) {
    if (archivos.length === 0) return;
    resultados = await app.importarArchivos(archivos, (fecha) =>
      confirm(`Vas a sustituir TODO tu progreso actual por la copia${fecha ? ` del ${fecha}` : ''}. ¿Seguir?`),
    );
  }
</script>

<div
  class="zona"
  class:compacta
  class:encima
  role="region"
  aria-label="Importar lecciones"
  ondragover={(e) => {
    e.preventDefault();
    encima = true;
  }}
  ondragleave={() => (encima = false)}
  ondrop={(e) => {
    e.preventDefault();
    e.stopPropagation();
    encima = false;
    void importar([...(e.dataTransfer?.files ?? [])]);
  }}
>
  <Icono nombre="importar" tam="2rem" />
  <div>
    <strong>Arrastra aquí tus archivos .json</strong>
    <p class="tenue peq">Lecciones o una copia de tu progreso. Puedes soltar varios a la vez.</p>
  </div>
  <button class="btn" type="button" onclick={() => input.click()}>Elegir archivos</button>
  <input
    bind:this={input}
    class="oculto-v"
    type="file"
    accept=".json,application/json"
    multiple
    onchange={async () => {
      const archivos = [...(input.files ?? [])];
      input.value = '';
      await importar(archivos);
    }}
  />
</div>

{#if resultados.length}
  <ul class="resultados" aria-live="polite">
    {#each resultados as r, i (i)}
      <li class:mal={!r.ok}>
        <Icono nombre={r.ok ? 'check' : 'cruz'} tam="1.1rem" />
        <span><strong>{r.archivo}</strong> · {r.mensaje}</span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .zona {
    display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap;
    border: 2px dashed var(--borde); border-radius: var(--r-l); padding: 1.5rem;
    background: var(--papel); color: var(--primario); transition: border-color 0.15s, background 0.15s;
  }
  .zona > div { flex: 1; min-width: 14rem; color: var(--texto); }
  .zona p { margin: 0.2rem 0 0; }
  .zona.encima { border-color: var(--primario); background: var(--primario-suave); }
  .zona.compacta { padding: 1rem 1.2rem; }
  .resultados { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: 0.4rem; }
  .resultados li { display: flex; gap: 0.5rem; align-items: flex-start; color: var(--terciario); font-size: 0.92rem; }
  .resultados li span { color: var(--texto); }
  .resultados li.mal { color: var(--secundario); }
</style>
