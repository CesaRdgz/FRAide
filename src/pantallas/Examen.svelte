<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Cabecera from '../componentes/Cabecera.svelte';
  import Confeti from '../componentes/Confeti.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { atras } from '../estado/ruta.svelte';
  import { barajar } from '../lib/aleatorio';
  import { calificacion, corregir, formatearNota, generar, nota10, type PreguntaExamen, SECCIONES, tiemposDelTema } from '../lib/examen';
  import { conHueco } from '../lib/markdown';
  import { esGenerado } from '../lib/practica';
  import { normalizar } from '../lib/respuestas';
  import type { Examen } from '../lib/tipos';

  let { libro, dossier }: { libro: string; dossier: number } = $props();

  const lecciones = $derived(app.lecciones.filter((l) => l.libro === libro && l.dossier === dossier));
  const nombreTema = $derived(dossier === 0 ? 'Repaso' : `Dossier ${dossier}`);
  const mejor = $derived(
    app.progreso.examenes.filter((e) => e.libro === libro && e.dossier === dossier).reduce<number | null>((m, e) => Math.max(m ?? 0, e.nota10), null),
  );

  let fase = $state<'cargando' | 'intro' | 'preguntas' | 'resultado'>('cargando');
  let preguntas = $state<PreguntaExamen[]>([]);
  let opciones = $state<string[][]>([]);
  let respuestas = $state<string[]>([]);
  let correctas = $state<boolean[]>([]);
  let indice = $state(0);
  let inicio = 0;
  let segundos = $state(0);
  let resultado = $state<Examen | null>(null);
  let mejorAntes = $state<number | null>(null);
  let dialogo = $state<HTMLDialogElement | null>(null);
  let campo = $state<HTMLInputElement | null>(null);

  async function preparar() {
    fase = 'cargando';
    const verbos = await app.verbos();
    const ls = lecciones;
    preguntas = generar(
      ls.flatMap((l) => l.ejercicios),
      ls.flatMap((l) => l.vocabulario),
      app.vocab,
      verbos,
      tiemposDelTema(ls, dossier, verbos),
    );
    opciones = preguntas.map((p) => (p.ejercicio.fijas ? p.ejercicio.opciones : barajar(p.ejercicio.opciones)));
    respuestas = preguntas.map(() => '');
    indice = 0;
    fase = 'intro';
  }
  void preparar();

  const actual = $derived(preguntas[indice]);
  const enBlanco = $derived(respuestas.filter((r) => !r.trim()).length);
  const porSeccion = $derived(SECCIONES.map(([s, t]) => [t, preguntas.filter((p) => p.seccion === s).length] as const).filter(([, n]) => n > 0));

  $effect(() => {
    if (fase === 'preguntas' && actual && actual.ejercicio.opciones.length === 0) campo?.focus();
  });

  function empezar() {
    fase = 'preguntas';
    inicio = Date.now();
  }

  function ir(i: number) {
    indice = Math.max(0, Math.min(preguntas.length - 1, i));
  }

  function entregar() {
    dialogo?.close();
    correctas = preguntas.map((p, i) => corregir(p, respuestas[i]));
    segundos = Math.round((Date.now() - inicio) / 1000);
    mejorAntes = mejor;
    // Cada respuesta cuenta también para el progreso normal
    preguntas.forEach((p, i) => {
      const ok = correctas[i];
      const ej = p.ejercicio;
      if (p.seccion === 'verbos') {
        const [inf, tiempo, persona] = ej.id.slice(ej.id.indexOf('verbo:') + 6).split('|');
        app.registrarVerbo(inf, tiempo, Number(persona) || 0, ok);
      } else if (esGenerado(ej)) app.registrarPractica();
      else app.registrarIntento(ej, ok, respuestas[i]);
    });
    const aciertos = correctas.filter(Boolean).length;
    const ex: Examen = { libro, dossier, nota10: nota10(aciertos, preguntas.length), aciertos, total: preguntas.length, fecha: Date.now() };
    app.guardarExamen(ex);
    resultado = ex;
    fase = 'resultado';
    window.scrollTo({ top: 0 });
  }

  function salir() {
    if (fase === 'preguntas' && respuestas.some((r) => r.trim()) && !confirm('¿Abandonar el examen? Perderás las respuestas de este intento.')) return;
    atras();
  }

  function teclado(e: KeyboardEvent) {
    if (fase !== 'preguntas' || !actual || dialogo?.open) return;
    const enCampo = (e.target as HTMLElement)?.tagName === 'INPUT';
    if (e.key === 'Escape') salir();
    else if (!enCampo && e.key === 'ArrowRight') ir(indice + 1);
    else if (!enCampo && e.key === 'ArrowLeft') ir(indice - 1);
    else if (!enCampo && /^[1-9]$/.test(e.key)) {
      const op = opciones[indice]?.[Number(e.key) - 1];
      if (op !== undefined) respuestas[indice] = op;
    } else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
      e.preventDefault();
      if (indice < preguntas.length - 1) ir(indice + 1);
      else dialogo?.showModal();
    }
  }
</script>

<svelte:window onkeydown={teclado} />

<Cabecera
  titulo={`Examen · ${nombreTema}`}
  subtitulo={fase === 'preguntas' ? `Pregunta ${indice + 1} de ${preguntas.length}` : libro}
  alVolver={salir}
/>

{#if fase === 'cargando'}
  <p class="tenue">Preparando el examen…</p>
{:else if preguntas.length === 0}
  <Vacio titulo="Sin preguntas" texto="Este tema todavía no tiene contenido suficiente para un examen.">
    <button class="btn" type="button" onclick={() => atras()}>Volver</button>
  </Vacio>
{:else if fase === 'intro'}
  <div class="intro tarjeta rayado d{dossier % 6}">
    <p class="seccion">{preguntas.length} preguntas</p>
    <ul>
      {#each porSeccion as [t, n] (t)}<li>{n} de {t.toLowerCase()}</li>{/each}
    </ul>
    <p class="tenue">Como en un examen de verdad: no verás si aciertas hasta entregarlo. Puedes moverte entre preguntas y cambiar respuestas. Cada intento sale distinto.</p>
    {#if mejor !== null}<p>Tu mejor nota en este tema: <strong class="fr">{formatearNota(mejor)}</strong></p>{/if}
    <button class="btn" type="button" onclick={empezar}>Empezar el examen</button>
  </div>
{:else if fase === 'preguntas' && actual}
  <div class="examen">
    <div class="principal">
      <Barra valor={(indice + 1) / preguntas.length} color="var(--secundario)" etiqueta="Avance" />
      <span class="etiqueta">{SECCIONES.find(([s]) => s === actual.seccion)?.[1]}</span>
      <div class="tarjeta rayado enunciado">
        <p class="fr">{@html conHueco(actual.ejercicio.enunciado)}</p>
      </div>
      {#if actual.ejercicio.opciones.length > 0}
        <div class="pila">
          {#each opciones[indice] ?? [] as op, i (op)}
            <button
              type="button"
              class="opcion"
              class:elegida={respuestas[indice] !== '' && normalizar(respuestas[indice]) === normalizar(op)}
              onclick={() => (respuestas[indice] = op)}
            >
              <span class="letra">{i + 1}</span><span class="crece">{op}</span>
            </button>
          {/each}
        </div>
      {:else}
        <input bind:this={campo} class="campo grande" bind:value={respuestas[indice]} placeholder="Tu respuesta" lang="fr" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Tu respuesta" />
      {/if}
      <div class="fila entre navegacion">
        <button class="btn secundario" type="button" disabled={indice === 0} onclick={() => ir(indice - 1)}>Anterior</button>
        {#if indice < preguntas.length - 1}
          <button class="btn" type="button" onclick={() => ir(indice + 1)}>Siguiente</button>
        {:else}
          <button class="btn" type="button" onclick={() => dialogo?.showModal()}>Entregar</button>
        {/if}
      </div>
      <p class="tenue peq">Atajos: <kbd>←</kbd> <kbd>→</kbd> para moverte · <kbd>1</kbd>–<kbd>4</kbd> para elegir · <kbd>Intro</kbd> siguiente</p>
    </div>
    <aside class="mapa tarjeta plana">
      <p class="seccion">Preguntas</p>
      <div class="cuadros">
        {#each preguntas as _, i (i)}
          <button type="button" class:actual={i === indice} class:hecha={respuestas[i].trim() !== ''} onclick={() => ir(i)} aria-label="Pregunta {i + 1}">{i + 1}</button>
        {/each}
      </div>
      <p class="tenue peq">{preguntas.length - enBlanco} de {preguntas.length} respondidas</p>
      <button class="btn ancho" type="button" onclick={() => dialogo?.showModal()}>Entregar</button>
    </aside>
  </div>
{:else if fase === 'resultado' && resultado}
  {@const ex = resultado}
  {@const color = ex.nota10 >= 70 ? 'var(--terciario)' : ex.nota10 >= 50 ? 'var(--primario)' : 'var(--secundario)'}
  {#if ex.nota10 >= 70}<Confeti />{/if}
  <div class="resultado">
    <div class="tarjeta rayado nota" style:--c={color}>
      <p class="fr cifra">{formatearNota(ex.nota10)}</p>
      <p class="seccion calif">{calificacion(ex.nota10)}</p>
      <p class="tenue">{ex.aciertos} de {ex.total} bien · {Math.floor(segundos / 60)} min {segundos % 60} s</p>
      {#if mejorAntes !== null && ex.nota10 > mejorAntes}<p class="record">¡Has mejorado tu nota en este tema!</p>{/if}
      {#each SECCIONES as [s, t] (s)}
        {@const idx = preguntas.map((p, i) => [p, i] as const).filter(([p]) => p.seccion === s).map(([, i]) => i)}
        {#if idx.length}
          {@const bien = idx.filter((i) => correctas[i]).length}
          <div class="fila seccion-res">
            <span class="nombre">{t}</span>
            <div class="crece"><Barra valor={bien / idx.length} {color} /></div>
            <span class="tenue peq">{bien}/{idx.length}</span>
          </div>
        {/if}
      {/each}
      <div class="fila envuelve botones">
        <button class="btn" type="button" onclick={() => void preparar()}>Otro examen de este tema</button>
        <button class="btn texto" type="button" onclick={() => atras()}>Volver</button>
      </div>
    </div>
    {#if correctas.some((c) => !c)}
      <h2 class="sub">Revisa tus fallos</h2>
      <div class="pila">
        {#each preguntas as p, i (i)}
          {#if !correctas[i]}
            <div class="tarjeta plana fallo">
              <p class="seccion">{SECCIONES.find(([s]) => s === p.seccion)?.[1]}</p>
              <p class="fr enun">{@html conHueco(p.ejercicio.enunciado)}</p>
              <p><span class="tenue peq">Tu respuesta:</span> <span class="fr mal-txt">{respuestas[i] || '(en blanco)'}</span></p>
              <p><span class="tenue peq">Correcta:</span> <span class="fr bien-txt">{p.seccion === 'verbos' ? (p.ejercicio.explicacion ?? p.ejercicio.respuestas[0]) : p.ejercicio.respuestas[0]}</span></p>
              {#if p.seccion !== 'verbos' && p.ejercicio.explicacion}<p class="tenue peq">{p.ejercicio.explicacion}</p>{/if}
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
{/if}

<dialog bind:this={dialogo}>
  <h3>¿Entregar el examen?</h3>
  <p class="tenue">{enBlanco > 0 ? `Te quedan ${enBlanco} ${enBlanco === 1 ? 'pregunta' : 'preguntas'} sin responder; contarán como fallo.` : 'Has respondido todas las preguntas.'}</p>
  <div class="fila" style="justify-content:flex-end">
    <button class="btn texto" type="button" onclick={() => dialogo?.close()}>Revisar</button>
    <button class="btn" type="button" onclick={entregar}>Entregar</button>
  </div>
</dialog>

<style>
  .intro { max-width: 36rem; padding-left: 2rem; display: grid; gap: 0.6rem; justify-items: start; border-left: 4px solid var(--acento); }
  .intro ul { margin: 0; padding-left: 1.2rem; font-size: 1.05rem; }
  .intro p { margin: 0; }
  .examen { display: grid; grid-template-columns: minmax(0, 44rem) 15rem; gap: 2rem; align-items: start; }
  @media (max-width: 64rem) { .examen { grid-template-columns: 1fr; } .mapa { order: -1; } }
  .principal { display: grid; gap: 1rem; justify-items: stretch; }
  .principal > .etiqueta { justify-self: start; }
  .enunciado { padding-left: 2rem; }
  .enunciado p { font-size: 1.45rem; margin: 0; line-height: 1.4; }
  .navegacion { margin-top: 0.4rem; }
  .mapa { position: sticky; top: 1.5rem; display: grid; gap: 0.8rem; }
  .mapa p { margin: 0; }
  .cuadros { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.35rem; }
  .cuadros button { aspect-ratio: 1; border-radius: var(--r-s); border: 1px solid var(--borde); background: var(--papel); cursor: pointer; font-size: 0.85rem; }
  .cuadros button.hecha { background: var(--primario-suave); border-color: var(--primario); }
  .cuadros button.actual { outline: 2px solid var(--secundario); outline-offset: 1px; }
  .resultado { max-width: 44rem; }
  .nota { padding-left: 2rem; }
  .cifra { font-size: 4.5rem; line-height: 1; margin: 0; color: var(--c); }
  .calif { color: var(--c); margin: 0.3rem 0; }
  .record { color: var(--c); font-weight: 600; }
  .seccion-res { margin: 0.5rem 0; }
  .seccion-res .nombre { width: 7rem; }
  .botones { margin-top: 1.2rem; }
  .sub { margin: 2rem 0 1rem; }
  .fallo p { margin: 0.2rem 0; }
  .enun { font-size: 1.1rem; }
  .mal-txt { color: var(--secundario); }
  .bien-txt { color: var(--terciario); }
  dialog h3 { margin-bottom: 0.6rem; }
</style>
