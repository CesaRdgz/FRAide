/**
 * Markdown mínimo para las explicaciones: párrafos, listas con «- », **negrita** y *cursiva*.
 * Escapa todo el HTML: el contenido importado nunca puede inyectar código.
 */
export function escapar(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function enLinea(s: string): string {
  return escapar(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>');
}

export function markdown(texto: string): string {
  const bloques = texto.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return bloques
    .map((b) => {
      const lineas = b.split('\n').filter((l) => l.trim() !== '');
      if (lineas.length > 0 && lineas.every((l) => /^\s*[-•]\s+/.test(l))) {
        return `<ul>${lineas.map((l) => `<li>${enLinea(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      // Bloque mixto: texto seguido de lista
      const html: string[] = [];
      let lista: string[] = [];
      const cerrar = () => {
        if (lista.length) html.push(`<ul>${lista.join('')}</ul>`);
        lista = [];
      };
      const parrafo: string[] = [];
      const volcarParrafo = () => {
        if (parrafo.length) html.push(`<p>${parrafo.join('<br>')}</p>`);
        parrafo.length = 0;
      };
      for (const l of lineas) {
        if (/^\s*[-•]\s+/.test(l)) {
          volcarParrafo();
          lista.push(`<li>${enLinea(l.replace(/^\s*[-•]\s+/, ''))}</li>`);
        } else {
          cerrar();
          parrafo.push(enLinea(l));
        }
      }
      volcarParrafo();
      cerrar();
      return html.join('');
    })
    .join('');
}

/** Resalta el hueco «___» de un enunciado. */
export function conHueco(enunciado: string): string {
  return escapar(enunciado).replace(/_{2,}/g, '<span class="hueco">&nbsp;</span>');
}
