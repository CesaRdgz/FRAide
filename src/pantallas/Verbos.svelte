<script lang="ts">
  import Icono from '../componentes/Icono.svelte';
  import { app } from '../estado/app.svelte';
  import { href, ir } from '../estado/ruta.svelte';
  import { sinAcentos } from '../lib/respuestas';
  import type { DatosVerbos } from '../lib/tipos';
  import { GRUPOS, type GrupoVerbos, ultimosVerbos } from '../lib/verbos';

  let datos = $state<DatosVerbos | null>(null);
  app.verbos().then((d) => (datos = d));

  let elegidos = $state<Set<string>>(new Set(['presente']));
  let grupo = $state<GrupoVerbos>('todos');
  let cantidad = $state(15);
  let busqueda = $state('');

  const ultimos = $derived(ultimosVerbos(app.progreso.intentosVerbo));
  const numFallos = $derived([...ultimos.values()].filter((v) => !v).length);

  const filtrados = $derived.by(() => {
    if (!datos) return [];
    const q = sinAcentos(busqueda.trim().toLowerCase());
    return datos.verbos.filter((v) => !q || sinAcentos(v.inf.toLowerCase()).includes(q) || sinAcentos(v.es.toLowerCase()).includes(q));
  });

  const GRUPO_TXT: Record<string, string> = { irregular: 'irregular', er: '-er', ir: '-ir', pronominal: 'pronominal' };

  function alternar(id: string) {
    const s = new Set(elegidos);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    elegidos = s;
  }
</script>

<h1 class="titulo">Verbos</h1>

{#if !datos}
  <p class="tenue">Cargando verbos…</p>
{:else}
  <section class="tarjeta rayado entreno">
    <p class="seccion">Entrenador de conjugación</p>
    <h2>¿Qué quieres practicar?</h2>
    <div class="grupo-opciones">
      <span class="tenue peq">Tiempos</span>
      <div class="fila envuelve">
        {#each datos.tiempos as t (t.id)}
          <button type="button" class="chip" aria-pressed={elegidos.has(t.id)} onclick={() => alternar(t.id)}>
            {t.nombre} <span class="tenue peq">{t.nivel}</span>
          </button>
        {/each}
      </div>
    </div>
    <div class="grupo-opciones">
      <span class="tenue peq">Verbos</span>
      <div class="fila envuelve">
        {#each GRUPOS as [id, texto] (id)}
          <button type="button" class="chip" aria-pressed={grupo === id} onclick={() => (grupo = id)}>
            {texto}{#if id === 'fallos'} ({numFallos}){/if}
          </button>
        {/each}
      </div>
    </div>
    <div class="grupo-opciones">
      <span class="tenue peq">Preguntas</span>
      <div class="fila">
        {#each [10, 15, 25] as n (n)}
          <button type="button" class="chip" aria-pressed={cantidad === n} onclick={() => (cantidad = n)}>{n}</button>
        {/each}
      </div>
    </div>
    <button class="btn" type="button" disabled={elegidos.size === 0 || (grupo === 'fallos' && numFallos === 0)} onclick={() => ir('entreno', [...elegidos].join(','), grupo, cantidad)}>
      Empezar
    </button>
  </section>

  <section>
    <h2 class="sub">Teoría de cada tiempo</h2>
    <div class="rejilla">
      {#each datos.tiempos as t (t.id)}
        <a class="tarjeta teoria" href={href('teoria', t.id)}>
          <div class="fila entre"><h3>{t.nombre}</h3><span class="etiqueta">{t.nivel}</span></div>
          <p class="tenue peq">{t.nombre_es}</p>
        </a>
      {/each}
    </div>
  </section>

  <section>
    <div class="fila entre envuelve sub">
      <h2>Consultar un verbo</h2>
      <input class="campo buscar" type="search" bind:value={busqueda} placeholder="Buscar (francés o español)" aria-label="Buscar verbo" />
    </div>
    <div class="lista">
      {#each filtrados as v (v.inf)}
        <a class="verbo" href={href('verbo', v.inf)}>
          <span class="fr inf">{v.inf}</span>
          <span class="tenue crece">{v.es}</span>
          <span class="etiqueta">{GRUPO_TXT[v.grupo] ?? v.grupo}</span>
          <Icono nombre="siguiente" tam="1.1rem" />
        </a>
      {:else}
        <p class="tenue">No hay ningún verbo con «{busqueda}».</p>
      {/each}
    </div>
  </section>
{/if}

<style>
  .titulo { margin-bottom: 1.5rem; }
  .entreno { padding-left: 2rem; display: grid; gap: 1rem; justify-items: start; margin-bottom: 2.5rem; }
  .grupo-opciones { display: grid; gap: 0.4rem; }
  section { margin-bottom: 2.5rem; }
  .sub { margin-bottom: 1rem; }
  .teoria h3 { font-size: 1.15rem; }
  .teoria p { margin: 0.2rem 0 0; }
  .buscar { max-width: 20rem; min-height: 2.6rem; }
  .lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr)); gap: 0.4rem; }
  .verbo { display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem 0.9rem; border-radius: var(--r-m); background: var(--papel); border: 1px solid var(--borde); color: inherit; text-decoration: none; }
  .verbo:hover { border-color: var(--contorno); }
  .inf { font-size: 1.1rem; min-width: 7rem; }
  .verbo :global(svg) { color: var(--contorno); }
</style>
