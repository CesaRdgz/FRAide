/*
 * Estado global de la app (Svelte 5 runes) y persistencia en IndexedDB.
 * Todo vive en el navegador: lecciones importadas, ajustes y progreso.
 */
import { createStore, get, set } from 'idb-keyval';
import { analizar, escribirCopia } from '../lib/importador';
import * as P from '../lib/progreso';
import { ajustesPorDefecto, progresoVacio, type Ajustes, type DatosVerbos, type Ejercicio, type Examen, type Leccion, type Progreso } from '../lib/tipos';
import competenciasJson from '../lib/competencias.json';
import type { Competencia } from '../lib/tipos';

const almacen = typeof indexedDB !== 'undefined' ? createStore('fraide', 'datos') : undefined;

export const COMPETENCIAS: Competencia[] = (competenciasJson as { competencias: Competencia[] }).competencias;

export interface ResultadoImportacion {
  archivo: string;
  ok: boolean;
  mensaje: string;
}

class EstadoApp {
  cargado = $state(false);
  ajustes = $state<Ajustes>(ajustesPorDefecto());
  lecciones = $state<Leccion[]>([]);
  progreso = $state<Progreso>(progresoVacio());
  /** Fallo al leer o guardar (navegador en modo privado, sin espacio…). */
  avisoAlmacen = $state<string | null>(null);

  private verbosCache: Promise<DatosVerbos> | null = null;
  private temporizador: ReturnType<typeof setTimeout> | null = null;

  // ------------------------------ Derivados ------------------------------

  /** Lecciones ordenadas: libro más reciente primero, luego dossier y número. */
  leccionesOrdenadas = $derived.by(() => {
    const recienteDeLibro = new Map<string, number>();
    for (const l of this.lecciones) recienteDeLibro.set(l.libro, Math.max(recienteDeLibro.get(l.libro) ?? 0, l.importada));
    return [...this.lecciones].sort(
      (a, b) =>
        (recienteDeLibro.get(b.libro)! - recienteDeLibro.get(a.libro)!) ||
        a.libro.localeCompare(b.libro) ||
        a.dossier - b.dossier ||
        a.numero - b.numero,
    );
  });

  vocab = $derived(this.leccionesOrdenadas.flatMap((l) => l.vocabulario));

  /** Solo tarjetas de palabras que siguen existiendo. */
  resumenHoy = $derived(P.resumenHoy(this.vocab, this.progreso));
  racha = $derived(P.racha(this.progreso.actividad));
  ultimos = $derived(P.ultimosIntentos(this.progreso.intentos));

  // ------------------------------- Carga -------------------------------

  async cargar(): Promise<void> {
    try {
      const [a, l, p] = await Promise.all([get<Ajustes>('ajustes', almacen), get<Leccion[]>('lecciones', almacen), get<Progreso>('progreso', almacen)]);
      if (a) this.ajustes = { ...ajustesPorDefecto(), ...a };
      if (l) this.lecciones = l;
      if (p) this.progreso = { ...progresoVacio(), ...p };
      // Pide al navegador que no borre los datos si le falta espacio
      navigator.storage?.persist?.().catch(() => {});
    } catch {
      this.avisoAlmacen = 'Este navegador no deja guardar datos (¿ventana privada?). Lo que hagas se perderá al cerrar.';
    }
    this.cargado = true;
  }

  private async escribir(clave: string, valor: unknown): Promise<void> {
    try {
      await set(clave, valor, almacen);
    } catch {
      this.avisoAlmacen = 'No se ha podido guardar. Exporta tu progreso desde Ajustes por si acaso.';
    }
  }

  guardarAjustes(cambios: Partial<Ajustes>): void {
    this.ajustes = { ...this.ajustes, ...cambios };
    void this.escribir('ajustes', $state.snapshot(this.ajustes));
  }

  /** Guarda el progreso agrupando cambios seguidos. */
  guardarProgreso(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      void this.escribir('progreso', $state.snapshot(this.progreso));
    }, 300);
  }

  /** Antes de cerrar la pestaña, guarda lo pendiente. */
  guardarYa(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
      void this.escribir('progreso', $state.snapshot(this.progreso));
    }
  }

  private guardarLecciones(): void {
    void this.escribir('lecciones', $state.snapshot(this.lecciones));
  }

  // ------------------------------ Acciones ------------------------------

  responderTarjeta(vocabId: string, acierto: boolean): void {
    P.responderTarjeta(this.progreso, vocabId, acierto);
    this.guardarProgreso();
  }

  registrarIntento(ej: Ejercicio, correcto: boolean, respuesta: string): void {
    P.registrarIntento(this.progreso, ej, correcto, respuesta);
    this.guardarProgreso();
  }

  registrarVerbo(inf: string, tiempo: string, persona: number, correcto: boolean): void {
    P.registrarVerbo(this.progreso, inf, tiempo, persona, correcto);
    this.guardarProgreso();
  }

  /** Práctica generada: solo cuenta para la racha. */
  registrarPractica(): void {
    P.sumarActividad(this.progreso);
    this.guardarProgreso();
  }

  guardarExamen(e: Examen): void {
    this.progreso.examenes.push(e);
    this.guardarProgreso();
  }

  leccion(id: string): Leccion | undefined {
    return this.lecciones.find((l) => l.id === id);
  }

  verbos(): Promise<DatosVerbos> {
    this.verbosCache ??= import('../lib/verbos.json').then((m) => m.default as unknown as DatosVerbos);
    return this.verbosCache;
  }

  /** Importa lecciones y/o una copia de progreso desde archivos. */
  async importarArchivos(archivos: File[], confirmarCopia: (fecha: string) => boolean): Promise<ResultadoImportacion[]> {
    const res: ResultadoImportacion[] = [];
    let cambiadas = false;
    for (const f of archivos) {
      const a = analizar(await f.text());
      switch (a.tipo) {
        case 'leccion': {
          const previa = this.lecciones.findIndex((l) => l.id === a.leccion.id);
          if (previa >= 0) {
            // Actualización: conserva su posición en el orden de libros
            a.leccion.importada = this.lecciones[previa].importada;
            this.lecciones[previa] = a.leccion;
          } else {
            this.lecciones.push(a.leccion);
          }
          cambiadas = true;
          res.push({ archivo: f.name, ok: true, mensaje: `${previa >= 0 ? 'Actualizada' : 'Añadida'}: ${a.leccion.titulo}` });
          break;
        }
        case 'retirada': {
          const i = this.lecciones.findIndex((l) => l.id === a.id);
          if (i >= 0) {
            this.lecciones.splice(i, 1);
            cambiadas = true;
          }
          res.push({ archivo: f.name, ok: true, mensaje: 'Lección retirada del curso: no se importa.' });
          break;
        }
        case 'copia':
          if (confirmarCopia(a.fecha)) {
            this.progreso = a.copia;
            this.guardarProgreso();
            res.push({ archivo: f.name, ok: true, mensaje: 'Progreso restaurado.' });
          } else {
            res.push({ archivo: f.name, ok: false, mensaje: 'Restauración cancelada.' });
          }
          break;
        case 'invalido':
          res.push({ archivo: f.name, ok: false, mensaje: a.motivo });
      }
    }
    if (cambiadas) this.guardarLecciones();
    return res;
  }

  borrarLeccion(id: string): void {
    this.lecciones = this.lecciones.filter((l) => l.id !== id);
    this.guardarLecciones();
  }

  copiaDeProgreso(): string {
    return escribirCopia($state.snapshot(this.progreso) as Progreso);
  }

  reiniciarProgreso(): void {
    this.progreso = progresoVacio();
    this.guardarProgreso();
  }
}

export const app = new EstadoApp();
