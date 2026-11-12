/*
 * Lectura de lecciones (.json) y copias de progreso, con las mismas reglas
 * que Importador.kt de la app Android.
 */
import type { Ejercicio, Examen, Intento, IntentoVerbo, Leccion, Nivel, Progreso, Tarjeta } from './tipos';

export const TIPO_COPIA = 'fraide-progreso';
const NIVELES = new Set(['A1', 'A2', 'B1', 'B2']);
const TIPOS_VOCAB = new Set(['sustantivo', 'verbo', 'adjetivo', 'expresion', 'adverbio']);
const TIPOS_EJERCICIO = new Set(['opcion_multiple', 'rellenar', 'conjugar', 'traducir', 'verdadero_falso']);

export type Analisis =
  | { tipo: 'leccion'; leccion: Leccion; texto: string }
  | { tipo: 'copia'; copia: Progreso; fecha: string }
  | { tipo: 'retirada'; id: string }
  | { tipo: 'invalido'; motivo: string };

class ErrorLeccion extends Error {}

function exigir(cond: unknown, motivo: string): asserts cond {
  if (!cond) throw new ErrorLeccion(motivo);
}

type Obj = Record<string, unknown>;
const esObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const texto = (o: Obj, c: string): string => {
  const v = o[c];
  exigir(typeof v === 'string', `El campo «${c}» debe ser un texto.`);
  return v;
};
const textoONulo = (o: Obj, c: string): string | null => (typeof o[c] === 'string' ? (o[c] as string) : null);
const entero = (o: Obj, c: string): number => {
  const v = o[c];
  exigir(typeof v === 'number' && Number.isInteger(v), `El campo «${c}» debe ser un número entero.`);
  return v;
};
const lista = (o: Obj, c: string): unknown[] => (Array.isArray(o[c]) ? (o[c] as unknown[]) : []);
const objetos = (o: Obj, c: string): Obj[] => lista(o, c).filter(esObj);
const textos = (o: Obj, c: string): string[] => lista(o, c).filter((x): x is string => typeof x === 'string');

/** Convierte el JSON de una lección; lanza un error con un motivo legible si no es válido. */
export function leerLeccion(o: Obj, importada = Date.now()): Leccion {
  for (const c of ['id', 'libro', 'nivel', 'dossier', 'leccion', 'titulo', 'titulo_es', 'resumen', 'vocabulario', 'gramatica', 'ejercicios']) {
    exigir(c in o, `Falta el campo «${c}».`);
  }
  const lid = texto(o, 'id');
  exigir(/^[a-z0-9-]+$/.test(lid), `El id «${lid}» solo puede tener minúsculas, números y guiones.`);
  const nivel = texto(o, 'nivel');
  exigir(NIVELES.has(nivel), `Nivel «${nivel}» no válido.`);
  const gid = (local: string) => `${lid}:${local}`;

  const idsLocales = new Set<string>();
  const vocabulario = objetos(o, 'vocabulario').map((v) => {
    const id = texto(v, 'id');
    exigir(!idsLocales.has(id), `Id de vocabulario repetido: ${id}`);
    idsLocales.add(id);
    const tipo = texto(v, 'tipo');
    exigir(TIPOS_VOCAB.has(tipo), `${id}: tipo «${tipo}» no válido.`);
    return {
      id: gid(id),
      leccionId: lid,
      fr: texto(v, 'fr'),
      es: texto(v, 'es'),
      tipo,
      genero: textoONulo(v, 'genero'),
      categoria: textoONulo(v, 'categoria'),
      ejemploFr: textoONulo(v, 'ejemplo_fr'),
      ejemploEs: textoONulo(v, 'ejemplo_es'),
      nota: textoONulo(v, 'nota'),
    };
  });

  const gramatica = objetos(o, 'gramatica').map((g) => {
    const id = texto(g, 'id');
    exigir(!idsLocales.has(id), `Id repetido: ${id}`);
    idsLocales.add(id);
    const t = g.tabla;
    return {
      id: gid(id),
      titulo: texto(g, 'titulo'),
      explicacion: texto(g, 'explicacion'),
      tabla: esObj(t)
        ? {
            columnas: textos(t, 'columnas'),
            filas: lista(t, 'filas').map((f) => (Array.isArray(f) ? f.map((c) => String(c ?? '')) : [])),
          }
        : null,
      ejemplos: objetos(g, 'ejemplos').map((e) => ({ fr: String(e.fr ?? ''), es: String(e.es ?? '') })),
      errores: textos(g, 'errores_comunes'),
    };
  });

  const ejercicios: Ejercicio[] = objetos(o, 'ejercicios').map((e) => {
    const id = texto(e, 'id');
    const tipo = texto(e, 'tipo');
    exigir(TIPOS_EJERCICIO.has(tipo), `Ejercicio ${id}: tipo «${tipo}» no válido.`);
    const r = e.respuesta;
    const respuestas = Array.isArray(r) ? r.map(String) : r === undefined || r === null ? [] : [String(r)];
    exigir(respuestas.length > 0, `Ejercicio ${id}: sin respuesta.`);
    const opciones = Array.isArray(e.opciones) ? e.opciones.map(String) : [];
    if (tipo === 'opcion_multiple' || tipo === 'verdadero_falso') {
      exigir(opciones.length >= 2, `Ejercicio ${id}: necesita al menos 2 opciones.`);
    }
    const ref = textoONulo(e, 'ref');
    return {
      id: gid(id),
      leccionId: lid,
      tipo,
      enunciado: texto(e, 'enunciado'),
      opciones,
      respuestas,
      explicacion: textoONulo(e, 'explicacion'),
      ref: ref !== null && idsLocales.has(ref) ? gid(ref) : null,
    };
  });

  const notas: Leccion['notas'] = [];
  for (const tipo of ['cultura', 'pronunciacion'] as const) {
    for (const n of objetos(o, tipo)) notas.push({ tipo, titulo: texto(n, 'titulo'), texto: texto(n, 'texto') });
  }

  return {
    id: lid,
    libro: texto(o, 'libro'),
    nivel: nivel as Nivel,
    dossier: entero(o, 'dossier'),
    numero: entero(o, 'leccion'),
    paginas: textoONulo(o, 'paginas'),
    estado: typeof o.estado === 'string' ? o.estado : 'completa',
    titulo: texto(o, 'titulo'),
    tituloEs: texto(o, 'titulo_es'),
    tareaFinal: textoONulo(o, 'tarea_final'),
    resumen: texto(o, 'resumen'),
    objetivos: textos(o, 'objetivos'),
    competencias: textos(o, 'competencias'),
    vocabulario,
    gramatica,
    aclaraciones: objetos(o, 'aclaraciones').map((a) => ({ pregunta: texto(a, 'pregunta'), respuesta: texto(a, 'respuesta') })),
    expresiones: objetos(o, 'expresiones_utiles').map((x) => ({ fr: texto(x, 'fr'), es: texto(x, 'es'), uso: textoONulo(x, 'uso') })),
    notas,
    ejercicios,
    importada,
  };
}

/** Qué contiene un archivo abierto con FRAide. */
export function analizar(contenido: string): Analisis {
  let o: unknown;
  try {
    o = JSON.parse(contenido.replace(/^﻿/, ''));
  } catch {
    return { tipo: 'invalido', motivo: 'No es un archivo JSON válido.' };
  }
  if (!esObj(o)) return { tipo: 'invalido', motivo: 'El archivo no tiene el formato esperado.' };
  try {
    if (o.tipo === TIPO_COPIA) return { tipo: 'copia', copia: leerCopia(o), fecha: String(o.fecha ?? '') };
    if (typeof o.retirado === 'string' && typeof o.id === 'string') return { tipo: 'retirada', id: o.id };
    return { tipo: 'leccion', leccion: leerLeccion(o), texto: contenido };
  } catch (e) {
    if (e instanceof ErrorLeccion) return { tipo: 'invalido', motivo: e.message };
    return { tipo: 'invalido', motivo: `El archivo no tiene el formato esperado (${(e as Error).message}).` };
  }
}

// ------------------------- Copia de seguridad -------------------------
// Mismo formato que la app Android: una copia hecha en el móvil se puede abrir aquí y al revés.

export function escribirCopia(p: Progreso, fecha = new Date()): string {
  return JSON.stringify(
    {
      tipo: TIPO_COPIA,
      version: 1,
      fecha: fecha.toISOString().slice(0, 16).replace('T', ' '),
      tarjetas: Object.values(p.tarjetas).map((t) => ({
        item_id: t.itemId, caja: t.caja, proximo: t.proximo, aciertos: t.aciertos, fallos: t.fallos, ultimo: t.ultimo,
      })),
      intentos: p.intentos.map((i) => ({
        ejercicio_id: i.ejercicioId, leccion_id: i.leccionId, correcto: i.correcto, respuesta: i.respuesta, fecha: i.fecha,
      })),
      actividad: Object.entries(p.actividad).map(([dia, respuestas]) => ({ dia, respuestas })),
      examenes: p.examenes.map((e) => ({ ...e })),
      intentos_verbo: p.intentosVerbo.map((v) => ({ ...v })),
    },
    null,
    2,
  );
}

export function leerCopia(o: Obj): Progreso {
  const num = (x: Obj, c: string) => {
    const v = x[c];
    exigir(typeof v === 'number', `Copia: el campo «${c}» debe ser un número.`);
    return v;
  };
  const bool = (x: Obj, c: string) => x[c] === true;
  const tarjetas: Record<string, Tarjeta> = {};
  for (const t of objetos(o, 'tarjetas')) {
    const itemId = texto(t, 'item_id');
    tarjetas[itemId] = {
      itemId,
      caja: num(t, 'caja'),
      proximo: num(t, 'proximo'),
      aciertos: num(t, 'aciertos'),
      fallos: num(t, 'fallos'),
      ultimo: typeof t.ultimo === 'number' ? t.ultimo : null,
    };
  }
  const intentos: Intento[] = objetos(o, 'intentos').map((i) => ({
    ejercicioId: texto(i, 'ejercicio_id'),
    leccionId: texto(i, 'leccion_id'),
    correcto: bool(i, 'correcto'),
    respuesta: textoONulo(i, 'respuesta'),
    fecha: num(i, 'fecha'),
  }));
  const actividad: Record<string, number> = {};
  for (const a of objetos(o, 'actividad')) actividad[texto(a, 'dia')] = num(a, 'respuestas');
  const examenes: Examen[] = objetos(o, 'examenes').map((e) => ({
    libro: texto(e, 'libro'),
    dossier: num(e, 'dossier'),
    nota10: num(e, 'nota10'),
    aciertos: num(e, 'aciertos'),
    total: num(e, 'total'),
    fecha: num(e, 'fecha'),
  }));
  const intentosVerbo: IntentoVerbo[] = objetos(o, 'intentos_verbo').map((v) => ({
    verbo: texto(v, 'verbo'),
    tiempo: texto(v, 'tiempo'),
    persona: num(v, 'persona'),
    correcto: bool(v, 'correcto'),
    fecha: num(v, 'fecha'),
  }));
  intentos.sort((a, b) => a.fecha - b.fecha);
  intentosVerbo.sort((a, b) => a.fecha - b.fecha);
  return { tarjetas, intentos, actividad, intentosVerbo, examenes };
}
