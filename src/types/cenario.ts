export type EnvironmentType = 'whatsapp' | 'sms' | 'email' | 'bank' | 'web' | 'phone';

export type ManipulationTactic = 
  | 'urgency'       // Urgência e pressa
  | 'fear'          // Medo e intimidação
  | 'authority'     // Falsa autoridade / Instituição
  | 'affection'     // Confiança / Relação afetiva ou familiar
  | 'reward'        // Falso benefício ou ganho
  | 'isolation';    // Isolamento da vítima

export type KinshipType = 'filho' | 'filha' | 'neto' | 'neta' | 'sobrinho' | 'sobrinha' | 'familiar';

export interface RelativeProfile {
  kinship: KinshipType;
  name?: string;
  detectedName?: string;
  targetTitle?: string; // 'mãe', 'pai', 'vó', 'vô', 'tia', 'tio'
}

export interface RiskSignal {
  id: string;
  title: string;
  description: string;
  tactic: ManipulationTactic;
}

export type ChoiceType = 
  | 'safe'            // Ação segura (ex: ligar para número antigo, abrir canal oficial)
  | 'insecure'        // Ação de risco (ex: enviar Pix, clicar em link suspeito)
  | 'neutral'         // Pergunta ou resposta intermediária
  | 'verify_official';// Ação ativa de verificação independente

export interface UserChoice {
  id: string;
  text: string;
  type: ChoiceType;
  nextNodeId: string;
  feedbackText?: string;
  explanation?: string;
}

export interface LinkPreview {
  url: string;
  displayUrl: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  destinationPageId?: string;
}

export interface WebFormField {
  id: string;
  label: string;
  type: 'text' | 'cpf' | 'password' | 'money';
  placeholder?: string;
  defaultValue?: string;
}

export interface WebActionButton {
  id: string;
  label: string;
  type: 'submit_risk' | 'cancel_safe' | 'inspect_url';
  nextAction: 'critical_failure' | 'safe_return' | 'inspect_modal';
  explanation?: string;
}

export interface SimulatedWebPage {
  id: string;
  url: string;
  title: string;
  brandName: string;
  brandLogo?: string;
  theme: 'bank' | 'delivery' | 'government' | 'generic';
  isSuspiciousUrl: boolean;
  suspiciousDomainExplanation: string;
  officialDomainExample: string;
  headline: string;
  subheadline?: string;
  alertBox?: {
    type: 'danger' | 'warning' | 'info';
    title: string;
    message: string;
  };
  formFields?: WebFormField[];
  pixPayment?: {
    keyType: string;
    key: string;
    receiverName: string;
    receiverBank: string;
    amount: string;
    description: string;
  };
  actionButtons: WebActionButton[];
}

export interface MessageNode {
  id: string;
  sender: 'opponent' | 'user' | 'system';
  text: string;
  timestamp?: string;
  delayMs?: number;
  linkPreview?: LinkPreview;
  riskSignals?: RiskSignal[];
  choices?: UserChoice[];
  nextNodeId?: string; // Para fluxo direto sem escolha
  isCriticalAction?: boolean; // Se atingir este nó significa ação insegura consumada
  isSafeEnding?: boolean;     // Se o usuário completou com segurança
}

export interface SenderProfile {
  name: string;
  phoneNumber?: string;
  avatarUrl?: string;
  statusText?: string;
  institution?: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  environment: EnvironmentType;
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  description: string;
  sender: SenderProfile;
  initialNodeId: string;
  nodes: Record<string, MessageNode>;
  simulatedWebPages?: Record<string, SimulatedWebPage>;
  summary: {
    scamType: string;
    manipulationTactics: ManipulationTactic[];
    safeRouteExplanation: string;
    goldenRule: string;
  };
}
