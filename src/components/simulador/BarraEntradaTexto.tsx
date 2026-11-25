import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, Sparkles, AlertCircle, Info, X } from 'lucide-react';
import { UserChoice, EnvironmentType } from '../../types/cenario';
import { audioService } from '../../services/audioService';

interface ChatInputBarProps {
  onSendMessage: (text: string, inputType?: 'typed' | 'audio') => void;
  suggestedChoices: UserChoice[];
  disabled: boolean;
  highContrast: boolean;
  fontSizeLevel: number;
  environment?: EnvironmentType;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSendMessage,
  suggestedChoices,
  disabled,
  highContrast,
  fontSizeLevel,
  environment = 'whatsapp'
}) => {
  const isSms = environment === 'sms' || environment === 'phone';
  const [inputText, setInputText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [usedAudioForInput, setUsedAudioForInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'info' | 'warning' } | null>(null);
  const recognitionRef = useRef<any>(null);
  const autoClearTimerRef = useRef<any>(null);
  const interimTextRef = useRef<string>('');

  // Limpa o timer de status ao desmontar
  useEffect(() => {
    return () => {
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const showStatus = (text: string, type: 'error' | 'info' | 'warning' = 'info', durationMs = 7000) => {
    if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
    setStatusMessage({ text, type });
    if (durationMs > 0) {
      autoClearTimerRef.current = setTimeout(() => {
        setStatusMessage(null);
      }, durationMs);
    }
  };

  const commitInterimText = () => {
    const t = interimTextRef.current.trim();
    if (t) {
      setInputText(prev => (prev ? `${prev} ${t}` : t));
      setUsedAudioForInput(true);
    }
    interimTextRef.current = '';
    setInterimText('');
  };

  const stopListening = () => {
    commitInterimText();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleToggleMic = () => {
    if (disabled) return;

    // Se já estiver gravando, para imediatamente
    if (isListening) {
      stopListening();
      showStatus('Gravação finalizada.', 'info', 3000);
      return;
    }

    // Para áudio sintetizado em execução para não capturar o próprio som dos alto-falantes
    audioService.stop();

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      showStatus(
        'Seu navegador não possui suporte ao reconhecimento de voz nativo. Recomendamos usar o Google Chrome ou Microsoft Edge.',
        'warning',
        9000
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        interimTextRef.current = '';
        setInterimText('');
        showStatus('🎙️ Microfone ligado! Pode falar sua resposta...', 'info', 5000);
      };

      recognition.onspeechstart = () => {
        showStatus('🎙️ Ouvindo sua voz... continue falando.', 'info', 6000);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final) {
          const finalTrim = final.trim();
          setInputText(prev => (prev ? `${prev} ${finalTrim}` : finalTrim));
          interimTextRef.current = '';
          setInterimText('');
          setUsedAudioForInput(true);
        } else if (interim) {
          const interimTrim = interim.trim();
          interimTextRef.current = interimTrim;
          setInterimText(interimTrim);
          setUsedAudioForInput(true);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Web Speech API onerror:', event.error);
        setIsListening(false);
        interimTextRef.current = '';
        setInterimText('');

        if (event.error === 'not-allowed') {
          showStatus(
            'Permissão de microfone negada. Clique no cadeado ao lado do link do navegador e habilite o microfone.',
            'error',
            10000
          );
        } else if (event.error === 'no-speech') {
          showStatus(
            'Nenhuma fala foi detectada. Confira no ícone de microfone/cadeado do navegador se o microfone correto está selecionado e tente falar novamente (ou digite sua resposta).',
            'warning',
            8000
          );
        } else if (event.error === 'audio-capture') {
          showStatus('Nenhum dispositivo de microfone funcionando no momento.', 'error', 8000);
        } else if (event.error === 'network') {
          showStatus(
            'O serviço de reconhecimento de voz do navegador não respondeu (bloqueio de rede ou navegador sem suporte). Tente no Google Chrome ou digite sua resposta.',
            'warning',
            8000
          );
        } else if (event.error !== 'aborted') {
          showStatus(`Aviso do microfone: ${event.error}`, 'warning', 5000);
        }
      };

      recognition.onend = () => {
        commitInterimText();
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Falha ao iniciar SpeechRecognition:', err);
      setIsListening(false);
      showStatus('Não foi possível ativar o microfone neste momento. Você pode digitar sua resposta.', 'warning', 6000);
    }
  };

  const handleSend = () => {
    const combined = `${inputText} ${interimText}`.trim();
    if (!combined || disabled) return;
    
    const inputType: 'typed' | 'audio' = usedAudioForInput ? 'audio' : 'typed';
    setInputText('');
    setInterimText('');
    setUsedAudioForInput(false);
    stopListening();
    onSendMessage(combined, inputType);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectChip = (choice: UserChoice) => {
    if (disabled) return;
    stopListening();
    setUsedAudioForInput(false);
    onSendMessage(choice.text, 'typed');
  };

  const fontSizeClasses = [
    'text-sm sm:text-base',
    'text-base sm:text-lg',
    'text-lg sm:text-xl'
  ][fontSizeLevel] || 'text-sm sm:text-base';

  return (
    <div className={`p-2.5 sm:p-3 border-t shadow-2xl transition-colors shrink-0 ${
      highContrast 
        ? 'bg-black border-yellow-400 text-white' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Sugestões Rápidas de Resposta (Chips acessíveis) */}
      {suggestedChoices && suggestedChoices.length > 0 && !disabled && (
        <div className="mb-2">
          <div className="flex items-center justify-between gap-1 mb-1.5 px-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className={`w-3.5 h-3.5 ${isSms ? 'text-blue-600' : 'text-emerald-600'}`} />
              <span>{isSms ? 'Sugestões de resposta por SMS:' : 'Sugestões rápidas de resposta:'}</span>
            </span>
            <button
              onClick={() => {
                const text = `Sugestões de resposta: ${suggestedChoices.map((c, i) => `${i + 1}: ${c.text}`).join('. ')}`;
                audioService.speak(text);
              }}
              className={`text-[11px] font-bold flex items-center gap-1 active:scale-95 ${
                isSms ? 'text-blue-700 hover:text-blue-800' : 'text-emerald-700 hover:text-emerald-800'
              }`}
              title="Ouvir sugestões"
            >
              <Volume2 className="w-3 h-3" />
              <span>Ouvir</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pb-0.5">
            {suggestedChoices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleSelectChip(choice)}
                className={`text-left px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all active:scale-95 ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400 hover:bg-yellow-400 hover:text-black text-white'
                    : choice.type === 'insecure'
                    ? 'bg-red-50 border-red-200 hover:bg-red-100 text-red-950 font-semibold'
                    : choice.type === 'verify_official'
                    ? isSms
                      ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-950 font-bold'
                      : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-950 font-bold'
                    : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerta/Notificação de Status do Microfone */}
      {statusMessage && (
        <div className={`mb-2 px-3 py-2 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-2 border transition-all animate-fade-in ${
          statusMessage.type === 'error'
            ? 'bg-red-50 border-red-300 text-red-900'
            : statusMessage.type === 'warning'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-blue-50 border-blue-300 text-blue-950'
        }`}>
          <div className="flex items-start gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <span className="font-semibold leading-relaxed">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-0.5 text-slate-500 hover:text-slate-800 shrink-0"
            title="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Barra de Entrada de Texto com Microfone e Botão de Envio (SMS vs WhatsApp) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Botão de Gravação de Voz (Speech-to-Text) */}
        <button
          type="button"
          onClick={handleToggleMic}
          disabled={disabled}
          title={isListening ? 'Clique para encerrar gravação de voz' : 'Falar mensagem no microfone (Reconhecimento de Voz)'}
          aria-label={isListening ? 'Parar gravação' : 'Falar mensagem no microfone'}
          className={`p-2.5 sm:p-3 rounded-full transition-all shrink-0 active:scale-95 shadow-md ${
            isListening
              ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-300 shadow-red-200'
              : highContrast
              ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700 border-2 border-yellow-400'
              : isSms
              ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-2 border-blue-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Campo de Entrada de Texto */}
        <div className="relative flex-1">
          <input
            type="text"
            value={isListening && interimText ? `${inputText}${inputText ? ' ' : ''}${interimText}` : inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setUsedAudioForInput(false);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              isListening 
                ? '🎙️ Gravando sua voz... fale agora' 
                : isSms
                ? 'Mensagem de texto (SMS)...'
                : 'Digite sua mensagem ou clique nas sugestões...'
            }
            className={`w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border-2 outline-none transition-all ${fontSizeClasses} ${
              isListening
                ? 'border-red-400 bg-red-50/30'
                : highContrast
                ? 'bg-zinc-950 border-yellow-400 text-white placeholder-zinc-500 focus:ring-2 focus:ring-yellow-400'
                : isSms
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-200'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-200'
            }`}
          />
        </div>

        {/* Botão de Envio */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!inputText.trim() && !interimText.trim())}
          title={isSms ? 'Enviar SMS' : 'Enviar mensagem'}
          aria-label={isSms ? 'Enviar SMS' : 'Enviar mensagem'}
          className={`p-2.5 sm:p-3 rounded-full transition-all shrink-0 active:scale-95 shadow-md ${
            (!inputText.trim() && !interimText.trim()) || disabled
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : highContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300 font-bold'
              : isSms
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Feedback em Tempo Real de Fala Enquanto o Usuário Fala */}
      {isListening && (
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
            <p className="text-xs text-red-900 font-bold truncate">
              {interimText ? `"${interimText}..."` : 'Ouvindo... pode falar agora'}
            </p>
          </div>
          <button
            onClick={stopListening}
            className="text-[11px] font-black text-red-700 hover:text-red-900 underline shrink-0"
          >
            Concluir
          </button>
        </div>
      )}
    </div>
  );
};

export const BarraEntradaTexto = ChatInputBar;
