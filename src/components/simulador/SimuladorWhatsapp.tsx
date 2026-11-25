import React, { useState, useEffect, useRef } from 'react';
import { Scenario, MessageNode, UserChoice, RelativeProfile, LinkPreview, SimulatedWebPage } from '../../types/cenario';
import { CabecalhoChat } from './CabecalhoChat';
import { BalaoMensagem } from './BalaoMensagem';
import { BarraEntradaTexto } from './BarraEntradaTexto';
import { SimuladorNavegador } from './SimuladorNavegador';
import { ModalInspecaoLink } from './ModalInspecaoLink';
import { ModalAlertaGolpe } from './ModalAlertaGolpe';
import { ModalSucessoSeguro } from './ModalSucessoSeguro';
import { SimuladorLigacao } from './SimuladorLigacao';
import { audioService } from '../../services/audioService';
import { dialogueInterpreter, DialogueStage } from '../../services/interpretadorDialogoService';
import { userProgressService, progressoUsuarioService } from '../../services/progressoUsuarioService';
import { aiScammerService, iaGolpistaService } from '../../services/iaGolpistaService';
import { dbService } from '../../services/bancoDadosService';
import { vocabularyService } from '../../services/vocabularioService';
import { SimulationSession } from '../../types/bancoDados';
import { ModalConfiguracaoIA } from './ModalConfiguracaoIA';
import { availableScenarios } from '../../data/scenarios';

interface SimuladorWhatsappProps {
  scenario: Scenario;
  onBack: () => void;
  onViewCertificate?: () => void;
  onSwitchScenario?: (newScenario: Scenario) => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const SimuladorWhatsapp: React.FC<SimuladorWhatsappProps> = ({
  scenario,
  onBack,
  onViewCertificate,
  onSwitchScenario,
  highContrast,
  fontSizeLevel
}) => {
  const isFamilyScenario = scenario.id === 'falso-familiar-novo-numero' || scenario.id === 'falso-familiar';
  const [displayedMessages, setDisplayedMessages] = useState<MessageNode[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [relativeProfile, setRelativeProfile] = useState<RelativeProfile>({ kinship: 'filho', targetTitle: 'mãe' });
  const [activeWebPage, setActiveWebPage] = useState<SimulatedWebPage | null>(null);
  const [inspectingPage, setInspectingPage] = useState<SimulatedWebPage | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [isPhoneCallActive, setIsPhoneCallActive] = useState<boolean>(false);
  const [lastCriticalReason, setLastCriticalReason] = useState<string>('');
  const [lastSafeReply, setLastSafeReply] = useState<string>('');
  const [dialogueStage, setDialogueStage] = useState<DialogueStage>('greeting');
  const [dynamicChoices, setDynamicChoices] = useState<UserChoice[]>([]);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [isAiActive, setIsAiActive] = useState<boolean>(aiScammerService.isAiEnabled());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTimeRef = useRef<string>(new Date().toISOString());

  // Salva a sessão no Banco de Dados (IndexedDB) para acompanhamento dos familiares e extensionistas
  const recordDbSession = (outcome: 'safe' | 'fallen', reason: string, finalMessages: MessageNode[]) => {
    const session: SimulationSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      seniorId: dbService.getActiveSeniorId(),
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      category: scenario.category,
      startedAt: sessionStartTimeRef.current,
      completedAt: new Date().toISOString(),
      outcome,
      reason,
      roundsCount: finalMessages.length,
      vulnerabilitiesDetected: outcome === 'fallen' ? [reason] : [],
      safeHabitsObserved: outcome === 'safe' ? [reason] : [],
      messages: finalMessages.map(m => ({
        sender: (m.sender === 'user' || m.sender === 'opponent' ? m.sender : 'system') as 'user' | 'opponent' | 'system',
        text: m.text,
        timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))
    };
    dbService.addSession(session).catch((err: any) => console.warn('Erro ao salvar sessão no BD:', err));
  };

  // Cenário correlato para avanço (Sprint 3 - US14)
  const currentScenarioIndex = availableScenarios.findIndex(s => s.id === scenario.id);
  const nextCorrelatedIndex = (currentScenarioIndex + 1) % availableScenarios.length;
  const nextCorrelatedScenario = availableScenarios[nextCorrelatedIndex];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayedMessages, isTyping]);

  useEffect(() => {
    startSimulationDirectly();
  }, [scenario]);

  const startSimulationDirectly = () => {
    sessionStartTimeRef.current = new Date().toISOString();
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setIsPhoneCallActive(scenario.id === 'golpe-falso-motoboy');
    setActiveWebPage(null);
    setInspectingPage(null);
    setLastCriticalReason('');
    setLastSafeReply('');
    setIsTyping(false);

    const initialNode = scenario.nodes[scenario.initialNodeId];
    if (!initialNode) return;

    // Reseta imediatamente histórico e perfis para evitar contaminação entre cenários
    setDialogueStage('greeting');
    setDynamicChoices(initialNode.choices || []);
    setDisplayedMessages([initialNode]);
    
    if (!isFamilyScenario) {
      setRelativeProfile({ kinship: 'familiar', targetTitle: 'cliente' });
    } else {
      setRelativeProfile({ kinship: 'filho', targetTitle: 'mãe' });
    }

    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      audioService.speak(
        isFamilyScenario 
          ? `Você recebeu uma mensagem no WhatsApp de um número desconhecido: ${initialNode.text}`
          : `Você recebeu uma notificação urgente: ${initialNode.text}`
      );
    }, 400);

    return () => clearTimeout(timer);
  };

  // Abrir o navegador web simulado ao clicar em link (Sprint 2 - US06 / US07)
  const handleOpenLink = (link: LinkPreview) => {
    audioService.stop();
    if (link.destinationPageId && scenario.simulatedWebPages) {
      const page = scenario.simulatedWebPages[link.destinationPageId];
      if (page) {
        setActiveWebPage(page);
        return;
      }
    }
    if (scenario.simulatedWebPages) {
      const firstPage = Object.values(scenario.simulatedWebPages)[0];
      if (firstPage) {
        setActiveWebPage(firstPage);
      }
    }
  };

  // Inspecionar link sem abrir o site
  const handleInspectLink = (link: LinkPreview) => {
    audioService.stop();
    if (link.destinationPageId && scenario.simulatedWebPages) {
      const page = scenario.simulatedWebPages[link.destinationPageId];
      if (page) {
        setInspectingPage(page);
        return;
      }
    }
    if (scenario.simulatedWebPages) {
      const firstPage = Object.values(scenario.simulatedWebPages)[0];
      if (firstPage) {
        setInspectingPage(firstPage);
      }
    }
  };

  // Envio de mensagem pelo usuário (seja digitando, falando ou clicando na sugestão)
  const handleSendMessage = (text: string, inputType: 'typed' | 'audio' = 'typed') => {
    if (!text.trim() || isTyping) return;

    // Se o usuário selecionou uma opção que envolve abrir o link ou examinar a página
    const currentChoices = dynamicChoices.length > 0 ? dynamicChoices : (scenario.nodes[scenario.initialNodeId]?.choices || []);
    const matchedChoice = currentChoices.find(c => c.text === text);

    if (matchedChoice) {
      if ((matchedChoice.nextNodeId === 'node_in_browser' || matchedChoice.text.toLowerCase().includes('acessar link') || matchedChoice.text.toLowerCase().includes('abrir o navegador')) && scenario.simulatedWebPages) {
        const page = Object.values(scenario.simulatedWebPages)[0];
        if (page) {
          setActiveWebPage(page);
          return;
        }
      }
    }

    // Se digitou algo como "abrir link", "clicar no link", "ver o site"
    const lower = text.toLowerCase();
    if ((lower.includes('abrir link') || lower.includes('clicar no link') || lower.includes('entrar no site')) && scenario.simulatedWebPages) {
      const page = Object.values(scenario.simulatedWebPages)[0];
      if (page) {
        setActiveWebPage(page);
        return;
      }
    }

    // 1. Adiciona a fala do usuário ao chat
    const userMessage: MessageNode = {
      id: `user_msg_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDisplayedMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // 2. Se houver nó específico mapeado para a escolha (árvore de cenários fixos como fakeBankLink ou fakeCallCenter)
    if (matchedChoice && scenario.nodes[matchedChoice.nextNodeId]) {
      vocabularyService.recordInput(text, inputType, scenario.id, scenario.title, dialogueStage, false);
      const nextNode = scenario.nodes[matchedChoice.nextNodeId];
      if (scenario.environment === 'phone' && (matchedChoice.id === 'c1_call_0800' || matchedChoice.nextNodeId === 'node_call_connected' || scenario.id === 'golpe-falso-motoboy')) {
        setIsPhoneCallActive(true);
      }

      setTimeout(() => {
        setIsTyping(false);
        const finalHistory = [...displayedMessages, userMessage, nextNode];
        setDisplayedMessages(prev => [...prev, nextNode]);
        if (nextNode.isCriticalAction) {
          const reason = matchedChoice.explanation || 'Ação insegura detectada';
          setLastCriticalReason(reason);
          userProgressService.recordAttempt(scenario.id, scenario.title, scenario.category, 'fallen', reason);
          recordDbSession('fallen', reason, finalHistory);
          setTimeout(() => {
            setIsPhoneCallActive(false);
            setShowErrorModal(true);
          }, 600);
        } else if (nextNode.isSafeEnding) {
          const safeReason = matchedChoice.explanation || 'Decisão segura aplicada';
          setLastSafeReply(nextNode.text);
          audioService.speak(nextNode.text);
          userProgressService.recordAttempt(scenario.id, scenario.title, scenario.category, 'safe', safeReason);
          recordDbSession('safe', safeReason, finalHistory);
          setTimeout(() => {
            setIsPhoneCallActive(false);
            setShowSuccessModal(true);
          }, 3500);
        } else {
          setDynamicChoices(nextNode.choices || []);
        }
      }, 700);
      return;
    }

    // 3. Função auxiliar para interpretação local (Offline / Heurística com Isolamento de Cenário)
    const runOfflineInterpretation = () => {
      const interpretation = dialogueInterpreter.interpret(text, dialogueStage, relativeProfile, scenario.id);
      setDialogueStage(interpretation.newStage);

      // Registra a entrada no vocabulário e grava expressões não reconhecidas no banco de dados!
      vocabularyService.recordInput(
        text,
        inputType,
        scenario.id,
        scenario.title,
        dialogueStage,
        interpretation.isUnrecognized ?? false,
        interpretation.matchedRule
      );

      if (isFamilyScenario) {
        if (interpretation.detectedName) {
          setRelativeProfile(prev => ({ ...prev, detectedName: interpretation.detectedName }));
        }
        if (interpretation.updatedProfile) {
          setRelativeProfile(prev => ({ ...prev, ...interpretation.updatedProfile }));
        }
      }

      const typingDelay = Math.min(Math.max(text.length * 20, 800), 1600);

      setTimeout(() => {
        setIsTyping(false);

        if (interpretation.isCriticalAction) {
          const sysMsg: MessageNode = {
            id: `sys_crit_${Date.now()}`,
            sender: 'system',
            text: interpretation.replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const finalHistory = [...displayedMessages, userMessage, sysMsg];
          setDisplayedMessages(prev => [...prev, sysMsg]);
          setLastCriticalReason(interpretation.replyText);
          userProgressService.recordAttempt(scenario.id, scenario.title, scenario.category, 'fallen', interpretation.replyText);
          recordDbSession('fallen', interpretation.replyText, finalHistory);
          setTimeout(() => setShowErrorModal(true), 2000);
        } else if (interpretation.isSafeEnding) {
          const sysMsg: MessageNode = {
            id: `sys_safe_${Date.now()}`,
            sender: 'system',
            text: interpretation.replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          const finalHistory = [...displayedMessages, userMessage, sysMsg];
          setDisplayedMessages(prev => [...prev, sysMsg]);
          setLastSafeReply(interpretation.replyText);
          audioService.speak(interpretation.replyText);
          userProgressService.recordAttempt(scenario.id, scenario.title, scenario.category, 'safe', interpretation.replyText);
          recordDbSession('safe', interpretation.replyText, finalHistory);
          setTimeout(() => setShowSuccessModal(true), 4200);
        } else {
          const botMsg: MessageNode = {
            id: `bot_reply_${Date.now()}`,
            sender: 'opponent',
            text: interpretation.replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setDisplayedMessages(prev => [...prev, botMsg]);
          setDynamicChoices(interpretation.suggestedChoices || []);
        }
      }, typingDelay);
    };

    // 4. Se o Agente de IA estiver ativo e configurado (Modo Online com Gemini API)
    if (aiScammerService.isAiEnabled()) {
      vocabularyService.recordInput(text, inputType, scenario.id, scenario.title, dialogueStage, false);
      const updatedHistory = [...displayedMessages, userMessage];
      // Só passa relativeProfile se for de fato um cenário familiar!
      aiScammerService.generateReply(scenario, updatedHistory, text, isFamilyScenario ? relativeProfile : undefined)
        .then((aiReply: any) => {
          if (aiReply) {
            setIsTyping(false);
            if (aiReply.outcome === 'critical_action') {
              const opponentMsg: MessageNode = {
                id: `ai_crit_${Date.now()}`,
                sender: 'opponent',
                text: aiReply.replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              const finalHistory = [...displayedMessages, userMessage, opponentMsg];
              setDisplayedMessages(prev => [...prev, opponentMsg]);
              const reason = aiReply.scamReason || aiReply.replyText;
              setLastCriticalReason(reason);
              userProgressService.recordAttempt(scenario.id, scenario.title, scenario.category, 'fallen', reason);
              recordDbSession('fallen', reason, finalHistory);
              setTimeout(() => setShowErrorModal(true), 2000);
            } else if (aiReply.outcome === 'safe_exit') {
              const safeMsg: MessageNode = {
                id: `ai_safe_${Date.now()}`,
                sender: 'opponent',
                text: aiReply.replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              const finalHistory = [...displayedMessages, userMessage, safeMsg];
              setDisplayedMessages(prev => [...prev, safeMsg]);
              setLastSafeReply(aiReply.replyText);
              audioService.speak(aiReply.replyText);
              const safeReason = aiReply.scamReason || 'Decisão segura aplicada';
              userProgressService.recordAttempt(scenario.id, scenario.title, scenario.category, 'safe', safeReason);
              recordDbSession('safe', safeReason, finalHistory);
              setTimeout(() => setShowSuccessModal(true), 4500);
            } else {
              const botMsg: MessageNode = {
                id: `ai_reply_${Date.now()}`,
                sender: 'opponent',
                text: aiReply.replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              setDisplayedMessages(prev => [...prev, botMsg]);
              setDynamicChoices(aiReply.suggestedChoices);
            }
          } else {
            runOfflineInterpretation();
          }
        })
        .catch(() => {
          runOfflineInterpretation();
        });
      return;
    }

    // Modo Padrão Offline
    runOfflineInterpretation();
  };

  const handleRestart = () => {
    audioService.stop();
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setIsPhoneCallActive(scenario.id === 'golpe-falso-motoboy');
    setActiveWebPage(null);
    setInspectingPage(null);
    setDisplayedMessages([]);
    setRelativeProfile({ kinship: 'filho', targetTitle: 'mãe' });
    startSimulationDirectly();
  };

  const handleBackToHome = () => {
    audioService.stop();
    onBack();
  };

  const handleNextCorrelated = () => {
    audioService.stop();
    setShowErrorModal(false);
    setShowSuccessModal(false);
    setIsPhoneCallActive(nextCorrelatedScenario.id === 'golpe-falso-motoboy');
    setActiveWebPage(null);
    setInspectingPage(null);
    if (onSwitchScenario) {
      onSwitchScenario(nextCorrelatedScenario);
    }
  };

  // Se o usuário estiver navegando na página web simulada (Sprint 2)
  if (activeWebPage) {
    return (
      <SimuladorNavegador
        page={activeWebPage}
        onClose={() => setActiveWebPage(null)}
        onSubmitRisk={() => {
          setActiveWebPage(null);
          const reason = 'Inseriu dados e confirmou senha em página web não oficial';
          setLastCriticalReason(reason);
          progressoUsuarioService.recordAttempt(scenario.id, scenario.title, scenario.category, 'fallen', reason);
          setShowErrorModal(true);
        }}
        onSafeExit={() => {
          setActiveWebPage(null);
          progressoUsuarioService.recordAttempt(scenario.id, scenario.title, scenario.category, 'safe', 'Fechou o navegador falso com segurança');
          setShowSuccessModal(true);
        }}
        highContrast={highContrast}
        fontSizeLevel={fontSizeLevel}
      />
    );
  }

  // Se o usuário estiver em uma ligação telefônica simulada (Golpe 3 - Falsa Central)
  if (isPhoneCallActive && scenario.environment === 'phone') {
    const lastOpponentMsg = displayedMessages.slice().reverse().find(m => m.sender === 'opponent') || scenario.nodes['node_call_connected'];
    return (
      <div className="w-full">
        <SimuladorLigacao
          scenario={scenario}
          currentNode={lastOpponentMsg}
          onSelectChoice={(choice) => handleSendMessage(choice.text)}
          onHangup={() => {
            audioService.stop();
            setIsPhoneCallActive(false);
            const hangupReason = 'Desligou imediatamente a ligação da falsa central telefônica';
            progressoUsuarioService.recordAttempt(
              scenario.id,
              scenario.title,
              scenario.category,
              'safe',
              hangupReason
            );
            recordDbSession('safe', hangupReason, displayedMessages);
            setLastSafeReply('Atendente Rodrigo: "Alô? Não desliga a chamada..." [Você encerrou a ligação com segurança]');
            setShowSuccessModal(true);
          }}
          onSendMessage={handleSendMessage}
          isAiActive={isAiActive}
          highContrast={highContrast}
          fontSizeLevel={fontSizeLevel}
        />

        {/* Modal do 'Susto Seguro' ao cair no golpe */}
        {showErrorModal && (
          <ModalAlertaGolpe
            scenario={scenario}
            onRestart={handleRestart}
            onBack={handleBackToHome}
            onNextCorrelatedScenario={onSwitchScenario ? handleNextCorrelated : undefined}
            correlatedScenarioTitle={nextCorrelatedScenario.title}
            criticalReason={lastCriticalReason}
            highContrast={highContrast}
            fontSizeLevel={fontSizeLevel}
          />
        )}

        {/* Modal de Sucesso ao tomar decisão segura */}
        {showSuccessModal && (
          <ModalSucessoSeguro
            scenario={scenario}
            onRestart={handleRestart}
            onBack={handleBackToHome}
            onViewCertificate={onViewCertificate}
            onNextCorrelatedScenario={onSwitchScenario ? handleNextCorrelated : undefined}
            correlatedScenarioTitle={nextCorrelatedScenario.title}
            lastDialogueText={lastSafeReply}
            highContrast={highContrast}
            fontSizeLevel={fontSizeLevel}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col h-[calc(100dvh-44px)] sm:h-[88vh] sm:max-h-[850px] sm:rounded-3xl sm:shadow-2xl overflow-hidden border transition-all ${
      highContrast 
        ? 'bg-black border-yellow-400' 
        : 'bg-slate-50 border-slate-300'
    }`}>
      {/* Top Header do WhatsApp / SMS com Dados do Remetente */}
      <div className="shrink-0">
        <CabecalhoChat
          sender={{
            ...scenario.sender,
            phoneNumber: (scenario.environment !== 'sms' && relativeProfile.detectedName)
              ? `Número não salvo na agenda (~ ${relativeProfile.detectedName})`
              : scenario.sender.phoneNumber
          }}
          scenarioTitle={scenario.title}
          onBack={handleBackToHome}
          onOpenAiConfig={() => setShowAiModal(true)}
          isAiActive={isAiActive}
          highContrast={highContrast}
          environment={scenario.environment}
        />
      </div>

      {/* Área Central de Mensagens com Fundo Personalizado (SMS vs WhatsApp) */}
      <main aria-label="Mensagens da simulação" className={`flex-1 min-h-[160px] overflow-y-auto p-3 sm:p-4 space-y-2 transition-colors ${
        highContrast 
          ? 'bg-zinc-950' 
          : scenario.environment === 'sms' || scenario.environment === 'phone'
          ? 'bg-slate-100'
          : 'bg-[#EFEAE2]'
      }`}>
        {displayedMessages.map((msg, index) => (
          <BalaoMensagem
            key={`${msg.id}_${index}`}
            message={msg}
            onOpenLink={handleOpenLink}
            onInspectLink={handleInspectLink}
            highContrast={highContrast}
            fontSizeLevel={fontSizeLevel}
            environment={scenario.environment}
          />
        ))}

        {/* Indicador de 'digitando...' ou 'recebendo...' */}
        {isTyping && (
          <div className="flex items-center gap-2 p-3 bg-white text-slate-500 rounded-2xl w-fit text-sm shadow-sm border border-slate-200">
            <span className="font-semibold">
              {scenario.environment === 'sms' || scenario.environment === 'phone'
                ? 'Recebendo SMS...'
                : `${scenario.sender.name} está digitando`}
            </span>
            <span className="flex gap-1">
              <span className={`w-2 h-2 rounded-full animate-bounce ${scenario.environment === 'sms' || scenario.environment === 'phone' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.2s] ${scenario.environment === 'sms' || scenario.environment === 'phone' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
              <span className={`w-2 h-2 rounded-full animate-bounce [animation-delay:0.4s] ${scenario.environment === 'sms' || scenario.environment === 'phone' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Barra Dinâmica Inferior de Mensagens com Digitação Livre e Microfone */}
      {!showErrorModal && !showSuccessModal && (
        <BarraEntradaTexto
          onSendMessage={handleSendMessage}
          suggestedChoices={dynamicChoices}
          disabled={isTyping}
          highContrast={highContrast}
          fontSizeLevel={fontSizeLevel}
          environment={scenario.environment}
        />
      )}

      {/* Modal de Inspeção de Link Independente */}
      {inspectingPage && (
        <ModalInspecaoLink
          page={inspectingPage}
          onClose={() => setInspectingPage(null)}
          highContrast={highContrast}
          fontSizeLevel={fontSizeLevel}
        />
      )}

      {/* Modal do 'Susto Seguro' ao cair no golpe (Sprint 3 MVP) */}
      {showErrorModal && (
        <ModalAlertaGolpe
          scenario={scenario}
          onRestart={handleRestart}
          onBack={handleBackToHome}
          onNextCorrelatedScenario={onSwitchScenario ? handleNextCorrelated : undefined}
          correlatedScenarioTitle={nextCorrelatedScenario.title}
          criticalReason={lastCriticalReason}
          highContrast={highContrast}
          fontSizeLevel={fontSizeLevel}
        />
      )}

      {/* Modal de Sucesso ao tomar decisão segura (Sprint 3 MVP) */}
      {showSuccessModal && (
        <ModalSucessoSeguro
          scenario={scenario}
          onRestart={handleRestart}
          onBack={handleBackToHome}
          onViewCertificate={onViewCertificate}
          onNextCorrelatedScenario={onSwitchScenario ? handleNextCorrelated : undefined}
          correlatedScenarioTitle={nextCorrelatedScenario.title}
          lastDialogueText={lastSafeReply}
          highContrast={highContrast}
          fontSizeLevel={fontSizeLevel}
        />
      )}

      {/* Modal de Configuração do Agente de IA */}
      <ModalConfiguracaoIA
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onKeySaved={() => setIsAiActive(iaGolpistaService.isAiEnabled())}
        highContrast={highContrast}
      />
    </div>
  );
};

export const SimulationContainer = SimuladorWhatsapp;
