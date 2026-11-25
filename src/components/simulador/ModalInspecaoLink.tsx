import React from 'react';
import { ShieldAlert, ExternalLink, CheckCircle2, XCircle, Volume2, X } from 'lucide-react';
import { SimulatedWebPage } from '../../types/cenario';
import { audioService } from '../../services/audioService';

interface UrlInspectorModalProps {
  page: SimulatedWebPage;
  onClose: () => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const UrlInspectorModal: React.FC<UrlInspectorModalProps> = ({
  page,
  onClose,
  highContrast,
  fontSizeLevel
}) => {
  const handleHearExplanation = () => {
    const text = `Laboratório de Verificação de Links. O endereço deste site é: ${page.url}. Veja o alerta: ${page.suspiciousDomainExplanation}. O endereço oficial correto da instituição seria: ${page.officialDomainExample}. Lembre-se: ter o cadeado não significa que o site é honesto.`;
    audioService.speak(text);
  };

  const fontSizeClasses = [
    'text-base',
    'text-lg sm:text-xl',
    'text-xl sm:text-2xl'
  ][fontSizeLevel] || 'text-base';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className={`my-auto max-w-xl w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-4 transition-all ${
        highContrast 
          ? 'bg-black text-white border-yellow-400' 
          : 'bg-white text-slate-900 border-amber-500'
      }`}>
        {/* Header com Botão Fechar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">
                Raio-X do Endereço (Link)
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Aprenda a inspecionar links antes de digitar senhas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleHearExplanation}
              className="p-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95 transition-all"
              title="Ouvir explicação do link"
              aria-label="Ouvir explicação do link"
            >
              <Volume2 className="w-5 h-5 text-amber-700" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
              title="Fechar análise"
              aria-label="Fechar análise"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparador Visual de Links */}
        <div className="my-4 space-y-3">
          {/* Link Suspeito Analisado */}
          <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-xs font-black uppercase text-red-700 tracking-wider">
                Endereço Deste Site (Suspeito / Falso)
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-red-950 bg-white p-2.5 rounded-xl border border-red-200 break-all select-all">
              {page.url}
            </div>
            <p className="mt-2 text-xs sm:text-sm text-red-900 leading-relaxed font-medium">
              ⚠️ <strong>Sinal de Perigo:</strong> {page.suspiciousDomainExplanation}
            </p>
          </div>

          {/* Link Oficial Legítimo para Comparar */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">
                Como seria o Endereço Oficial Verdadeiro
              </span>
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-emerald-950 bg-white p-2.5 rounded-xl border border-emerald-200 break-all">
              {page.officialDomainExample}
            </div>
            <p className="mt-2 text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
              ✅ <strong>Regra de Ouro:</strong> Os bancos e órgãos oficiais usam sempre o domínio principal conhecido (geralmente terminados em <code>.com.br</code> ou <code>.gov.br</code>), e <strong>nunca</strong> usam palavras extras como <code>-seguro</code>, <code>-login</code> ou finais como <code>.xyz</code>.
            </p>
          </div>

          {/* Mito do Cadeado */}
          <div className="p-3 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs sm:text-sm leading-relaxed">
            🔒 <strong>Atenção ao Mito do Cadeado:</strong> O símbolo do cadeado indica apenas que a conexão é criptografada, mas <strong>qualquer golpista consegue colocar um cadeado em um site falso</strong> em minutos. O cadeado não garante honestidade!
          </div>
        </div>

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${fontSizeClasses} ${
            highContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          <span>Entendi, Voltar para o Site</span>
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const ModalInspecaoLink = UrlInspectorModal;
