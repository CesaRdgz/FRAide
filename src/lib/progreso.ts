/*
 * Reglas de progreso (Leitner, racha, estados de palabra), iguales que en Repositorio.kt.
 * Funciones puras: reciben el progreso y lo modifican en el sitio; quien llama lo guarda.
 */
import { barajar, type Rnd, rndPorDefecto } from './aleatorio';
import type { Ejercicio, Intento, Leccion, Progreso, Tarjeta, Vocab } from './tipos';

export const CAJA_MAX = 5;
/** Una palabra se considera memorizada a partir de esta caja. */
export const CAJA_APRENDIDA = 3;
const DIAS = [0, 1, 2, 4, 8, 16];

/** Fecha local yyyy-MM-dd. */
export function diaLocal(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Medianoche local de dentro de N días (epoch ms). */
export function proximoRepaso(caja: number, ahora = new Date()): number {
  const dias = DIAS[Math.min(Math.max(caja, 0), CAJA_MAX)];
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + dias);
  return d.getTime();
}

export type EstadoPalabra = 'nueva' | 'vista' | 'memorizada';

export function estadoPalabra(t: Tarjeta | undefined): EstadoPalabra {
  if (!t) return 'nueva';
  return t.caja >= CAJA_APRENDIDA ? 'memorizada' : 'vista';
}

export function sumarActividad(p: Progreso, ahora = new Date()): void {
  const hoy = diaLocal(ahora);
  p.actividad[hoy] = (p.actividad[hoy] ?? 0) + 1;
}

export function responderTarjeta(p: Progreso, vocabId: string, acierto: boolean, ahora = new Date()): void {
  const ms = ahora.getTime();
  const t: Tarjeta = p.tarjetas[vocabId] ?? { itemId: vocabId, caja: 0, proximo: ms, aciertos: 0, fallos: 0, ultimo: null };
  let nueva: Tarjeta;
  if (acierto) {
    if (t.proximo <= ms) {
      // Repaso a su hora: sube de caja y se espacia el siguiente
      const caja = Math.min(t.caja + 1, CAJA_MAX);
      nueva = { ...t, caja, proximo: proximoRepaso(caja, ahora), aciertos: t.aciertos + 1, ultimo: ms };
    } else {
      // Práctica adelantada: cuenta como vista, pero no adelanta el calendario
      nueva = { ...t, aciertos: t.aciertos + 1, ultimo: ms };
    }
  } else {
    nueva = { ...t, caja: 0, proximo: ms, fallos: t.fallos + 1, ultimo: ms };
  }
  p.tarjetas[vocabId] = nueva;
  sumarActividad(p, ahora);
}

export function registrarIntento(p: Progreso, ej: Ejercicio, correcto: boolean, respuesta: string, ahora = new Date()): void {
  p.intentos.push({ ejercicioId: ej.id, leccionId: ej.leccionId, correcto, respuesta, fecha: ahora.getTime() });
  sumarActividad(p, ahora);
}

export function registrarVerbo(p: Progreso, inf: string, tiempo: string, persona: number, correcto: boolean, ahora = new Date()): void {
  p.intentosVerbo.push({ verbo: inf, tiempo, persona, correcto, fecha: ahora.getTime() });
  sumarActividad(p, ahora);
}

/** Días seguidos con actividad, contando hasta hoy (o hasta ayer si hoy aún no has practicado). */
export function racha(actividad: Record<string, number>, ahora = new Date()): number {
  const hay = (d: Date) => (actividad[diaLocal(d)] ?? 0) > 0;
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  if (!hay(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (hay(d)) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Último intento de cada ejercicio (los intentos van ordenados por fecha). */
export function ultimosIntentos(intentos: Intento[]): Map<string, Intento> {
  const m = new Map<string, Intento>();
  for (const i of intentos) m.set(i.ejercicioId, i);
  return m;
}

/** Repaso del día: las que tocan hoy (barajadas) y después hasta N nuevas. */
export function sesionRepaso(vocab: Vocab[], p: Progreso, maxNuevas: number, ahora = Date.now(), rnd: Rnd = rndPorDefecto): Vocab[] {
  const pendientes = vocab.filter((v) => {
    const t = p.tarjetas[v.id];
    return t !== undefined && t.proximo <= ahora;
  });
  const nuevas = vocab.filter((v) => !(v.id in p.tarjetas)).slice(0, maxNuevas);
  return [...barajar(pendientes, rnd), ...nuevas];
}

export interface ResumenHoy {
  pendientes: number;
  nuevas: number;
  practicadoHoy: boolean;
}

export function resumenHoy(vocab: Vocab[], p: Progreso, ahora = new Date()): ResumenHoy {
  const ms = ahora.getTime();
  let pendientes = 0;
  let nuevas = 0;
  for (const v of vocab) {
    const t = p.tarjetas[v.id];
    if (!t) nuevas++;
    else if (t.proximo <= ms) pendientes++;
  }
  return { pendientes, nuevas, practicadoHoy: (p.actividad[diaLocal(ahora)] ?? 0) > 0 };
}

export interface FilaLeccion {
  leccion: Leccion;
  vocab: number;
  ejercicios: number;
  ejerciciosBien: number;
  palabrasVistas: number;
  palabrasMemorizadas: number;
  /** Ejercicios bien + palabras vistas, sobre el total. */
  fraccion: number;
}

export function filaLeccion(l: Leccion, p: Progreso, ultimos: Map<string, Intento>): FilaLeccion {
  let bien = 0;
  for (const e of l.ejercicios) if (ultimos.get(e.id)?.correcto) bien++;
  let vistas = 0;
  let memorizadas = 0;
  for (const v of l.vocabulario) {
    const est = estadoPalabra(p.tarjetas[v.id]);
    if (est !== 'nueva') vistas++;
    if (est === 'memorizada') memorizadas++;
  }
  const total = l.vocabulario.length + l.ejercicios.length;
  return {
    leccion: l,
    vocab: l.vocabulario.length,
    ejercicios: l.ejercicios.length,
    ejerciciosBien: bien,
    palabrasVistas: vistas,
    palabrasMemorizadas: memorizadas,
    fraccion: total === 0 ? 0 : (bien + vistas) / total,
  };
}

/** Ejercicios cuyo último intento fue incorrecto. */
export function ejerciciosFallados(lecciones: Leccion[], p: Progreso): Ejercicio[] {
  const ultimos = ultimosIntentos(p.intentos);
  return lecciones.flatMap((l) => l.ejercicios).filter((e) => ultimos.get(e.id)?.correcto === false);
}
