/**
 * Examen de un tema (dossier): ejercicios de sus lecciones, vocabulario generado
 * y conjugación de los tiempos que trabaja el tema (igual que ExamenTema.kt).
 */
import { barajar, distintosPor, type Rnd, rndPorDefecto } from './aleatorio';
import { genero, PREFIJO, traduccion } from './practica';
import { opcionCorrecta, evaluar } from './respuestas';
import type { DatosVerbos, Ejercicio, Leccion, Vocab } from './tipos';
import { COMPETENCIA_TIEMPO, PERSONAS_CORTAS, respuestasConSujeto } from './verbos';

export type Seccion = 'ejercicios' | 'vocabulario' | 'verbos';

export const SECCIONES: [Seccion, string][] = [
  ['ejercicios', 'Ejercicios'],
  ['vocabulario', 'Vocabulario'],
  ['verbos', 'Verbos'],
];

export interface PreguntaExamen {
  ejercicio: Ejercicio;
  seccion: Seccion;
}

export const TOTAL = 20;
const VOCABULARIO = 6;
const VERBOS = 4;

export function generar(
  ejercicios: Ejercicio[],
  vocab: Vocab[],
  reservaVocab: Vocab[],
  verbos: DatosVerbos | null,
  tiempos: Set<string>,
  rnd: Rnd = rndPorDefecto,
): PreguntaExamen[] {
  // 1) Verbos de los tiempos del tema
  const deVerbos = !verbos || tiempos.size === 0 ? [] : preguntasVerbos(verbos, tiempos, VERBOS, rnd);

  // 2) Vocabulario: género y traducción en los dos sentidos
  const porTipo = Math.floor(VOCABULARIO / 3);
  const g = genero(vocab, porTipo, rnd);
  const haciaEs = traduccion(vocab, reservaVocab, porTipo, true, rnd);
  const haciaFr = traduccion(vocab, reservaVocab, VOCABULARIO - g.length - haciaEs.length, false, rnd);
  const deVocab = distintosPor([...g, ...haciaEs, ...haciaFr], (e) => e.id).map((e) => ({ ejercicio: e, seccion: 'vocabulario' as const }));

  // 3) Ejercicios de las lecciones, repartidos por igual entre ellas
  const huecos = TOTAL - deVerbos.length - deVocab.length;
  const porLeccion = new Map<string, Ejercicio[]>();
  for (const e of ejercicios) {
    const l = porLeccion.get(e.leccionId);
    if (l) l.push(e);
    else porLeccion.set(e.leccionId, [e]);
  }
  const colas = [...porLeccion.values()].map((l) => barajar(l, rnd));
  const elegidos: Ejercicio[] = [];
  while (elegidos.length < huecos && colas.some((c) => c.length > 0)) {
    for (const cola of barajar(colas, rnd)) {
      if (elegidos.length >= huecos) break;
      const e = cola.shift();
      if (e) elegidos.push(e);
    }
  }
  const deEjercicios = elegidos.map((e) => ({ ejercicio: e, seccion: 'ejercicios' as const }));

  return [...barajar(deEjercicios, rnd), ...barajar(deVocab, rnd), ...deVerbos];
}

function preguntasVerbos(datos: DatosVerbos, tiempos: Set<string>, n: number, rnd: Rnd): PreguntaExamen[] {
  const candidatas = datos.verbos.flatMap((v) =>
    datos.tiempos
      .filter((t) => tiempos.has(t.id))
      .flatMap((t) => (v.tiempos[t.id] ?? []).flatMap((f, p) => (f ? [{ v, t, p, f }] : []))),
  );
  return distintosPor(barajar(candidatas, rnd), (c) => c.v.inf)
    .slice(0, n)
    .map(({ v, t, p, f }) => {
      const persona = t.id === 'imperativo' ? `(${PERSONAS_CORTAS[p].split(' ')[0]})` : PERSONAS_CORTAS[p];
      return {
        ejercicio: {
          id: `${PREFIJO}verbo:${v.inf}|${t.id}|${p}`,
          leccionId: '',
          tipo: 'conjugar',
          enunciado: `${v.inf} · ${persona} · ${t.nombre}`,
          opciones: [],
          respuestas: respuestasConSujeto(f, p, t.id),
          explicacion: f.d,
          ref: null,
        },
        seccion: 'verbos' as const,
      };
    });
}

/** Tiempos verbales que entran en el examen de un tema. */
export function tiemposDelTema(lecciones: Leccion[], dossier: number, verbos: DatosVerbos): Set<string> {
  if (dossier === 0) {
    const nivel = lecciones[0]?.nivel;
    return new Set(verbos.tiempos.filter((t) => t.nivel === nivel).map((t) => t.id));
  }
  return new Set(lecciones.flatMap((l) => l.competencias).flatMap((c) => (COMPETENCIA_TIEMPO[c] ? [COMPETENCIA_TIEMPO[c]] : [])));
}

/** ¿Es correcta la respuesta a una pregunta del examen? (en blanco = fallo) */
export function corregir(p: PreguntaExamen, respuesta: string): boolean {
  if (respuesta.trim() === '') return false;
  return p.ejercicio.opciones.length > 0 ? opcionCorrecta(respuesta, p.ejercicio.respuestas) : evaluar(respuesta, p.ejercicio.respuestas).correcto;
}

/** Nota sobre 10 con un decimal, guardada ×10 (7,5 → 75). */
export const nota10 = (aciertos: number, total: number) => (total === 0 ? 0 : Math.round((aciertos * 100) / total));

export function calificacion(n: number): string {
  if (n >= 90) return 'Sobresaliente';
  if (n >= 70) return 'Notable';
  if (n >= 60) return 'Bien';
  if (n >= 50) return 'Aprobado';
  return 'Suspenso';
}

export const formatearNota = (n: number) => (n % 10 === 0 ? `${n / 10}` : `${Math.floor(n / 10)},${n % 10}`);
