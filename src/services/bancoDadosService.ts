import { 
  SeniorClient, 
  SimulationSession, 
  UnrecognizedExpression, 
  WordFrequency,
  FamilyVulnerabilityReport,
  CategoriaPalavraPtBr
} from '../types/bancoDados';

const DB_NAME = 'SegurancaDigitalIdososDB';
const DB_VERSION = 1;

const STORE_SENIORS = 'seniors';
const STORE_SESSIONS = 'simulation_sessions';
const STORE_UNRECOGNIZED = 'unrecognized_expressions';
const STORE_WORDS = 'word_frequencies';

const STORAGE_ACTIVE_SENIOR_KEY = 'seguranca_digital_active_senior_id';

const classificarCategoriaPtBr = (palavra: string): CategoriaPalavraPtBr => {
  const norm = palavra.toLowerCase();
  const termosFamilia = ['filho', 'filha', 'neto', 'neta', 'mae', 'pai', 'marido', 'esposa', 'tio', 'tia', 'sobrinho', 'sobrinha', 'parente', 'comadre', 'compadre', 'irmao', 'irma', 'familia', 'genro', 'nora', 'casa', 'vizinho'];
  const termosFinanceiro = ['pix', 'dinheiro', 'banco', 'cartao', 'conta', 'senha', 'limite', 'fatura', 'pagar', 'transferir', 'taxa', 'reais', 'valor', 'saldo', 'emprestimo', 'consignado', 'agencia', 'estorno', 'chave'];
  const termosSeguranca = ['golpe', 'policia', 'delegacia', 'mentira', 'procon', 'falso', 'oficial', 'bloquear', 'desligar', 'gerente', 'seguranca', 'cuidado', 'crime', 'advogado', 'cartorio', 'app'];
  const termosUrgencia = ['urgente', 'pressa', 'rapido', 'socorro', 'quebrou', 'conserto', 'guincho', 'bloqueio', 'suspensao', 'prazo', 'perigo', 'agora', 'ajuda'];

  if (termosFamilia.some(k => norm.includes(k))) return 'familia';
  if (termosFinanceiro.some(k => norm.includes(k))) return 'financeiro';
  if (termosSeguranca.some(k => norm.includes(k))) return 'seguranca';
  if (termosUrgencia.some(k => norm.includes(k))) return 'urgencia';
  return 'geral';
};

class BancoDadosService {
  private db: IDBDatabase | null = null;
  private isSupported: boolean = typeof window !== 'undefined' && 'indexedDB' in window;
  private memoryFallback: {
    seniors: Record<string, SeniorClient>;
    sessions: Record<string, SimulationSession>;
    unrecognized: Record<string, UnrecognizedExpression>;
    words: Record<string, WordFrequency>;
  } = {
    seniors: {},
    sessions: {},
    unrecognized: {},
    words: {}
  };

  constructor() {
    this.initFallbackFromLocalStorage();
  }

  private initFallbackFromLocalStorage() {
    try {
      const saved = localStorage.getItem(`${DB_NAME}_fallback`);
      if (saved) {
        this.memoryFallback = JSON.parse(saved);
      }
    } catch {
      // Ignora falhas de storage privado
    }
  }

  private persistFallback() {
    try {
      localStorage.setItem(`${DB_NAME}_fallback`, JSON.stringify(this.memoryFallback));
    } catch {
      // Ignora
    }
  }

  public async init(): Promise<void> {
    if (!this.isSupported) {
      this.seedDefaultSeniorIfNeeded();
      return;
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(STORE_SENIORS)) {
            db.createObjectStore(STORE_SENIORS, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
            const sessionStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
            sessionStore.createIndex('seniorId', 'seniorId', { unique: false });
            sessionStore.createIndex('scenarioId', 'scenarioId', { unique: false });
            sessionStore.createIndex('outcome', 'outcome', { unique: false });
            sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORE_UNRECOGNIZED)) {
            const unrecStore = db.createObjectStore(STORE_UNRECOGNIZED, { keyPath: 'id' });
            unrecStore.createIndex('scenarioId', 'scenarioId', { unique: false });
            unrecStore.createIndex('timestamp', 'timestamp', { unique: false });
            unrecStore.createIndex('status', 'status', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORE_WORDS)) {
            db.createObjectStore(STORE_WORDS, { keyPath: 'word' });
          }
        };

        request.onsuccess = async () => {
          this.db = request.result;
          await this.seedDefaultSeniorIfNeeded();
          resolve();
        };

        request.onerror = () => {
          console.warn('Falha ao abrir IndexedDB. Alternando para armazenamento local transparente.');
          this.db = null;
          this.seedDefaultSeniorIfNeeded();
          resolve();
        };
      } catch (err) {
        console.warn('Erro ao inicializar banco de dados:', err);
        this.db = null;
        this.seedDefaultSeniorIfNeeded();
        resolve();
      }
    });
  }

  private async seedDefaultSeniorIfNeeded(): Promise<void> {
    const seniors = await this.getSeniors();
    if (seniors.length === 0) {
      const defaultSenior: SeniorClient = {
        id: 'senior_maria_padrao',
        name: 'Dona Maria da Silva',
        ageGroup: '70-79',
        phone: '(65) 99876-5432',
        caregiverName: 'Ana Paula da Silva',
        caregiverPhone: '(65) 99123-4567',
        caregiverEmail: 'anapaula.silva@email.com',
        caregiverRelationship: 'filho(a)',
        notes: 'Participante das oficinas comunitárias do projeto de extensão universitária do IFMT Cuiabá.',
        riskLevel: 'moderado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await this.saveSenior(defaultSenior);
      this.setActiveSeniorId(defaultSenior.id);
    } else if (!this.getActiveSeniorId()) {
      this.setActiveSeniorId(seniors[0].id);
    }
  }

  // =========================================================================
  // GESTÃO DE CLIENTES / IDOSOS (SENIORS)
  // =========================================================================

  public async getSeniors(): Promise<SeniorClient[]> {
    if (!this.db) {
      return Object.values(this.memoryFallback.seniors);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_SENIORS, 'readonly');
        const store = transaction.objectStore(STORE_SENIORS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(Object.values(this.memoryFallback.seniors));
      } catch {
        resolve(Object.values(this.memoryFallback.seniors));
      }
    });
  }

  public async getSenior(id: string): Promise<SeniorClient | null> {
    if (!this.db) {
      return this.memoryFallback.seniors[id] || null;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_SENIORS, 'readonly');
        const store = transaction.objectStore(STORE_SENIORS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(this.memoryFallback.seniors[id] || null);
      } catch {
        resolve(this.memoryFallback.seniors[id] || null);
      }
    });
  }

  public async saveSenior(senior: SeniorClient): Promise<void> {
    senior.updatedAt = new Date().toISOString();
    this.memoryFallback.seniors[senior.id] = senior;
    this.persistFallback();

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_SENIORS, 'readwrite');
        const store = transaction.objectStore(STORE_SENIORS);
        const req = store.put(senior);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async deleteSenior(id: string): Promise<void> {
    delete this.memoryFallback.seniors[id];
    this.persistFallback();

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_SENIORS, 'readwrite');
        const store = transaction.objectStore(STORE_SENIORS);
        store.delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public getActiveSeniorId(): string {
    return localStorage.getItem(STORAGE_ACTIVE_SENIOR_KEY) || 'senior_maria_padrao';
  }

  public setActiveSeniorId(id: string): void {
    localStorage.setItem(STORAGE_ACTIVE_SENIOR_KEY, id);
  }

  public async getActiveSenior(): Promise<SeniorClient> {
    const activeId = this.getActiveSeniorId();
    const senior = await this.getSenior(activeId);
    if (senior) return senior;

    const all = await this.getSeniors();
    if (all.length > 0) return all[0];

    return {
      id: 'senior_maria_padrao',
      name: 'Dona Maria da Silva',
      ageGroup: '70-79',
      phone: '(65) 99876-5432',
      caregiverName: 'Ana Paula da Silva',
      caregiverPhone: '(65) 99123-4567',
      caregiverEmail: 'anapaula.silva@email.com',
      caregiverRelationship: 'filho(a)',
      notes: 'Participante das oficinas comunitárias do projeto de extensão universitária do IFMT Cuiabá.',
      riskLevel: 'moderado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // =========================================================================
  // GESTÃO DE SESSÕES DE SIMULAÇÃO (SESSIONS)
  // =========================================================================

  public async addSession(session: SimulationSession): Promise<void> {
    this.memoryFallback.sessions[session.id] = session;
    this.persistFallback();

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_SESSIONS, 'readwrite');
        const store = transaction.objectStore(STORE_SESSIONS);
        const req = store.put(session);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getSessions(seniorId?: string): Promise<SimulationSession[]> {
    if (!this.db) {
      const all = Object.values(this.memoryFallback.sessions);
      return seniorId ? all.filter(s => s.seniorId === seniorId) : all;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_SESSIONS, 'readonly');
        const store = transaction.objectStore(STORE_SESSIONS);

        if (seniorId && store.indexNames.contains('seniorId')) {
          const index = store.index('seniorId');
          const req = index.getAll(seniorId);
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } else {
          const req = store.getAll();
          req.onsuccess = () => {
            const list: SimulationSession[] = req.result || [];
            resolve(seniorId ? list.filter(s => s.seniorId === seniorId) : list);
          };
          req.onerror = () => resolve([]);
        }
      } catch {
        const all = Object.values(this.memoryFallback.sessions);
        resolve(seniorId ? all.filter(s => s.seniorId === seniorId) : all);
      }
    });
  }

  // =========================================================================
  // GESTÃO DE PALAVRAS E EXPRESSÕES NÃO RECONHECIDAS (PT-BR)
  // =========================================================================

  public async logUnrecognizedExpression(entry: Omit<UnrecognizedExpression, 'idioma'> & { idioma?: 'pt-BR' }): Promise<void> {
    const fullEntry: UnrecognizedExpression = {
      ...entry,
      idioma: 'pt-BR'
    };

    this.memoryFallback.unrecognized[fullEntry.id] = fullEntry;
    this.persistFallback();

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_UNRECOGNIZED, 'readwrite');
        const store = transaction.objectStore(STORE_UNRECOGNIZED);
        store.put(fullEntry);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getUnrecognizedExpressions(): Promise<UnrecognizedExpression[]> {
    if (!this.db) {
      return Object.values(this.memoryFallback.unrecognized).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_UNRECOGNIZED, 'readonly');
        const store = transaction.objectStore(STORE_UNRECOGNIZED);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: UnrecognizedExpression[] = req.result || [];
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(list);
        };
        req.onerror = () => resolve(Object.values(this.memoryFallback.unrecognized));
      } catch {
        resolve(Object.values(this.memoryFallback.unrecognized));
      }
    });
  }

  public async updateUnrecognizedStatus(id: string, status: 'pending' | 'mapped' | 'ignored'): Promise<void> {
    if (this.memoryFallback.unrecognized[id]) {
      this.memoryFallback.unrecognized[id].status = status;
      this.persistFallback();
    }

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_UNRECOGNIZED, 'readwrite');
        const store = transaction.objectStore(STORE_UNRECOGNIZED);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            const updated = { ...req.result, status };
            store.put(updated);
          }
          resolve();
        };
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async clearUnrecognizedExpressions(): Promise<void> {
    this.memoryFallback.unrecognized = {};
    this.persistFallback();

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_UNRECOGNIZED, 'readwrite');
        const store = transaction.objectStore(STORE_UNRECOGNIZED);
        store.clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // =========================================================================
  // FREQUÊNCIA DE PALAVRAS UTILIZADAS EM PORTUGUÊS (PT-BR)
  // =========================================================================

  public async incrementWordFrequencies(
    words: string[], 
    inputType: 'typed' | 'audio', 
    scenarioId: string
  ): Promise<void> {
    const now = new Date().toISOString();

    for (const rawWord of words) {
      const word = rawWord.trim().toLowerCase();
      if (word.length < 3) continue;

      const categoria = classificarCategoriaPtBr(word);
      const existing = this.memoryFallback.words[word] || {
        word,
        count: 0,
        lastUsedAt: now,
        source: inputType,
        scenarioContexts: [],
        idioma: 'pt-BR' as const,
        categoria
      };

      existing.count += 1;
      existing.lastUsedAt = now;
      existing.idioma = 'pt-BR';
      existing.categoria = categoria;
      if (existing.source !== inputType && existing.source !== 'both') {
        existing.source = 'both';
      }
      if (!existing.scenarioContexts.includes(scenarioId)) {
        existing.scenarioContexts.push(scenarioId);
      }

      this.memoryFallback.words[word] = existing;
    }
    this.persistFallback();

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_WORDS, 'readwrite');
        const store = transaction.objectStore(STORE_WORDS);

        for (const rawWord of words) {
          const word = rawWord.trim().toLowerCase();
          if (word.length < 3) continue;

          const getReq = store.get(word);
          getReq.onsuccess = () => {
            const categoria = classificarCategoriaPtBr(word);
            const current: WordFrequency = getReq.result || {
              word,
              count: 0,
              lastUsedAt: now,
              source: inputType,
              scenarioContexts: [],
              idioma: 'pt-BR' as const,
              categoria
            };

            current.count += 1;
            current.lastUsedAt = now;
            current.idioma = 'pt-BR';
            current.categoria = categoria;
            if (current.source !== inputType && current.source !== 'both') {
              current.source = 'both';
            }
            if (!current.scenarioContexts.includes(scenarioId)) {
              current.scenarioContexts.push(scenarioId);
            }

            store.put(current);
          };
        }

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getWordFrequencies(limit = 100): Promise<WordFrequency[]> {
    if (!this.db) {
      return Object.values(this.memoryFallback.words)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_WORDS, 'readonly');
        const store = transaction.objectStore(STORE_WORDS);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: WordFrequency[] = req.result || [];
          list.sort((a, b) => b.count - a.count);
          resolve(list.slice(0, limit));
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // =========================================================================
  // GERAÇÃO DO LAUDO / RELATÓRIO DE VULNERABILIDADE FAMILIAR
  // =========================================================================

  public async generateFamilyReport(seniorId?: string): Promise<FamilyVulnerabilityReport> {
    const targetId = seniorId || this.getActiveSeniorId();
    const senior = (await this.getSenior(targetId)) || await this.getActiveSenior();
    const sessions = await this.getSessions(senior.id);

    const totalSessions = sessions.length;
    const safeSessions = sessions.filter(s => s.outcome === 'safe');
    const fallenSessions = sessions.filter(s => s.outcome === 'fallen');

    const safeCount = safeSessions.length;
    const fallenCount = fallenSessions.length;
    const safeRate = totalSessions > 0 ? Math.round((safeCount / totalSessions) * 100) : 100;
    const vulnerabilityIndex = totalSessions > 0 ? Math.round((fallenCount / totalSessions) * 100) : 0;

    let riskLevel: 'baixo' | 'moderado' | 'alto' = 'baixo';
    if (vulnerabilityIndex >= 50 || fallenCount >= 3) {
      riskLevel = 'alto';
    } else if (vulnerabilityIndex >= 20 || fallenCount >= 1) {
      riskLevel = 'moderado';
    }

    // Métricas por Categoria
    const categoryMetrics: Record<string, { total: number; safe: number; fallen: number; vulnerabilityRate: number }> = {};
    for (const session of sessions) {
      const cat = session.category || 'Geral';
      if (!categoryMetrics[cat]) {
        categoryMetrics[cat] = { total: 0, safe: 0, fallen: 0, vulnerabilityRate: 0 };
      }
      categoryMetrics[cat].total += 1;
      if (session.outcome === 'safe') categoryMetrics[cat].safe += 1;
      if (session.outcome === 'fallen') categoryMetrics[cat].fallen += 1;
    }

    for (const cat in categoryMetrics) {
      const item = categoryMetrics[cat];
      item.vulnerabilityRate = item.total > 0 ? Math.round((item.fallen / item.total) * 100) : 0;
    }

    // Vulnerabilidades detectadas consolidadas
    const detectedVulnerabilities: Array<{ title: string; description: string; severity: 'alta' | 'media' | 'baixa'; scenarios: string[] }> = [];

    const hasPixFall = fallenSessions.some(s => s.scenarioId === 'falso-familiar-novo-numero');
    if (hasPixFall) {
      detectedVulnerabilities.push({
        title: 'Alta suscetibilidade ao Apelo Emocional e Pedido de Pix',
        description: 'O idoso tende a confiar rapidamente quando alguém finge ser filho/parente precisando de ajuda urgente, sem checar pelo número antigo.',
        severity: 'alta',
        scenarios: ['Golpe do Falso Familiar (Novo Número)']
      });
    }

    const hasLinkFall = fallenSessions.some(s => s.scenarioId === 'falso-aviso-banco-link' || s.scenarioId === 'falsa-prova-vida-inss');
    if (hasLinkFall) {
      detectedVulnerabilities.push({
        title: 'Dificuldade em Checar Links Falsos (.xyz)',
        description: 'O idoso clicou em mensagens alarmistas de banco ou INSS e preencheu formulários fora dos aplicativos oficiais.',
        severity: 'alta',
        scenarios: ['SMS de Banco Falso', 'Falsa Prova de Vida do INSS']
      });
    }

    const hasPhoneFall = fallenSessions.some(s => s.scenarioId === 'falsa-central-0800' || s.scenarioId === 'golpe-falso-motoboy');
    if (hasPhoneFall) {
      detectedVulnerabilities.push({
        title: 'Vulnerabilidade a Telefonemas Falsos e Falso Motoboy',
        description: 'O idoso acreditou em atendentes falsos que simulam perigo de clonagem e solicitam senhas ou entrega de cartão físico na residência.',
        severity: 'alta',
        scenarios: ['Falsa Central 0800', 'Golpe do Falso Motoboy']
      });
    }

    const hasGiftFall = fallenSessions.some(s => s.scenarioId === 'golpe-presente-taxa-entrega');
    if (hasGiftFall) {
      detectedVulnerabilities.push({
        title: 'Risco de Pagamento de Frete Falso ou Biometria no Portão',
        description: 'O idoso aceitou pagar taxa de entrega com maquininha na calçada ou tirar foto para desconhecidos.',
        severity: 'media',
        scenarios: ['Golpe do Presente / Taxa de Entrega']
      });
    }

    // Hábitos seguros consolidados
    const safeHabitsSet = new Set<string>();
    for (const session of safeSessions) {
      session.safeHabitsObserved.forEach(h => safeHabitsSet.add(h));
    }
    const consolidatedSafeHabits = Array.from(safeHabitsSet);
    if (consolidatedSafeHabits.length === 0 && safeCount > 0) {
      consolidatedSafeHabits.push('Desconfiou de pedidos imediatos de dinheiro');
      consolidatedSafeHabits.push('Preferiu contatar canais oficiais e recusou links suspeitos');
    }

    // Recomendações para a família
    const familyRecommendations: Array<{ title: string; action: string; urgency: 'imediata' | 'recomendada' | 'preventiva' }> = [];

    familyRecommendations.push({
      title: 'Definir Palavra-Código Secreta Familiar',
      action: 'Combinem uma palavra secreta em família (ex: "Jardim", "Pé de Manga"). Se qualquer filho mandar mensagem pedindo dinheiro de número novo, o idoso deve exigir a palavra secreta.',
      urgency: 'imediata'
    });

    familyRecommendations.push({
      title: 'Ajustar Limites de Pix no Aplicativo Bancário',
      action: 'Ajudem o idoso a reduzir o limite de Pix diário para R$ 200,00 e o limite noturno para R$ 100,00 no app do banco.',
      urgency: 'imediata'
    });

    familyRecommendations.push({
      title: 'Bloquear Chamadas Desconhecidas e 0800 Suspeitos',
      action: 'Ativar o filtro nativo anti-spam no celular do idoso para silenciar chamadas de números não salvos na agenda telefônica.',
      urgency: 'recomendada'
    });

    familyRecommendations.push({
      title: 'Ativar Confirmação em Duas Etapas no WhatsApp',
      action: 'Configurar a senha de 6 dígitos no WhatsApp do idoso para impedir que golpistas clonem ou transfiram a conta.',
      urgency: 'recomendada'
    });

    familyRecommendations.push({
      title: 'Aviso Visível no Portão / Geladeira',
      action: 'Colocar um recadinho impresso na geladeira: "NUNCA pague taxa de presente na maquininha e NUNCA entregue cartão para motoboy".',
      urgency: 'preventiva'
    });

    return {
      senior,
      totalSessions,
      safeCount,
      fallenCount,
      safeRate,
      vulnerabilityIndex,
      riskLevel,
      categoryMetrics,
      detectedVulnerabilities,
      consolidatedSafeHabits,
      familyRecommendations
    };
  }

  // =========================================================================
  // EXPORTAÇÃO E IMPORTAÇÃO COMPLETA DO BANCO DE DADOS (JSON)
  // =========================================================================

  public async exportFullDatabase(): Promise<string> {
    const seniors = await this.getSeniors();
    const sessions = await this.getSessions();
    const unrecognized = await this.getUnrecognizedExpressions();
    const words = await this.getWordFrequencies(500);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: DB_VERSION,
      idiomaPadrao: 'pt-BR',
      seniors,
      sessions,
      unrecognized,
      words
    };

    return JSON.stringify(payload, null, 2);
  }

  public async importFullDatabase(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.seniors)) {
        for (const s of data.seniors) await this.saveSenior(s);
      }
      if (Array.isArray(data.sessions)) {
        for (const sess of data.sessions) await this.addSession(sess);
      }
      if (Array.isArray(data.unrecognized)) {
        for (const unrec of data.unrecognized) await this.logUnrecognizedExpression(unrec);
      }
      return true;
    } catch (err) {
      console.error('Erro ao importar banco:', err);
      return false;
    }
  }
}

export const bancoDadosService = new BancoDadosService();
export const dbService = bancoDadosService;
