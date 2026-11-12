/*
 * Modelo de datos. Los ids son los mismos que en la app Android
 * («mae2-d1-l1:v-appeler»), así las copias de progreso valen para las dos.
 */

export type Nivel = 'A1' | 'A2' | 'B1' | 'B2';

export interface Vocab {
  id: string;
  leccionId: string;
  fr: string;
  es: string;
  tipo: string;
  genero: string | null;
  categoria: string | null;
  ejemploFr: string | null;
  ejemploEs: string | null;
  nota: string | null;
}

export interface Tabla {
  columnas: string[];
  filas: string[][];
}

export interface Ejemplo {
  fr: string;
  es: string;
}

export interface PuntoGramatica {
  id: string;
  titulo: string;
  explicacion: string;
  tabla: Tabla | null;
  ejemplos: Ejemplo[];
  errores: string[];
}

export interface Ejercicio {
  id: string;
  leccionId: string;
  tipo: string;
  enunciado: string;
  /** Vacío si la respuesta se escribe. */
  opciones: string[];
  respuestas: string[];
  explicacion: string | null;
  ref: string | null;
  /** No barajar las opciones (p. ej. «un / une»). */
  fijas?: boolean;
}

export interface Leccion {
  id: string;
  libro: string;
  nivel: Nivel;
  dossier: number;
  numero: number;
  paginas: string | null;
  estado: string;
  titulo: string;
  tituloEs: string;
  tareaFinal: string | null;
  resumen: string;
  objetivos: string[];
  competencias: string[];
  vocabulario: Vocab[];
  gramatica: PuntoGramatica[];
  aclaraciones: { pregunta: string; respuesta: string }[];
  expresiones: { fr: string; es: string; uso: string | null }[];
  notas: { tipo: 'cultura' | 'pronunciacion'; titulo: string; texto: string }[];
  ejercicios: Ejercicio[];
  /** Momento de importación: ordena los libros (el más reciente, primero). */
  importada: number;
}

// ------------------------------ Progreso ------------------------------

/** Tarjeta Leitner (cajas 0..5). */
export interface Tarjeta {
  itemId: string;
  caja: number;
  proximo: number;
  aciertos: number;
  fallos: number;
  ultimo: number | null;
}

export interface Intento {
  ejercicioId: string;
  leccionId: string;
  correcto: boolean;
  respuesta: string | null;
  fecha: number;
}

export interface IntentoVerbo {
  verbo: string;
  tiempo: string;
  persona: number;
  correcto: boolean;
  fecha: number;
}

export interface Examen {
  libro: string;
  dossier: number;
  /** Nota × 10 (75 = 7,5). */
  nota10: number;
  aciertos: number;
  total: number;
  fecha: number;
}

export interface Progreso {
  tarjetas: Record<string, Tarjeta>;
  intentos: Intento[];
  /** Respuestas por día (yyyy-MM-dd). */
  actividad: Record<string, number>;
  intentosVerbo: IntentoVerbo[];
  examenes: Examen[];
}

export const progresoVacio = (): Progreso => ({
  tarjetas: {},
  intentos: [],
  actividad: {},
  intentosVerbo: [],
  examenes: [],
});

export interface Ajustes {
  nombre: string;
  bienvenidaVista: boolean;
  nuevasPorSesion: number;
  velocidadVoz: number;
  /** Multiplicador del tamaño de letra. */
  tamanoTexto: number;
  altoContraste: boolean;
  /** 'sistema' sigue al sistema operativo. */
  tema: 'sistema' | 'claro' | 'oscuro';
}

export const ajustesPorDefecto = (): Ajustes => ({
  nombre: '',
  bienvenidaVista: false,
  nuevasPorSesion: 15,
  velocidadVoz: 0.9,
  tamanoTexto: 1,
  altoContraste: false,
  tema: 'sistema',
});

export const TAMANOS_TEXTO: [number, string][] = [
  [1, 'Normal'],
  [1.15, 'Grande'],
  [1.3, 'Muy grande'],
  [1.5, 'Enorme'],
];

// ------------------------------- Verbos -------------------------------

export interface FormaVerbal {
  /** Forma completa para mostrar: «j'ai pris». */
  d: string;
  /** Respuestas aceptadas sin sujeto: «ai pris». */
  r: string[];
}

export interface TiempoVerbal {
  id: string;
  nombre: string;
  nombre_es: string;
  nivel: string;
  uso: string;
  formacion: string;
  ejemplos: Ejemplo[];
  errores: string[];
}

export interface Verbo {
  inf: string;
  es: string;
  grupo: 'er' | 'ir' | 'irregular' | 'pronominal' | string;
  aux: string;
  nivel: string;
  participio: string;
  tiempos: Record<string, (FormaVerbal | null)[] | null>;
}

export interface DatosVerbos {
  personas: string[];
  tiempos: TiempoVerbal[];
  verbos: Verbo[];
}

export interface Competencia {
  id: string;
  nivel: string;
  tipo: string;
  titulo: string;
}
