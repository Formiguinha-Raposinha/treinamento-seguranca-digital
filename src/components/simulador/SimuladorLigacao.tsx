import React, { useState, useEffect } from 'react';
import { PhoneOff, Volume2, PhoneCall } from 'lucide-react';
import { Scenario, MessageNode, UserChoice } from '../../types/cenario';
import { audioService } from '../../services/audioService';

interface PhoneCallSimulatorProps {
  scenario: Scenario;
  currentNode: MessageNode;
  onSelectChoice: (choice: UserChoice) => void;
  onHangup: () => void;
  onSendMessage?: (text: string) => void;
  isAiActive?: boolean;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const PhoneCallSimulator: React.FC<PhoneCallSimulatorProps> = ({
  scenario,
  currentNode,
  onSelectChoice,
  onHangup,
  onSendMessage,
  highContrast,
  fontSizeLevel
}) => {
  const [callDurationSeconds, setCallDurationSeconds] = useState(12);
  const [isSpeakingOperator, setIsSpeakingOperator] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Contador de tempo da chamada telefônica
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDurationSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formata os segundos em mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Narra a fala do atendente ao entrar no nó
  useEffect(() => {
    if (currentNode.text) {
      setIsSpeakingOperator(true);
      // Remove marcadores visuais como [Música de espera...] para o áudio ficar limpo
      const speechText = currentNode.text
        .replace(/\[.*?\]/g, '')
        .replace(/👨‍💼 Atendente Rodrigo:/g, 'Atendente Rodrigo diz:')
        .trim();
      
      audioService.speak(speechText, () => {
        setIsSpeakingOperator(false);
      });
    }
  }, [currentNode.id]);

  const handleHearAgain = () => {
    setIsSpeakingOperator(true);
    const speechText = currentNode.text
      .replace(/\[.*?\]/g, '')
      .replace(/👨‍💼 Atendente Rodrigo:/g, 'Atendente Rodrigo diz:')
      .trim();
    audioService.speak(speechText, () => {
      setIsSpeakingOperator(false);
    });
  };

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    if (onSendMessage) {
      onSendMessage(customInput);
      setCustomInput('');
    }
  };

  const fontSizeClasses = [
    'text-sm sm:text-base',
    'text-base sm:text-lg',
    'text-lg sm:text-xl'
  ][fontSizeLevel] || 'text-sm sm:text-base';

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col h-[calc(100dvh-44px)] sm:h-[88vh] sm:max-h-[850px] sm:rounded-3xl shadow-2xl overflow-hidden border-2 transition-all ${
      highContrast
        ? 'bg-black text-white border-yellow-400'
        : 'bg-gradient-to-b from-slate-900 via-zinc-900 to-black text-white border-slate-700'
    }`}>
      {/* Topo da Chamada Telefônica */}
      <div className={`p-3 sm:p-4 text-center border-b shrink-0 ${
        highContrast ? 'border-yellow-400 bg-zinc-950' : 'border-slate-800 bg-slate-950/70'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Ligação Telefônica Ativa • Falsa Central</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
              ⏱️ {formatTime(callDurationSeconds)}
            </span>
          </div>
        </div>

        {/* Identificação do Remetente da Chamada */}
        <div className="mt-2.5">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
            {scenario.sender.name || 'Central de Segurança 0800'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">
            {scenario.sender.phoneNumber || '0800 878 9120'}
          </p>
        </div>
      </div>

      {/* Meio da Chamada: Avatar da Central e Transcrição da Voz */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-between space-y-4">
        {/* Animação Visual de Voz da URA / Atendente */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-all ${
              isSpeakingOperator
                ? 'bg-amber-600 border-amber-400 scale-105 shadow-amber-500/30'
                : 'bg-slate-800 border-slate-700'
            }`}>
              <PhoneCall className={`w-10 h-10 sm:w-12 sm:h-12 ${isSpeakingOperator ? 'text-white animate-bounce' : 'text-slate-400'}`} />
            </div>

            {isSpeakingOperator && (
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase shadow">
                Falando...
              </span>
            )}
          </div>

          <span className="text-xs text-slate-400 font-semibold mt-2.5 flex items-center gap-1.5">
            <span>Operador Rodrigo em linha</span>
            {isSpeakingOperator && (
              <span className="flex gap-0.5">
                <span className="w-1.5 h-3 bg-amber-400 animate-pulse"></span>
                <span className="w-1.5 h-4 bg-amber-400 animate-pulse [animation-delay:0.15s]"></span>
                <span className="w-1.5 h-2 bg-amber-400 animate-pulse [animation-delay:0.3s]"></span>
              </span>
            )}
          </span>
        </div>

        {/* Cartão de Transcrição da Voz do Operador */}
        <div className={`p-4 rounded-2xl border transition-all ${
          highContrast
            ? 'bg-zinc-900 border-yellow-400 text-white'
            : 'bg-slate-800/90 border-slate-700 text-slate-100 shadow-xl'
        }`}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>🎧 O que o suposto atendente está falando:</span>
            </span>
            <button
              onClick={handleHearAgain}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 underline"
              title="Ouvir novamente a fala do atendente"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Ouvir Voz</span>
            </button>
          </div>

          <p className={`${fontSizeClasses} leading-relaxed font-medium italic`}>
            {currentNode.text}
          </p>
        </div>

        {/* Opções de Resposta do Idoso ao Telefone */}
        <div className="space-y-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <span>🗣️ Como você responde na ligação:</span>
          </span>

          <div className="flex flex-col gap-2">
            {currentNode.choices?.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onSelectChoice(choice)}
                className={`p-3 sm:p-3.5 rounded-xl font-bold text-left transition-all active:scale-[0.98] border shadow-md text-xs sm:text-sm flex items-center justify-between gap-2 ${
                  choice.type === 'safe'
                    ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-500/60'
                    : choice.type === 'insecure'
                    ? 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-500/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                }`}
              >
                <span>{choice.text}</span>
                <span className="shrink-0 text-slate-400 text-xs">➔</span>
              </button>
            ))}
          </div>

          {/* Digitação/Fala Livre caso queira responder com microfone ou texto */}
          {onSendMessage && (
            <form onSubmit={handleCustomSend} className="flex gap-2 pt-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ou fale algo para o atendente..."
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!customInput.trim()}
                className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs"
              >
                Falar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Rodapé da Ligação Telefônica com o Botão Vermelho Salva-Vidas */}
      <div className={`p-4 sm:p-5 border-t flex flex-col items-center justify-center gap-3 shrink-0 ${
        highContrast ? 'bg-zinc-950 border-yellow-400' : 'bg-slate-950/90 border-slate-800'
      }`}>
        {/* Botão Vermelho Gigante: DESLIGAR A CHAMADA (A Atitude Segura Principal) */}
        <button
          onClick={onHangup}
          className="w-full max-w-md py-3.5 sm:py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all border-2 border-red-400"
          title="Desligar imediatamente a chamada telefônica"
        >
          <PhoneOff className="w-6 h-6 animate-pulse" />
          <span>🛑 DESLIGAR CHAMADA (Encerrar Ligação)</span>
        </button>

        <p className="text-[11px] text-slate-400 font-medium text-center">
          💡 <strong>Regra de Ouro:</strong> Bancos nunca pedem senha ou Pix por telefone. Em caso de dúvida, <strong>desligue na hora!</strong>
        </p>
      </div>
    </div>
  );
};

export const SimuladorLigacao = PhoneCallSimulator;
