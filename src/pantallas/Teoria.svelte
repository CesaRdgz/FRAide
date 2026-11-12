<script lang="ts">
  import BotonVoz from '../componentes/BotonVoz.svelte';
  import Cabecera from '../componentes/Cabecera.svelte';
  import { app } from '../estado/app.svelte';
  import { ir } from '../estado/ruta.svelte';
  import { markdown } from '../lib/markdown';
  import type { DatosVerbos } from '../lib/tipos';

  let { tiempo }: { tiempo: string } = $props();

  let datos = $state<DatosVerbos | null>(null);
  app.verbos().then((d) => (datos = d));
  const t = $derived(datos?.tiempos.find((x) => x.id === tiempo));
</script>

{#if t}
  <Cabecera titulo={t.nombre} subtitulo={`${t.nombre_es} · ${t.nivel}`}>
    {#snippet acciones()}
      <button class="btn" type="button" onclick={() => ir('entreno', t.id, 'todos', 15)}>Practicar</button>
    {/snippet}
  </Cabecera>
  <div class="teoria">
    <div class="tarjeta rayado uso">
      <p class="seccion">Cuándo se usa</p>
      <p>{t.uso}</p>
    </div>
    <div class="tarjeta">
      <p class="seccion">Cómo se forma</p>
      <div class="md">{@html markdown(t.formacion)}</div>
    </div>
    {#if t.ejemplos.length}
      <div class="tarjeta">
        <p class="seccion">Ejemplos</p>
        <ul class="ejemplos">
          {#each t.ejemplos as e, i (i)}
            <li>
              <div class="fila"><span class="fr crece">{e.fr}</span><BotonVoz texto={e.fr} tam="1rem" /></div>
              <span class="tenue peq">{e.es}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    {#if t.errores.length}
      <div class="errores">
        <p class="seccion">Errores típicos</p>
        <ul>{#each t.errores as e, i (i)}<li>{e}</li>{/each}</ul>
      </div>
    {/if}
  </div>
{/if}

<style>
  .teoria { display: grid; gap: 1rem; max-width: 50rem; }
  .uso { padding-left: 2rem; }
  .uso p:last-child { font-size: 1.05rem; margin: 0.4rem 0 0; }
  .seccion { margin-bottom: 0.5rem; }
  .ejemplos { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  .ejemplos li { border-left: 3px solid var(--primario); padding-left: 0.8rem; }
  .ejemplos .fr { font-size: 1.05rem; }
  .errores { background: var(--secundario-suave); border-radius: var(--r-l); padding: 1rem 1.4rem; }
  .errores ul { margin: 0; padding-left: 1.1rem; }
</style>
