<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import ZonaImportar from '../componentes/ZonaImportar.svelte';
  import { app } from '../estado/app.svelte';
  import { href } from '../estado/ruta.svelte';
  import { agruparPor } from '../lib/aleatorio';
  import { formatearNota, TOTAL } from '../lib/examen';
  import { ejerciciosFallados, filaLeccion } from '../lib/progreso';

  const fecha = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  const grupos = $derived.by(() => {
    const filas = app.leccionesOrdenadas.map((l) => filaLeccion(l, app.progreso, app.ultimos));
    return [...agruparPor(filas, (f) => f.leccion.libro)].map(([libro, fs]) => ({
      libro,
      nivel: fs[0].leccion.nivel,
      esRepaso: fs.every((f) => f.leccion.dossier === 0),
      dossiers: [...agruparPor(fs, (f) => f.leccion.dossier)].sort((a, b) => a[0] - b[0]),
    }));
  });

  const mejores = $derived.by(() => {
    const m = new Map<string, number>();
    for (const e of app.progreso.examenes) {
      const k = `${e.libro}|${e.dossier}`;
      m.set(k, Math.max(m.get(k) ?? 0, e.nota10));
    }
    return m;
  });

  const fallos = $derived(ejerciciosFallados(app.lecciones, app.progreso).length);
  const hoy = $derived(app.resumenHoy);
  const nuevasHoy = $derived(Math.min(hoy.nuevas, app.ajustes.nuevasPorSesion));
</script>

<header class="saludo">
  <p class="seccion">{fecha}</p>
  {#if app.ajustes.nombre.trim()}
    <p class="hola fr tenue">Bonjour,</p>
    <h1>{app.ajustes.nombre.trim()}.</h1>
  {:else}
    <h1>Bonjour !</h1>
  {/if}
</header>

{#if app.lecciones.length === 0}
  <Vacio titulo="Todavía no tienes lecciones" texto="Las lecciones del curso te las pasan en archivos .json (por WhatsApp, correo…). Guárdalos en el ordenador y arrástralos aquí. Mientras tanto, ya puedes practicar los verbos.">
    <a class="btn secundario" href={href('verbos')}>Ir a Verbos</a>
  </Vacio>
  <ZonaImportar />
{:else}
  <section class="hoy">
    <a class="tarjeta dia rayado" href={href('repaso')}>
      <p class="seccion">Repaso de hoy</p>
      {#if hoy.pendientes + nuevasHoy > 0}
        <p class="numero fr">{hoy.pendientes + nuevasHoy}</p>
        <p class="tenue">
          {hoy.pendientes} {hoy.pendientes === 1 ? 'palabra toca' : 'palabras tocan'} hoy · {nuevasHoy} {nuevasHoy === 1 ? 'nueva' : 'nuevas'}
        </p>
        <span class="btn">Empezar el repaso</span>
      {:else}
        <p class="numero fr">✓</p>
        <p class="tenue">Repaso al día. ¡Muy bien!</p>
        <span class="btn secundario">Practicar igualmente</span>
      {/if}
    </a>
    <div class="pila">
      <a class="tarjeta mini" href={href('ejercicios', 'fallos')} class:apagada={fallos === 0}>
        <Icono nombre="lapiz" />
        <div class="crece">
          <strong>Mis fallos</strong>
          <p class="tenue peq">{fallos === 0 ? 'No tienes ejercicios pendientes de corregir' : `${fallos} ${fallos === 1 ? 'ejercicio' : 'ejercicios'} para repetir`}</p>
        </div>
        <Icono nombre="siguiente" />
      </a>
      <a class="tarjeta mini" href={href('practicar')}>
        <Icono nombre="tarjetas" />
        <div class="crece">
          <strong>Más práctica</strong>
          <p class="tenue peq">Test de vocabulario, emparejar y dictado</p>
        </div>
        <Icono nombre="siguiente" />
      </a>
    </div>
  </section>

  {#each grupos as g (g.libro)}
    <section class="libro">
      <div class="titulo-libro">
        <h2>{g.esRepaso ? `Repaso ${g.nivel}` : g.libro}</h2>
        <span class="etiqueta">{g.nivel}{g.esRepaso ? ` · ${g.libro}` : ''}</span>
      </div>
      {#each g.dossiers as [dossier, filas] (dossier)}
        <div class="dossier d{dossier % 6}">
          {#if !g.esRepaso}<p class="seccion acento">Dossier {dossier}</p>{/if}
          <div class="rejilla">
            {#each filas as f (f.leccion.id)}
              <a class="tarjeta leccion" href={href('leccion', f.leccion.id)}>
                <div class="fila">
                  <span class="lomo">{g.esRepaso ? `R${f.leccion.numero}` : `L${f.leccion.numero}`}</span>
                  <div class="crece">
                    <h3>{f.leccion.titulo}</h3>
                    <p class="tenue peq">{f.leccion.tituloEs}</p>
                  </div>
                </div>
                <Barra valor={f.fraccion} color="var(--acento)" etiqueta="Progreso de la lección" />
                <p class="tenue peq datos">
                  {f.palabrasMemorizadas}/{f.vocab} palabras memorizadas · {f.ejerciciosBien}/{f.ejercicios} ejercicios
                  {#if f.leccion.estado !== 'completa'}<span class="etiqueta">parcial</span>{/if}
                </p>
              </a>
            {/each}
            {#if true}
              {@const mejor = mejores.get(`${g.libro}|${dossier}`)}
              <a class="tarjeta examen" href={href('examen', g.libro, dossier)}>
                <Icono nombre="examen" tam="1.6rem" />
                <div class="crece">
                  <h3>{dossier === 0 ? 'Examen del repaso' : `Examen del Dossier ${dossier}`}</h3>
                  <p class="tenue peq">{TOTAL} preguntas · nota al final</p>
                </div>
                {#if mejor !== undefined}
                  <div class="nota"><strong class="fr">{formatearNota(mejor)}</strong><span class="peq tenue">mejor nota</span></div>
                {:else}
                  <span class="peq acento-txt">Empezar ›</span>
                {/if}
              </a>
            {/if}
          </div>
        </div>
      {/each}
    </section>
  {/each}
{/if}

<style>
  .saludo { margin-bottom: 1.8rem; }
  .saludo .hola { font-size: 1.8rem; margin: 0.4rem 0 0; }
  .saludo h1 { font-size: 2.8rem; color: var(--primario); font-weight: 400; }
  .hoy { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; margin-bottom: 2.5rem; }
  @media (max-width: 44rem) { .hoy { grid-template-columns: 1fr; } }
  .dia { padding-left: 2rem; }
  .dia .numero { font-size: 3.2rem; line-height: 1; margin: 0.6rem 0 0.3rem; color: var(--primario); }
  .dia .btn { margin-top: 0.8rem; }
  .mini { display: flex; align-items: center; gap: 1rem; color: var(--primario); }
  .mini strong { color: var(--texto); }
  .mini p { margin: 0.1rem 0 0; }
  .mini.apagada { opacity: 0.7; }
  .libro { margin-bottom: 2.5rem; }
  .titulo-libro { display: flex; align-items: baseline; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1rem; border-bottom: 1px solid var(--borde); padding-bottom: 0.6rem; }
  .dossier { margin-bottom: 1.6rem; }
  .acento { color: var(--acento); margin-bottom: 0.7rem; }
  .leccion { display: flex; flex-direction: column; gap: 0.8rem; border-left: 4px solid var(--acento); }
  .leccion h3 { font-size: 1.1rem; }
  .leccion p { margin: 0.15rem 0 0; }
  .lomo {
    flex: none; display: grid; place-items: center; min-width: 2.8rem; min-height: 2.8rem; border-radius: var(--r-s);
    background: var(--acento-suave); color: var(--acento); font: 600 1rem var(--serif);
  }
  .datos { margin: 0 !important; }
  .examen { display: flex; align-items: center; gap: 1rem; color: var(--acento); background: var(--acento-suave); border-color: color-mix(in srgb, var(--acento) 35%, transparent); }
  .examen h3 { font-size: 1.05rem; color: var(--acento); }
  .examen p { margin: 0.15rem 0 0; }
  .nota { display: flex; flex-direction: column; align-items: flex-end; }
  .nota strong { font-size: 1.6rem; line-height: 1; }
  .acento-txt { color: var(--acento); font-weight: 600; }
</style>
