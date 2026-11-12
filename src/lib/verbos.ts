/** Conjugación: entrenador y utilidades (igual que Verbos.kt). */
import { type Rnd, rndPorDefecto } from './aleatorio';
import { evaluar, normalizar, type Resultado } from './respuestas';
import type { DatosVerbos, FormaVerbal, IntentoVerbo, TiempoVerbal, Verbo } from './tipos';

/** Qué tiempo verbal trabaja cada competencia (para los exámenes y el progreso). */
export const COMPETENCIA_TIEMPO: Record<string, string> = {
  'presente-regulares': 'presente',
  'presente-irregulares': 'presente',
  'etre-avoir': 'presente',
  imperativo: 'imperativo',
  'passe-compose': 'passe_compose',
  'imperfecto-vs-pc': 'passe_compose',
  'passe-recent': 'passe_recent',
  'futuro-proximo': 'futur_proche',
  imperfecto: 'imparfait',
};

export const claveForma = (inf: string, tiempo: string, persona: number) => `${inf}|${tiempo}|${persona}`;

export type GrupoVerbos = 'todos' | 'regulares' | 'irregulares' | 'pronominales' | 'fallos';

export const GRUPOS: [GrupoVerbos, string][] = [
  ['todos', 'Todos'],
  ['regulares', 'Regulares'],
  ['irregulares', 'Irregulares'],
  ['pronominales', 'Pronominales'],
  ['fallos', 'Mis fallos'],
];

export interface PreguntaVerbo {
  verbo: Verbo;
  tiempo: TiempoVerbal;
  persona: number;
  forma: FormaVerbal;
}

export const clavePregunta = (p: PreguntaVerbo) => claveForma(p.verbo.inf, p.tiempo.id, p.persona);

/** Clave de forma → ¿el último intento fue correcto? */
export function ultimosVerbos(intentos: IntentoVerbo[]): Map<string, boolean> {
  const m = new Map<string, boolean>();
  for (const i of intentos) m.set(claveForma(i.verbo, i.tiempo, i.persona), i.correcto);
  return m;
}

/**
 * Elige [cantidad] formas distintas al azar, con más peso para las que fallaste
 * la última vez (×4) y las que no has practicado nunca (×2).
 */
export function sesionVerbos(
  datos: DatosVerbos,
  tiempos: Set<string>,
  grupo: GrupoVerbos,
  cantidad: number,
  ultimos: Map<string, boolean>,
  rnd: Rnd = rndPorDefecto,
): PreguntaVerbo[] {
  const verbos = datos.verbos.filter((v) => {
    switch (grupo) {
      case 'regulares':
        return v.grupo === 'er' || v.grupo === 'ir';
      case 'irregulares':
        return v.grupo === 'irregular';
      case 'pronominales':
        return v.grupo === 'pronominal';
      default:
        return true;
    }
  });
  const candidatas: PreguntaVerbo[] = [];
  for (const v of verbos) {
    for (const t of datos.tiempos) {
      if (!tiempos.has(t.id)) continue;
      v.tiempos[t.id]?.forEach((f, p) => {
        if (f) candidatas.push({ verbo: v, tiempo: t, persona: p, forma: f });
      });
    }
  }
  const filtradas = grupo === 'fallos' ? candidatas.filter((c) => ultimos.get(clavePregunta(c)) === false) : candidatas;
  // Muestreo ponderado sin reemplazo (Efraimidis-Spirakis)
  return filtradas
    .map((c) => {
      const u = ultimos.get(clavePregunta(c));
      const peso = u === false ? 4 : u === undefined ? 2 : 1;
      return { c, k: Math.pow(rnd(), 1 / peso) };
    })
    .sort((a, b) => b.k - a.k)
    .slice(0, cantidad)
    .map((x) => x.c);
}

const SUJETOS = ["j'", 'je ', 'tu ', 'il ', 'elle ', 'on ', 'nous ', 'vous ', 'ils ', 'elles '];

/** Comprueba una respuesta; acepta que se escriba también el sujeto («j'ai pris»). */
export function evaluarVerbo(respuesta: string, forma: FormaVerbal): Resultado {
  const directa = evaluar(respuesta, forma.r);
  if (directa.tipo === 'correcto') return directa;
  const n = normalizar(respuesta);
  const sujeto = SUJETOS.find((s) => n.startsWith(s));
  if (sujeto) {
    const r = evaluar(n.slice(sujeto.length), forma.r);
    if (r.correcto) return r;
  }
  return directa.correcto ? directa : { tipo: 'incorrecto', correcto: false, esperada: forma.r[0] };
}

/** Respuestas aceptadas con sujeto delante («j'ai pris», «elle est allée»), además de sin él. */
export function respuestasConSujeto(f: FormaVerbal, persona: number, tiempo: string): string[] {
  if (tiempo === 'imperativo') return f.r;
  const vocal = (s: string) => /^[aeiouyhàâéèêëîïôûùœ]/i.test(s);
  const sujetos: string[][] = [['je'], ['tu'], ['il', 'elle', 'on'], ['nous'], ['vous'], ['ils', 'elles']];
  const con = f.r.flatMap((r) =>
    (sujetos[persona] ?? []).map((s) => (s === 'je' && vocal(r) ? `j'${r}` : `${s} ${r}`)),
  );
  return [...f.r, ...con];
}

export const PERSONAS_CORTAS = ['je', 'tu', 'il / elle', 'nous', 'vous', 'ils / elles'];
