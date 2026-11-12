<script lang="ts">
  import { untrack } from 'svelte';
  import Barra from '../componentes/Barra.svelte';
  import BotonVoz from '../componentes/BotonVoz.svelte';
  import Cabecera from '../componentes/Cabecera.svelte';
  import Confeti from '../componentes/Confeti.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { atras, href } from '../estado/ruta.svelte';
  import { voz } from '../estado/voz.svelte';
  import { barajar } from '../lib/aleatorio';
  import { sesionRepaso } from '../lib/progreso';
  import type { Vocab } from '../lib/tipos';

  let { modo, leccionId }: { modo: 'diario' | 'leccion' | 'libre'; leccionId?: string } = $props();

  const leccion = $derived(leccionId ? app.leccion(leccionId) : undefined);

  function preparar(m: typeof modo): Vocab[] {
    if (m === 'leccion') return barajar(leccion?.vocabulario ?? []);
    if (m === 'libre') return barajar(app.vocab).slice(0, 20);
    return sesionRepaso(app.vocab, app.progreso, app.ajustes.nuevasPorSesion);
  }

  // La pantalla se vuelve a crear al cambiar de ruta: basta con el valor inicial
  const inicial = untrack(() => preparar(modo));
  let modoActual = $state(untrack(() => modo));
  let cola = $state<Vocab[]>(inicial);
  let total = $state(inicial.length);
  let indice = $state(0);
  let revelada = $state(false);
  let inverso = $state(false);
  let falladas = $state(0);

  const actual = $derived(cola[indice]);
  const terminado = $derived(cola.length > 0 && indice >= cola.length);

  function revelar() {
    revelada = true;
    if (inverso && actual) voz.hablar(actual.fr);
  }

  function responder(sabia: boolean) {
    if (!actual || !revelada) return;
    app.responderTarjeta(actual.id, sabia);
    // Si fallas, la palabra vuelve al final de la sesión
    if (!sabia) {
      cola.push(actual);
      falladas++;
    }
    indice++;
    revelada = false;
  }

  function empezar(m: typeof modo) {
    modoActual = m;
    cola = preparar(m);
    total = cola.length;
    indice = 0;
    revelada = false;
    falladas = 0;
  }

  function teclado(e: KeyboardEvent) {
    if (!actual || terminado) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!revelada) revelar();
      else responder(true);
    } else if (revelada && (e.key === '1' || e.key === 'ArrowLeft')) responder(false);
    else if (revelada && (e.key === '2' || e.key === 'ArrowRight')) responder(true);
  }
</script>

<svelte:window onkeydown={teclado} />

<Cabecera
  titulo={modoActual === 'leccion' ? `Tarjetas · ${leccion?.titulo ?? ''}` : modoActual === 'libre' ? 'Práctica libre' : 'Repaso de hoy'}
  subtitulo={cola.length && !terminado ? `Tarjeta ${indice + 1} de ${cola.length}` : undefined}
>
  {#snippet acciones()}
    <button class="btn texto" type="button" onclick={() => ((inverso = !inverso), (revelada = false))} title="Cambiar el sentido de las tarjetas">
      <Icono nombre="girar" tam="1.1rem" />
      {inverso ? 'ES → FR' : 'FR → ES'}
    </button>
  {/snippet}
</Cabecera>

{#if cola.length === 0}
  {#if app.vocab.length === 0}
    <Vacio titulo="No hay palabras todavía" texto="Importa alguna lección para empezar a repasar vocabulario.">
      <a class="btn" href={href('ajustes')}>Importar lecciones</a>
    </Vacio>
  {:else}
    <Vacio titulo="¡Repaso al día!" texto="Hoy no te toca ninguna palabra. Puedes practicar igualmente sin que cambie tu calendario de repaso.">
      <button class="btn" type="button" onclick={() => empezar('libre')}>Práctica libre (20 palabras)</button>
    </Vacio>
  {/if}
{:else if terminado}
  {#if falladas === 0}<Confeti />{/if}
  <div class="tarjeta rayado fin">
    <p class="seccion">¡Hecho!</p>
    <p class="cifra fr">{total}</p>
    <p class="tenue">{total === 1 ? 'palabra repasada' : 'palabras repasadas'}{falladas ? ` · ${falladas} ${falladas === 1 ? 'vuelta' : 'vueltas'} extra por fallos` : ' sin un solo fallo'}</p>
    <div class="fila envuelve">
      {#if modoActual === 'diario'}
        <button class="btn" type="button" onclick={() => empezar('libre')}>Seguir practicando</button>
      {:else}
        <button class="btn" type="button" onclick={() => empezar(modoActual)}>Otra vuelta</button>
      {/if}
      <button class="btn texto" type="button" onclick={() => atras()}>Volver</button>
    </div>
  </div>
{:else if actual}
  <div class="repaso">
    <Barra valor={indice / cola.length} color="var(--terciario)" etiqueta="Avance" />
    <button class="tarjeta rayado carta" type="button" onclick={() => !revelada && revelar()} aria-live="polite">
      <div class="cara">
        {#if !inverso}
          <div class="fila centrada">
            <span class="fr grande">{actual.fr}</span>
            <BotonVoz texto={actual.fr} />
          </div>
        {:else}
          <span class="fr grande">{actual.es}</span>
        {/if}
        {#if actual.categoria}<span class="etiqueta">{actual.categoria}</span>{/if}
      </div>
      {#if revelada}
        <div class="dorso">
          {#if !inverso}
            <p class="trad">{actual.es}</p>
          {:else}
            <div class="fila centrada"><span class="fr trad">{actual.fr}</span><BotonVoz texto={actual.fr} /></div>
          {/if}
          {#if actual.ejemploFr}<p class="fr ejemplo">{actual.ejemploFr}</p>{/if}
          {#if actual.ejemploEs}<p class="tenue peq">{actual.ejemploEs}</p>{/if}
          {#if actual.nota}<p class="nota peq">{actual.nota}</p>{/if}
        </div>
      {:else}
        <p class="pista tenue peq">Piensa la respuesta y pulsa para darle la vuelta <kbd>Espacio</kbd></p>
      {/if}
    </button>

    {#if revelada}
      <div class="respuestas">
        <button class="btn peligro" type="button" onclick={() => responder(false)}><Icono nombre="cruz" tam="1.1rem" /> No lo sabía <kbd>1</kbd></button>
        <button class="btn bien" type="button" onclick={() => responder(true)}><Icono nombre="check" tam="1.1rem" /> Lo sabía <kbd>2</kbd></button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .repaso { max-width: 40rem; margin: 0 auto; display: grid; gap: 1.2rem; }
  .carta { min-height: 18rem; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 1.2rem; padding: 2rem 2rem 2rem 2.6rem; }
  .carta:hover { transform: none !important; }
  .cara { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
  .centrada { justify-content: center; }
  .grande { font-size: 2.2rem; line-height: 1.2; }
  .dorso { border-top: 1px dashed var(--borde); padding-top: 1.2rem; width: 100%; }
  .dorso p { margin: 0.25rem 0; }
  .trad { font-size: 1.5rem; color: var(--primario); }
  .ejemplo { font-size: 1.1rem; }
  .nota { color: var(--secundario); }
  .pista { margin: 0; }
  .respuestas { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; }
  .respuestas .btn { min-height: 3.4rem; }
  .respuestas kbd { background: transparent; color: inherit; border-color: currentColor; opacity: 0.7; }
  .btn.bien { background: var(--terciario); color: var(--sobre-terciario); }
  .fin { max-width: 36rem; padding-left: 2rem; }
  .cifra { font-size: 3.6rem; line-height: 1; margin: 0.4rem 0; color: var(--primario); }
</style>
