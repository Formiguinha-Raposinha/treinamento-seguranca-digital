import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  RotateCcw, 
  Volume2, 
  CheckCircle2, 
  AlertTriangle, 
  Home, 
  Brain, 
  Eye, 
  ListOrdered, 
  ArrowRight, 
  Sparkles
} from 'lucide-react';
import { Scenario, RiskSignal } from '../../types/cenario';
import { audioService } from '../../services/audioService';

interface SafeErrorModalProps {
  scenario: Scenario;
  onRestart: () => void;
  onBack: () => void;
  onNextCorrelatedScenario?: () => void;
  correlatedScenarioTitle?: string;
  criticalReason?: string;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const SafeErrorModal: React.FC<SafeErrorModalProps> = ({
  scenario,
  onRestart,
  onBack,
  onNextCorrelatedScenario,
  correlatedScenarioTitle,
  criticalReason,
  highContrast,
  fontSizeLevel
}) => {
  // Abas do Centro de Aprendizagem do Erro Seguro (Sprint 3 MVP)
  // US10: Alerta Empático | US11: Raio-X dos Sinais | US12: Gatilhos Psicológicos | US13: Como Agir Passo a Passo
  const [activeTab, setActiveTab] = useState<'overview' | 'xray' | 'psychology' | 'guideline'>('overview');

  useEffect(() => {
    // Narração automática inicial acolhedora
    const welcomeText = "Atenção! Pare. Você acabou de cair em uma simulação de golpe. Mas fique bem tranquilo: nada aconteceu de verdade! Nenhum centavo saiu da sua conta e nenhum dado foi roubado. Este é o ambiente seguro do seu treinamento para errar e aprender.";
    audioService.speak(welcomeText);
  }, []);

  const handleHearTab = (tab: 'overview' | 'xray' | 'psychology' | 'guideline') => {
    audioService.stop();
    if (tab === 'overview') {
      audioService.speak(
        `Visão Geral do Erro Seguro. Situação: ${scenario.title}. ${criticalReason || 'Ação insegura detectada'}. Fique calmo: você está em um ambiente simulado de extensão universitária.`
      );
    } else if (tab === 'xray') {
      audioService.speak(
        `Raio-X dos Sinais de Risco deste golpe. Os criminosos utilizaram os seguintes sinais de perigo: ${signalsToDisplay.map(s => `${s.title}: ${s.description}`).join('. ')}`
      );
    } else if (tab === 'psychology') {
      audioService.speak(
        `Gatilhos Mentais e Psicológicos da Engenharia Social. Por que nosso cérebro cai? Os golpistas exploram a pressa e o medo para bloquear nosso raciocínio de segurança antes que possamos pensar com calma.`
      );
    } else if (tab === 'guideline') {
      audioService.speak(
        `Guia Passo a Passo: O que fazer da próxima vez. Regra de Ouro: ${scenario.summary.goldenRule}. ${scenario.summary.safeRouteExplanation}`
      );
    }
  };

  const handleReturnHome = () => {
    audioService.stop();
    onBack();
  };

  const fontSizeClasses = [
    'text-base',
    'text-lg sm:text-xl',
    'text-xl sm:text-2xl'
  ][fontSizeLevel] || 'text-base';

  // Coleta os sinais de risco específicos do cenário
  const extractedSignals: RiskSignal[] = Object.values(scenario.nodes)
    .flatMap(node => node.riskSignals || [])
    .filter((sig, index, self) => index === self.findIndex(s => s.id === sig.id));

  // Fallback caso o cenário não tenha riskSignals em nós individuais
  const defaultSignalsByScenario: Record<string, RiskSignal[]> = {
    'falso-familiar-novo-numero': [
      {
        id: 'sig_new_number',
        title: 'Número Desconhecido fora da Agenda',
        description: 'A pessoa alega ser seu filho ou parente, mas manda mensagem de um número não salvo e pede para você apagar o antigo.',
        tactic: 'affection'
      },
      {
        id: 'sig_urgency_pix',
        title: 'Pressão de Tempo e Urgência',
        description: 'Coloca um limite de horário (ex.: "preciso pagar até as 15h") para você agir por impulso sem ligar para outros familiares.',
        tactic: 'urgency'
      },
      {
        id: 'sig_third_party_pix',
        title: 'Chave Pix em Nome de Terceiro',
        description: 'A chave para transferência não está no nome do parente, mas sim de uma pessoa física desconhecida (conta de laranja).',
        tactic: 'urgency'
      }
    ],
    'falso-boleto-link': [
      {
        id: 'sig_bank_fear',
        title: 'Medo com Falsa Compra de Valor Alto',
        description: 'Envia um SMS de compra de R$ 3.890,00 para gerar pânico e desespero imediatos na vítima.',
        tactic: 'fear'
      },
      {
        id: 'sig_fake_domain',
        title: 'Domínio Estranho terminado em .xyz',
        description: 'Nenhum banco oficial no Brasil utiliza terminação .xyz. Todos usam domínios protegidos terminados em .com.br.',
        tactic: 'authority'
      },
      {
        id: 'sig_password_phishing',
        title: 'Pedido de Senha Bancária de 6 Dígitos',
        description: 'Bancos legítimos nunca solicitam a sua senha eletrônica para estornar ou cancelar transações em páginas web.',
        tactic: 'authority'
      }
    ],
    'falsa-central-0800': [
      {
        id: 'sig_call_0800',
        title: 'Falso 0800 de Prevenção a Fraudes',
        description: 'Os golpistas contratam números 0800 temporários para simular uma central telefônica institucional.',
        tactic: 'authority'
      },
      {
        id: 'sig_call_panic',
        title: 'Alerta com Compra de R$ 4.750,00',
        description: 'Estimulam o medo da vítima ter o limite do cartão estourado para forçar a ligação para a falsa central.',
        tactic: 'fear'
      },
      {
        id: 'sig_blindagem',
        title: 'Falso "Pix de Blindagem" ou Senha',
        description: 'Pedem transferências alegando ser para "proteger ou estornar o saldo em uma conta-cofre". Isso não existe em nenhum banco.',
        tactic: 'urgency'
      }
    ]
  };

  const signalsToDisplay = extractedSignals.length > 0 
    ? extractedSignals 
    : (defaultSignalsByScenario[scenario.id] || defaultSignalsByScenario['falso-familiar-novo-numero']);

  const getTacticBadge = (tactic: string) => {
    switch (tactic) {
      case 'urgency':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">⏱️ Pressão de Tempo</span>;
      case 'fear':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-900 border border-red-300">😨 Medo & Pânico</span>;
      case 'authority':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">🏛️ Falsa Autoridade</span>;
      case 'affection':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-300">❤️ Laço Familiar</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-800">⚠️ Engenharia Social</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className={`w-full max-w-2xl max-h-[96vh] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl border-4 flex flex-col justify-between overflow-hidden transition-all ${
        highContrast
          ? 'bg-black text-white border-yellow-400'
          : 'bg-white text-slate-900 border-red-500'
      }`}>
        {/* Topo do Alerta Empático (US10) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-red-100 text-red-950 border border-red-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-2xl shrink-0 animate-pulse">
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-200 text-red-900 text-xs font-black mb-0.5">
                <span>Metodologia do Susto Seguro • Treinamento Prático</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-red-600">
                🚨 PARE! Você caiu na simulação de golpe
              </h2>
              <p className="text-xs sm:text-sm font-bold text-red-900">
                Fique 100% tranquilo(a)! Nenhum centavo foi perdido e nenhum dado foi roubado.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleHearTab(activeTab)}
            className="px-3 py-2 rounded-xl bg-white text-red-900 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-red-50 border border-red-200 shrink-0"
            title="Ouvir explicação desta tela"
          >
            <Volume2 className="w-4 h-4 text-red-600" />
            <span>Ouvir</span>
          </button>
        </div>

        {/* Mensagem Acolhedora Imediata (US10) */}
        <div className="my-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm font-semibold leading-relaxed">
            🛡️ <strong>O erro aqui é seguro e faz parte do aprendizado!</strong> É vivenciando a armadilha neste ambiente protegido que você cria reflexos automáticos para jamais cair na vida real.
          </p>
        </div>

        {/* Abas Pedagógicas do Sprint 3 (US10, US11, US12, US13) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto my-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>1. O Seu Erro</span>
          </button>

          <button
            onClick={() => setActiveTab('xray')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'xray'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4 text-red-500" />
            <span>2. Raio-X dos Sinais</span>
          </button>

          <button
            onClick={() => setActiveTab('psychology')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'psychology'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-600" />
            <span>3. Gatilhos Mentais</span>
          </button>

          <button
            onClick={() => setActiveTab('guideline')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'guideline'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-4 h-4 text-emerald-600" />
            <span>4. O Que Fazer</span>
          </button>
        </div>

        {/* Corpo com Rolagem das Abas */}
        <div className="flex-1 overflow-y-auto pr-1 my-1">
          {/* Conteúdo da Aba 1: O Seu Erro e Risco Concreto (US10 & US12) */}
          {activeTab === 'overview' && (
          <div className="space-y-3 my-2 animate-fade-in">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2 mb-1 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>O que disparou a armadilha do golpe?</span>
              </h3>
              <p className={`${fontSizeClasses} leading-relaxed text-slate-700`}>
                {criticalReason 
                  ? <span>Você realizou a seguinte ação: <strong>"{criticalReason}"</strong>.</span>
                  : <span>Você seguiu a solicitação do golpista sem realizar uma verificação externa independente pelo canal oficial.</span>
                }
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800">
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-700 mb-1">
                💥 Qual seria o risco concreto no mundo real?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {scenario.environment === 'web'
                  ? 'Ao inserir sua senha de 6 dígitos em uma página web clonada, os criminosos teriam acesso imediato ao seu aplicativo bancário para realizar saques e empréstimos no seu nome.'
                  : scenario.environment === 'phone'
                  ? 'Ao transferir o "Pix de Blindagem" ou passar o código SMS ao suposto atendente, o dinheiro seria enviado para contas laranjas de criminosos, sem possibilidade de estorno fácil.'
                  : 'Ao realizar a transferência Pix acreditando ser seu parente, o dinheiro iria direto para uma conta falsa de terceiro sem que seu parente real recebesse um centavo.'}
              </p>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 2: Raio-X dos Sinais de Risco (US11) */}
        {activeTab === 'xray' && (
          <div className="space-y-2.5 my-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2 text-slate-800">
                <Eye className="w-5 h-5 text-red-600" />
                <span>Raio-X: Os 3 sinais de alerta que estavam na mensagem</span>
              </h3>
              <span className="text-xs text-slate-500 font-bold">Identificação Pedagógica</span>
            </div>

            <div className="space-y-2">
              {signalsToDisplay.map((sig, idx) => (
                <div key={sig.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4 className="font-black text-sm text-slate-900">{sig.title}</h4>
                      {getTacticBadge(sig.tactic)}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {sig.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 3: Gatilhos Psicológicos de Engenharia Social (US12) */}
        {activeTab === 'psychology' && (
          <div className="space-y-3 my-2 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2 text-purple-900 mb-1">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>Por que o nosso cérebro cai? A armadilha emocional</span>
              </h3>
              <p className="text-xs sm:text-sm text-purple-900 leading-relaxed">
                Nenhum golpe é apenas sobre tecnologia: os criminosos estudam psicologia para manipular os sentimentos humanos mais nobres e naturais.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
                <h4 className="font-black text-xs mb-1 text-amber-900 flex items-center gap-1.5">
                  <span>⏱️ 1. O Senso de Urgência</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Ao criar prazos curtos ("até 15h" ou "10 minutos"), o golpista desativa a área de prudência do cérebro para você não pensar.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950">
                <h4 className="font-black text-xs mb-1 text-blue-900 flex items-center gap-1.5">
                  <span>🏛️ 2. Falsa Autoridade / Medo</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-blue-900">
                  Usam nomes de bancos e números 0800 para fazer você acreditar que está falando com um órgão oficial protetor.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950">
                <h4 className="font-black text-xs mb-1 text-purple-900 flex items-center gap-1.5">
                  <span>❤️ 3. Afeto e Preocupação</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-purple-900">
                  Fingem ser filhos ou netos necessitados, explorando o desejo de ajudar a família antes de checar a verdade.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba 4: Guia Sequencial Passo a Passo (US13) */}
        {activeTab === 'guideline' && (
          <div className="space-y-3 my-2 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2 mb-1 text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>O que fazer da próxima vez? (Método de 4 Passos)</span>
              </h3>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed font-medium">
                Sempre que receber qualquer mensagem com pedido de dinheiro, links ou ligações suspeitas:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="font-black text-slate-900">PAUSA COGNITIVA (30 segundos)</h4>
                  <p className="text-slate-600 text-xs mt-0.5">Solte o celular na mesa e respire. Golpistas contam com a sua afobação.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="font-black text-slate-900">DESCONFIE DE QUEM VEIO ATÉ VOCÊ</h4>
                  <p className="text-slate-600 text-xs mt-0.5">Se o número não está salvo ou veio por SMS/WhatsApp, trate como 100% suspeito.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="font-black text-slate-900">BUSQUE O CANAL INDEPENDENTE</h4>
                  <p className="text-slate-600 text-xs mt-0.5">Ligue para o número antigo do parente ou para o telefone no verso do seu cartão.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                <div>
                  <h4 className="font-black text-slate-900">REGRA DE OURO</h4>
                  <p className="text-slate-600 text-xs mt-0.5">Banco e parente de verdade NUNCA pedem senha nem Pix em nome de desconhecidos.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Rodapé com Ações de Superação e Aprendizado (US14: Tentar Novamente / Cenário Correlato) */}
        <div className="shrink-0 mt-3 pt-2.5 border-t border-slate-200 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Botão de Repetir o Mesmo Cenário (Segunda Chance de Aprendizagem) */}
            <button
              onClick={onRestart}
              className={`flex-1 py-3 px-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 text-xs sm:text-sm ${
                highContrast
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Praticar este mesmo cenário novamente e aplicar a Regra de Ouro"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Praticar Novamente Este Treino (Segunda Chance)</span>
            </button>

            {/* Botão de Tentar Cenário Correlato (US14) */}
            {onNextCorrelatedScenario && (
              <button
                onClick={onNextCorrelatedScenario}
                className="flex-1 py-3 px-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                title={`Avançar para o desafio correlato: ${correlatedScenarioTitle || 'Próximo Treino'}`}
              >
                <span>Tentar Desafio Correlato</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Botão de Voltar ao Catálogo */}
            <button
              onClick={handleReturnHome}
              className={`py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 text-xs sm:text-sm border-2 ${
                highContrast
                  ? 'border-white text-white hover:bg-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <Home className="w-4 h-4 text-slate-700" />
              <span>Catálogo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalAlertaGolpe = SafeErrorModal;
