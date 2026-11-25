class AudioService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public registerStateChange(callback: (speaking: boolean) => void) {
    this.onStateChangeCallback = callback;
  }

  public isSupported(): boolean {
    return this.synth !== null;
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.synth) {
      console.warn('Síntese de voz não suportada neste navegador.');
      if (onEnd) onEnd();
      return;
    }

    // Interrompe fala anterior se houver
    this.stop();

    // Limpa texto para narração mais fluida
    const cleanText = text
      .replace(/[📱📧🏦🌐🛒📦🏛️🚨✅⚠️🔴🟡🟢🛡️🆘👨👩👧]/g, '')
      .replace(/https?:\/\/\S+/g, 'link na mensagem');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95; // Velocidade ligeiramente mais lenta e acolhedora para idosos
    utterance.pitch = 1.0;

    // Busca voz em português se disponível
    const voices = this.synth.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Erro ao reproduzir áudio:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
    }
  }

  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }
}

export const audioService = new AudioService();
