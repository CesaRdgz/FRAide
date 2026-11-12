<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import { app, COMPETENCIAS } from '../estado/app.svelte';
  import { href } from '../estado/ruta.svelte';
  import { formatearNota } from '../lib/examen';
  import { diaLocal, estadoPalabra, filaLeccion } from '../lib/progreso';
  import type { DatosVerbos } from '../lib/tipos';
  import { ultimosVerbos } from '../lib/verbos';

  let verbos = $state<DatosVerbos | null>(null);
  app.verbos().then((d) => (verbos = d));

  // Últimas 5 semanas de actividad (de lunes a domingo)
  const semanas = $derived.by(() => {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7) - 28);
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const dia = diaLocal(d);
      return { dia, n: app.progreso.actividad[dia] ?? 0, futuro: d > hoy };
    });
  });
  const diasActivos30 = $derived(semanas.slice(-30).filter((s) => s.n > 0).length);

  const palabras = $derived.by(() => {
    const c = { nueva: 0, vista: 0, memorizada: 0 };
    for (const v of app.vocab) c[estadoPalabra(app.progreso.tarjetas[v.id])]++;
    return c;
  });

  const ejercicios = $derived.by(() => {
    const ids = new Set(app.lecciones.flatMap((l) => l.ejercicios.map((e) => e.id)));
    const ult = [...app.ultimos.values()].filter((i) => ids.has(i.ejercicioId));
    return { total: ids.size, hechos: ult.length, bien: ult.filter((i) => i.correcto).length };
  });

  const porTiempo = $derived.by(() => {
    if (!verbos) return [];
    const ult = ultimosVerbos(app.progreso.intentosVerbo);
    return verbos.tiempos.map((t) => {
      let hechas = 0;
      let bien = 0;
      for (const [k, ok] of ult) {
        if (k.split('|')[1] === t.id) {
          hechas++;
          if (ok) bien++;
        }
      }
      return { t, hechas, bien };
    });
  });

  // Competencias: media del progreso de las lecciones que las trabajan
  const competencias = $derived.by(() => {
    const filas = app.lecciones.map((l) => filaLeccion(l, app.progreso, app.ultimos));
    return COMPETENCIAS.flatMap((c) => {
      const fs = filas.filter((f) => f.leccion.competencias.includes(c.id));
      return fs.length ? [{ c, valor: fs.reduce((s, f) => s + f.fraccion, 0) / fs.length }] : [];
    });
  });

  const examenes = $derived.by(() => {
    const m = new Map<string, { libro: string; dossier: number; mejor: number; intentos: number }>();
    for (const e of app.progreso.examenes) {
      const k = `${e.libro}|${e.dossier}`;
      const x = m.get(k) ?? { libro: e.libro, dossier: e.dossier, mejor: 0, intentos: 0 };
      x.mejor = Math.max(x.mejor, e.nota10);
      x.intentos++;
      m.set(k, x);
    }
    return [...m.values()];
  });

  const nivel = (n: number) => (n === 0 ? 0 : n < 10 ? 1 : n < 30 ? 2 : 3);
</script>

<h1 class="titulo">Progreso</h1>

<div class="cifras">
  <div class="tarjeta cifra racha">
    <Icono nombre="llama" tam="1.8rem" />
    <p class="fr num">{app.racha}</p>
    <p class="tenue peq">{app.racha === 1 ? 'día seguido' : 'días seguidos'}</p>
  </div>
  <div class="tarjeta cifra">
    <p class="fr num">{palabras.memorizada}</p>
    <p class="tenue peq">palabras memorizadas de {app.vocab.length}</p>
  </div>
  <div class="tarjeta cifra">
    <p class="fr num">{ejercicios.hechos ? Math.round((ejercicios.bien / ejercicios.hechos) * 100) : 0}%</p>
    <p class="tenue peq">de acierto en {ejercicios.hechos} de {ejercicios.total} ejercicios</p>
  </div>
  <div class="tarjeta cifra">
    <p class="fr num">{diasActivos30}</p>
    <p class="tenue peq">días con práctica en los últimos 30</p>
  </div>
</div>

<div class="columnas">
  <section class="tarjeta">
    <h2>Actividad</h2>
    <div class="calendario" aria-label="Actividad de las últimas 5 semanas">
      {#each ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as d (d)}<span class="dia-sem tenue peq">{d}</span>{/each}
      {#each semanas as s (s.dia)}
        <span class="celda n{nivel(s.n)}" class:futuro={s.futuro} title="{s.dia}: {s.n} respuestas"></span>
      {/each}
    </div>
    <h2 class="sub">Vocabulario</h2>
    <div class="palabras">
      <div><span class="punto memorizada"></span> Memorizadas <strong>{palabras.memorizada}</strong></div>
      <div><span class="punto vista"></span> Vistas <strong>{palabras.vista}</strong></div>
      <div><span class="punto"></span> Nuevas <strong>{palabras.nueva}</strong></div>
    </div>
    <Barra valor={app.vocab.length ? palabras.memorizada / app.vocab.length : 0} color="var(--terciario)" alto="0.7rem" />
  </section>

  <section class="tarjeta">
    <h2>Verbos por tiempo</h2>
    {#each porTiempo as x (x.t.id)}
      <div class="linea">
        <a class="nombre" href={href('teoria', x.t.id)}>{x.t.nombre}</a>
        <div class="crece"><Barra valor={x.hechas ? x.bien / x.hechas : 0} color="var(--primario)" /></div>
        <span class="tenue peq cuenta">{x.hechas ? `${Math.round((x.bien / x.hechas) * 100)} % · ${x.hechas} formas` : 'sin practicar'}</span>
      </div>
    {/each}
  </section>

  {#if examenes.length}
    <section class="tarjeta">
      <h2>Exámenes</h2>
      {#each examenes as e (`${e.libro}|${e.dossier}`)}
        <a class="linea examen d{e.dossier % 6}" href={href('examen', e.libro, e.dossier)}>
          <span class="crece">{e.dossier === 0 ? 'Repaso' : `Dossier ${e.dossier}`} <span class="tenue peq">· {e.libro} · {e.intentos} {e.intentos === 1 ? 'intento' : 'intentos'}</span></span>
          <strong class="fr nota">{formatearNota(e.mejor)}</strong>
        </a>
      {/each}
    </section>
  {/if}

  {#if competencias.length}
    <section class="tarjeta">
      <h2>Competencias</h2>
      {#each competencias as { c, valor } (c.id)}
        <div class="linea">
          <span class="nombre-c">{c.titulo} <span class="etiqueta">{c.nivel}</span></span>
          <div class="barra-c"><Barra valor={valor} color="var(--terciario)" /></div>
        </div>
      {/each}
    </section>
  {/if}
</div>

<style>
  .titulo { margin-bottom: 1.5rem; }
  .cifras { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 1rem; margin-bottom: 1rem; }
  .cifra { display: flex; flex-direction: column; gap: 0.2rem; }
  .cifra p { margin: 0; }
  .num { font-size: 2.4rem; line-height: 1; color: var(--primario); }
  .racha { background: var(--ocre-suave); color: var(--ocre); border-color: transparent; }
  .racha .num { color: var(--ocre); }
  .columnas { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
  @media (max-width: 64rem) { .columnas { grid-template-columns: 1fr; } }
  h2 { font-size: 1.2rem; margin-bottom: 1rem; }
  .sub { margin-top: 1.5rem; }
  .calendario { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.3rem; max-width: 20rem; }
  .dia-sem { text-align: center; }
  .celda { aspect-ratio: 1; border-radius: 4px; background: var(--variante); }
  .celda.n1 { background: color-mix(in srgb, var(--terciario) 35%, var(--variante)); }
  .celda.n2 { background: color-mix(in srgb, var(--terciario) 65%, var(--variante)); }
  .celda.n3 { background: var(--terciario); }
  .celda.futuro { opacity: 0.25; }
  .palabras { display: flex; gap: 1.2rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
  .punto { display: inline-block; width: 0.6rem; height: 0.6rem; border-radius: 50%; border: 2px solid var(--contorno); }
  .punto.vista { border-color: var(--ocre); background: var(--ocre-suave); }
  .punto.memorizada { border-color: var(--terciario); background: var(--terciario); }
  .linea { display: flex; align-items: center; gap: 0.8rem; padding: 0.45rem 0; color: inherit; text-decoration: none; flex-wrap: wrap; }
  .nombre { width: 7.5rem; text-decoration: none; }
  .cuenta { min-width: 8rem; text-align: right; }
  .examen { border-bottom: 1px solid var(--borde); }
  .examen .nota { font-size: 1.4rem; color: var(--acento); }
  .nombre-c { flex: 1 1 14rem; font-size: 0.92rem; }
  .barra-c { flex: 1 1 8rem; }
</style>
