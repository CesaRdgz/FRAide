<script lang="ts">
  import { onMount } from 'svelte';
  import Icono, { type NombreIcono } from './componentes/Icono.svelte';
  import { app } from './estado/app.svelte';
  import { atras, href, ruta } from './estado/ruta.svelte';
  import Ajustes from './pantallas/Ajustes.svelte';
  import Bienvenida from './pantallas/Bienvenida.svelte';
  import Dictado from './pantallas/Dictado.svelte';
  import Ejercicios from './pantallas/Ejercicios.svelte';
  import Emparejar from './pantallas/Emparejar.svelte';
  import Entreno from './pantallas/Entreno.svelte';
  import Examen from './pantallas/Examen.svelte';
  import Inicio from './pantallas/Inicio.svelte';
  import Leccion from './pantallas/Leccion.svelte';
  import Practicar from './pantallas/Practicar.svelte';
  import Progreso from './pantallas/Progreso.svelte';
  import Repaso from './pantallas/Repaso.svelte';
  import Teoria from './pantallas/Teoria.svelte';
  import Verbo from './pantallas/Verbo.svelte';
  import Verbos from './pantallas/Verbos.svelte';

  const SECCIONES: { id: string; texto: string; icono: NombreIcono; pantallas: string[] }[] = [
    { id: '', texto: 'Lecciones', icono: 'libro', pantallas: ['', 'leccion', 'ejercicios', 'examen'] },
    { id: 'practicar', texto: 'Practicar', icono: 'tarjetas', pantallas: ['practicar', 'repaso', 'test', 'emparejar', 'dictado'] },
    { id: 'verbos', texto: 'Verbos', icono: 'lista', pantallas: ['verbos', 'verbo', 'teoria', 'entreno'] },
    { id: 'progreso', texto: 'Progreso', icono: 'grafica', pantallas: ['progreso'] },
    { id: 'ajustes', texto: 'Ajustes', icono: 'ajustes', pantallas: ['ajustes'] },
  ];

  const activa = $derived(SECCIONES.find((s) => s.pantallas.includes(ruta.pantalla))?.id ?? '');
  const p = $derived(ruta.partes);

  let aviso = $state<string | null>(null);
  let arrastrando = $state(false);

  onMount(() => {
    void app.cargar();
    const guardar = () => app.guardarYa();
    addEventListener('pagehide', guardar);
    document.addEventListener('visibilitychange', guardar);
    return () => {
      removeEventListener('pagehide', guardar);
      document.removeEventListener('visibilitychange', guardar);
    };
  });

  // Tamaño de letra, tema y contraste en <html>
  $effect(() => {
    const r = document.documentElement;
    r.style.setProperty('--escala', String(app.ajustes.tamanoTexto));
    if (app.ajustes.tema === 'sistema') delete r.dataset.tema;
    else r.dataset.tema = app.ajustes.tema;
    if (app.ajustes.altoContraste) r.dataset.contraste = '';
    else delete r.dataset.contraste;
  });

  // Soltar archivos en cualquier parte de la ventana
  async function soltar(e: DragEvent) {
    e.preventDefault();
    arrastrando = false;
    const archivos = [...(e.dataTransfer?.files ?? [])];
    if (!archivos.length) return;
    const res = await app.importarArchivos(archivos, (f) => confirm(`Vas a sustituir TODO tu progreso por la copia${f ? ` del ${f}` : ''}. ¿Seguir?`));
    aviso = res.map((r) => `${r.ok ? '✓' : '✗'} ${r.mensaje}`).join('\n');
    setTimeout(() => (aviso = null), 6000);
  }

  function teclado(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !ruta.pantalla || ruta.pantalla === 'examen') return;
    if ((e.target as HTMLElement)?.closest('dialog')) return;
    atras();
  }
</script>

<svelte:window
  onkeydown={teclado}
  ondragover={(e) => {
    if (e.dataTransfer?.types.includes('Files')) {
      e.preventDefault();
      arrastrando = true;
    }
  }}
  ondragleave={(e) => {
    if (!e.relatedTarget) arrastrando = false;
  }}
  ondrop={soltar}
/>

{#if !app.cargado}
  <div class="carga" aria-busy="true">Cargando…</div>
{:else if !app.ajustes.bienvenidaVista}
  <Bienvenida />
{:else}
  <div class="marco">
    <aside class="lateral" aria-label="Navegación">
      <a class="logo" href={href()} aria-label="FRAide, inicio">Fr<span>.</span></a>
      <nav>
        {#each SECCIONES as s (s.id)}
          <a href={href(...(s.id ? [s.id] : []))} class:activa={activa === s.id} aria-current={activa === s.id ? 'page' : undefined}>
            <Icono nombre={s.icono} />
            <span>{s.texto}</span>
          </a>
        {/each}
      </nav>
      <div class="racha" title="Días seguidos practicando">
        <Icono nombre="llama" />
        <span><strong>{app.racha}</strong> {app.racha === 1 ? 'día' : 'días'} de racha</span>
      </div>
    </aside>

    <main class="contenido">
      {#if app.avisoAlmacen}
        <div class="aviso-almacen" role="alert">{app.avisoAlmacen}</div>
      {/if}
      {#key p.join('/')}
        {#if ruta.pantalla === ''}
          <Inicio />
        {:else if ruta.pantalla === 'leccion'}
          <Leccion id={p[1]} />
        {:else if ruta.pantalla === 'ejercicios'}
          <Ejercicios modo={p[1] === 'fallos' ? 'fallos' : 'leccion'} leccionId={p[1]} />
        {:else if ruta.pantalla === 'test'}
          <Ejercicios modo="vocabulario" leccionId={p[1] === 'todo' ? undefined : p[1]} />
        {:else if ruta.pantalla === 'repaso'}
          <Repaso modo={p[1] === 'libre' ? 'libre' : p[1] ? 'leccion' : 'diario'} leccionId={p[1]} />
        {:else if ruta.pantalla === 'practicar'}
          <Practicar />
        {:else if ruta.pantalla === 'emparejar'}
          <Emparejar ambito={p[1] ?? 'todo'} />
        {:else if ruta.pantalla === 'dictado'}
          <Dictado ambito={p[1] ?? 'todo'} frases={p[2] === 'frases'} />
        {:else if ruta.pantalla === 'verbos'}
          <Verbos />
        {:else if ruta.pantalla === 'verbo'}
          <Verbo inf={p[1]} />
        {:else if ruta.pantalla === 'teoria'}
          <Teoria tiempo={p[1]} />
        {:else if ruta.pantalla === 'entreno'}
          <Entreno tiempos={(p[1] ?? '').split(',')} grupo={p[2] ?? 'todos'} cantidad={Number(p[3]) || 15} />
        {:else if ruta.pantalla === 'examen'}
          <Examen libro={p[1]} dossier={Number(p[2]) || 0} />
        {:else if ruta.pantalla === 'progreso'}
          <Progreso />
        {:else if ruta.pantalla === 'ajustes'}
          <Ajustes />
        {:else}
          <Inicio />
        {/if}
      {/key}
    </main>
  </div>
{/if}

{#if arrastrando}
  <div class="soltar" aria-hidden="true"><Icono nombre="importar" tam="3rem" /><p>Suelta para importar</p></div>
{/if}
{#if aviso}
  <div class="aviso" role="status">{aviso}</div>
{/if}

<style>
  .carga { display: grid; place-items: center; min-height: 100vh; color: var(--texto-2); }
  .marco { display: grid; grid-template-columns: var(--lateral) 1fr; min-height: 100vh; }
  .lateral {
    position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 1.5rem;
    padding: 1.6rem 1rem; border-right: 1px solid var(--borde); background: var(--superficie);
  }
  .logo {
    font: 600 2.4rem/1 var(--serif); color: var(--primario); text-decoration: none; padding: 0 0.6rem; letter-spacing: -0.02em;
  }
  .logo span { color: var(--secundario); }
  nav { display: flex; flex-direction: column; gap: 0.2rem; }
  nav a {
    display: flex; align-items: center; gap: 0.8rem; padding: 0.7rem 0.9rem; border-radius: 999px;
    color: var(--texto-2); text-decoration: none; font-weight: 500;
  }
  nav a:hover { background: var(--superficie-alta); color: var(--texto); }
  nav a.activa { background: var(--primario-suave); color: var(--sobre-primario-suave); }
  .racha { margin-top: auto; display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem; border-radius: var(--r-m); background: var(--ocre-suave); color: var(--ocre); font-size: 0.9rem; }
  .racha span { color: var(--texto); }
  .contenido { padding: 2.2rem clamp(1rem, 4vw, 3.5rem) 4rem; max-width: 72rem; width: 100%; min-width: 0; }
  .aviso-almacen { background: var(--secundario-suave); border-radius: var(--r-m); padding: 0.8rem 1rem; margin-bottom: 1rem; }
  .soltar {
    position: fixed; inset: 0; z-index: 60; display: grid; place-content: center; justify-items: center; gap: 0.5rem;
    background: color-mix(in srgb, var(--primario-suave) 88%, transparent); color: var(--primario);
    border: 3px dashed var(--primario); font-size: 1.2rem; font-weight: 500;
  }
  .aviso {
    position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); z-index: 70; white-space: pre-line;
    background: var(--texto); color: var(--fondo); padding: 0.9rem 1.3rem; border-radius: var(--r-m); box-shadow: var(--sombra); max-width: 90vw;
  }

  /* Pantallas estrechas (móvil o ventana pequeña): barra de navegación abajo */
  @media (max-width: 56rem) {
    .marco { grid-template-columns: 1fr; }
    .lateral {
      position: fixed; top: auto; bottom: 0; left: 0; right: 0; height: auto; z-index: 40;
      flex-direction: row; padding: 0.3rem 0.4rem calc(0.3rem + env(safe-area-inset-bottom));
      border-right: none; border-top: 1px solid var(--borde);
    }
    .logo, .racha { display: none; }
    nav { flex-direction: row; justify-content: space-around; width: 100%; }
    nav a { flex-direction: column; gap: 0.15rem; padding: 0.4rem 0.6rem; font-size: 0.7rem; border-radius: var(--r-m); }
    .contenido { padding-bottom: 6rem; padding-top: 1.4rem; }
  }
</style>
