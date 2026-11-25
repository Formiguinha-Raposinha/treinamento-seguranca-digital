import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  PhoneCall, 
  Play, 
  User, 
  Sparkles,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { userProgressService, UserProgressData } from '../../services/progressoUsuarioService';
import { audioService } from '../../services/audioService';
import { Scenario } from '../../types/cenario';
import { availableScenarios } from '../../data/scenarios';

interface PainelEvolucaoIdosoProps {
  onBack: () => void;
  onSelectScenario: (scenario: Scenario) => void;
  onOpenCertificate: () => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const PainelEvolucaoIdoso: React.FC<PainelEvolucaoIdosoProps> = ({
  onBack,
  onSelectScenario,
  onOpenCertificate,
  highContrast,
  fontSizeLevel
}) => {
  const [progressData, setProgressData] = useState<UserProgressData>(userProgressService.getProgress());
  const [userName, setUserName] = useState<string>(progressData.profile.name);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  useEffect(() => {
    setProgressData(userProgressService.getProgress());
  }, []);

  const completedSafeCount = userProgressService.getCompletedSafeCount();
  const totalScenarios = availableScenarios.length;
  const progressPercentage = Math.round((completedSafeCount / totalScenarios) * 100);

  // Determina o Nível de Proteção do Aluno
  let securityLevel = {
    title: 'Iniciante Digital',
    badge: '🛡️ Nível 1',
    description: 'Você está começando sua jornada de proteção contra golpes online.',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  if (completedSafeCount >= 1 && completedSafeCount < Math.ceil(totalScenarios / 2)) {
    securityLevel = {
      title: 'Prudente em Alerta',
      badge: '🥉 Nível 2',
      description: `Muito bem! Você já aprendeu a desconfiar e identificar armadilhas (${completedSafeCount} de ${totalScenarios} concluídos).`,
      color: 'text-amber-700 bg-amber-50 border-amber-300'
    };
  } else if (completedSafeCount >= Math.ceil(totalScenarios / 2) && completedSafeCount < totalScenarios) {
    securityLevel = {
      title: 'Guardião Digital Atento',
      badge: '🥈 Nível 3',
      description: `Excelente! Faltam apenas ${totalScenarios - completedSafeCount} treinamento(s) para se tornar um Cidadão Digital Protegido.`,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-300'
    };
  } else if (completedSafeCount >= totalScenarios) {
    securityLevel = {
      title: 'Cidadão Digital Protegido',
      badge: '🥇 Nível Máximo (Protegido)',
      description: `Parabéns! Você concluiu todos os ${totalScenarios} treinamentos com decisões seguras e está imune às principais fraudes!`,
      color: 'text-purple-700 bg-purple-50 border-purple-300'
    };
  }

  const feedbackList = userProgressService.getPersonalizedFeedback();

  const handleHearSummary = () => {
    const text = `Meu Painel de Evolução em Segurança Digital. Participante: ${userName}. Você concluiu ${completedSafeCount} de ${totalScenarios} treinamentos com segurança. Seu nível atual é: ${securityLevel.title}. ${securityLevel.description}`;
    audioService.speak(text);
  };

  const handleSaveName = () => {
    userProgressService.setUserName(userName);
    setIsEditingName(false);
    setProgressData(userProgressService.getProgress());
  };

  const fontSizeClasses = [
    'text-sm',
    'text-base',
    'text-lg'
  ][fontSizeLevel] || 'text-base';

  return (
    <div className={`max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 transition-all ${fontSizeClasses} ${
      highContrast ? 'text-white' : 'text-slate-900'
    }`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2.5 rounded-2xl border transition-all active:scale-95 ${
              highContrast 
                ? 'bg-yellow-400 text-black border-yellow-300' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
            }`}
            title="Voltar aos treinamentos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Meu Progresso Individual</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Minha Evolução & Desempenho
            </h1>
            <p className="text-sm text-slate-500">
              Acompanhe onde você está acertando e onde precisa de mais atenção para se proteger.
            </p>
          </div>
        </div>

        {/* Botão de Leitura */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleHearSummary}
            className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 border transition-all ${
              highContrast
                ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400/10'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shadow-sm'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>Ouvir Meu Progresso</span>
          </button>
        </div>
      </div>

      {/* Card Principal do Aluno com Nível e Progresso */}
      <div className={`p-6 sm:p-8 rounded-3xl border-2 shadow-lg transition-all ${
        highContrast 
          ? 'bg-zinc-900 border-yellow-400' 
          : 'bg-gradient-to-br from-white via-white to-emerald-50/40 border-emerald-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="px-2 py-1 border rounded-lg text-base font-bold"
                    placeholder="Seu nome ou apelido"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {userName}
                  </span>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs text-slate-400 underline hover:text-slate-600"
                  >
                    (trocar nome)
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Seu histórico fica salvo com segurança neste navegador sem precisar criar senhas.
            </p>
          </div>

          <div className={`px-4 py-2 rounded-2xl border text-sm font-black flex items-center gap-2 ${securityLevel.color}`}>
            <span>{securityLevel.badge}</span>
            <span>•</span>
            <span>{securityLevel.title}</span>
          </div>
        </div>

        {/* Barra de Progresso até o Certificado */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-extrabold text-slate-700">
            <span>Progresso da Capacitação: {completedSafeCount} de {totalScenarios} módulos dominados</span>
            <span className="text-emerald-700 font-black">{progressPercentage}%</span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Chamada para o Certificado */}
        {completedSafeCount >= 1 && (
          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900">
              <Award className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {completedSafeCount === totalScenarios
                  ? 'Você desbloqueou o Certificado Oficial de Conclusão!'
                  : 'Você já pode visualizar e emitir seu Certificado de Participação!'}
              </span>
            </div>
            <button
              onClick={onOpenCertificate}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Emitir Meu Certificado</span>
            </button>
          </div>
        )}
      </div>

      {/* Diagnóstico Personalizado: "Onde Você Precisa de Mais Atenção" */}
      <div className={`p-6 rounded-3xl border-2 transition-all ${
        highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-slate-800">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Diagnóstico Personalizado de Defesa Digital</span>
        </h2>

        <div className="space-y-3">
          {feedbackList.map((item, index) => {
            const isAlert = item.level === 'alert';
            const isWarning = item.level === 'warning';
            return (
              <div
                key={index}
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  isAlert
                    ? 'bg-red-50 border-red-200 text-red-950'
                    : isWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                {isAlert ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-black text-sm">{item.title}</h3>
                  <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">{item.tip}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade com os Módulos e o Status do Aluno em cada um */}
      <div className="space-y-3">
        <h2 className="text-lg font-black flex items-center gap-2 text-slate-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Seu Desempenho nos {totalScenarios} Módulos</span>
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {availableScenarios.map((scenario) => {
            const result = progressData.results[scenario.id];
            const isLink = scenario.category.includes('Links');
            const isPhone = scenario.category.includes('Telefone') || scenario.environment === 'phone';

            const isSafe = result?.status === 'safe';
            const isFallen = result?.status === 'fallen';
            const notStarted = !result;

            return (
              <div
                key={scenario.id}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400'
                    : isSafe
                    ? 'bg-white border-emerald-300 shadow-sm'
                    : isFallen
                    ? 'bg-white border-amber-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    isPhone
                      ? 'bg-purple-100 text-purple-700'
                      : isLink
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {isPhone ? <PhoneCall className="w-6 h-6" /> : isLink ? <Globe className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {scenario.category}
                      </span>

                      {/* Badge de Status */}
                      {isSafe && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Dominado com Segurança</span>
                        </span>
                      )}

                      {isFallen && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>Caiu na Simulação (Recomenda-se repetir)</span>
                        </span>
                      )}

                      {notStarted && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Ainda Não Praticado
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {scenario.title}
                    </h3>

                    {result && (
                      <p className="text-xs text-slate-500">
                        Tentativas: <strong>{result.attempts}</strong> • Último treino: {result.lastAttemptDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Botão de Praticar */}
                <button
                  onClick={() => {
                    audioService.stop();
                    onSelectScenario(scenario);
                  }}
                  className={`w-full sm:w-auto px-4 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all shrink-0 ${
                    isSafe
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSafe ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isSafe ? 'Praticar Novamente' : isFallen ? 'Tentar de Novo' : 'Começar Módulo'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const UserEvolutionDashboard = PainelEvolucaoIdoso;
