/** Comprobación de respuestas escritas (igual que util/Respuestas.kt). */

export type Resultado =
  | { tipo: 'correcto'; correcto: true }
  /** Correcta salvo acentos: cuenta como acierto, pero se avisa. */
  | { tipo: 'sinAcentos'; correcto: true; esperada: string }
  | { tipo: 'incorrecto'; correcto: false; esperada: string };

/** Minúsculas, apóstrofos rectos, espacios simples y sin puntuación final. */
export function normalizar(texto: string): string {
  return texto
    .toLocaleLowerCase('fr')
    .replace(/[’‘`]/g, "'")
    .replace(/\s*'\s*/g, "'")
    .replace(/[¡¿«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?, ]+$/, '')
    .trim();
}

export function sinAcentos(texto: string): string {
  return texto
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{Mn}+/gu, '');
}

export function evaluar(respuesta: string, validas: string[]): Resultado {
  const r = normalizar(respuesta);
  if (validas.some((v) => normalizar(v) === r)) return { tipo: 'correcto', correcto: true };
  const plano = sinAcentos(r);
  const parecida = validas.find((v) => sinAcentos(normalizar(v)) === plano);
  if (parecida !== undefined) return { tipo: 'sinAcentos', correcto: true, esperada: parecida };
  return { tipo: 'incorrecto', correcto: false, esperada: validas[0] ?? '' };
}

/** Para ejercicios de opciones: ¿la opción elegida es una de las válidas? */
export function opcionCorrecta(elegida: string, validas: string[]): boolean {
  const e = normalizar(elegida);
  return validas.some((v) => normalizar(v) === e);
}

/** Para comparar dictados: sin signos de puntuación (las comas no cuentan). */
export function soloTexto(s: string): string {
  return s
    .replace(/’/g, "'")
    .replace(/[^\p{L}\p{N}' -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
