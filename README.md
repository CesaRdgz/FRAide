# FRAide web

Versión para navegador de **FRAide**, el cuaderno de francés de la clase (A1–A2), pensada para usarla en el **ordenador**.
Es la misma app que la de Android: lecciones resumidas, repaso de vocabulario con tarjetas, ejercicios,
entrenador de verbos, examen por tema y progreso. Funciona sin servidor y sin conexión una vez cargada.

> **Las lecciones no están en este repositorio.** La web arranca vacía y cada persona importa los archivos
> `.json` de sus lecciones (los mismos que usa la app Android). Solo se publica el código y el material propio
> (verbos, teoría de los tiempos y competencias).

## Uso

1. Abre la web y elige tamaño de letra y nombre.
2. Arrastra los `.json` de las lecciones a la ventana (o **Ajustes → Elegir archivos**).
3. Todo se guarda en el navegador (IndexedDB). Exporta una copia desde **Ajustes → Exportar progreso**:
   es el mismo formato que la app Android, así que sirve para pasar el progreso de un sitio a otro.

Atajos de teclado: <kbd>1</kbd>–<kbd>9</kbd> para elegir opción, <kbd>Intro</kbd> para comprobar/seguir,
<kbd>Espacio</kbd> para girar una tarjeta, <kbd>←</kbd>/<kbd>→</kbd> en el examen, <kbd>Esc</kbd> para volver.

## Desarrollo

Requiere Node 22.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # tests de la lógica (Vitest)
npm run check     # tipos (svelte-check)
npm run build     # → dist/
```

Si la carpeta `../FRAide` (proyecto Android) está al lado, `npm test` comprueba además que todas sus
lecciones se importan bien.

### Estructura

```
src/
  lib/          lógica pura en TypeScript, igual que la app Android (con tests)
    importador.ts   lectura y validación de lecciones y copias de progreso
    progreso.ts     Leitner, racha, estado de las palabras
    practica.ts     ejercicios generados (género, traducción, emparejar, dictado)
    verbos.ts       entrenador de conjugación
    examen.ts       examen por tema y notas
    verbos.json     59 verbos × 6 tiempos (generado por tools/gen_verbos.py del proyecto Android)
  estado/       estado global (Svelte 5 runes), persistencia, voz y rutas
  pantallas/    una pantalla por ruta
  componentes/  piezas reutilizables
tests/          Vitest
```

**Stack:** Svelte 5 + TypeScript + Vite. Sin backend. Rutas con `#` para que funcione en GitHub Pages.

### Actualizar los verbos

Los verbos salen del proyecto Android: `python tools/gen_verbos.py` allí y copia `content/verbos.json`
a `src/lib/verbos.json`.

## Publicación

Cada `push` a `main` ejecuta los tests, compila y publica en GitHub Pages (`.github/workflows/publicar.yml`).
Guía paso a paso en [docs/PUBLICAR.md](docs/PUBLICAR.md).

## Aviso

Proyecto personal sin ánimo de lucro, no afiliado a ninguna editorial. No subas al repositorio lecciones
derivadas de libros de texto: compártelas solo con quien use el libro.

Código bajo licencia MIT. Fuentes Fraunces e Inter bajo SIL OFL 1.1. Iconos de Material Icons (Apache 2.0).
