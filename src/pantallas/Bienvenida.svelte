<script lang="ts">
  import Icono, { type NombreIcono } from '../componentes/Icono.svelte';
  import SelectorTamano from '../componentes/SelectorTamano.svelte';
  import { app } from '../estado/app.svelte';
  import { voz } from '../estado/voz.svelte';

  let paso = $state(0);
  let nombre = $state(app.ajustes.nombre);

  const BLOQUES: [NombreIcono, string, string][] = [
    ['libro', 'Lecciones', 'Cada lección resumida: vocabulario, gramática, dudas típicas y ejercicios. Al final de cada tema, un examen de 20 preguntas con nota.'],
    ['tarjetas', 'Practicar', 'Repaso diario de vocabulario con tarjetas: las que fallas vuelven antes. También test, emparejar y dictado.'],
    ['lista', 'Verbos', 'Entrenador de conjugación por tiempos, teoría de cada tiempo y la conjugación completa de 59 verbos.'],
    ['grafica', 'Progreso', 'Tu racha, las palabras memorizadas, tus notas y tus puntos débiles.'],
  ];

  function terminar() {
    app.guardarAjustes({ nombre: nombre.trim().slice(0, 24), bienvenidaVista: true });
  }
</script>

<div class="fondo rayado">
  <main class="caja">
    <div class="puntos" aria-hidden="true">
      {#each [0, 1, 2] as i (i)}<span class:hecho={i <= paso}></span>{/each}
    </div>

    {#if paso === 0}
      <p class="seccion">Bienvenue</p>
      <h1>Bonjour !</h1>
      <p class="intro">FRAide es tu cuaderno de francés: las lecciones del curso resumidas, vocabulario que se repasa solo, verbos y exámenes por tema. Todo se guarda en este ordenador.</p>
      <h2>Tamaño de la letra</h2>
      <SelectorTamano />
      <h2>¿Cómo te llamas?</h2>
      <input
        class="campo grande"
        bind:value={nombre}
        placeholder="Tu nombre (opcional)"
        maxlength="24"
        onkeydown={(e) => e.key === 'Enter' && (paso = 1)}
        aria-label="Tu nombre"
      />
      <p class="tenue peq">Solo se usa para saludarte. Puedes cambiarlo en Ajustes.</p>
    {:else if paso === 1}
      <p class="seccion">Así funciona</p>
      <h1>Lo que vas a encontrar</h1>
      <div class="pila bloques">
        {#each BLOQUES as [icono, titulo, texto] (titulo)}
          <div class="bloque">
            <span class="icono"><Icono nombre={icono} /></span>
            <div><strong>{titulo}</strong><p class="tenue peq">{texto}</p></div>
          </div>
        {/each}
      </div>
      <div class="tarjeta plana aviso">
        <strong>Las lecciones se importan</strong>
        <p class="peq">Te las pasarán en archivos <code>.json</code>. Arrástralos a la ventana (o en Ajustes → Importar). Tu progreso se guarda en este navegador: exporta una copia de vez en cuando desde Ajustes.</p>
      </div>
    {:else}
      <p class="seccion">Pronunciación</p>
      <h1>Prueba la voz</h1>
      <p class="intro">FRAide lee en voz alta palabras y frases con la voz francesa de tu ordenador.</p>
      <div class="voz">
        <button class="btn grande" type="button" disabled={!voz.disponible} onclick={() => voz.hablar('Bonjour ! Bienvenue dans FRAide.')}>
          <Icono nombre="altavoz" tam="1.6rem" /> Escuchar
        </button>
      </div>
      {#if voz.disponible}
        <p class="centro">Si oyes «Bonjour», todo está listo.</p>
      {:else}
        <div class="tarjeta plana aviso">
          <strong>No encuentro una voz francesa</strong>
          <p class="peq">La app funciona igual, pero sin audio. En Windows: Configuración → Hora e idioma → Voz → Agregar voces → Français (France). En Mac: Ajustes del Sistema → Accesibilidad → Contenido leído → Voz del sistema → Gestionar voces. Después recarga la página. Chrome y Edge suelen traer voces francesas.</p>
        </div>
      {/if}
    {/if}

    <div class="fila botones">
      {#if paso > 0}<button class="btn secundario" type="button" onclick={() => paso--}>Atrás</button>{/if}
      <button class="btn crece" type="button" onclick={() => (paso < 2 ? paso++ : terminar())}>{paso < 2 ? 'Siguiente' : 'Empezar'}</button>
    </div>
  </main>
</div>

<style>
  .fondo { min-height: 100vh; display: grid; place-items: center; padding: 2rem 1rem; }
  .caja { width: min(40rem, 100%); background: var(--fondo); border: 1px solid var(--borde); border-radius: var(--r-l); box-shadow: var(--sombra); padding: 2rem clamp(1.2rem, 4vw, 2.6rem); display: grid; gap: 0.9rem; }
  .puntos { display: flex; gap: 0.4rem; justify-content: center; margin-bottom: 0.4rem; }
  .puntos span { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: var(--variante); }
  .puntos span.hecho { background: var(--primario); }
  h1 { font-size: 2.6rem; color: var(--primario); font-weight: 400; }
  h2 { font-size: 1.2rem; margin-top: 0.6rem; }
  .intro { color: var(--texto-2); font-size: 1.05rem; margin: 0; }
  .bloques { margin-top: 0.4rem; }
  .bloque { display: flex; gap: 0.9rem; align-items: flex-start; }
  .bloque p { margin: 0.1rem 0 0; }
  .icono { flex: none; display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--primario-suave); color: var(--primario); }
  .aviso { background: var(--superficie); }
  .aviso p { margin: 0.3rem 0 0; }
  .voz { display: grid; place-items: center; padding: 1.5rem 0; }
  .btn.grande { min-height: 4rem; padding: 0 2rem; font-size: 1.1rem; }
  .botones { margin-top: 1rem; }
</style>
