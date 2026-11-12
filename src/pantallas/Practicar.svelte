<script lang="ts">
  import Icono, { type NombreIcono } from '../componentes/Icono.svelte';
  import Vacio from '../componentes/Vacio.svelte';
  import { app } from '../estado/app.svelte';
  import { href } from '../estado/ruta.svelte';
  import { ejerciciosFallados } from '../lib/progreso';

  let ambito = $state('todo');

  const fallos = $derived(ejerciciosFallados(app.lecciones, app.progreso).length);
  const hoy = $derived(app.resumenHoy);

  const opciones = $derived<{ icono: NombreIcono; titulo: string; texto: string; enlace: string }[]>([
    {
      icono: 'tarjetas',
      titulo: 'Repaso de hoy',
      texto: `${hoy.pendientes} para hoy · ${Math.min(hoy.nuevas, app.ajustes.nuevasPorSesion)} nuevas. Las que fallas vuelven antes.`,
      enlace: href('repaso'),
    },
    { icono: 'lapiz', titulo: 'Mis fallos', texto: fallos ? `${fallos} ejercicios que fallaste la última vez` : 'Nada pendiente', enlace: href('ejercicios', 'fallos') },
    { icono: 'examen', titulo: 'Test de vocabulario', texto: '15 preguntas: «¿un o une?» y traducción en los dos sentidos', enlace: href('test', ambito) },
    { icono: 'enlace', titulo: 'Emparejar', texto: 'Une cada palabra francesa con su traducción', enlace: href('emparejar', ambito) },
    { icono: 'oreja', titulo: 'Dictado de palabras', texto: 'Escucha y escribe', enlace: href('dictado', ambito, 'palabras') },
    { icono: 'oreja', titulo: 'Dictado de frases', texto: 'Frases de ejemplo de las lecciones', enlace: href('dictado', ambito, 'frases') },
    { icono: 'tarjetas', titulo: 'Práctica libre', texto: '20 tarjetas al azar, sin cambiar tu calendario de repaso', enlace: href('repaso', 'libre') },
  ]);
</script>

<header class="cab">
  <h1>Practicar</h1>
  {#if app.lecciones.length}
    <label class="fila">
      <span class="tenue peq">Vocabulario de</span>
      <select class="campo" bind:value={ambito}>
        <option value="todo">todas las lecciones</option>
        {#each app.leccionesOrdenadas as l (l.id)}
          <option value={l.id}>{l.dossier === 0 ? `Repaso ${l.numero}` : `D${l.dossier} L${l.numero}`} · {l.titulo}</option>
        {/each}
      </select>
    </label>
  {/if}
</header>

{#if app.lecciones.length === 0}
  <Vacio titulo="Sin lecciones" texto="Importa lecciones para practicar su vocabulario. Los verbos ya los puedes practicar.">
    <a class="btn" href={href('ajustes')}>Importar lecciones</a>
    <a class="btn secundario" href={href('verbos')}>Ir a Verbos</a>
  </Vacio>
{:else}
  <div class="rejilla">
    {#each opciones as o (o.titulo)}
      <a class="tarjeta opcion-p" href={o.enlace}>
        <span class="icono"><Icono nombre={o.icono} /></span>
        <div>
          <h3>{o.titulo}</h3>
          <p class="tenue peq">{o.texto}</p>
        </div>
      </a>
    {/each}
  </div>
{/if}

<style>
  .cab { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .cab select { min-height: 2.6rem; width: auto; max-width: 24rem; }
  .opcion-p { display: flex; gap: 1rem; align-items: flex-start; }
  .icono { display: grid; place-items: center; width: 2.8rem; height: 2.8rem; border-radius: 50%; background: var(--primario-suave); color: var(--primario); flex: none; }
  h3 { font-size: 1.1rem; }
  p { margin: 0.2rem 0 0; }
</style>
