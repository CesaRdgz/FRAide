/** Generador aleatorio inyectable: en los tests se usa una semilla fija. */
export type Rnd = () => number;

export const rndPorDefecto: Rnd = Math.random;

/** Generador con semilla (mulberry32). */
export function conSemilla(semilla: number): Rnd {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function barajar<T>(lista: readonly T[], rnd: Rnd = rndPorDefecto): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function distintosPor<T, K>(lista: readonly T[], clave: (t: T) => K): T[] {
  const vistos = new Set<K>();
  return lista.filter((t) => {
    const k = clave(t);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

export function agruparPor<T, K>(lista: readonly T[], clave: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const t of lista) {
    const k = clave(t);
    const l = m.get(k);
    if (l) l.push(t);
    else m.set(k, [t]);
  }
  return m;
}
