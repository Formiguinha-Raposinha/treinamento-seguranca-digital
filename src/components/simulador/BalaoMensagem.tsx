import React, { useState } from 'react';
import { Volume2, VolumeX, AlertTriangle, ShieldCheck, Globe, ExternalLink, Search } from 'lucide-react';
import { MessageNode, LinkPreview, EnvironmentType } from '../../types/cenario';
import { audioService } from '../../services/audioService';

interface MessageBubbleProps {
  message: MessageNode;
  onOpenLink?: (link: LinkPreview) => void;
  onInspectLink?: (link: LinkPreview) => void;
  highContrast: boolean;
  fontSizeLevel: number;
  environment?: EnvironmentType;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onOpenLink,
  onInspectLink,
  highContrast,
  fontSizeLevel,
  environment = 'whatsapp'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const isSms = environment === 'sms' || environment === 'phone';

  const handleSpeak = () => {
    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const prefix = message.sender === 'opponent' 
        ? (isSms ? 'Mensagem SMS recebida: ' : 'Mensagem recebida: ') 
        : 'Sua resposta: ';
      let textToRead = prefix + message.text;
      if (message.linkPreview) {
        textToRead += `. Há um link anexado para: ${message.linkPreview.displayUrl}. Título: ${message.linkPreview.title}.`;
      }
      audioService.speak(textToRead, () => {
        setIsPlaying(false);
      });
    }
  };

  const isOpponent = message.sender === 'opponent';
  const isSystem = message.sender === 'system';

  // Classes dinâmicas de tamanho de fonte
  const fontSizeClasses = [
    'text-base',        // Normal
    'text-lg sm:text-xl', // Grande
    'text-xl sm:text-2xl' // Extra Grande
  ][fontSizeLevel] || 'text-base';

  if (isSystem) {
    return (
      <div className="w-full flex justify-center my-3 px-4">
        <div className={`max-w-md p-3.5 rounded-2xl border text-center text-sm sm:text-base font-semibold shadow-sm flex items-center gap-2.5 ${
          message.isSafeEnding 
            ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
            : 'bg-amber-100 text-amber-900 border-amber-300'
        }`}>
          {message.isSafeEnding ? <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
          <div className="flex-1 text-left">{message.text}</div>
          <button
            onClick={handleSpeak}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 shrink-0"
            title="Ouvir aviso do sistema"
          >
            {isPlaying ? <VolumeX className="w-5 h-5 text-red-600 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  // Estilização distinta entre SMS (Android / Google Messages) e WhatsApp
  const bubbleStyles = isOpponent
    ? highContrast
      ? 'bg-zinc-900 text-white border-2 border-white rounded-tl-none'
      : isSms
      ? 'bg-slate-200 text-slate-900 border border-slate-300 rounded-tl-none'
      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
    : highContrast
    ? 'bg-yellow-400 text-black font-bold border-2 border-yellow-500 rounded-tr-none'
    : isSms
    ? 'bg-blue-600 text-white rounded-tr-none' // SMS Azul Google Messages
    : 'bg-emerald-600 text-white rounded-tr-none'; // WhatsApp Verde

  return (
    <div className={`w-full flex my-2 px-3 ${isOpponent ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 shadow-sm relative transition-all ${bubbleStyles}`}
      >
        {/* Identificador sutil de SMS recebido */}
        {isSms && isOpponent && (
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
            <span>Mensagem SMS Recebida</span>
          </div>
        )}

        {/* Texto da Mensagem */}
        <p className={`${fontSizeClasses} leading-relaxed font-normal`}>
          {message.text}
        </p>

        {/* Card de Preview de Link Interativo */}
        {message.linkPreview && (
          <div className={`mt-3 p-3 rounded-xl border-2 transition-all ${
            highContrast
              ? 'bg-black border-yellow-400 text-white'
              : isSms
              ? 'bg-white border-slate-300 text-slate-900 hover:border-blue-500'
              : 'bg-slate-50 border-slate-300 text-slate-900 hover:border-emerald-500'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isSms ? 'bg-red-50 text-red-600' : 'bg-red-100 text-red-700'}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-mono font-bold text-red-600 truncate block">
                  {message.linkPreview.displayUrl}
                </span>
                <h4 className="text-sm font-extrabold line-clamp-1 mt-0.5">
                  {message.linkPreview.title}
                </h4>
                {message.linkPreview.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    {message.linkPreview.description}
                  </p>
                )}
              </div>
            </div>

            {/* Ações do Link */}
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onOpenLink && onOpenLink(message.linkPreview!)}
                className={`flex-1 px-3 py-2 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all ${
                  isSms ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                title="Acessar página simulada no navegador seguro"
              >
                <span>Acessar Link (Simulado)</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              {onInspectLink && (
                <button
                  type="button"
                  onClick={() => onInspectLink(message.linkPreview!)}
                  className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                  title="Inspecionar e analisar se o link é perigoso"
                >
                  <Search className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Inspecionar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rodapé do Balão: Horário e Botão de Áudio Dedicado */}
        <div className="mt-2.5 pt-1.5 border-t border-black/10 flex items-center justify-between gap-4">
          <span className={`text-xs opacity-70 font-medium ${
            isOpponent 
              ? 'text-slate-500' 
              : isSms
              ? 'text-blue-100'
              : 'text-emerald-100'
          }`}>
            {isSms ? `SMS • ${message.timestamp || 'Agora'}` : (message.timestamp || 'Agora')}
          </span>

          {/* Botão de Leitura de Áudio Acessível */}
          <button
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-transform active:scale-95 ${
              isPlaying
                ? 'bg-red-500 text-white animate-bounce'
                : isOpponent
                ? isSms
                  ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
            title="Ouvir esta mensagem em voz alta"
            aria-label="Ouvir mensagem"
          >
            {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Parar' : 'Ouvir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const BalaoMensagem = MessageBubble;
