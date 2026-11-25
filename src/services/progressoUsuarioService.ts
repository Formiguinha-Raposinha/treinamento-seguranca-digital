export interface ScenarioResult {
  scenarioId: string;
  scenarioTitle: string;
  category: string;
  status: 'safe' | 'fallen' | 'in_progress';
  attempts: number;
  lastAttemptDate: string;
  vulnerabilityReasons: string[];
  safeActions: string[];
  hasOvercomeError?: boolean;
  previousStatus?: 'safe' | 'fallen' | 'in_progress';
}

export interface UserProfile {
  name: string;
  phone?: string;
  registeredAt: string;
}

export interface UserProgressData {
  profile: UserProfile;
  results: Record<string, ScenarioResult>;
}

const STORAGE_KEY = 'antigravity_user_progress_v1';

export class UserProgressService {
  private progress: UserProgressData;

  constructor() {
    this.progress = this.loadFromStorage();
  }

  private loadFromStorage(): UserProgressData {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao carregar progresso:', e);
    }

    return {
      profile: {
        name: 'Dona Maria',
        registeredAt: new Date().toISOString()
      },
      results: {}
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Erro ao salvar progresso:', e);
    }
  }

  public getProgress(): UserProgressData {
    return this.progress;
  }

  public getResultForScenario(scenarioId: string): ScenarioResult | undefined {
    return this.progress.results[scenarioId];
  }

  public setUserName(name: string): void {
    this.progress.profile.name = name.trim() || 'Participante';
    this.saveToStorage();
  }

  public setUserPhone(phone: string): void {
    this.progress.profile.phone = phone.trim();
    this.saveToStorage();
  }

  public recordAttempt(
    scenarioId: string,
    scenarioTitle: string,
    category: string,
    outcome: 'safe' | 'fallen',
    reason?: string
  ): void {
    const existing = this.progress.results[scenarioId] || {
      scenarioId,
      scenarioTitle,
      category,
      status: 'in_progress',
      attempts: 0,
      lastAttemptDate: new Date().toLocaleDateString('pt-BR'),
      vulnerabilityReasons: [],
      safeActions: []
    };

    const previousStatus = existing.status;
    existing.attempts += 1;
    existing.lastAttemptDate = new Date().toLocaleDateString('pt-BR');
    existing.status = outcome;
    existing.previousStatus = previousStatus;

    if (outcome === 'safe' && previousStatus === 'fallen') {
      existing.hasOvercomeError = true;
    }

    if (outcome === 'fallen' && reason && !existing.vulnerabilityReasons.includes(reason)) {
      existing.vulnerabilityReasons.push(reason);
    }

    if (outcome === 'safe' && reason && !existing.safeActions.includes(reason)) {
      existing.safeActions.push(reason);
    }

    this.progress.results[scenarioId] = existing;
    this.saveToStorage();
  }

  public getCompletedSafeCount(validScenarioIds?: string[]): number {
    const validIds = validScenarioIds || [
      'falso-familiar-novo-numero',
      'falso-boleto-link',
      'falsa-central-0800',
      'falsa-prova-vida-inss',
      'golpe-falso-motoboy',
      'golpe-presente-taxa-entrega'
    ];
    return validIds.filter(id => this.progress.results[id]?.status === 'safe').length;
  }

  public getTotalAttemptsCount(): number {
    return Object.values(this.progress.results).reduce((acc, r) => acc + r.attempts, 0);
  }

  public getPersonalizedFeedback(): { title: string; tip: string; level: 'good' | 'warning' | 'alert' }[] {
    const feedback: { title: string; tip: string; level: 'good' | 'warning' | 'alert' }[] = [];
    const results = Object.values(this.progress.results);

    if (results.length === 0) {
      feedback.push({
        title: 'Comece seu primeiro treinamento',
        tip: 'Escolha qualquer um dos treinamentos disponíveis para aprender a identificar fraudes no seu próprio ritmo.',
        level: 'good'
      });
      return feedback;
    }

    const fallenCount = results.filter(r => r.status === 'fallen').length;
    const safeCount = results.filter(r => r.status === 'safe').length;

    // Feedback específico por cenário
    const linkResult = this.progress.results['falso-boleto-link'];
    if (linkResult && linkResult.status === 'fallen') {
      feedback.push({
        title: 'Atenção aos Links Recebidos',
        tip: 'Você clicou em um endereço não oficial. Sempre verifique o cadeado e o final do endereço antes de digitar qualquer dado.',
        level: 'warning'
      });
    }

    const pixResult = this.progress.results['falso-familiar-novo-numero'];
    if (pixResult && pixResult.status === 'fallen') {
      feedback.push({
        title: 'Cuidado com Pedidos de Dinheiro',
        tip: 'Se um suposto parente pedir Pix dizendo que trocou de número, ligue para o número antigo dele antes de transferir qualquer valor.',
        level: 'alert'
      });
    }

    const phoneResult = this.progress.results['falsa-central-0800'];
    if (phoneResult && phoneResult.status === 'fallen') {
      feedback.push({
        title: 'Falsas Centrais Telefônicas',
        tip: 'Bancos nunca pedem senhas nem transferências de "blindagem" por telefone. Desligue e olhe o número no verso do seu cartão.',
        level: 'alert'
      });
    }

    const inssResult = this.progress.results['falsa-prova-vida-inss'];
    if (inssResult && inssResult.status === 'fallen') {
      feedback.push({
        title: 'Cuidado com Falsa Prova de Vida do INSS',
        tip: 'O INSS nunca pede fotos de documentos, biometria ou senhas Gov.br por WhatsApp ou SMS. Acesse apenas pelo aplicativo Meu INSS oficial.',
        level: 'alert'
      });
    }

    const motoboyResult = this.progress.results['golpe-falso-motoboy'];
    if (motoboyResult && motoboyResult.status === 'fallen') {
      feedback.push({
        title: 'Bancos Nunca Enviam Motoboy',
        tip: 'Nenhum banco retira cartões na residência do cliente nem solicita a digitação de senha por telefone.',
        level: 'alert'
      });
    }

    const giftResult = this.progress.results['golpe-presente-taxa-entrega'];
    if (giftResult && giftResult.status === 'fallen') {
      feedback.push({
        title: 'Atenção a Presentes e Taxas de Entrega',
        tip: 'Nunca pague taxa de entrega na maquininha para presentes surpresa nem tire fotos do rosto com estranhos no portão.',
        level: 'alert'
      });
    }

    if (safeCount > 0 && fallenCount === 0) {
      feedback.push({
        title: 'Excelente Desempenho!',
        tip: 'Você aplicou a Regra de Ouro em todas as simulações e não caiu em nenhuma armadilha digital!',
        level: 'good'
      });
    }

    return feedback;
  }

  public resetAll(): void {
    this.progress = {
      profile: {
        name: 'Dona Maria',
        registeredAt: new Date().toISOString()
      },
      results: {}
    };
    this.saveToStorage();
  }
}

export const userProgressService = new UserProgressService();
export const progressoUsuarioService = userProgressService;
