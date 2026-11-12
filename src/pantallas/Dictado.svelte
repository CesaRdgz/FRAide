<script lang="ts">
  import Cabecera from '../componentes/Cabecera.svelte';
  import Icono from '../componentes/Icono.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { atras } from '../estado/ruta.svelte';
  import { voz } from '../estado/voz.svelte';
  import { dictado } from '../lib/practica';
  import { normalizar, sinAcentos, soloTexto } from '../lib/respuestas';

  let { ambito, frases }: { ambito: string; frases: boolean } = $props();

  const lecciones = $derived(ambito === 'todo' ? app.lecciones : app.lecciones.filter((l) => l.id === ambito));
  const vocab = $derived(lecciones.flatMap((l) => l.vocabulario));
  const extra = $derived(lecciones.flatMap((l) => l.gramatica.flatMap((g) => g.ejemplos.map((e) => e.fr))));

  let textos = $state<string[]>([]);
  let indice = $state(0);
  let escrito = $state('');
  let comprobado = $state<'bien' | 'acentos' | 'mal' | null>(null);
  let aciertos = $state(0);
  let campo = $state<HTMLInputElement | null>(null);

  function nueva() {
    textos = dictado(vocab, extra, frases, 10);
    indice = 0;
    aciertos = 0;
    escrito = '';
    comprobado = null;
  }
  nueva();

  const actual = $derived(textos[indice]);
  const terminado = $derived(textos.length > 0 && indice >= textos.length);

  $effect(() => {
    if (actual && !comprobado) {
      campo?.focus();
    }
  });

  function escuchar(lento = false) {
    if (actual) voz.hablar(actual, lento);
  }

  function comprobar() {
    if (!actual || comprobado || !escrito.trim()) return;
    const a = normalizar(soloTexto(escrito));
    const b = normalizar(soloTexto(actual));
    comprobado = a === b ? 'bien' : sinAcentos(a) === sinAcentos(b) ? 'acentos' : 'mal';
    if (comprobado !== 'mal') aciertos++;
    app.registrarPractica();
  }

  function siguiente() {
    indice++;
    escrito = '';
    comprobado = null;
    setTimeout(() => escuchar(), 150);
  }
</script>

<Cabecera titulo={frases ? 'Dictado de frases' : 'Dictado de palabras'} subtitulo={textos.length && !terminado ? `${indice + 1} de ${textos.length}` : undefined} />

{#if !voz.disponible}
  <Vacio titulo="No hay voz francesa" texto="Tu ordenador no tiene una voz en francés instalada. En Windows: Configuración → Hora e idioma → Voz → Agregar voces → Français (France). Después recarga la página.">
    <button class="btn" type="button" onclick={() => atras()}>Volver</button>
  </Vacio>
{:else if textos.length === 0}
  <Vacio titulo="No hay nada que dictar" texto="Este vocabulario no tiene palabras o frases adecuadas para un dictado.">
    <button class="btn" type="button" onclick={() => atras()}>Volver</button>
  </Vacio>
{:else if terminado}
  <div class="tarjeta rayado fin">
    <p class="seccion">Resultado</p>
    <p class="fr cifra">{aciertos}/{textos.length}</p>
    <div class="fila">
      <button class="btn" type="button" onclick={nueva}>Otro dictado</button>
      <button class="btn texto" type="button" onclick={() => atras()}>Volver</button>
    </div>
  </div>
{:else}
  <div class="dictado">
    <div class="tarjeta rayado escuchar">
      <button class="btn grande" type="button" onclick={() => escuchar()}><Icono nombre="altavoz" tam="1.6rem" /> Escuchar</button>
      <button class="btn texto" type="button" onclick={() => escuchar(true)}>Más despacio</button>
    </div>
    <form
      class="fila"
      onsubmit={(e) => {
        e.preventDefault();
        if (comprobado) siguiente();
        else comprobar();
      }}
    >
      <input bind:this={campo} class="campo grande crece" bind:value={escrito} placeholder="Escribe lo que oyes" lang="fr" autocomplete="off" spellcheck="false" readonly={comprobado !== null} aria-label="Lo que oyes" />
      <button class="btn" type="submit" disabled={!comprobado && !escrito.trim()}>{comprobado ? 'Siguiente' : 'Comprobar'}</button>
    </form>
    {#if comprobado}
      <div class="correccion {comprobado === 'mal' ? 'mal' : 'bien'}">
        <strong>{comprobado === 'bien' ? '¡Perfecto!' : comprobado === 'acentos' ? 'Casi: ojo con los acentos' : 'Era:'}</strong>
        <span class="fr">{actual}</span>
      </div>
    {:else}
      <p class="tenue peq">Las mayúsculas y los signos de puntuación no cuentan. <kbd>Intro</kbd> para comprobar.</p>
    {/if}
  </div>
{/if}

<style>
  .dictado { max-width: 40rem; display: grid; gap: 1.2rem; }
  .escuchar { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; padding: 2rem; }
  .btn.grande { min-height: 4rem; padding: 0 2rem; font-size: 1.1rem; }
  .correccion .fr { font-size: 1.2rem; }
  .fin { max-width: 32rem; padding-left: 2rem; }
  .cifra { font-size: 3rem; margin: 0.3rem 0; color: var(--primario); line-height: 1; }
</style>
