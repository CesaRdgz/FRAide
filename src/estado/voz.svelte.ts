/** Voz francesa del sistema (Web Speech API), sin internet en la mayoría de equipos. */
import { app } from './app.svelte';

class Voz {
  disponible = $state(false);
  private voz: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof speechSynthesis === 'undefined') return;
    const elegir = () => {
      const voces = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
      // Preferimos francés de Francia y voces locales
      this.voz =
        voces.find((v) => v.lang === 'fr-FR' && v.localService) ??
        voces.find((v) => v.lang === 'fr-FR') ??
        voces[0] ??
        null;
      this.disponible = this.voz !== null;
    };
    elegir();
    speechSynthesis.addEventListener?.('voiceschanged', elegir);
  }

  hablar(texto: string, lento = false): void {
    if (!this.voz) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.voice = this.voz;
    u.lang = this.voz.lang;
    u.rate = app.ajustes.velocidadVoz * (lento ? 0.7 : 1);
    speechSynthesis.speak(u);
  }
}

export const voz = new Voz();
