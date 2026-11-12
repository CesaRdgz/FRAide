<script lang="ts">
  import Icono from '../componentes/Icono.svelte';
  import SelectorTamano from '../componentes/SelectorTamano.svelte';
  import ZonaImportar from '../componentes/ZonaImportar.svelte';
  import { app } from '../estado/app.svelte';
  import { voz } from '../estado/voz.svelte';
  import { diaLocal } from '../lib/progreso';

  let nombre = $state(app.ajustes.nombre);
  let dialogoBorrar = $state<HTMLDialogElement | null>(null);

  function exportar() {
    const blob = new Blob([app.copiaDeProgreso()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fraide-progreso-${diaLocal()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function borrarLeccion(id: string, titulo: string) {
    if (confirm(`¿Quitar «${titulo}»? Tu progreso en ella se conserva si la vuelves a importar.`)) app.borrarLeccion(id);
  }
</script>

<h1 class="titulo">Ajustes</h1>

<div class="columnas">
  <div class="pila">
    <section class="tarjeta">
      <h2>Perfil</h2>
      <label class="pila etiqueta-campo">
        <span>Tu nombre</span>
        <input class="campo" bind:value={nombre} maxlength="24" placeholder="Opcional" onchange={() => app.guardarAjustes({ nombre: nombre.trim() })} />
      </label>
    </section>

    <section class="tarjeta">
      <h2>Accesibilidad</h2>
      <p class="sub">Tamaño de la letra</p>
      <SelectorTamano />
      <p class="fr muestra">Je m'appelle Marie et j'habite à Paris.</p>
      <label class="interruptor">
        <span class="crece">
          <span>Alto contraste</span>
          <span class="tenue peq">Textos secundarios y bordes más marcados.</span>
        </span>
        <input type="checkbox" checked={app.ajustes.altoContraste} onchange={(e) => app.guardarAjustes({ altoContraste: e.currentTarget.checked })} />
      </label>
      <p class="sub">Tema</p>
      <div class="fila envuelve">
        {#each [['sistema', 'Como el sistema'], ['claro', 'Claro'], ['oscuro', 'Oscuro']] as const as [id, txt] (id)}
          <button type="button" class="chip" aria-pressed={app.ajustes.tema === id} onclick={() => app.guardarAjustes({ tema: id })}>{txt}</button>
        {/each}
      </div>
    </section>

    <section class="tarjeta">
      <h2>Voz y repaso</h2>
      {#if voz.disponible}
        <label class="pila etiqueta-campo">
          <span>Velocidad de la voz: {Math.round(app.ajustes.velocidadVoz * 100)} %</span>
          <input type="range" min="0.5" max="1.2" step="0.05" value={app.ajustes.velocidadVoz} oninput={(e) => app.guardarAjustes({ velocidadVoz: Number(e.currentTarget.value) })} />
        </label>
        <button class="btn texto" type="button" onclick={() => voz.hablar(app.ajustes.nombre ? `Bonjour ! Je m'appelle ${app.ajustes.nombre}.` : 'Bonjour ! Comment ça va ?')}>
          <Icono nombre="altavoz" tam="1.1rem" /> Probar la voz
        </button>
      {:else}
        <p class="tenue peq">No hay ninguna voz francesa en este ordenador. En Windows: Configuración → Hora e idioma → Voz → Agregar voces → Français (France), y recarga la página.</p>
      {/if}
      <label class="pila etiqueta-campo">
        <span>Palabras nuevas por repaso diario: {app.ajustes.nuevasPorSesion}</span>
        <input type="range" min="5" max="40" step="5" value={app.ajustes.nuevasPorSesion} oninput={(e) => app.guardarAjustes({ nuevasPorSesion: Number(e.currentTarget.value) })} />
      </label>
    </section>
  </div>

  <div class="pila">
    <section class="tarjeta">
      <h2>Lecciones</h2>
      <ZonaImportar compacta />
      {#if app.leccionesOrdenadas.length}
        <ul class="lecciones">
          {#each app.leccionesOrdenadas as l (l.id)}
            <li>
              <span class="crece">
                <span class="fr">{l.titulo}</span>
                <span class="tenue peq">{l.libro} · {l.dossier === 0 ? 'Repaso' : `D${l.dossier} L${l.numero}`}</span>
              </span>
              <button class="btn-icono" type="button" title="Quitar lección" aria-label="Quitar {l.titulo}" onclick={() => borrarLeccion(l.id, l.titulo)}>
                <Icono nombre="papelera" tam="1.2rem" />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="tarjeta">
      <h2>Tu progreso</h2>
      <p class="tenue peq">Se guarda solo en este navegador. Exporta una copia de vez en cuando: sirve para no perderlo y para pasarlo a otro ordenador o al móvil Android (es el mismo formato).</p>
      <div class="fila envuelve">
        <button class="btn" type="button" onclick={exportar}><Icono nombre="descargar" tam="1.1rem" /> Exportar progreso</button>
        <span class="tenue peq">Para restaurar, importa el archivo como una lección.</span>
      </div>
      <button class="btn texto peligro-txt" type="button" onclick={() => dialogoBorrar?.showModal()}>Borrar todo mi progreso…</button>
    </section>

    <section class="tarjeta acerca">
      <h2>Acerca de</h2>
      <p class="peq">FRAide web {__VERSION__}. Proyecto personal sin ánimo de lucro, no afiliado a ninguna editorial. Las lecciones no forman parte de la web: cada persona importa las suyas.</p>
      <p class="peq tenue">Fuentes Fraunces e Inter (SIL Open Font License). Iconos de Material Icons (Apache 2.0).</p>
    </section>
  </div>
</div>

<dialog bind:this={dialogoBorrar}>
  <h3>¿Borrar todo el progreso?</h3>
  <p class="tenue">Se perderán tus tarjetas, ejercicios, verbos, racha y notas de examen. Las lecciones no se borran. No se puede deshacer: exporta una copia antes si tienes dudas.</p>
  <div class="fila" style="justify-content:flex-end">
    <button class="btn texto" type="button" onclick={() => dialogoBorrar?.close()}>Cancelar</button>
    <button
      class="btn peligro"
      type="button"
      onclick={() => {
        app.reiniciarProgreso();
        dialogoBorrar?.close();
      }}>Borrar</button
    >
  </div>
</dialog>

<style>
  .titulo { margin-bottom: 1.5rem; }
  .columnas { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
  @media (max-width: 64rem) { .columnas { grid-template-columns: 1fr; } }
  section h2 { font-size: 1.25rem; margin-bottom: 1rem; }
  .sub { font-weight: 500; margin: 1rem 0 0.5rem; }
  .sub:first-of-type { margin-top: 0; }
  .muestra { font-size: 1.15rem; margin: 0.8rem 0; }
  .etiqueta-campo { gap: 0.4rem; margin: 0.8rem 0; }
  .interruptor { display: flex; align-items: center; gap: 1rem; padding: 0.8rem 0; border-top: 1px solid var(--borde); border-bottom: 1px solid var(--borde); cursor: pointer; }
  .interruptor .crece { display: flex; flex-direction: column; }
  .interruptor input { width: 1.4rem; height: 1.4rem; accent-color: var(--primario); }
  input[type='range'] { accent-color: var(--primario); width: 100%; }
  .lecciones { list-style: none; padding: 0; margin: 1rem 0 0; }
  .lecciones li { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0; border-bottom: 1px solid var(--borde); }
  .lecciones li .crece { display: flex; flex-direction: column; }
  .peligro-txt { color: var(--secundario); margin-top: 0.6rem; }
  .acerca p { margin: 0.3rem 0; }
  dialog h3 { margin-bottom: 0.6rem; }
</style>
