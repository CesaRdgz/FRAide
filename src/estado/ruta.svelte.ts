/**
 * Rutas con «#» (#/leccion/mae2-d1-l1): funcionan en GitHub Pages sin configurar nada
 * y el botón Atrás del navegador hace lo esperado.
 */
class Ruta {
  partes = $state<string[]>([]);

  constructor() {
    if (typeof window === 'undefined') return;
    const leer = () => {
      this.partes = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    };
    leer();
    window.addEventListener('hashchange', () => {
      leer();
      window.scrollTo({ top: 0 });
    });
  }

  get pantalla(): string {
    return this.partes[0] ?? '';
  }
}

export const ruta = new Ruta();

export function ir(...partes: (string | number)[]): void {
  location.hash = '/' + partes.map((p) => encodeURIComponent(String(p))).join('/');
}

export function href(...partes: (string | number)[]): string {
  return '#/' + partes.map((p) => encodeURIComponent(String(p))).join('/');
}

export function atras(porDefecto = ''): void {
  if (history.length > 1) history.back();
  else ir(porDefecto);
}
