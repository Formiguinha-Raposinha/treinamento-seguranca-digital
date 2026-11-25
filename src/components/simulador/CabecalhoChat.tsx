import React from 'react';
import { ArrowLeft, ShieldCheck, Phone, Video, Volume2, Sparkles, MessageSquare, Info } from 'lucide-react';
import { SenderProfile, EnvironmentType } from '../../types/cenario';
import { audioService } from '../../services/audioService';

interface ChatHeaderProps {
  sender: SenderProfile;
  scenarioTitle: string;
  onBack: () => void;
  onOpenAiConfig?: () => void;
  isAiActive?: boolean;
  highContrast: boolean;
  environment?: EnvironmentType;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  sender,
  scenarioTitle,
  onBack,
  onOpenAiConfig,
  isAiActive = false,
  highContrast,
  environment = 'whatsapp'
}) => {
  const isWhatsApp = environment === 'whatsapp';
  const isPhone = environment === 'phone';
  const isSms = environment === 'sms' || isPhone;

  const handleHearHeaderInfo = () => {
    const text = isPhone
      ? `Você está visualizando um SMS de Notificação de 0800. Treinamento: ${scenarioTitle}. Remetente: ${sender.name}. Canal: ${sender.phoneNumber || '0800'}. Lembre-se: este é um ambiente 100% simulado.`
      : isSms
      ? `Você está no aplicativo de Mensagens SMS. Treinamento: ${scenarioTitle}. Remetente: ${sender.name}. Número de envio: ${sender.phoneNumber || 'Número Curto'}. Lembre-se: este é um ambiente 100% simulado.`
      : `Você está no treinamento: ${scenarioTitle}. Conversa simulada no WhatsApp com: ${sender.name}. Número exibido: ${sender.phoneNumber || 'Desconhecido'}. Lembre-se: este é um teste seguro para aprender.`;
    audioService.speak(text);
  };

  return (
    <header className={`w-full border-b transition-colors ${
      highContrast 
        ? 'bg-black text-white border-yellow-400' 
        : !isWhatsApp
        ? 'bg-slate-900 text-white border-slate-800 shadow-md'
        : 'bg-emerald-800 text-white border-emerald-900 shadow-md'
    }`}>
      {/* Faixa Superior de Aviso de Segurança / Simulação */}
      <div className={`px-3 py-1 flex items-center justify-between text-[11px] sm:text-xs font-bold ${
        highContrast 
          ? 'bg-yellow-400 text-black' 
          : isPhone
          ? 'bg-slate-950 text-amber-300 border-b border-slate-800'
          : isSms
          ? 'bg-slate-950 text-blue-300 border-b border-slate-800'
          : 'bg-emerald-950 text-emerald-300'
      }`}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {isPhone
              ? 'SMS DE 0800 • SIMULAÇÃO DE FALSA CENTRAL • AMBIENTE SEGURO'
              : isSms
              ? 'APP DE SMS • AMBIENTE 100% SIMULADO & SEGURO'
              : 'WHATSAPP SIMULADO • AMBIENTE 100% SEGURO'}
          </span>
        </div>
        <button
          onClick={handleHearHeaderInfo}
          className="flex items-center gap-1 underline hover:text-white transition-colors shrink-0 ml-2"
          title="Ouvir informações deste contato"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Ouvir</span>
        </button>
      </div>

      {/* Barra de Título do Mensageiro (SMS vs WhatsApp vs Telefone) */}
      <div className="px-3 py-1.5 sm:py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Botão de Voltar ao Início */}
          <button
            onClick={onBack}
            className={`flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-95 shadow-sm shrink-0 ${
              highContrast
                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                : !isWhatsApp
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-emerald-950 hover:bg-black text-white border border-emerald-600/60'
            }`}
            title="Parar treino e voltar à tela inicial"
            aria-label="Parar treino e voltar à tela inicial"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Início</span>
          </button>

          {/* Avatar (Ícone de SMS para SMS ou Telefone para Phone ou Foto para WhatsApp) */}
          <div className="relative shrink-0">
            {isPhone ? (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-600 flex items-center justify-center text-white shadow-inner border border-amber-400/40">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            ) : isSms ? (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-inner border border-blue-400/40">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            ) : sender.avatarUrl ? (
              <img
                src={sender.avatarUrl}
                alt={sender.name}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-emerald-300"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm sm:text-lg border-2 border-emerald-300">
                {sender.name.charAt(0)}
              </div>
            )}
            {/* Ponto verde de online APENAS no WhatsApp (SMS e Telefone não possuem status online) */}
            {isWhatsApp && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
            )}
          </div>

          {/* Dados do Remetente */}
          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base leading-tight truncate flex items-center gap-1.5">
              <span>{sender.name}</span>
              {isPhone ? (
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30">
                  0800
                </span>
              ) : isSms ? (
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-400/30">
                  SMS
                </span>
              ) : null}
            </h1>
            <p className={`text-[11px] sm:text-xs truncate ${!isWhatsApp ? 'text-slate-300' : 'text-emerald-100 opacity-90'}`}>
              {isPhone
                ? `${sender.phoneNumber || '0800 878 9120'} • Notificação de Segurança`
                : isSms
                ? `${sender.phoneNumber || 'Número Curto'} • Mensagem de Texto`
                : (sender.phoneNumber || sender.statusText || 'online')}
            </p>
          </div>
        </div>

        {/* Ações e Ícones do Topo */}
        <div className="flex items-center gap-1.5 text-white/90">
          {onOpenAiConfig && (
            <button
              onClick={onOpenAiConfig}
              className={`px-2 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 border transition-all active:scale-95 ${
                isAiActive
                  ? 'bg-purple-900/90 text-purple-200 border-purple-400 hover:bg-purple-800 shadow-sm'
                  : !isWhatsApp
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-black'
              }`}
              title="Configurações do Agente de IA Golpista"
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>{isAiActive ? 'IA Online' : 'Offline'}</span>
            </button>
          )}

          {/* Ícones de chamada: Apenas para WhatsApp */}
          {isWhatsApp && (
            <>
              <button 
                onClick={() => audioService.speak('Esta é uma chamada de vídeo simulada. Em caso de suspeita, você deve ligar para o número antigo do seu familiar.')}
                className="p-2 rounded-full hover:bg-white/10" 
                title="Simular chamada de vídeo"
              >
                <Video className="w-5 h-5" />
              </button>
              <button 
                onClick={() => audioService.speak('Esta é uma chamada simulada. Sempre confirme a identidade por voz ou vídeo com pessoas conhecidas.')}
                className="p-2 rounded-full hover:bg-white/10" 
                title="Simular chamada de voz"
              >
                <Phone className="w-5 h-5" />
              </button>
            </>
          )}

          {!isWhatsApp && (
            <button
              onClick={() => audioService.speak(
                isPhone 
                  ? 'Esta é uma notificação com número 0800. Golpistas contratam números 0800 falsos para induzir você a ligar. Nunca ligue no 0800 recebido por mensagem!'
                  : 'Você está visualizando uma mensagem de texto SMS recebida em seu celular. Notificações de bancos legítimos nunca pedem senhas ou cliques em links não oficiais.'
              )}
              className="p-2 rounded-full hover:bg-white/10 text-slate-300"
              title="Informações de Segurança"
            >
              <Info className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export const CabecalhoChat = ChatHeader;
