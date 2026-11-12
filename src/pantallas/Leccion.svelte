<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import BotonVoz from '../componentes/BotonVoz.svelte';
  import Cabecera from '../componentes/Cabecera.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { href } from '../estado/ruta.svelte';
  import { agruparPor } from '../lib/aleatorio';
  import { markdown } from '../lib/markdown';
  import { estadoPalabra, filaLeccion } from '../lib/progreso';

  let { id }: { id: string } = $props();

  const l = $derived(app.leccion(id));
  const fila = $derived(l ? filaLeccion(l, app.progreso, app.ultimos) : null);
  const categorias = $derived(l ? [...agruparPor(l.vocabulario, (v) => v.categoria ?? 'Vocabulario')] : []);
  const cultura = $derived(l?.notas.filter((n) => n.tipo === 'cultura') ?? []);
  const pronunciacion = $derived(l?.notas.filter((n) => n.tipo === 'pronunciacion') ?? []);

  const indice = $derived(
    l
      ? [
          ['resumen', 'Resumen'],
          ['vocabulario', `Vocabulario (${l.vocabulario.length})`],
          ['gramatica', 'Gramática'],
          ...(l.aclaraciones.length ? [['dudas', 'Dudas frecuentes']] : []),
          ...(l.expresiones.length ? [['expresiones', 'Expresiones útiles']] : []),
          ...(cultura.length ? [['cultura', 'Cultura']] : []),
          ...(pronunciacion.length ? [['pronunciacion', 'Pronunciación']] : []),
        ]
      : [],
  );

  function irA(seccion: string) {
    document.getElementById(seccion)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

{#if !l || !fila}
  <Cabecera titulo="Lección no encontrada" />
  <Vacio titulo="Esta lección no está" texto="Puede que se haya borrado. Vuelve a importarla desde Ajustes.">
    <a class="btn" href={href()}>Ir a Lecciones</a>
  </Vacio>
{:else}
  <div class="d{l.dossier % 6}">
    <Cabecera titulo={l.titulo} subtitulo={`${l.dossier === 0 ? `Repaso ${l.nivel}` : `Dossier ${l.dossier} · Lección ${l.numero}`} · ${l.tituloEs}`} />

    <div class="cuerpo">
      <article class="principal">
        <section id="resumen" class="tarjeta rayado portada">
          <p class="seccion">{l.libro}{l.paginas ? ` · págs. ${l.paginas}` : ''}</p>
          <p class="resumen">{l.resumen}</p>
          {#if l.objetivos.length}
            <p class="seccion sub">Al acabar…</p>
            <ul class="objetivos">
              {#each l.objetivos as o, i (i)}<li>{o}</li>{/each}
            </ul>
          {/if}
          {#if l.tareaFinal}
            <p class="tarea"><span class="seccion">Tarea final</span> <span class="fr">{l.tareaFinal}</span></p>
          {/if}
        </section>

        <section id="vocabulario">
          <h2>Vocabulario</h2>
          <p class="tenue peq leyenda">
            <span class="punto nueva"></span> nueva <span class="punto vista"></span> vista <span class="punto memorizada"></span> memorizada
          </p>
          {#each categorias as [cat, palabras] (cat)}
            <h3 class="cat seccion">{cat}</h3>
            <div class="vocab">
              {#each palabras as v (v.id)}
                {@const est = estadoPalabra(app.progreso.tarjetas[v.id])}
                <div class="palabra">
                  <span class="punto {est}" title={est}></span>
                  <div class="crece">
                    <div class="fila">
                      <span class="fr palabra-fr">{v.fr}</span>
                      <BotonVoz texto={v.fr} tam="1.1rem" />
                    </div>
                    <p class="es">{v.es}</p>
                    {#if v.ejemploFr}
                      <p class="ejemplo"><span class="fr">{v.ejemploFr}</span>{#if v.ejemploEs}<span class="tenue"> — {v.ejemploEs}</span>{/if}</p>
                    {/if}
                    {#if v.nota}<p class="nota peq">{v.nota}</p>{/if}
                  </div>
                </div>
              {/each}
            </div>
          {/each}
        </section>

        <section id="gramatica">
          <h2>Gramática</h2>
          {#each l.gramatica as g (g.id)}
            <div class="tarjeta punto-g">
              <h3>{g.titulo}</h3>
              <div class="md">{@html markdown(g.explicacion)}</div>
              {#if g.tabla && g.tabla.filas.length}
                <div class="tabla-scroll">
                  <table class="tabla">
                    {#if g.tabla.columnas.some((c) => c)}
                      <thead><tr>{#each g.tabla.columnas as c, i (i)}<th>{c}</th>{/each}</tr></thead>
                    {/if}
                    <tbody>
                      {#each g.tabla.filas as f, i (i)}
                        <tr>{#each f as c, j (j)}<td>{c}</td>{/each}</tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
              {#if g.ejemplos.length}
                <p class="seccion sub">Ejemplos</p>
                <ul class="ejemplos">
                  {#each g.ejemplos as e, i (i)}
                    <li>
                      <div class="fila"><span class="fr crece">{e.fr}</span><BotonVoz texto={e.fr} tam="1rem" /></div>
                      <span class="tenue peq">{e.es}</span>
                    </li>
                  {/each}
                </ul>
              {/if}
              {#if g.errores.length}
                <div class="errores">
                  <p class="seccion">Errores típicos</p>
                  <ul>{#each g.errores as e, i (i)}<li>{e}</li>{/each}</ul>
                </div>
              {/if}
            </div>
          {/each}
        </section>

        {#if l.aclaraciones.length}
          <section id="dudas">
            <h2>Dudas frecuentes</h2>
            <div class="tarjeta">
              {#each l.aclaraciones as a, i (i)}
                <details class="aclaracion"><summary>{a.pregunta}</summary><p>{a.respuesta}</p></details>
              {/each}
            </div>
          </section>
        {/if}

        {#if l.expresiones.length}
          <section id="expresiones">
            <h2>Expresiones útiles</h2>
            <div class="tarjeta">
              {#each l.expresiones as x, i (i)}
                <div class="expresion">
                  <div class="fila"><span class="fr crece">{x.fr}</span><BotonVoz texto={x.fr} tam="1rem" /></div>
                  <p>{x.es}{#if x.uso}<span class="tenue peq"> · {x.uso}</span>{/if}</p>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        {#each [['cultura', 'Cultura', cultura], ['pronunciacion', 'Pronunciación', pronunciacion]] as const as [sid, titulo, notas] (sid)}
          {#if notas.length}
            <section id={sid}>
              <h2>{titulo}</h2>
              {#each notas as n, i (i)}
                <div class="tarjeta nota-c">
                  <h3>{n.titulo}</h3>
                  <p>{n.texto}</p>
                </div>
              {/each}
            </section>
          {/if}
        {/each}
      </article>

      <aside class="lado">
        <div class="tarjeta pila acciones">
          <p class="seccion">Practicar esta lección</p>
          <Barra valor={fila.fraccion} color="var(--acento)" etiqueta="Progreso" />
          <p class="tenue peq">{fila.palabrasMemorizadas}/{fila.vocab} palabras memorizadas · {fila.ejerciciosBien}/{fila.ejercicios} ejercicios bien</p>
          <a class="btn ancho" href={href('ejercicios', l.id)}><Icono nombre="lapiz" tam="1.1rem" /> Ejercicios ({l.ejercicios.length})</a>
          <a class="btn secundario ancho" href={href('repaso', l.id)}><Icono nombre="tarjetas" tam="1.1rem" /> Tarjetas de vocabulario</a>
          <a class="btn secundario ancho" href={href('test', l.id)}>Test de vocabulario</a>
          <div class="fila">
            <a class="btn texto crece" href={href('emparejar', l.id)}>Emparejar</a>
            <a class="btn texto crece" href={href('dictado', l.id, 'palabras')}>Dictado</a>
          </div>
        </div>
        <nav class="indice" aria-label="En esta lección">
          <p class="seccion">En esta lección</p>
          {#each indice as [sid, texto] (sid)}
            <button type="button" onclick={() => irA(sid)}>{texto}</button>
          {/each}
        </nav>
      </aside>
    </div>
  </div>
{/if}

<style>
  .cuerpo { display: grid; grid-template-columns: minmax(0, 1fr) 17rem; gap: 2rem; align-items: start; }
  @media (max-width: 70rem) {
    .cuerpo { grid-template-columns: 1fr; }
    .lado { order: -1; position: static !important; }
    .indice { display: none !important; }
  }
  .principal > section { margin-bottom: 2.5rem; scroll-margin-top: 1.5rem; }
  .principal h2 { margin-bottom: 1rem; }
  .portada { padding-left: 2rem; }
  .resumen { font-size: 1.05rem; }
  .sub { margin: 1rem 0 0.4rem; }
  .objetivos { margin: 0; padding-left: 1.2rem; }
  .objetivos li { margin: 0.2rem 0; }
  .tarea { margin: 1rem 0 0; display: flex; gap: 0.6rem; align-items: baseline; flex-wrap: wrap; }
  .tarea .fr { font-size: 1.1rem; }
  .leyenda { display: flex; align-items: center; gap: 0.35rem; margin: -0.5rem 0 1rem; }
  .leyenda .punto { margin-left: 0.6rem; }
  .punto { flex: none; display: inline-block; width: 0.6rem; height: 0.6rem; border-radius: 50%; border: 2px solid var(--contorno); }
  .punto.vista { border-color: var(--ocre); background: var(--ocre-suave); }
  .punto.memorizada { border-color: var(--terciario); background: var(--terciario); }
  .cat { color: var(--acento); margin: 1.4rem 0 0.6rem; }
  .vocab { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); gap: 0.6rem; }
  .palabra { display: flex; gap: 0.7rem; align-items: flex-start; background: var(--papel); border: 1px solid var(--borde); border-radius: var(--r-m); padding: 0.7rem 0.9rem; }
  .palabra .punto { margin-top: 0.55rem; }
  .palabra .fila { gap: 0.2rem; }
  .palabra-fr { font-size: 1.12rem; }
  .palabra p { margin: 0.1rem 0 0; }
  .es { color: var(--texto-2); }
  .ejemplo { font-size: 0.9rem; }
  .nota { color: var(--secundario); }
  .punto-g { margin-bottom: 1rem; }
  .punto-g h3 { margin-bottom: 0.7rem; color: var(--primario); }
  .punto-g .tabla-scroll { margin: 0.8rem 0; }
  .ejemplos { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.4rem; }
  .ejemplos li { border-left: 3px solid var(--acento); padding-left: 0.8rem; }
  .ejemplos .fr { font-size: 1.02rem; }
  .errores { margin-top: 1rem; background: var(--secundario-suave); border-radius: var(--r-m); padding: 0.8rem 1rem; }
  .errores ul { margin: 0.4rem 0 0; padding-left: 1.1rem; }
  .expresion { padding: 0.6rem 0; border-bottom: 1px solid var(--borde); }
  .expresion:last-child { border: none; }
  .expresion .fr { font-size: 1.05rem; }
  .expresion p { margin: 0; }
  .nota-c { margin-bottom: 0.8rem; }
  .nota-c h3 { margin-bottom: 0.4rem; }
  .lado { position: sticky; top: 1.5rem; display: grid; gap: 1rem; }
  .acciones p { margin: 0; }
  .indice { display: flex; flex-direction: column; gap: 0.1rem; padding: 0 0.5rem; }
  .indice .seccion { margin-bottom: 0.4rem; }
  .indice button { text-align: left; background: none; border: none; padding: 0.35rem 0.5rem; border-radius: var(--r-s); color: var(--texto-2); cursor: pointer; }
  .indice button:hover { background: var(--superficie); color: var(--texto); }
</style>
