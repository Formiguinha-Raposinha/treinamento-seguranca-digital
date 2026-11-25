import React, { useEffect } from 'react';
import { ShieldCheck, RotateCcw, Volume2, Award, Home, Sparkles, ArrowRight } from 'lucide-react';
import { Scenario } from '../../types/cenario';
import { audioService } from '../../services/audioService';
import { progressoUsuarioService } from '../../services/progressoUsuarioService';

interface SafeSuccessModalProps {
  scenario: Scenario;
  onRestart: () => void;
  onBack: () => void;
  onViewCertificate?: () => void;
  onNextCorrelatedScenario?: () => void;
  correlatedScenarioTitle?: string;
  lastDialogueText?: string;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const SafeSuccessModal: React.FC<SafeSuccessModalProps> = ({
  scenario,
  onRestart,
  onBack,
  onViewCertificate,
  onNextCorrelatedScenario,
  correlatedScenarioTitle,
  lastDialogueText,
  highContrast,
  fontSizeLevel
}) => {
  const result = progressoUsuarioService.getResultForScenario(scenario.id);
  const isOvercome = result?.hasOvercomeError;

  useEffect(() => {
    const text = isOvercome
      ? "Sensacional! Você superou o erro da tentativa anterior! Você treinou novamente, aplicou a regra de ouro e agora está 100% protegido contra esse tipo de golpe!"
      : "Parabéns! Você tomou uma decisão muito segura. Você não cedeu à pressa, desconfiou e protegeu suas finanças e dados pessoais!";
    audioService.speak(text);
  }, [isOvercome]);

  const handleHearDetails = () => {
    const text = `Parabéns pela sua decisão! Você aplicou a regra: ${scenario.summary.goldenRule}. ${lastDialogueText ? `Antes de desistir, o golpista disse: ${lastDialogueText}.` : ''} É exatamente assim que você deve agir sempre que receber uma mensagem suspeita.`;
    audioService.speak(text);
  };

  const handleReturnHome = () => {
    audioService.stop();
    onBack();
  };

  const fontSizeClasses = [
    'text-xs sm:text-sm',
    'text-sm sm:text-base',
    'text-base sm:text-lg'
  ][fontSizeLevel] || 'text-sm sm:text-base';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className={`w-full max-w-lg max-h-[96vh] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl border-4 flex flex-col justify-between overflow-hidden transition-all ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white text-slate-900 border-emerald-500'
      }`}>
        {/* Topo Sucesso (Fixo) */}
        <div className="shrink-0 flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-950 border border-emerald-300">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-emerald-800 leading-tight">
              🎉 Parabéns! Decisão Segura!
            </h2>
            <p className="text-xs font-bold text-emerald-900 mt-0.5 truncate sm:whitespace-normal">
              Você evitou a tentativa de golpe com sucesso!
            </p>
          </div>
        </div>

        {/* Corpo com Rolagem Suave se a tela for muito pequena */}
        <div className="flex-1 overflow-y-auto pr-1 my-2 space-y-2">
          {/* Destaque de Superação de Erro */}
          {isOvercome && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
                <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
              </div>
              <div>
                <div className="inline-block px-1.5 py-0.2 rounded-full bg-black/20 text-yellow-200 text-[9px] font-black uppercase tracking-wider">
                  Superação Conquistada
                </div>
                <h3 className="font-black text-xs">
                  🏆 Você aprendeu com o erro anterior e venceu o golpe!
                </h3>
              </div>
            </div>
          )}

          {/* O que o golpista respondeu antes de desistir */}
          {lastDialogueText && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 border-2 border-amber-300 text-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  💬 Desfecho: O que o golpista respondeu
                </span>
                <button
                  type="button"
                  onClick={() => audioService.speak(`O golpista respondeu: ${lastDialogueText}`)}
                  className="px-2 py-0.5 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-950 text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors"
                  title="Ouvir resposta do golpista"
                >
                  <Volume2 className="w-3 h-3 text-amber-800" />
                  <span>Ouvir</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm font-semibold italic text-slate-900 leading-snug bg-white/80 p-2 rounded-lg border border-amber-200">
                "{lastDialogueText}"
              </p>
            </div>
          )}

          {/* Mensagem de Reforço Positivo */}
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <p className={`${fontSizeClasses} leading-snug font-semibold text-emerald-950`}>
              🛡️ <strong>Você praticou a atitude mais segura:</strong> parou antes de agir, desconfiou do contato e buscou confirmação pelo canal oficial.
            </p>
          </div>

          {/* Regra de Ouro Consolidada */}
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
            <h4 className="font-extrabold text-xs mb-0.5 text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Regra de Ouro Gravada</span>
            </h4>
            <p className="text-xs text-slate-700 leading-snug font-medium">
              {scenario.summary.goldenRule}
            </p>
          </div>
        </div>

        {/* Rodapé Fixo com Ações */}
        <div className="shrink-0 pt-2 border-t border-slate-200 flex flex-col gap-1.5">
          {/* Botão de Avanço para Desafio Correlato (Destaque Principal) */}
          {onNextCorrelatedScenario && (
            <button
              onClick={onNextCorrelatedScenario}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl font-black flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95 text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span className="truncate">Próximo Desafio: {correlatedScenarioTitle || 'Treinamento Correlato'}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          )}

          {/* Linha com Certificado e Concluir/Voltar ao Início */}
          <div className="flex gap-2">
            {onViewCertificate && (
              <button
                onClick={onViewCertificate}
                className={`flex-1 py-2 px-2.5 rounded-xl font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 text-xs transition-all cursor-pointer ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300 border-2 border-white'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-yellow-200 shrink-0" />
                <span className="truncate">🎓 Emitir Certificado</span>
              </button>
            )}

            <button
              onClick={handleReturnHome}
              className={`flex-1 py-2 px-2.5 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 text-xs cursor-pointer ${
                highContrast
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                  : onNextCorrelatedScenario 
                    ? 'bg-slate-700 hover:bg-slate-800 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Concluir Treino</span>
            </button>
          </div>

          {/* Botões Secundários: Treinar Novamente e Ouvir */}
          <div className="flex gap-2">
            <button
              onClick={onRestart}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all active:scale-95 text-[11px] sm:text-xs border cursor-pointer ${
                highContrast
                  ? 'border-white text-white hover:bg-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Treinar de Novo</span>
            </button>

            <button
              onClick={handleHearDetails}
              className={`flex-1 py-1.5 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all active:scale-95 text-[11px] sm:text-xs border cursor-pointer ${
                highContrast
                  ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Ouvir Resumo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalSucessoSeguro = SafeSuccessModal;
