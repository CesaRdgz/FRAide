<script lang="ts">
  import BotonVoz from '../componentes/BotonVoz.svelte';
  import Cabecera from '../componentes/Cabecera.svelte';
  import { app } from '../estado/app.svelte';
  import { href } from '../estado/ruta.svelte';
  import type { DatosVerbos } from '../lib/tipos';
  import { claveForma, ultimosVerbos } from '../lib/verbos';

  let { inf }: { inf: string } = $props();

  let datos = $state<DatosVerbos | null>(null);
  app.verbos().then((d) => (datos = d));

  const verbo = $derived(datos?.verbos.find((v) => v.inf === inf));
  const ultimos = $derived(ultimosVerbos(app.progreso.intentosVerbo));
</script>

{#if datos && !verbo}
  <Cabecera titulo="Verbo no encontrado" />
{:else if verbo && datos}
  <Cabecera titulo={verbo.inf} subtitulo={`${verbo.es} · participio: ${verbo.participio} · auxiliar: ${verbo.aux}`}>
    {#snippet acciones()}<BotonVoz texto={verbo.inf} />{/snippet}
  </Cabecera>
  <div class="rejilla tiempos">
    {#each datos.tiempos as t (t.id)}
      {@const formas = verbo.tiempos[t.id]}
      {#if formas}
        <div class="tarjeta tiempo">
          <div class="fila entre">
            <h3>{t.nombre}</h3>
            <a class="peq" href={href('teoria', t.id)}>Teoría</a>
          </div>
          <ul>
            {#each formas as f, p (p)}
              {#if f}
                {@const u = ultimos.get(claveForma(verbo.inf, t.id, p))}
                <li class:fallo={u === false}>
                  <span class="fr crece">{f.d}</span>
                  {#if u === false}<span class="etiqueta">la fallaste</span>{/if}
                  <BotonVoz texto={f.d.replace(/ \/ elles?/, '')} tam="1rem" />
                </li>
              {/if}
            {/each}
          </ul>
        </div>
      {/if}
    {/each}
  </div>
{/if}

<style>
  .tiempos { grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); }
  .tiempo h3 { color: var(--primario); }
  ul { list-style: none; padding: 0; margin: 0.6rem 0 0; }
  li { display: flex; align-items: center; gap: 0.3rem; border-bottom: 1px solid var(--borde); padding: 0.1rem 0; }
  li:last-child { border: none; }
  li .fr { font-size: 1.05rem; }
  li.fallo .fr { color: var(--secundario); }
</style>
