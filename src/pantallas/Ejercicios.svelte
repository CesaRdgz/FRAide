<script lang="ts">
  import Barra from '../componentes/Barra.svelte';
  import BotonVoz from '../componentes/BotonVoz.svelte';
  import Cabecera from '../componentes/Cabecera.svelte';
  import Confeti from '../componentes/Confeti.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { atras, href } from '../estado/ruta.svelte';
  import { barajar } from '../lib/aleatorio';
  import { conHueco } from '../lib/markdown';
  import { esGenerado, sesionVocabulario } from '../lib/practica';
  import { ejerciciosFallados } from '../lib/progreso';
  import { evaluar, opcionCorrecta, type Resultado } from '../lib/respuestas';
  import type { Ejercicio } from '../lib/tipos';

  let { modo, leccionId }: { modo: 'leccion' | 'fallos' | 'vocabulario'; leccionId?: string } = $props();

  const leccion = $derived(leccionId ? app.leccion(leccionId) : undefined);

  function preparar(): Ejercicio[] {
    if (modo === 'fallos') return barajar(ejerciciosFallados(app.lecciones, app.progreso));
    if (modo === 'vocabulario') {
      const vocab = leccion ? leccion.vocabulario : app.vocab;
      return sesionVocabulario(vocab, app.vocab, 15);
    }
    return leccion ? barajar(leccion.ejercicios) : [];
  }

  interface Respondida {
    ej: Ejercicio;
    respuesta: string;
    resultado: Resultado;
  }

  let cola = $state<Ejercicio[]>(preparar());
  // Opciones barajadas una vez por tanda
  const opciones = $derived(cola.map((e) => (e.fijas ? e.opciones : barajar(e.opciones))));
  let indice = $state(0);
  let escrito = $state('');
  let elegida = $state<string | null>(null);
  let resultado = $state<Resultado | null>(null);
  let hechas = $state<Respondida[]>([]);
  let campo = $state<HTMLInputElement | null>(null);

  const actual = $derived(cola[indice]);
  const terminado = $derived(cola.length > 0 && indice >= cola.length);
  const aciertos = $derived(hechas.filter((h) => h.resultado.correcto).length);

  const titulo = $derived(
    modo === 'fallos' ? 'Mis fallos' : modo === 'vocabulario' ? (leccion ? `Test · ${leccion.titulo}` : 'Test de vocabulario') : (leccion?.titulo ?? 'Ejercicios'),
  );

  $effect(() => {
    if (actual && actual.opciones.length === 0 && !resultado) campo?.focus();
  });

  function comprobar(respuesta: string) {
    if (!actual || resultado) return;
    const r: Resultado =
      actual.opciones.length > 0
        ? opcionCorrecta(respuesta, actual.respuestas)
          ? { tipo: 'correcto', correcto: true }
          : { tipo: 'incorrecto', correcto: false, esperada: actual.respuestas[0] }
        : evaluar(respuesta, actual.respuestas);
    resultado = r;
    hechas.push({ ej: actual, respuesta, resultado: r });
    if (esGenerado(actual)) app.registrarPractica();
    else app.registrarIntento(actual, r.correcto, respuesta);
  }

  function siguiente() {
    indice++;
    escrito = '';
    elegida = null;
    resultado = null;
  }

  function reiniciar(soloFallos: boolean) {
    const nueva = soloFallos ? hechas.filter((h) => !h.resultado.correcto).map((h) => h.ej) : preparar();
    cola = barajar(nueva);
    hechas = [];
    indice = 0;
    escrito = '';
    elegida = null;
    resultado = null;
  }

  function teclado(e: KeyboardEvent) {
    if (!actual || terminado) return;
    const destino = (e.target as HTMLElement)?.tagName;
    const enCampo = destino === 'INPUT';
    // En el campo de texto manda el formulario; en un botón, su propio clic
    if (e.key === 'Enter' && (enCampo || destino === 'BUTTON')) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (resultado) siguiente();
      else if (actual.opciones.length === 0 && escrito.trim()) comprobar(escrito);
      return;
    }
    if (!enCampo && !resultado && /^[1-9]$/.test(e.key)) {
      const op = opciones[indice]?.[Number(e.key) - 1];
      if (op !== undefined) {
        elegida = op;
        comprobar(op);
      }
    }
  }
</script>

<svelte:window onkeydown={teclado} />

<Cabecera {titulo} subtitulo={cola.length && !terminado ? `Pregunta ${indice + 1} de ${cola.length}` : undefined} />

{#if cola.length === 0}
  {#if modo === 'fallos'}
    <Vacio titulo="¡Sin fallos pendientes!" texto="Cuando falles un ejercicio de una lección aparecerá aquí hasta que lo aciertes.">
      <a class="btn" href={href()}>Ir a Lecciones</a>
    </Vacio>
  {:else}
    <Vacio titulo="No hay ejercicios" texto="Esta lección no tiene suficiente contenido para esta práctica.">
      <button class="btn" type="button" onclick={() => atras()}>Volver</button>
    </Vacio>
  {/if}
{:else if terminado}
  {@const pct = aciertos / hechas.length}
  {#if pct >= 0.8}<Confeti />{/if}
  <div class="resumen tarjeta rayado">
    <p class="seccion">Resultado</p>
    <p class="cifra fr">{aciertos}<span class="tenue">/{hechas.length}</span></p>
    <p class="tenue">{pct === 1 ? '¡Perfecto!' : pct >= 0.8 ? '¡Muy bien!' : pct >= 0.5 ? 'Vas bien, repasa los fallos.' : 'Toca repasar: vuelve a la teoría y repite.'}</p>
    <div class="fila envuelve botones">
      {#if aciertos < hechas.length}<button class="btn" type="button" onclick={() => reiniciar(true)}>Repetir los fallos</button>{/if}
      <button class="btn secundario" type="button" onclick={() => reiniciar(false)}>{modo === 'vocabulario' ? 'Otra tanda' : 'Empezar de nuevo'}</button>
      <button class="btn texto" type="button" onclick={() => atras()}>Volver</button>
    </div>
  </div>
  {#if aciertos < hechas.length}
    <h2 class="titulo-fallos">Repasa tus fallos</h2>
    <div class="pila">
      {#each hechas.filter((h) => !h.resultado.correcto) as h, i (i)}
        <div class="tarjeta plana fallo">
          <p class="fr enun">{@html conHueco(h.ej.enunciado)}</p>
          <p><span class="tenue peq">Tu respuesta:</span> <span class="fr mal-txt">{h.respuesta || '(en blanco)'}</span></p>
          <p><span class="tenue peq">Correcta:</span> <span class="fr bien-txt">{h.ej.respuestas[0]}</span></p>
          {#if h.ej.explicacion}<p class="tenue peq">{h.ej.explicacion}</p>{/if}
        </div>
      {/each}
    </div>
  {/if}
{:else if actual}
  <div class="ejercicio">
    <Barra valor={indice / cola.length} color="var(--secundario)" etiqueta="Avance" />
    <div class="tarjeta rayado enunciado">
      <div class="fila">
        <p class="fr crece">{@html conHueco(actual.enunciado)}</p>
        {#if modo === 'vocabulario' && actual.id.includes(':trad:es:')}<BotonVoz texto={actual.enunciado} />{/if}
      </div>
    </div>

    {#if actual.opciones.length > 0}
      <div class="pila">
        {#each opciones[indice] ?? [] as op, i (op)}
          {@const esCorrecta = opcionCorrecta(op, actual.respuestas)}
          <button
            type="button"
            class="opcion"
            class:bien={resultado && esCorrecta}
            class:mal={resultado && elegida === op && !esCorrecta}
            disabled={resultado !== null}
            onclick={() => {
              elegida = op;
              comprobar(op);
            }}
          >
            <span class="letra">{i + 1}</span>
            <span class="crece">{op}</span>
          </button>
        {/each}
      </div>
    {:else}
      <form
        class="fila"
        onsubmit={(e) => {
          e.preventDefault();
          if (resultado) siguiente();
          else if (escrito.trim()) comprobar(escrito);
        }}
      >
        <input
          bind:this={campo}
          class="campo grande crece"
          bind:value={escrito}
          placeholder="Escribe tu respuesta"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          lang="fr"
          readonly={resultado !== null}
          aria-label="Tu respuesta"
        />
        {#if !resultado}<button class="btn" type="submit" disabled={!escrito.trim()}>Comprobar</button>{/if}
      </form>
    {/if}

    {#if resultado}
      <div class="correccion {resultado.correcto ? 'bien' : 'mal'}" aria-live="polite">
        {#if resultado.tipo === 'correcto'}
          <strong>¡Correcto!</strong>
        {:else if resultado.tipo === 'sinAcentos'}
          <strong>Bien, pero ojo con los acentos: <span class="fr">{resultado.esperada}</span></strong>
        {:else}
          <strong>La respuesta es: <span class="fr">{resultado.esperada}</span></strong>
        {/if}
        {#if actual.explicacion}<p class="expl">{actual.explicacion}</p>{/if}
      </div>
      <div class="fila entre">
        <span class="tenue peq">Pulsa <kbd>Intro</kbd> para seguir</span>
        <button class="btn" type="button" onclick={siguiente}>{indice + 1 < cola.length ? 'Siguiente' : 'Ver resultado'}</button>
      </div>
    {:else if actual.opciones.length > 0}
      <p class="tenue peq atajo">Atajo: pulsa <kbd>1</kbd>–<kbd>{Math.min(9, actual.opciones.length)}</kbd> para responder</p>
    {/if}
  </div>
{/if}

<style>
  .ejercicio { max-width: 44rem; display: grid; gap: 1.2rem; }
  .enunciado { padding-left: 2rem; }
  .enunciado p { font-size: 1.5rem; margin: 0; line-height: 1.4; }
  .correccion .expl { margin: 0.3rem 0 0; white-space: pre-line; }
  .atajo { margin: 0; }
  .resumen { max-width: 36rem; padding-left: 2rem; }
  .cifra { font-size: 3.6rem; line-height: 1; margin: 0.5rem 0; color: var(--primario); }
  .cifra span { font-size: 2rem; }
  .botones { margin-top: 1rem; }
  .titulo-fallos { margin: 2rem 0 1rem; }
  .fallo { max-width: 44rem; }
  .fallo p { margin: 0.2rem 0; }
  .enun { font-size: 1.1rem; }
  .mal-txt { color: var(--secundario); }
  .bien-txt { color: var(--terciario); }
</style>
