/** Ejercicios generados a partir del vocabulario (igual que Practica.kt). */
import { barajar, distintosPor, type Rnd, rndPorDefecto } from './aleatorio';
import type { Ejercicio, Vocab } from './tipos';

export const PREFIJO = 'gen:';
export const esGenerado = (e: Ejercicio) => e.id.startsWith(PREFIJO);

// «une» antes que «un»: si no, «une maison» se partía en «un» + «e maison»
const ARTICULO = /^(une\s+|un\s+|la\s+|le\s+|l')(.+)$/i;
const SEPARADORES = [' / ', ' → ', ' = ', ' ≠ ', ' ; '];

/** Primera parte limpia de un texto: sin alternativas, flechas ni paréntesis. */
export function limpiar(texto: string): string {
  let t = texto;
  for (const s of SEPARADORES) t = t.split(s)[0];
  return t.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

/** Sustantivo apto para «¿un o une?»: [palabra sin artículo, artículo indefinido correcto]. */
export function sustantivoConGenero(v: Vocab): [string, string] | null {
  if (v.tipo !== 'sustantivo' || (v.genero !== 'm' && v.genero !== 'f')) return null;
  if (SEPARADORES.some((s) => v.fr.includes(s)) || v.fr.includes('(') || v.fr.includes(',')) return null;
  const m = ARTICULO.exec(v.fr.trim());
  if (!m) return null;
  const palabra = m[2].trim();
  if (!palabra || palabra.split(' ').length > 3) return null;
  return [palabra, v.genero === 'm' ? 'un' : 'une'];
}

export function genero(vocab: Vocab[], n: number, rnd: Rnd = rndPorDefecto): Ejercicio[] {
  const aptos = vocab.flatMap((v) => {
    const par = sustantivoConGenero(v);
    return par ? [{ v, par }] : [];
  });
  return barajar(aptos, rnd)
    .slice(0, n)
    .map(({ v, par: [palabra, art] }) => ({
      id: `${PREFIJO}genero:${v.id}`,
      leccionId: v.leccionId,
      tipo: 'opcion_multiple',
      enunciado: `___ ${palabra}`,
      opciones: ['un', 'une'],
      respuestas: [art],
      explicacion: `${v.fr} · ${v.es}` + (v.nota ? `\n${v.nota}` : ''),
      ref: null,
      fijas: true,
    }));
}

/** Elegir la traducción entre 4 opciones. haciaEspanol: se ve el francés y eliges el español. */
export function traduccion(vocab: Vocab[], reserva: Vocab[], n: number, haciaEspanol: boolean, rnd: Rnd = rndPorDefecto): Ejercicio[] {
  const pool = distintosPor(vocab.length >= 4 ? vocab : reserva, (v) => v.id);
  const textoDe = (v: Vocab) => limpiar(haciaEspanol ? v.es : v.fr);
  const res: Ejercicio[] = [];
  for (const v of barajar(vocab, rnd).slice(0, n)) {
    const correcta = textoDe(v);
    const distractores = [
      ...new Set(
        pool
          .filter((o) => o.id !== v.id)
          .map((o) => ({ o, k: (o.tipo === v.tipo ? 1 : 0) + rnd() }))
          .sort((a, b) => b.k - a.k)
          .map(({ o }) => textoDe(o))
          .filter((t) => t.trim() !== '' && t !== correcta),
      ),
    ].slice(0, 3);
    if (distractores.length < 3) continue;
    res.push({
      id: `${PREFIJO}trad:${haciaEspanol ? 'es' : 'fr'}:${v.id}`,
      leccionId: v.leccionId,
      tipo: 'opcion_multiple',
      enunciado: limpiar(haciaEspanol ? v.fr : v.es),
      opciones: [...distractores, correcta],
      respuestas: [correcta],
      explicacion: `${v.fr} = ${v.es}`,
      ref: null,
    });
  }
  return res;
}

/** Parejas francés–español para emparejar, sin textos repetidos. */
export function parejas(vocab: Vocab[], n: number, rnd: Rnd = rndPorDefecto): [string, string][] {
  const pares = barajar(vocab, rnd)
    .map((v) => [limpiar(v.fr), limpiar(v.es)] as [string, string])
    .filter(([fr, es]) => fr && es && fr.length <= 32 && es.length <= 32);
  return distintosPor(distintosPor(pares, (p) => p[0]), (p) => p[1]).slice(0, n);
}

/** Textos para el dictado: palabras sueltas o frases de ejemplo. */
export function dictado(vocab: Vocab[], frasesExtra: string[], frases: boolean, n: number, rnd: Rnd = rndPorDefecto): string[] {
  const candidatos = frases
    ? [...vocab.flatMap((v) => (v.ejemploFr ? [v.ejemploFr] : [])), ...frasesExtra]
        .map((s) => s.trim())
        .filter((s) => s.length >= 12 && s.length <= 70 && !['→', '/', '…', '...', '___', '(', '≠'].some((x) => s.includes(x)))
    : vocab.map((v) => limpiar(v.fr)).filter((s) => s.length >= 2 && s.length <= 28 && !['...', '…', 'qqn', 'qqch', '/'].some((x) => s.includes(x)));
  return barajar([...new Set(candidatos)], rnd).slice(0, n);
}

/** Sesión generada de vocabulario: mezcla de género y traducción en los dos sentidos. */
export function sesionVocabulario(vocab: Vocab[], reserva: Vocab[], n: number, rnd: Rnd = rndPorDefecto): Ejercicio[] {
  const tercio = Math.max(1, Math.floor(n / 3));
  const g = genero(vocab, tercio, rnd);
  const es = traduccion(vocab, reserva, tercio, true, rnd);
  const fr = traduccion(vocab, reserva, n - g.length - es.length, false, rnd);
  return barajar(distintosPor([...g, ...es, ...fr], (e) => e.id), rnd);
}
