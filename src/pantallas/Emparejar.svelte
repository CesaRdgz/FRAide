<script lang="ts">
  import Cabecera from '../componentes/Cabecera.svelte';
  import Confeti from '../componentes/Confeti.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { atras } from '../estado/ruta.svelte';
  import { voz } from '../estado/voz.svelte';
  import { barajar } from '../lib/aleatorio';
  import { parejas } from '../lib/practica';

  let { ambito }: { ambito: string } = $props();

  const N = 6;
  const vocab = $derived(ambito === 'todo' ? app.vocab : (app.leccion(ambito)?.vocabulario ?? []));

  let pares = $state<[string, string][]>([]);
  let derecha = $state<string[]>([]);
  let elegidaFr = $state<string | null>(null);
  let hechas = $state<Set<string>>(new Set());
  let error = $state<string | null>(null);
  let fallos = $state(0);
  let ronda = $state(1);

  function nueva() {
    pares = parejas(vocab, N);
    derecha = barajar(pares.map((p) => p[1]));
    hechas = new Set();
    elegidaFr = null;
    fallos = 0;
  }
  nueva();

  const terminado = $derived(pares.length > 0 && hechas.size === pares.length);

  function elegirEs(es: string) {
    if (!elegidaFr) return;
    const par = pares.find((p) => p[0] === elegidaFr);
    if (par && par[1] === es) {
      hechas = new Set([...hechas, elegidaFr]);
      elegidaFr = null;
      app.registrarPractica();
    } else {
      fallos++;
      error = es;
      setTimeout(() => (error = null), 450);
    }
  }
</script>

<Cabecera titulo="Emparejar" subtitulo={`Ronda ${ronda} · elige una palabra francesa y luego su traducción`} />

{#if pares.length < 2}
  <Vacio titulo="No hay palabras suficientes" texto="Hacen falta al menos dos palabras para emparejar.">
    <button class="btn" type="button" onclick={() => atras()}>Volver</button>
  </Vacio>
{:else if terminado}
  {#if fallos === 0}<Confeti />{/if}
  <div class="tarjeta rayado fin">
    <p class="seccion">¡Ronda completa!</p>
    <p class="fr cifra">{pares.length}/{pares.length}</p>
    <p class="tenue">{fallos === 0 ? 'Sin ningún fallo.' : `${fallos} ${fallos === 1 ? 'intento fallido' : 'intentos fallidos'}.`}</p>
    <div class="fila">
      <button class="btn" type="button" onclick={() => (ronda++, nueva())}>Otra ronda</button>
      <button class="btn texto" type="button" onclick={() => atras()}>Volver</button>
    </div>
  </div>
{:else}
  <div class="columnas">
    <div class="pila">
      {#each pares as [fr] (fr)}
        <button
          type="button"
          class="opcion fr"
          class:elegida={elegidaFr === fr}
          class:bien={hechas.has(fr)}
          disabled={hechas.has(fr)}
          onclick={() => {
            elegidaFr = fr;
            voz.hablar(fr);
          }}>{fr}</button
        >
      {/each}
    </div>
    <div class="pila">
      {#each derecha as es (es)}
        {@const hecha = pares.some((p) => p[1] === es && hechas.has(p[0]))}
        <button type="button" class="opcion" class:bien={hecha} class:mal={error === es} disabled={hecha || !elegidaFr} onclick={() => elegirEs(es)}>{es}</button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .columnas { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 50rem; }
  .columnas .opcion { justify-content: center; text-align: center; min-height: 3.4rem; }
  .columnas .pila:last-child .opcion { font-family: var(--sans); font-size: 1rem; }
  .fin { max-width: 32rem; padding-left: 2rem; }
  .cifra { font-size: 3rem; margin: 0.3rem 0; color: var(--primario); line-height: 1; }
</style>
