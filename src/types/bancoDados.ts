export type CategoriaPalavraPtBr = 'familia' | 'financeiro' | 'seguranca' | 'urgencia' | 'geral';

export interface SeniorClient {
  id: string;
  name: string;
  ageGroup: '60-69' | '70-79' | '80+' | string;
  phone?: string;
  caregiverName: string;
  caregiverPhone: string;
  caregiverEmail?: string;
  caregiverRelationship: 'filho(a)' | 'neto(a)' | 'cônjuge' | 'cuidador(a)' | 'outro';
  notes?: string;
  riskLevel: 'baixo' | 'moderado' | 'alto';
  createdAt: string;
  updatedAt: string;
}

export interface SimulationSession {
  id: string;
  seniorId: string;
  scenarioId: string;
  scenarioTitle: string;
  category: string;
  startedAt: string;
  completedAt: string;
  outcome: 'safe' | 'fallen' | 'abandoned';
  reason: string;
  roundsCount: number;
  vulnerabilitiesDetected: string[];
  safeHabitsObserved: string[];
  messages: Array<{
    sender: 'user' | 'opponent' | 'system';
    text: string;
    timestamp: string;
  }>;
}

export interface UnrecognizedExpression {
  id: string;
  seniorId: string;
  scenarioId: string;
  scenarioTitle: string;
  rawText: string;
  normalizedText: string;
  inputType: 'typed' | 'audio';
  timestamp: string;
  stage: string;
  status: 'pending' | 'mapped' | 'ignored';
  notes?: string;
  idioma: 'pt-BR';
}

export interface WordFrequency {
  word: string;
  count: number;
  lastUsedAt: string;
  source: 'typed' | 'audio' | 'both';
  scenarioContexts: string[];
  idioma: 'pt-BR';
  categoria?: CategoriaPalavraPtBr;
}

export interface FamilyVulnerabilityReport {
  senior: SeniorClient;
  totalSessions: number;
  safeCount: number;
  fallenCount: number;
  safeRate: number; // 0 - 100%
  vulnerabilityIndex: number; // 0 - 100% (inverso da segurança)
  riskLevel: 'baixo' | 'moderado' | 'alto';
  categoryMetrics: Record<string, {
    total: number;
    safe: number;
    fallen: number;
    vulnerabilityRate: number;
  }>;
  detectedVulnerabilities: Array<{
    title: string;
    description: string;
    severity: 'alta' | 'media' | 'baixa';
    scenarios: string[];
  }>;
  consolidatedSafeHabits: string[];
  familyRecommendations: Array<{
    title: string;
    action: string;
    urgency: 'imediata' | 'recomendada' | 'preventiva';
  }>;
}
