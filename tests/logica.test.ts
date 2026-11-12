import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { conSemilla } from '../src/lib/aleatorio';
import { calificacion, formatearNota, generar, nota10, tiemposDelTema, TOTAL, corregir } from '../src/lib/examen';
import { analizar, escribirCopia, leerCopia } from '../src/lib/importador';
import { markdown, conHueco } from '../src/lib/markdown';
import { dictado, genero, limpiar, parejas, sustantivoConGenero, traduccion } from '../src/lib/practica';
import { CAJA_APRENDIDA, estadoPalabra, proximoRepaso, racha, responderTarjeta, sesionRepaso } from '../src/lib/progreso';
import { evaluar, normalizar } from '../src/lib/respuestas';
import { progresoVacio, type DatosVerbos, type Leccion, type Vocab } from '../src/lib/tipos';
import { evaluarVerbo, respuestasConSujeto, sesionVerbos, ultimosVerbos } from '../src/lib/verbos';
import datosVerbos from '../src/lib/verbos.json';

const verbos = datosVerbos as unknown as DatosVerbos;

const voc = (id: string, fr: string, es: string, genero: string | null = 'm', tipo = 'sustantivo'): Vocab => ({
  id: `l1:${id}`, leccionId: 'l1', fr, es, tipo, genero, categoria: null, ejemploFr: null, ejemploEs: null, nota: null,
});

const LECCION = {
  id: 'prueba-d1-l1',
  libro: 'Libro de prueba',
  nivel: 'A2',
  dossier: 1,
  leccion: 1,
  titulo: 'Titre',
  titulo_es: 'Título',
  resumen: 'Resumen.',
  competencias: ['passe-compose', 'comparativo'],
  vocabulario: [
    { id: 'v-maison', fr: 'une maison', es: 'una casa', tipo: 'sustantivo', genero: 'f' },
    { id: 'v-loyer', fr: 'le loyer', es: 'el alquiler', tipo: 'sustantivo', genero: 'm' },
  ],
  gramatica: [{ id: 'g-si', titulo: 'Si', explicacion: '**Si** + presente', ejemplos: [{ fr: 'a', es: 'b' }] }],
  ejercicios: [
    { id: 'e1', tipo: 'opcion_multiple', enunciado: '___ y a un balcon', opciones: ["S'il", 'Si il'], respuesta: "S'il", ref: 'g-si' },
    { id: 'e2', tipo: 'rellenar', enunciado: 'Le ___', respuesta: ['loyer'] },
  ],
};

describe('respuestas', () => {
  it('normaliza apóstrofos, mayúsculas y puntuación final', () => {
    expect(normalizar('  J’ai  Pris. ')).toBe("j'ai pris");
    expect(normalizar('«Bonjour» !')).toBe('bonjour');
  });
  it('acepta sin acentos avisando', () => {
    expect(evaluar('etait', ['était']).tipo).toBe('sinAcentos');
    expect(evaluar('était', ['était']).tipo).toBe('correcto');
    expect(evaluar('sont', ['était']).correcto).toBe(false);
  });
});

describe('importador', () => {
  it('lee una lección y prefija los ids como Android', () => {
    const a = analizar(JSON.stringify(LECCION));
    expect(a.tipo).toBe('leccion');
    if (a.tipo !== 'leccion') return;
    expect(a.leccion.vocabulario[0].id).toBe('prueba-d1-l1:v-maison');
    expect(a.leccion.ejercicios[0].ref).toBe('prueba-d1-l1:g-si');
    expect(a.leccion.ejercicios[1].respuestas).toEqual(['loyer']);
  });
  it('rechaza con un motivo legible', () => {
    const a = analizar(JSON.stringify({ ...LECCION, nivel: 'Z9' }));
    expect(a).toEqual({ tipo: 'invalido', motivo: 'Nivel «Z9» no válido.' });
    expect(analizar('no es json').tipo).toBe('invalido');
    const sinOpciones = { ...LECCION, ejercicios: [{ id: 'e1', tipo: 'opcion_multiple', enunciado: 'x', respuesta: 'a' }] };
    expect(analizar(JSON.stringify(sinOpciones))).toMatchObject({ tipo: 'invalido', motivo: 'Ejercicio e1: necesita al menos 2 opciones.' });
  });
  it('copia de progreso: ida y vuelta en el formato de Android', () => {
    const p = progresoVacio();
    responderTarjeta(p, 'l1:v-a', true);
    p.examenes.push({ libro: 'L', dossier: 1, nota10: 75, aciertos: 15, total: 20, fecha: 1 });
    p.intentosVerbo.push({ verbo: 'être', tiempo: 'presente', persona: 0, correcto: true, fecha: 2 });
    const json = JSON.parse(escribirCopia(p));
    expect(json.tipo).toBe('fraide-progreso');
    expect(json.tarjetas[0]).toHaveProperty('item_id', 'l1:v-a');
    const vuelta = leerCopia(json);
    expect(vuelta.tarjetas['l1:v-a'].caja).toBe(1);
    expect(vuelta.examenes[0].nota10).toBe(75);
    expect(vuelta.intentosVerbo[0].verbo).toBe('être');
    expect(Object.values(vuelta.actividad)[0]).toBe(1);
  });
});

describe('Leitner', () => {
  it('sube de caja solo si tocaba; un fallo vuelve a 0', () => {
    const p = progresoVacio();
    const dia1 = new Date(2026, 10, 10, 10);
    responderTarjeta(p, 'x', true, dia1);
    expect(p.tarjetas.x.caja).toBe(1);
    expect(p.tarjetas.x.proximo).toBe(proximoRepaso(1, dia1));
    responderTarjeta(p, 'x', true, dia1); // mismo día: no adelanta
    expect(p.tarjetas.x.caja).toBe(1);
    expect(p.tarjetas.x.aciertos).toBe(2);
    responderTarjeta(p, 'x', false, dia1);
    expect(p.tarjetas.x.caja).toBe(0);
  });
  it('memorizada a partir de la caja 3', () => {
    expect(estadoPalabra(undefined)).toBe('nueva');
    expect(estadoPalabra({ itemId: 'x', caja: CAJA_APRENDIDA, proximo: 0, aciertos: 3, fallos: 0, ultimo: 0 })).toBe('memorizada');
  });
  it('sesión: pendientes y luego nuevas con tope', () => {
    const p = progresoVacio();
    const vocab = [voc('a', 'un a', 'a'), voc('b', 'un b', 'b'), voc('c', 'un c', 'c')];
    p.tarjetas['l1:a'] = { itemId: 'l1:a', caja: 1, proximo: 0, aciertos: 1, fallos: 0, ultimo: 0 };
    const s = sesionRepaso(vocab, p, 1, Date.now(), conSemilla(1));
    expect(s.map((v) => v.id)).toEqual(['l1:a', 'l1:b']);
  });
  it('racha: días seguidos hasta hoy o ayer', () => {
    const hoy = new Date(2026, 10, 10, 12);
    expect(racha({ '2026-11-10': 3, '2026-11-09': 1, '2026-11-07': 2 }, hoy)).toBe(2);
    expect(racha({ '2026-11-09': 1, '2026-11-08': 1 }, hoy)).toBe(2);
    expect(racha({ '2026-11-08': 1 }, hoy)).toBe(0);
  });
});

describe('práctica generada', () => {
  const vocab = [
    voc('maison', 'une maison', 'una casa', 'f'),
    voc('loyer', 'le loyer', 'el alquiler', 'm'),
    voc('cave', 'une cave', 'un trastero', 'f'),
    voc('etage', "l'étage", 'la planta', 'm'),
    voc('quartier', 'un quartier', 'un barrio', 'm'),
    voc('louer', 'louer', 'alquilar', null, 'verbo'),
  ];
  it('limpia alternativas y paréntesis', () => {
    expect(limpiar('spacieux / spacieuse')).toBe('spacieux');
    expect(limpiar('bien situé(e)')).toBe('bien situé');
  });
  it('género: un/une sin artículo y opciones fijas', () => {
    expect(sustantivoConGenero(vocab[0])).toEqual(['maison', 'une']);
    expect(sustantivoConGenero(vocab[5])).toBeNull();
    const g = genero(vocab, 10, conSemilla(3));
    expect(g.length).toBe(5);
    expect(g.every((e) => e.fijas && e.opciones.join() === 'un,une')).toBe(true);
  });
  it('traducción: 4 opciones distintas con la correcta', () => {
    const t = traduccion(vocab, vocab, 3, true, conSemilla(7));
    for (const e of t) {
      expect(new Set(e.opciones).size).toBe(4);
      expect(e.opciones).toContain(e.respuestas[0]);
    }
  });
  it('parejas y dictado sin repetidos', () => {
    expect(new Set(parejas(vocab, 6, conSemilla(1)).map((p) => p[0])).size).toBe(6);
    expect(dictado(vocab, [], false, 10, conSemilla(1)).length).toBe(6);
  });
});

describe('verbos', () => {
  it('acepta la respuesta con o sin sujeto', () => {
    const f = { d: "j'ai pris", r: ['ai pris'] };
    expect(evaluarVerbo('ai pris', f).correcto).toBe(true);
    expect(evaluarVerbo("J'ai pris", f).correcto).toBe(true);
    expect(evaluarVerbo('je ai pris', f).correcto).toBe(true);
    expect(evaluarVerbo('as pris', f).correcto).toBe(false);
    expect(respuestasConSujeto(f, 0, 'passe_compose')).toEqual(['ai pris', "j'ai pris"]);
    expect(respuestasConSujeto({ d: 'je me lève', r: ['me lève'] }, 0, 'presente')).toContain('je me lève');
    expect(respuestasConSujeto({ d: 'Pars !', r: ['pars'] }, 1, 'imperativo')).toEqual(['pars']);
  });
  it('sesión: formas distintas del grupo y tiempo pedidos; «mis fallos» solo fallos', () => {
    const s = sesionVerbos(verbos, new Set(['presente']), 'irregulares', 15, new Map(), conSemilla(2));
    expect(s.length).toBe(15);
    expect(s.every((p) => p.tiempo.id === 'presente' && p.verbo.grupo === 'irregular')).toBe(true);
    const ult = ultimosVerbos([{ verbo: 'être', tiempo: 'presente', persona: 0, correcto: false, fecha: 1 }]);
    const f = sesionVerbos(verbos, new Set(['presente']), 'fallos', 10, ult);
    expect(f.map((p) => p.verbo.inf)).toEqual(['être']);
  });
  it('datos: 59 verbos y 6 tiempos', () => {
    expect(verbos.verbos.length).toBe(59);
    expect(verbos.tiempos.map((t) => t.id)).toContain('imparfait');
  });
});

describe('examen', () => {
  it('nota y calificación', () => {
    expect(nota10(15, 20)).toBe(75);
    expect(formatearNota(75)).toBe('7,5');
    expect(formatearNota(80)).toBe('8');
    expect(calificacion(75)).toBe('Notable');
    expect(calificacion(49)).toBe('Suspenso');
  });
  it('20 preguntas con verbos de los tiempos del tema', () => {
    const a = analizar(JSON.stringify(LECCION));
    if (a.tipo !== 'leccion') throw new Error();
    const l: Leccion = a.leccion;
    const ejercicios = Array.from({ length: 30 }, (_, i) => ({ ...l.ejercicios[1], id: `x${i}`, leccionId: `l${i % 3}` }));
    const vocab = Array.from({ length: 12 }, (_, i) => voc(`v${i}`, `le mot${i}`, `palabra${i}`));
    const tiempos = tiemposDelTema([l], 1, verbos);
    expect([...tiempos]).toEqual(['passe_compose']);
    const ex = generar(ejercicios, vocab, vocab, verbos, tiempos, conSemilla(5));
    expect(ex.length).toBe(TOTAL);
    expect(ex.filter((p) => p.seccion === 'verbos').length).toBe(4);
    expect(new Set(ex.map((p) => p.ejercicio.id)).size).toBe(TOTAL);
    const v = ex.find((p) => p.seccion === 'verbos')!;
    expect(corregir(v, v.ejercicio.respuestas[0])).toBe(true);
    expect(corregir(v, '')).toBe(false);
  });
  it('repaso (dossier 0): todos los tiempos de su nivel', () => {
    const l = { nivel: 'A1' } as Leccion;
    expect(tiemposDelTema([l], 0, verbos).size).toBeGreaterThan(0);
  });
});

describe('markdown', () => {
  it('escapa HTML y aplica negrita, cursiva y listas', () => {
    expect(markdown('<b>x</b> **y** *z*')).toBe('<p>&lt;b&gt;x&lt;/b&gt; <strong>y</strong> <em>z</em></p>');
    expect(markdown('Uno:\n- a\n- b')).toBe('<p>Uno:</p><ul><li>a</li><li>b</li></ul>');
    expect(conHueco('Le ___ est')).toContain('class="hueco"');
  });
});

// Si el proyecto Android está al lado (en el PC de César), comprueba que todas sus lecciones se leen bien.
const CARPETA = '../FRAide/content/lecciones';
describe.runIf(existsSync(CARPETA))('lecciones reales', () => {
  // En GitHub la carpeta no existe: sin esto, readdirSync fallaba antes de saltarse el bloque
  for (const f of existsSync(CARPETA) ? readdirSync(CARPETA) : []) {
    it(f, () => {
      const a = analizar(readFileSync(`${CARPETA}/${f}`, 'utf8'));
      expect(['leccion', 'retirada']).toContain(a.tipo);
    });
  }
});
