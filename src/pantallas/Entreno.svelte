<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import BotonVoz from '../componentes/BotonVoz.svelte';
  import Cabecera from '../componentes/Cabecera.svelte';
  import Confeti from '../componentes/Confeti.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { atras, href } from '../estado/ruta.svelte';
  import type { Resultado } from '../lib/respuestas';
  import type { DatosVerbos } from '../lib/tipos';
  import { evaluarVerbo, type GrupoVerbos, PERSONAS_CORTAS, type PreguntaVerbo, sesionVerbos, ultimosVerbos } from '../lib/verbos';

  let { tiempos, grupo, cantidad }: { tiempos: string[]; grupo: string; cantidad: number } = $props();

  let datos = $state<DatosVerbos | null>(null);
  let preguntas = $state<PreguntaVerbo[]>([]);
  let indice = $state(0);
  let escrito = $state('');
  let resultado = $state<Resultado | null>(null);
  let fallos = $state<{ p: PreguntaVerbo; respuesta: string }[]>([]);
  let campo = $state<HTMLInputElement | null>(null);

  function preparar(d: DatosVerbos) {
    preguntas = sesionVerbos(d, new Set(tiempos), grupo as GrupoVerbos, cantidad, ultimosVerbos(app.progreso.intentosVerbo));
    indice = 0;
    escrito = '';
    resultado = null;
    fallos = [];
  }

  app.verbos().then((d) => {
    datos = d;
    preparar(d);
  });

  const actual = $derived(preguntas[indice]);
  const terminado = $derived(preguntas.length > 0 && indice >= preguntas.length);

  $effect(() => {
    if (actual && !resultado) campo?.focus();
  });

  function comprobar() {
    if (!actual || resultado || !escrito.trim()) return;
    const r = evaluarVerbo(escrito, actual.forma);
    resultado = r;
    if (!r.correcto) fallos.push({ p: actual, respuesta: escrito });
    app.registrarVerbo(actual.verbo.inf, actual.tiempo.id, actual.persona, r.correcto);
  }

  function siguiente() {
    indice++;
    escrito = '';
    resultado = null;
  }

  const persona = (p: PreguntaVerbo) => (p.tiempo.id === 'imperativo' ? `(${PERSONAS_CORTAS[p.persona].split(' ')[0]})` : PERSONAS_CORTAS[p.persona]);
</script>

<Cabecera titulo="Entrenador de verbos" subtitulo={preguntas.length && !terminado ? `${indice + 1} de ${preguntas.length}` : undefined} />

{#if !datos}
  <p class="tenue">Cargando…</p>
{:else if preguntas.length === 0}
  <Vacio titulo="No hay nada que practicar" texto="No hay formas para esta combinación (si elegiste «Mis fallos», no tienes ninguno).">
    <a class="btn" href={href('verbos')}>Volver a Verbos</a>
  </Vacio>
{:else if terminado}
  {@const bien = preguntas.length - fallos.length}
  {#if fallos.length === 0}<Confeti />{/if}
  <div class="tarjeta rayado fin">
    <p class="seccion">Resultado</p>
    <p class="fr cifra">{bien}<span class="tenue">/{preguntas.length}</span></p>
    <div class="fila envuelve">
      <button class="btn" type="button" onclick={() => datos && preparar(datos)}>Otra tanda</button>
      <button class="btn texto" type="button" onclick={() => atras('verbos')}>Volver</button>
    </div>
  </div>
  {#if fallos.length}
    <h2 class="sub">Repasa</h2>
    <div class="tarjeta plana">
      <table class="tabla">
        <thead><tr><th>Verbo</th><th>Tiempo</th><th>Tu respuesta</th><th>Correcta</th></tr></thead>
        <tbody>
          {#each fallos as f, i (i)}
            <tr>
              <td><a href={href('verbo', f.p.verbo.inf)}>{f.p.verbo.inf}</a></td>
              <td class="sans">{f.p.tiempo.nombre}</td>
              <td class="mal-txt">{f.respuesta}</td>
              <td class="bien-txt">{f.p.forma.d}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{:else if actual}
  <div class="entreno">
    <Barra valor={indice / preguntas.length} color="var(--primario)" etiqueta="Avance" />
    <div class="tarjeta rayado pregunta">
      <span class="etiqueta">{actual.tiempo.nombre}</span>
      <p class="fr verbo">{actual.verbo.inf} <span class="tenue es">({actual.verbo.es})</span></p>
      <p class="persona fr">{persona(actual)} <span class="hueco"></span></p>
    </div>
    <form
      class="fila"
      onsubmit={(e) => {
        e.preventDefault();
        if (resultado) siguiente();
        else comprobar();
      }}
    >
      <input bind:this={campo} class="campo grande crece" bind:value={escrito} placeholder="Conjuga…" lang="fr" autocomplete="off" autocapitalize="off" spellcheck="false" readonly={resultado !== null} aria-label="Forma conjugada" />
      <button class="btn" type="submit" disabled={!resultado && !escrito.trim()}>{resultado ? 'Siguiente' : 'Comprobar'}</button>
    </form>
    {#if resultado}
      <div class="correccion {resultado.correcto ? 'bien' : 'mal'}">
        <div class="fila">
          <strong class="crece">
            {resultado.tipo === 'correcto' ? '¡Correcto!' : resultado.tipo === 'sinAcentos' ? 'Bien, pero ojo con los acentos:' : 'Era:'}
            <span class="fr">{actual.forma.d}</span>
          </strong>
          <BotonVoz texto={actual.forma.d.replace(/ \/ elles?/, '')} />
        </div>
      </div>
    {:else}
      <p class="tenue peq">Puedes escribir el sujeto o no: «suis» y «je suis» valen igual. <kbd>Intro</kbd> para comprobar.</p>
    {/if}
  </div>
{/if}

<style>
  .entreno { max-width: 40rem; display: grid; gap: 1.2rem; }
  .pregunta { padding-left: 2rem; }
  .verbo { font-size: 2rem; margin: 0.6rem 0 0.2rem; }
  .es { font-size: 1rem; font-family: var(--sans); }
  .persona { font-size: 1.4rem; margin: 0; color: var(--primario); }
  .fin { max-width: 32rem; padding-left: 2rem; }
  .cifra { font-size: 3.2rem; margin: 0.3rem 0; color: var(--primario); line-height: 1; }
  .cifra span { font-size: 1.8rem; }
  .sub { margin: 2rem 0 1rem; }
  .sans { font-family: var(--sans) !important; }
  .mal-txt { color: var(--secundario); }
  .bien-txt { color: var(--terciario); }
</style>
