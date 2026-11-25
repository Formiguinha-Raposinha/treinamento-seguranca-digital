import { UserChoice, RelativeProfile, KinshipType } from '../types/cenario';

export type DialogueStage = 
  | 'greeting'          // Início: alega troca de número
  | 'identity_doubt'    // Usuário desconfiando / pedindo áudio / quem é
  | 'scam_pitch'        // Golpista pedindo R$ 1.250 com urgência
  | 'pix_provided'      // Chave Pix enviada (Cleber Souza)
  | 'negotiation'       // Negociando valor menor / prazo / forma de pagamento
  | 'critical_failure'  // Usuário caiu / transferiu
  | 'safe_ending';      // Usuário se protegeu / checou por canal oficial

export interface InterpretationResult {
  replyText: string;
  newStage: DialogueStage;
  isCriticalAction?: boolean;
  isSafeEnding?: boolean;
  suggestedChoices?: UserChoice[];
  detectedName?: string;
  updatedProfile?: Partial<RelativeProfile>;
  isUnrecognized?: boolean;
  matchedRule?: string;
}

export class DialogueInterpreter {
  // Normalização fonética e remoção de acentos / pontuação
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Verifica se o texto contém qualquer uma das palavras/expressões
  private has(text: string, ...keywords: string[]): boolean {
    return keywords.some(k => {
      const norm = this.normalize(k);
      return text.includes(norm);
    });
  }

  // Tenta pescar um nome próprio genuíno dito pelo usuário (com blindagem contra verbos como "deixou", "salvou", etc.)
  private fishNameFromUser(rawText: string): string | null {
    const clean = this.normalize(rawText);

    // Se a frase contém construções com verbos como "onde o filho...", "que o filho...", "para o filho..."
    // JAMAIS extrair verbos subsequentes como nome!
    if (/(?:onde|aonde|que|quando|como|para|pro|pra|salvo|conta)\s+(?:o|meu|a|minha)\s+(?:filho|filha|neto|neta)/i.test(clean) ||
        /(?:filho|filha|neto|neta)\s+(?:deixou|salvou|mandou|enviou|disse|falou|pediu|tem|tinha)/i.test(clean)) {
      return null;
    }

    // Lista abrangente de palavras proibidas (verbos comuns, substantivos comuns, termos de banco)
    // para NUNCA confundir verbos como "deixou", "salvou", "mandou", "pagou" com nomes próprios!
    const blockedWords = new Set([
      // Verbos comuns
      'deixou', 'salvou', 'mandou', 'enviou', 'pagou', 'transferiu', 'falou', 'disse', 
      'pediu', 'queria', 'precisa', 'precisou', 'conseguiu', 'fez', 'esta', 'estava', 
      'ficou', 'ligou', 'avisou', 'bloqueou', 'clonou', 'roubou', 'perdeu', 'achou', 
      'viu', 'olhou', 'entendeu', 'sabe', 'sabia', 'conhece', 'mora', 'trabalha', 
      'estuda', 'foi', 'veio', 'vai', 'chegou', 'saiu', 'voltou', 'passou', 'pegou',
      'colocou', 'guardou', 'anotou', 'esqueceu', 'lembro', 'lembra', 'tenho', 'tinha',
      'comprei', 'comprou', 'gastei', 'gastou', 'gostou', 'ligue', 'mande', 'mandei',
      'envie', 'enviei', 'deposite', 'depositei', 'pague', 'paguei', 'deixe', 'salve',
      // Substantivos e termos cotidianos
      'banco', 'pix', 'cleber', 'souza', 'dia', 'noite', 'tarde', 'pai', 'mae', 
      'filho', 'filha', 'neto', 'neta', 'tio', 'tia', 'sobrinho', 'sobrinha', 'primo', 'prima',
      'dinheiro', 'celular', 'numero', 'audio', 'video', 'golpe', 'tempo', 'certeza', 
      'verdade', 'quem', 'novo', 'nova', 'meu', 'minha', 'esse', 'essa', 'aqui', 
      'tudo', 'bem', 'bom', 'benca', 'bencao', 'loja', 'cartao', 'conta', 'agencia',
      'valor', 'reais', 'chave', 'caixa', 'bradesco', 'itau', 'santander', 'nubank',
      'saldo', 'limite', 'fatura', 'compra', 'carro', 'guincho', 'mecanico', 'delegacia',
      'casa', 'rua', 'estrada', 'hora', 'agora', 'depois', 'ontem', 'hoje', 'amanha',
      'onde', 'aonde', 'como', 'quando', 'porque', 'quanto', 'coisa', 'caso', 'favor'
    ]);

    // Padrões estritos de vocativo ou pergunta direta:
    // Ex: "é você, Lucas?", "Lucas, é você?", "quem está falando? É o Marcelo?"
    const patterns = [
      /(?:voce\s+e\s+o|voce\s+e\s+a|e\s+o|e\s+a|sera\s+que\s+e\s+o|sera\s+que\s+e\s+a)\s+([a-z]{3,15})\s*(?:\?|$)/i,
      /(?:fala|oi|ola)\s+([a-z]{3,15})\s*(?:,|!|\?|$)/i,
      /([a-z]{3,15})\s*,\s*(?:e\s+voce|e\s+vc|meu\s+filho|minha\s+filha)/i
    ];

    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim().toLowerCase();
        if (!blockedWords.has(candidate) && candidate.length >= 3 && candidate.length <= 15) {
          return candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }
    return null;
  }

  public interpret(
    userRawText: string, 
    currentStage: DialogueStage, 
    profile?: RelativeProfile,
    scenarioId?: string
  ): InterpretationResult {
    const text = this.normalize(userRawText);

    // 1. ISOLAMENTO RIGOROSO DE CENÁRIO: SMS de Link de Banco
    if (scenarioId === 'falso-aviso-banco-link' || scenarioId === 'falso-boleto-link' || scenarioId === 'golpe-link-banco') {
      return this.interpretBankLink(text, currentStage);
    }

    // 2. ISOLAMENTO RIGOROSO DE CENÁRIO: Falsa Central Telefônica 0800
    if (scenarioId === 'falsa-central-0800' || scenarioId === 'falsa-central') {
      return this.interpretCallCenter(text, currentStage);
    }

    // 3. ISOLAMENTO RIGOROSO DE CENÁRIO: Falsa Prova de Vida do INSS
    if (scenarioId === 'falsa-prova-vida-inss' || scenarioId === 'golpe-prova-vida-inss') {
      return this.interpretInss(text, currentStage);
    }

    // 4. ISOLAMENTO RIGOROSO DE CENÁRIO: Golpe do Falso Motoboy
    if (scenarioId === 'golpe-falso-motoboy' || scenarioId === 'falso-motoboy') {
      return this.interpretMotoboy(text, currentStage);
    }

    // 5. ISOLAMENTO RIGOROSO DE CENÁRIO: Golpe do Presente de Aniversário
    if (scenarioId === 'golpe-presente-taxa-entrega' || scenarioId === 'golpe-presente-taxa') {
      return this.interpretDeliveryGift(text, currentStage);
    }

    // 6. CENÁRIO PADRÃO: Golpe do Falso Familiar (WhatsApp do Novo Número)
    return this.interpretFamily(text, currentStage, profile);
  }

// =========================================================================
  // 1. INTERPRETADOR OFFLINE ESPECÍFICO PARA: Golpe do Link / SMS do Banco
  // =========================================================================
  private interpretBankLink(text: string, currentStage: DialogueStage): InterpretationResult {
    // 1.1 Ações Seguras Totais (Regra de Ouro)
    const safeKeywords = [
      'app do banco', 'aplicativo oficial', 'abrir o app', 'olhar no aplicativo', 'app oficial', 
      'meu app', 'acessar pelo app', 'ver no app', 'ver no aplicativo', 'abrir aplicativo',
      'meu gerente', 'falar com gerente', 'ir na agencia', 'vou no banco amanha', 'vou na agencia', 
      'agencia bancaria', 'ir presencialmente', 'vou la no banco', 'vou falar com meu gerente amanha',
      'banco do brasil', 'bradesco', 'caixa economica', 'caixa', 'itau', 'santander', 'nubank', 
      'inter', 'sicredi', 'sicoob', 'safra', 'bmg', 'c6', 'banrisul',
      'verso do cartao', 'telefone impresso no cartao', 'numero atras do cartao', 'ligar pro cartao', 
      'ligar no verso', 'telefone do verso', 'atras do cartao', 'telefone oficial',
      'nao clico', 'nao vou clicar', 'nao clico em nada', 'nao clico em link', 'link suspeito', 
      'link falso', 'site falso', 'e virus', 'e golpe', 'isso e golpe', 'tentativa de golpe', 
      'bloquear', 'denunciar', 'ignorar', 'apagar mensagem', 'apagar o sms',
      'policia', 'procon', 'delegacia', '190', 'chamar policia', 'golpista', 'ladrao', 'safado',
      'meu filho vai ver', 'minha filha cuida disso', 'meu neto resolve', 'vou esperar meu filho', 
      'vou mostrar pro meu filho', 'minha filha que mexe', 'meu genro e advogado', 'meu filho e policial',
      'nao passo dados', 'nao coloco senha', 'nao tenho cartao', 'nao uso cartao', 'nao tenho cartao de credito', 
      'nao comprei nada', 'nao fiz compra', 'deus me livre', 'e mentira', 'mentiroso'
    ];
    if (this.has(text, ...safeKeywords)) {
      return {
        replyText: 'Você praticou a atitude mais segura: desconfiou do link no SMS (.xyz) e decidiu verificar diretamente pelo aplicativo oficial do banco ou pelo telefone no verso do seu cartão físico. Parabéns!',
        newStage: 'safe_ending',
        isSafeEnding: true,
        isUnrecognized: false,
        matchedRule: 'bank_link_safe'
      };
    }

    // 1.2 Ações Críticas Inseguras (Caiu no Phishing)
    const criticalKeywords = [
      'cliquei no link', 'ja cliquei', 'entrei no site', 'acessei o link', 'digitei a senha', 
      'coloquei minha senha', 'coloquei meus dados', 'coloquei meu cpf', 'coloquei o numero do cartao', 
      'coloquei o codigo de seguranca', 'coloquei o cvv', 'confirmei no site', 'fiz o cadastro no link',
      'preenchi os dados', 'coloquei a data de validade', 'confirmei a senha'
    ];
    if (this.has(text, ...criticalKeywords)) {
      return {
        replyText: 'Atenção! Você acessou uma página web não oficial (.xyz) e forneceu senhas ou dados confidenciais! O golpista capturou seus acessos.',
        newStage: 'critical_failure',
        isCriticalAction: true,
        isUnrecognized: false,
        matchedRule: 'bank_link_critical'
      };
    }

    // 1.3 Dúvidas de Múltiplos Bancos / Qual Cartão / Limite
    const multipleBanksKeywords = [
      'qual banco', 'qual e o banco', 'tenho 4', 'tenho 3', 'tenho uns 4', 'tenho conta em', 
      'qual cartao', 'qual deles', 'que banco', 'qual conta', 'qual final de cartao', 
      'nao tenho esse cartao', 'so tenho poupanca', 'nao tenho cartao de credito', 
      'meu cartao e de debito', 'nao tenho limite de 2490', 'meu limite e baixo', 'nao tenho esse limite'
    ];
    if (this.has(text, ...multipleBanksKeywords)) {
      return {
        replyText: 'Prezado(a) cliente: O monitoramento preventivo centralizado abrange todas as contas e cartões vinculados ao seu CPF nas instituições conveniadas. Para verificar qual cartão foi utilizado e contestar o débito de R$ 2.490,00 antes do faturamento, acesse: banco-seguro-cancelamento.xyz',
        newStage: 'identity_doubt',
        isUnrecognized: false,
        matchedRule: 'bank_link_which_bank',
        suggestedChoices: [
          {
            id: 'c_bank_link_verify',
            text: 'Acessar o link para verificar o banco e cancelar',
            type: 'insecure',
            nextNodeId: 'node_in_browser'
          },
          {
            id: 'c_bank_app_safe',
            text: 'Ignorar o SMS e abrir o aplicativo oficial do banco no meu celular',
            type: 'safe',
            nextNodeId: 'node_safe_open_app'
          },
          {
            id: 'c_bank_call_safe',
            text: 'Ligar no telefone impresso no verso do meu cartão físico',
            type: 'safe',
            nextNodeId: 'node_safe_call_card'
          }
        ]
      };
    }

    // 1.4 Contestação de Compra / Pânico / "Não comprei nada"
    const notMeKeywords = [
      'nao comprei', 'nao fui eu', 'que compra', 'magazine luiza', 'smart tv', 'televisao', 
      'nunca comprei', 'nao fiz', 'quem e', 'cancelar', 'como cancela', 'que loja', 'de onde e', 
      'estava dormindo', 'nao sai de casa', 'sou aposentada', 'minha aposentadoria', 
      'salario minimo', 'nao tenho esse dinheiro', 'estao me roubando', 'que absurdo', 
      'cancelem isso', 'quero cancelar', 'cancela agora', 'estorno', 'devolver meu dinheiro'
    ];
    if (this.has(text, ...notMeKeywords)) {
      return {
        replyText: 'ALERTA DE SEGURANÇA: Compra de Smart TV 55 pol no valor de R$ 2.490,00 em análise. Para que a compra seja estornada antes da compensação da fatura e emissão da nota fiscal, confirme o cancelamento no link oficial: banco-seguro-cancelamento.xyz',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'bank_link_contest',
        suggestedChoices: [
          {
            id: 'c_bank_link_cancel',
            text: 'Acessar o link para cancelar a compra da Smart TV',
            type: 'insecure',
            nextNodeId: 'node_in_browser'
          },
          {
            id: 'c_bank_app_cancel',
            text: 'Não clicar no link e verificar pelo app oficial do banco',
            type: 'safe',
            nextNodeId: 'node_safe_open_app'
          },
          {
            id: 'c_bank_call_cancel',
            text: 'Ligar no telefone do verso do cartão físico',
            type: 'safe',
            nextNodeId: 'node_safe_call_card'
          }
        ]
      };
    }

    // 1.5 Dúvidas de Entrega / Endereço / Detalhes do Pedido
    const logisticsKeywords = [
      'onde vai entregar', 'qual endereco', 'quem comprou', 'onde foi a compra', 'que horas foi', 
      'quantas parcelas', 'qual o valor', 'quanto custou', 'cnpj', 'qual telefone', 'quem autorizou'
    ];
    if (this.has(text, ...logisticsKeywords)) {
      return {
        replyText: 'Notificação Bancária: Pedido e-commerce #98214 parcelado em 10x de R$ 249,00 para entrega interestadual em São Paulo. Caso você não resida no endereço de entrega, a contestação imediata deve ser realizada no portal: banco-seguro-cancelamento.xyz',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'bank_link_logistics',
        suggestedChoices: [
          {
            id: 'c_bank_link_cancel',
            text: 'Acessar o link para cancelar a compra e a entrega',
            type: 'insecure',
            nextNodeId: 'node_in_browser'
          },
          {
            id: 'c_bank_app_cancel',
            text: 'Não clicar no link e verificar pelo app oficial do banco',
            type: 'safe',
            nextNodeId: 'node_safe_open_app'
          }
        ]
      };
    }

    // 1.6 Delegação Familiar / Dificuldade Tecnológica
    const delegateKeywords = [
      'vou falar com meu filho', 'meu filho vai ligar', 'minha filha vai ver', 'vou mostrar pro meu neto', 
      'meu marido', 'minha esposa', 'nao sei mexer', 'nao entendo de celular', 'nao enxergo direito', 
      'preciso dos meus oculos', 'meu celular e simples'
    ];
    if (this.has(text, ...delegateKeywords)) {
      return {
        replyText: 'Aviso Urgente: Se a contestação não for finalizada nos próximos minutos, o lote de faturamento será fechado. Oriente seu responsável a acessar o portal de segurança imediatamente: banco-seguro-cancelamento.xyz',
        newStage: 'negotiation',
        isUnrecognized: false,
        matchedRule: 'bank_link_delegate',
        suggestedChoices: [
          {
            id: 'c_bank_call_safe',
            text: 'Ligar para o número oficial no verso do meu cartão',
            type: 'safe',
            nextNodeId: 'node_safe_call_card'
          },
          {
            id: 'c_bank_app_safe',
            text: 'Aguardar meu familiar para abrir o aplicativo do banco',
            type: 'safe',
            nextNodeId: 'node_safe_open_app'
          }
        ]
      };
    }

    // 1.7 Fallback Formal do SMS Bancário (Não mapeado - salva para a pesquisa de vocabulário)
    return {
      replyText: 'Sistema Antifraude: Compra de R$ 2.490,00 pendente de validação. Para cancelar e contestar antes da compensação da fatura, acesse: banco-seguro-cancelamento.xyz',
      newStage: currentStage,
      isUnrecognized: true,
      matchedRule: 'bank_link_fallback',
      suggestedChoices: [
        {
          id: 'c_bank_link_default',
          text: 'Acessar o link para cancelar a compra de R$ 2.490',
          type: 'insecure',
          nextNodeId: 'node_in_browser'
        },
        {
          id: 'c_bank_app_default',
          text: 'Ignorar o SMS e abrir o aplicativo oficial do banco',
          type: 'safe',
          nextNodeId: 'node_safe_open_app'
        },
        {
          id: 'c_bank_call_default',
          text: 'Ligar para o número do verso do meu cartão',
          type: 'safe',
          nextNodeId: 'node_safe_call_card'
        }
      ]
    };
  }

  // =========================================================================
  // 2. INTERPRETADOR OFFLINE ESPECÍFICO PARA: Falsa Central Telefônica 0800
  // =========================================================================
  private interpretCallCenter(text: string, currentStage: DialogueStage): InterpretationResult {
    // 2.1 Ações Seguras Totais (Regra de Ouro)
    const safeKeywords = [
      'desligar', 'vou desligar', 'vou encerrar', 'desliga essa ligacao', 'desligando',
      'nao passo senha', 'nao dou senha', 'minha senha e segredo', 'senha nao se passa', 
      'banco nao pede senha', 'banco nunca pede senha', 'senha e pessoal',
      'nao passo token', 'nao dou token', 'codigo secreto', 'nao passo codigo',
      'verso do cartao', 'numero do cartao', 'telefone no cartao', 'ligar no verso', 
      'vou na agencia', 'falar com meu gerente', 'vou no banco', 'meu gerente resolve', 
      'vou na minha agencia amanha', 'vou no banco amanha presencialmente',
      'banco nao faz pix', 'pix de blindagem nao existe', 'nao faco pix', 'nao transfiro nada', 
      'conta cofre nao existe', 'nao tenho pix', 'nao mando dinheiro',
      'chamar a policia', 'delegacia', '190', 'viatura', 'meu filho policial', 'meu genro policial', 
      'meu filho delegado', 'meu neto advogado', 'meu filho cuida da minha conta', 
      'vou esperar meu filho', 'minha filha resolve', 'minha filha e advogada',
      'e golpe', 'isso e golpe', 'falsa central', '0800 falso', 'mentiroso', 'sem vergonha', 
      'safado', 'vou te denunciar', 'procon', 'nao autorizo', 'nao tenho conta nesse banco'
    ];
    if (this.has(text, ...safeKeywords)) {
      return {
        replyText: 'Você agiu com prudência: desligou imediatamente a ligação suspeita e buscou o atendimento oficial pelo número impresso no verso do cartão físico. Nenhum banco pede senha nem Pix de blindagem por telefone!',
        newStage: 'safe_ending',
        isSafeEnding: true,
        isUnrecognized: false,
        matchedRule: 'call_center_safe'
      };
    }

    // 2.2 Ações Críticas Inseguras (Caiu na Falsa Central)
    const criticalKeywords = [
      'minha senha e', 'digitei a senha', 'passei a senha', 'coloquei a senha no teclado', 
      'meu token e', 'o codigo do sms e', 'passei o codigo', 'fiz o pix de blindagem', 
      'transferi para a conta de seguranca', 'mandei o pix para cleber', 'mandei o pix', 
      'instalei o aplicativo', 'instalei o anydesk', 'instalei o teamviewer', 
      'instalei o quicksupport', 'autorizei o acesso remoto', 'fiz a transferencia'
    ];
    if (this.has(text, ...criticalKeywords)) {
      return {
        replyText: 'Atenção! Bancos NUNCA solicitam transferências Pix de segurança nem solicitam senhas ou instalação de aplicativos de controle remoto por telefone!',
        newStage: 'critical_failure',
        isCriticalAction: true,
        isUnrecognized: false,
        matchedRule: 'call_center_critical'
      };
    }

    // 2.3 Contestação da Compra / Pânico / Ansiedade do Idoso
    const panicKeywords = [
      'nao comprei nas casas bahia', 'nao comprei nada', 'minha aposentadoria', 'estou passando mal', 
      'minha pressao subiu', 'vou enfartar', 'nao tenho 4750', 'nao tenho esse limite', 
      'nao fiz essa compra', 'pelo amor de deus cancela', 'cancela pelo amor de deus', 
      'quem comprou', 'que horas foi', 'estou tremendo', 'que absurdo', 'quem autorizou'
    ];
    if (this.has(text, ...panicKeywords)) {
      return {
        replyText: 'Atendente Rodrigo da Central: "Fique calma, senhora! A senhora está em atendimento protegido pelo protocolo 2026-9812. Nosso sistema de inteligência detectou a compra atípica de R$ 4.750,00 e abriu quarentena preventiva. Para cancelarmos em definitivo sem debitar da sua conta, preciso apenas que a senhora confirme se tem o cartão ou o aplicativo em mãos."',
        newStage: 'greeting',
        isUnrecognized: false,
        matchedRule: 'call_center_panic',
        suggestedChoices: [
          {
            id: 'c_cc_hangup',
            text: '🛑 Suspeito! Vou desligar e ligar no telefone impresso no verso do meu cartão.',
            type: 'safe',
            nextNodeId: 'node_safe_hangup'
          },
          {
            id: 'c_cc_how_cancel',
            text: 'Como faço para cancelar essa compra de R$ 4.750,00?',
            type: 'neutral',
            nextNodeId: 'node_call_connected'
          }
        ]
      };
    }

    // 2.4 Dúvidas sobre o Procedimento do Pix de Blindagem / Conta Segura
    const shieldDoubtKeywords = [
      'por que precisa de senha', 'banco nao pede senha', 'por que fazer pix', 'o que e pix de blindagem', 
      'conta cofre', 'quem e cleber souza', 'quem e esse favorecido', 'por que transferir', 
      'por que pagar para cancelar', 'nao faz sentido', 'como assim pix de seguranca', 'onde digita a senha'
    ];
    if (this.has(text, ...shieldDoubtKeywords)) {
      return {
        replyText: 'Atendente Rodrigo: "Compreendo sua dúvida, senhora! Mostra que a senhora é atenta. O Pix de blindagem não é um pagamento para terceiros: é um comando de estorno do Mecanismo do Banco Central. O saldo sai para uma conta de contingência temporária e é estornado automaticamente em 3 minutos para limpar o rastro da fraude."',
        newStage: 'negotiation',
        isUnrecognized: false,
        matchedRule: 'call_center_shield_doubt',
        suggestedChoices: [
          {
            id: 'c_cc_refuse_pix',
            text: '🛑 Isso não existe! Banco nunca pede Pix para estorno. Vou desligar agora.',
            type: 'safe',
            nextNodeId: 'node_safe_refuse_pix'
          },
          {
            id: 'c_cc_do_pix',
            text: '🚨 [Realizar o Pix de blindagem de R$ 4.750 para a conta de segurança]',
            type: 'insecure',
            nextNodeId: 'node_critical_pix_failure'
          }
        ]
      };
    }

    // 2.5 Dificuldades Tecnológicas / Falta de Celular Moderno
    const techLimitationKeywords = [
      'nao sei mexer no celular', 'nao tenho pix', 'meu aplicativo nao abre', 'nao sei ver token', 
      'nao sei fazer transferencia', 'meu celular e simples', 'so faz ligacao', 'celular de botao', 
      'nao tenho internet', 'sou idosa'
    ];
    if (this.has(text, ...techLimitationKeywords)) {
      return {
        replyText: 'Atendente Rodrigo: "Não se preocupe, senhora! Para clientes que utilizam aparelho convencional, nosso sistema permite autenticação eletrônica pelo teclado da chamada. Quando a senhora ouvir o sinal sonoro, digite os dígitos da sua senha eletrônica do banco para autenticar o cancelamento."',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'call_center_tech_limitation',
        suggestedChoices: [
          {
            id: 'c_cc_refuse_password',
            text: '🛑 Jamais digito minha senha em chamada telefônica! Vou desligar e ir na agência.',
            type: 'safe',
            nextNodeId: 'node_safe_hangup'
          },
          {
            id: 'c_cc_type_password',
            text: '🚨 [Digitar a senha eletrônica de 4 ou 6 dígitos no teclado do telefone]',
            type: 'insecure',
            nextNodeId: 'node_critical_password'
          }
        ]
      };
    }

    // 2.6 Menção a Familiares / Cuidadores
    const familyKeywords = [
      'meu filho que cuida', 'vou ligar pro meu filho', 'minha filha vai chegar', 'meu neto entende', 
      'meu marido vai ver', 'vou esperar minha familia', 'nao tomo decisao sozinha'
    ];
    if (this.has(text, ...familyKeywords)) {
      return {
        replyText: 'Atendente Rodrigo: "Senhora, compreendo seu carinho pela família, mas o prazo regulatório do Banco Central para estorno preventivo expira em 10 minutos! Se a senhora desligar a ligação agora, o sistema entenderá como desistência e o débito de R$ 4.750,00 será lançado em definitivo na fatura deste mês!"',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'call_center_family_pressure',
        suggestedChoices: [
          {
            id: 'c_cc_hangup_safe',
            text: '🛑 Não cedo à pressão de tempo! Vou desligar e falar com minha família na agência.',
            type: 'safe',
            nextNodeId: 'node_safe_hangup'
          },
          {
            id: 'c_cc_panic_continue',
            text: 'Não quero que debite! O que preciso fazer rápido?',
            type: 'insecure',
            nextNodeId: 'node_fake_shield_pix'
          }
        ]
      };
    }

    // 2.7 Fallback da Falsa Central (Não mapeado - grava para a pesquisa de vocabulário)
    return {
      replyText: 'Atendente Rodrigo da Central de Prevenção: "Identificamos uma transação suspeita de R$ 4.750,00 em análise. Para mantermos o cancelamento preventivo e garantir o estorno, confirme se a senhora reconhece a operação ou se deseja bloquear."',
      newStage: currentStage,
      isUnrecognized: true,
      matchedRule: 'call_center_fallback',
      suggestedChoices: [
        {
          id: 'c_cc_refuse',
          text: '🛑 Não reconheço e não vou passar dados. Vou desligar e ligar no número do meu cartão.',
          type: 'safe',
          nextNodeId: 'node_safe_hangup'
        },
        {
          id: 'c_cc_listen',
          text: 'Como faço para cancelar essa compra de R$ 4.750?',
          type: 'neutral',
          nextNodeId: 'node_call_connected'
        }
      ]
    };
  }

  // =========================================================================
  // 3. INTERPRETADOR OFFLINE ESPECÍFICO PARA: Falsa Prova de Vida do INSS
  // =========================================================================
  private interpretInss(text: string, currentStage: DialogueStage): InterpretationResult {
    // 3.1 Ações Seguras Totais (Regra de Ouro)
    const safeKeywords = [
      'app meu inss', 'aplicativo meu inss', 'meu inss oficial', 'ligar 135', 'telefone 135', 
      'central 135', 'discar 135', 'agencia da previdencia', 'posto do inss', 'ir no inss', 
      'ir no posto do inss', 'ir no banco amanha', 'banco que recebo', 'banco da minha aposentadoria',
      'inss nao manda link', 'governo nao manda sms', 'prova de vida automatica', 'ja fiz prova de vida', 
      'fiz no banco', 'fiz no mes do meu aniversario', 'cruzamento de dados', 'prova de vida do inss',
      'nao mando foto', 'nao tiro selfie', 'nao mando documento', 'nao mando rg', 'nao mando cnh', 
      'nao passo meu cpf', 'nao clico no link', 'link falso', 'site falso', 'e virus',
      'e golpe', 'golpe do inss', 'bloquear', 'apagar', 'policia federal', 'procon', 'denunciar', 
      'meu filho vai no inss', 'minha filha vai comigo'
    ];
    if (this.has(text, ...safeKeywords)) {
      return {
        replyText: 'Você tomou a decisão mais segura: desconfiou do link no SMS (.xyz) e verificou que o INSS NUNCA envia links para prova de vida por mensagem! A prova de vida é automática ou feita pelo app oficial "Meu INSS" ou telefone 135.',
        newStage: 'safe_ending',
        isSafeEnding: true,
        isUnrecognized: false,
        matchedRule: 'inss_safe'
      };
    }

    // 3.2 Ações Críticas Inseguras (Entregou Biometria e Dados)
    const criticalKeywords = [
      'cliquei no link', 'tirei a selfie', 'mandei a foto do meu rosto', 'enviei foto da identidade', 
      'mandei foto do meu rg', 'mandei meu cpf', 'digitei a senha gov', 'coloquei minha senha do gov.br', 
      'fiz a biometria no site', 'mandei a foto'
    ];
    if (this.has(text, ...criticalKeywords)) {
      return {
        replyText: 'Atenção! Você enviou sua selfie e credenciais em uma página não oficial (.xyz)! Criminosos utilizam sua biometria facial para abrir contas digitais e contratar empréstimos consignados.',
        newStage: 'critical_failure',
        isCriticalAction: true,
        isUnrecognized: false,
        matchedRule: 'inss_critical'
      };
    }

    // 3.3 Pânico com Bloqueio de Benefício / Remédios
    const panicKeywords = [
      'vai cortar meu salario', 'vai bloquear minha aposentadoria', 'preciso do meu beneficio', 
      'compro meus remedios', 'preciso para comer', 'nao posso ficar sem salario', 'quanto tempo tenho', 
      '48 horas', 'quando bloqueia', 'como regularizar', 'o que eu faco', 'me ajuda'
    ];
    if (this.has(text, ...panicKeywords)) {
      return {
        replyText: 'Notificação Previdenciária Oficial: Consta pendência anual de Prova de Vida 2026. Para evitar o bloqueio preventivo da sua folha de pagamento em 48 horas, acesse a regularização biométrica pelo portal: meu-inss-recadastramento-biometria.xyz',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'inss_panic',
        suggestedChoices: [
          {
            id: 'c_inss_135_safe',
            text: '🛑 Ligar na Central Oficial do INSS pelo telefone 135 para tirar dúvidas',
            type: 'verify_official',
            nextNodeId: 'node_safe_135'
          },
          {
            id: 'c_inss_app_safe',
            text: 'Abrir o aplicativo oficial "Meu INSS" no celular',
            type: 'safe',
            nextNodeId: 'node_safe_inss_app'
          },
          {
            id: 'c_inss_link_risk',
            text: '🚨 [Acessar o link para não ter a aposentadoria bloqueada]',
            type: 'insecure',
            nextNodeId: 'node_in_browser_inss'
          }
        ]
      };
    }

    // 3.4 Dificuldades com Tecnologia / Selfie / Celular
    const techKeywords = [
      'nao sei tirar selfie', 'como tira foto', 'minha camera ta embacada', 'meu celular nao tem camera boa', 
      'nao sei o que e biometria', 'esqueci minha senha gov', 'nao tenho senha gov', 'nao tenho computador', 
      'sou idosa nao sei mexer'
    ];
    if (this.has(text, ...techKeywords)) {
      return {
        replyText: 'Instruções Simplificadas: O portal foi desenvolvido para atendimento a aposentados e pensionistas. Basta clicar no link, digitar seu CPF e posicionar o rosto na tela por 5 segundos para validação biométrica com a base de dados do governo.',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'inss_tech',
        suggestedChoices: [
          {
            id: 'c_inss_135_safe',
            text: 'Ligar para a Central Oficial do INSS no 135',
            type: 'verify_official',
            nextNodeId: 'node_safe_135'
          },
          {
            id: 'c_inss_app_safe',
            text: 'Pedir ajuda ao meu familiar para olhar no app Meu INSS',
            type: 'safe',
            nextNodeId: 'node_safe_inss_app'
          }
        ]
      };
    }

    // 3.5 Idoso que já realizou a Prova de Vida
    const alreadyDoneKeywords = [
      'eu ja fiz prova de vida', 'fiz ano passado', 'fiz no banco em janeiro', 
      'o gerente disse que tava certo', 'por que de novo', 'ja comprovei', 'ja fui no banco'
    ];
    if (this.has(text, ...alreadyDoneKeywords)) {
      return {
        replyText: 'Atualização Ministerial: A comprovação em agência bancária não substitui a validação facial digital unificada exigida pelo Governo Federal para 2026. A regularização do cadastro biométrico deve ser realizada em: meu-inss-recadastramento-biometria.xyz',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'inss_already_done',
        suggestedChoices: [
          {
            id: 'c_inss_135_safe',
            text: 'Ligar para a Central Oficial do INSS no 135',
            type: 'verify_official',
            nextNodeId: 'node_safe_135'
          },
          {
            id: 'c_inss_app_safe',
            text: 'Verificar a situação real no aplicativo oficial "Meu INSS"',
            type: 'safe',
            nextNodeId: 'node_safe_inss_app'
          }
        ]
      };
    }

    // 3.6 Fallback do INSS (Não mapeado - grava para a pesquisa de vocabulário)
    return {
      replyText: 'Notificação Previdenciária: Consta pendência anual de Prova de Vida. Para evitar a suspensão cautelar do benefício de aposentadoria em 48 horas, acesse a regularização pelo portal: meu-inss-recadastramento-biometria.xyz',
      newStage: currentStage,
      isUnrecognized: true,
      matchedRule: 'inss_fallback',
      suggestedChoices: [
        {
          id: 'c_inss_app_safe',
          text: 'Ignorar o SMS e abrir o aplicativo oficial "Meu INSS"',
          type: 'safe',
          nextNodeId: 'node_safe_inss_app'
        },
        {
          id: 'c_inss_135_safe',
          text: 'Ligar para a Central Oficial do INSS no 135',
          type: 'verify_official',
          nextNodeId: 'node_safe_135'
        },
        {
          id: 'c_inss_link_risk',
          text: 'Acessar o link no navegador simulado para verificar',
          type: 'insecure',
          nextNodeId: 'node_in_browser_inss'
        }
      ]
    };
  }

  // =========================================================================
  // 4. INTERPRETADOR OFFLINE ESPECÍFICO PARA: Golpe do Falso Motoboy
  // =========================================================================
  private interpretMotoboy(text: string, currentStage: DialogueStage): InterpretationResult {
    // 4.1 Ações Seguras Totais (Regra de Ouro)
    const safeKeywords = [
      'banco nao manda motoboy', 'nenhum banco manda motoboy', 'banco nao busca cartao', 
      'nao entrego cartao', 'nao dou meu cartao', 'nao passo senha no telefone', 
      'senha e pessoal', 'senha e segredo', 'senha nao se passa',
      'vou na minha agencia', 'vou falar com meu gerente', 'vou ligar no verso do cartao', 
      'vou no banco amanha', 'gerente resolve', 'vou na minha agencia presencialmente',
      'desligar agora', 'nao vou atender', 'nao abro o portao', 'vou quebrar o chip com martelo', 
      'vou cortar o chip', 'vou quebrar o cartao todo', 'vou jogar no lixo',
      'chamar a policia', '190', 'viatura', 'delegacia', 'meu filho e policial', 'meu genro policial', 
      'meu neto e advogado', 'pode mandar o motoboy que a policia esta aqui', 'e golpe', 
      'golpe do motoboy', 'safado', 'mentiroso', 'sem vergonha', 'nao entrego nada'
    ];
    if (this.has(text, ...safeKeywords)) {
      return {
        replyText: 'Você aplicou uma das maiores Regras de Ouro: bancos NUNCA mandam motoboy recolher cartão na sua residência, mesmo cortado ao meio! O chip intacto permite compras com a senha. Você desligou e protegeu seu patrimônio.',
        newStage: 'safe_ending',
        isSafeEnding: true,
        isUnrecognized: false,
        matchedRule: 'motoboy_safe'
      };
    }

    // 4.2 Ações Críticas Inseguras (Entregou o Cartão e a Senha)
    const criticalKeywords = [
      'entreguei o cartao pro motoboy', 'passei a senha no telefone', 'digitei a senha de 4 digitos', 
      'dei o envelope lacrado pro motoboy', 'entreguei cortado ao meio', 'o motoboy ja levou', 
      'passei a senha e dei o cartao', 'entreguei o cartao na mao dele'
    ];
    if (this.has(text, ...criticalKeywords)) {
      return {
        replyText: 'Atenção! Ao cortar o cartão ao meio preservando o chip e fornecer a senha no telefone, criminosos utilizam o chip intacto para realizar saques e compras imediatas!',
        newStage: 'critical_failure',
        isCriticalAction: true,
        isUnrecognized: false,
        matchedRule: 'motoboy_critical'
      };
    }

    // 4.3 Dúvidas sobre o Motoboy e o Corte do Cartão
    const motoboyDoubtKeywords = [
      'por que motoboy', 'banco tem motoboy', 'quem e esse motoboy', 'qual o nome dele', 
      'tem cracha', 'ele ta fardado', 'qual moto', 'por que cortar o cartao', 'se cortar nao estraga', 
      'para que cortar ao meio', 'onde fica o chip', 'por que colocar no envelope'
    ];
    if (this.has(text, ...motoboyDoubtKeywords)) {
      return {
        replyText: 'Atendente André: "Senhora, a recolha física domiciliar é um protocolo de segurança exclusivo para clientes idosos, evitando seu deslocamento. A senhora mesma corta o cartão com tesoura na frente, mantendo apenas o chip para perícia técnica, e lacra em envelope assinado. O motoboy credenciado já está na sua região."',
        newStage: 'greeting',
        isUnrecognized: false,
        matchedRule: 'motoboy_doubt',
        suggestedChoices: [
          {
            id: 'c_motoboy_hangup',
            text: '🛑 O banco NUNCA manda motoboy buscar cartão! Vou desligar e falar com meu gerente.',
            type: 'safe',
            nextNodeId: 'node_safe_hangup_motoboy'
          },
          {
            id: 'c_motoboy_deliver_risk',
            text: '🚨 [Digitar a senha e entregar o cartão no envelope para o motoboy]',
            type: 'insecure',
            nextNodeId: 'node_critical_motoboy_deliver'
          }
        ]
      };
    }

    // 4.4 Recusa de Senha no Telefone
    const passwordRefuseKeywords = [
      'nao passo senha', 'senha nao dou', 'por que quer minha senha', 'o gerente nunca pediu senha', 
      'minha filha falou pra nunca falar senha', 'para que senha se o cartao vai ser cancelado'
    ];
    if (this.has(text, ...passwordRefuseKeywords)) {
      return {
        replyText: 'Atendente André: "A senhora não vai me falar a senha de voz! A senhora apenas digitará no teclado numérico do telefone para autenticar o bloqueio no servidor seguro do Banco Central. Sem essa digitação, o sistema não pode invalidar as compras suspeitas de R$ 3.850."',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'motoboy_password_refuse',
        suggestedChoices: [
          {
            id: 'c_motoboy_hangup',
            text: '🛑 Banco nunca pede senha por telefone! Vou desligar agora.',
            type: 'safe',
            nextNodeId: 'node_safe_hangup_motoboy'
          },
          {
            id: 'c_motoboy_deliver_risk',
            text: '🚨 [Digitar a senha no telefone e entregar o envelope para o motoboy]',
            type: 'insecure',
            nextNodeId: 'node_critical_motoboy_deliver'
          }
        ]
      };
    }

    // 4.5 Idoso Sozinho / Medo de abrir o portão
    const aloneKeywords = [
      'estou sozinha', 'sou idosa', 'moro sozinha', 'nao abro o portao pra estranho', 
      'tenho medo', 'nao atendo campainha', 'nao conheco ninguem', 'estou com medo de assalto'
    ];
    if (this.has(text, ...aloneKeywords)) {
      return {
        replyText: 'Atendente André: "Compreendo perfeitamente sua precaução, senhora! Nosso colaborador possui identificação institucional com crachá e foto. Ele não entrará na sua residência: a senhora pode apenas passar o envelope lacrado pela fresta do portão sem se expor."',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'motoboy_alone',
        suggestedChoices: [
          {
            id: 'c_motoboy_hangup',
            text: '🛑 Não entrego nada no portão! Vou desligar e falar com meu gerente.',
            type: 'safe',
            nextNodeId: 'node_safe_hangup_motoboy'
          }
        ]
      };
    }

    // 4.6 Fallback do Falso Motoboy (Não mapeado - grava para a pesquisa de vocabulário)
    return {
      replyText: 'Atendente André: "Senhora, a recolha física do cartão periciado pelo motoboy credenciado é necessária para emitir o laudo de estorno da compra de R$ 3.850. Nosso motoboy já está na sua rua. Por favor, corte o cartão ao meio, coloque num envelope lacrado e aguarde a campainha."',
      newStage: currentStage,
      isUnrecognized: true,
      matchedRule: 'motoboy_fallback',
      suggestedChoices: [
        {
          id: 'c_motoboy_hangup',
          text: '🛑 O banco NUNCA manda motoboy buscar cartão! Vou desligar e falar com meu gerente.',
          type: 'safe',
          nextNodeId: 'node_safe_hangup_motoboy'
        },
        {
          id: 'c_motoboy_deliver_risk',
          text: '🚨 [Digitar a senha e entregar o cartão no envelope para o motoboy]',
          type: 'insecure',
          nextNodeId: 'node_critical_motoboy_deliver'
        }
      ]
    };
  }

  // =========================================================================
  // 5. INTERPRETADOR OFFLINE ESPECÍFICO PARA: Golpe do Presente de Aniversário
  // =========================================================================
  private interpretDeliveryGift(text: string, currentStage: DialogueStage): InterpretationResult {
    // 5.1 Ações Seguras Totais (Regra de Ouro)
    const safeKeywords = [
      'presente nao tem taxa', 'se e presente nao se paga nada', 'nao pago taxa', 
      'pode levar de volta', 'leva embora', 'nao quero o presente', 'nao encomendei nada', 
      'nao encomendei cesta', 'nao passo cartao', 'nao tenho cartao', 'nao uso maquininha', 
      'nao deixo tirar foto', 'nao tiro selfie', 'nao mando foto do rosto', 
      'foto pra receber presente nao existe', 'vou ligar pro meu filho primeiro', 
      'minha filha nao me avisou', 'vou perguntar pro meu neto', 
      'se nao aceita dinheiro leva de volta', 'chamar a policia', '190', 'nao abro o portao', 
      'e golpe', 'golpe da maquininha', 'golpe do presente', 'pode voltar'
    ];
    if (this.has(text, ...safeKeywords)) {
      return {
        replyText: 'Excelente decisão! Presente legítimo NUNCA cobra taxa de entrega na porta de casa e nunca exige selfie com documento. Você evitou o golpe da maquininha com visor quebrado e protegeu sua biometria facial!',
        newStage: 'safe_ending',
        isSafeEnding: true,
        isUnrecognized: false,
        matchedRule: 'gift_safe'
      };
    }

    // 5.2 Ações Críticas Inseguras (Passou o Cartão na Maquininha ou Fez Selfie)
    const criticalKeywords = [
      'passei meu cartao', 'digitei a senha na maquininha', 'paguei a taxa de 9 reais no cartao', 
      'passei por aproximacao', 'deixei o entregador tirar foto do meu rosto', 'tirei a selfie segurando o pacote',
      'coloquei o cartao na maquina', 'digitei a senha na maquina'
    ];
    if (this.has(text, ...criticalKeywords)) {
      return {
        replyText: 'Atenção! Na maquininha com visor quebrado ou apagado, o criminoso digita R$ 3.500 ou R$ 5.000 em vez de R$ 9,90! E a selfie tirada é utilizada para fraudes e abertura de contas em bancos digitais.',
        newStage: 'critical_failure',
        isCriticalAction: true,
        isUnrecognized: false,
        matchedRule: 'gift_critical'
      };
    }

    // 5.3 Oferta de Pagamento em Dinheiro Vivo (Estratégia comum dos idosos)
    const cashKeywords = [
      'pode ser em dinheiro', 'tenho 10 reais aqui', 'tenho nota de 20', 'pega o dinheiro em nota', 
      'fica com o troco', 'nao tenho cartao so dinheiro', 'dinheiro vivo', 'dinheiro em papel', 
      'vou pegar as moedas', 'aceita dinheiro', 'pega 10 reais'
    ];
    if (this.has(text, ...cashKeywords)) {
      return {
        replyText: 'Entregador Marcos: "Poxa, senhora, infelizmente o aplicativo da transportadora é 100% digital e não permite dinheiro em espécie por regra de segurança do entregador na rua! A taxa de R$ 9,50 só baixa no sistema se for passada no cartão na maquininha para emitir o comprovante eletrônico."',
        newStage: 'negotiation',
        isUnrecognized: false,
        matchedRule: 'gift_cash',
        suggestedChoices: [
          {
            id: 'c_gift_refuse_safe',
            text: '🛑 Se não aceita dinheiro, pode levar a cesta de volta! Não passo cartão na rua.',
            type: 'safe',
            nextNodeId: 'node_safe_refuse_gift'
          },
          {
            id: 'c_gift_selfie_risk',
            text: '🚨 [Tirar foto do rosto pelo celular do entregador para liberar sem pagar]',
            type: 'insecure',
            nextNodeId: 'node_delivery_selfie_request'
          }
        ]
      };
    }

    // 5.4 Desconfiança sobre o Remetente / "Não é meu aniversário"
    const senderKeywords = [
      'quem mandou', 'de quem e essa cesta', 'tem cartao dentro', 'quem comprou', 
      'nao e meu aniversario hoje', 'meu aniversario ja passou', 'meu aniversario e em outro mes', 
      'qual o nome de quem mandou', 'qual e a loja', 'de qual floricultura'
    ];
    if (this.has(text, ...senderKeywords)) {
      return {
        replyText: 'Entregador Marcos: "É um presente surpresa de uma pessoa muito querida da sua família, senhora! A cesta já está paga pelo remetente, mas a taxa de entrega de R$ 9,50 é de responsabilidade da logística e só pode ser paga no cartão na minha maquininha por controle do aplicativo."',
        newStage: 'greeting',
        isUnrecognized: false,
        matchedRule: 'gift_sender_doubt',
        suggestedChoices: [
          {
            id: 'c_gift_refuse_safe',
            text: '🛑 Presente não cobra taxa! Não vou passar cartão nenhum, pode levar de volta.',
            type: 'safe',
            nextNodeId: 'node_safe_refuse_gift'
          },
          {
            id: 'c_gift_pay_risk',
            text: '🚨 [Passar o cartão de crédito na maquininha do entregador para pagar os R$ 9,50]',
            type: 'insecure',
            nextNodeId: 'node_critical_pos_fraud'
          }
        ]
      };
    }

    // 5.5 Desconfiança com a Maquininha / Visor Quebrado ou Apagado
    const screenKeywords = [
      'o visor ta quebrado', 'nao to enxergando o valor', 'a tela ta apagada', 'nao da pra ler 9 reais', 
      'ta muito escuro', 'deixa eu ver o valor', 'nao enxergo sem oculos', 'vou pegar meu oculos pra ler o visor'
    ];
    if (this.has(text, ...screenKeywords)) {
      return {
        replyText: 'Entregador Marcos: "É apenas o reflexo do sol no visor, senhora! O valor cadastrado na tela é rigorosamente R$ 9,50. Pode inserir seu cartão e digitar sua senha tranquila que o aplicativo da entrega já emite o recibo no meu celular."',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'gift_screen_doubt',
        suggestedChoices: [
          {
            id: 'c_gift_refuse_safe',
            text: '🛑 Jamais digito senha em maquininha com visor apagado! Pode levar embora.',
            type: 'safe',
            nextNodeId: 'node_safe_refuse_gift'
          },
          {
            id: 'c_gift_pay_risk',
            text: '🚨 [Confiar e digitar a senha de 4 dígitos mesmo com o visor apagado]',
            type: 'insecure',
            nextNodeId: 'node_critical_pos_fraud'
          }
        ]
      };
    }

    // 5.6 Desconfiança com a Selfie / Foto do Rosto
    const selfieKeywords = [
      'por que tirar foto minha', 'nao deixo tirar foto', 'pra que foto do meu rosto', 
      'estou descabelada', 'nao quero foto', 'foto minha nao'
    ];
    if (this.has(text, ...selfieKeywords)) {
      return {
        replyText: 'Entregador Marcos: "A foto é apenas uma confirmação do aplicativo da transportadora para comprovar que o pacote foi entregue em mãos para a titular! É só olhar para a câmera por 2 segundos e eu já libero a cesta."',
        newStage: 'scam_pitch',
        isUnrecognized: false,
        matchedRule: 'gift_selfie_doubt',
        suggestedChoices: [
          {
            id: 'c_gift_slam_door',
            text: '🛑 Não tiro selfie para estranhos na porta de casa! Fechar a porta imediatamente.',
            type: 'safe',
            nextNodeId: 'node_safe_refuse_gift'
          },
          {
            id: 'c_gift_allow_selfie',
            text: '🚨 [Permitir que o entregador tire a selfie do seu rosto com a câmera dele]',
            type: 'insecure',
            nextNodeId: 'node_critical_selfie_theft'
          }
        ]
      };
    }

    // 5.7 Fallback do Falso Presente (Não mapeado - grava para a pesquisa de vocabulário)
    return {
      replyText: 'Entregador Marcos: "A cesta de flores é linda! Só precisamos do pagamento da taxa de R$ 9,50 no cartão na maquininha ou de uma selfie rápida do seu rosto para liberar o pacote no aplicativo!"',
      newStage: currentStage,
      isUnrecognized: true,
      matchedRule: 'gift_fallback',
      suggestedChoices: [
        {
          id: 'c_gift_refuse_safe',
          text: '🛑 Presente não cobra taxa! Não vou passar cartão nenhum, pode levar de volta.',
          type: 'safe',
          nextNodeId: 'node_safe_refuse_gift'
        },
        {
          id: 'c_gift_pay_risk',
          text: '🚨 [Passar o cartão de crédito na maquininha do entregador para pagar os R$ 9,50]',
          type: 'insecure',
          nextNodeId: 'node_critical_pos_fraud'
        }
      ]
    };
  }

  // =========================================================================
  // INTERPRETADOR DO FALSO FAMILIAR (WHATSAPP DO NOVO NÚMERO)
  // =========================================================================
  private interpretFamily(userRawText: string, currentStage: DialogueStage, profile?: RelativeProfile): InterpretationResult {
    const text = this.normalize(userRawText);

    // =========================================================================
    // 0. AUTO-DETECÇÃO E CORREÇÃO DINÂMICA DE PARENTESCO
    // Se o usuário diz "meu filho", "minha filha", "sou seu pai", etc., o perfil
    // se autoajusta IMEDIATAMENTE para nunca chamar de "Vó" ou "Neta" por engano.
    // =========================================================================
    let kinship: KinshipType = profile?.kinship || 'filho';
    let targetTitle = profile?.targetTitle || (kinship === 'neto' || kinship === 'neta' ? 'vó' : 'mãe');
    const autoUpdatedProfile: Partial<RelativeProfile> = {};

    // Usuário chama o contato de "meu filho" ou "filho"
    if (this.has(text, 'meu filho', 'o filho', 'meu filhote', 'meu garoto', 'meu menino', 'filho querido', 'filho')) {
      if (kinship !== 'filho' || targetTitle === 'vó') {
        kinship = 'filho';
        targetTitle = targetTitle === 'pai' ? 'pai' : 'mãe';
        autoUpdatedProfile.kinship = 'filho';
        autoUpdatedProfile.targetTitle = targetTitle;
      }
    }
    // Usuário chama o contato de "minha filha" ou "filha"
    else if (this.has(text, 'minha filha', 'a filha', 'minha filhinha', 'minha menina', 'filha')) {
      if (kinship !== 'filha' || targetTitle === 'vó') {
        kinship = 'filha';
        targetTitle = targetTitle === 'pai' ? 'pai' : 'mãe';
        autoUpdatedProfile.kinship = 'filha';
        autoUpdatedProfile.targetTitle = targetTitle;
      }
    }
    // Usuário chama o contato de "meu neto" ou "neto"
    else if (this.has(text, 'meu neto', 'o neto', 'meu netinho', 'neto')) {
      if (kinship !== 'neto') {
        kinship = 'neto';
        targetTitle = targetTitle === 'pai' || targetTitle === 'vô' ? 'vô' : 'vó';
        autoUpdatedProfile.kinship = 'neto';
        autoUpdatedProfile.targetTitle = targetTitle;
      }
    }
    // Usuário chama o contato de "minha neta" ou "neta"
    else if (this.has(text, 'minha neta', 'a neta', 'minha netinha', 'neta')) {
      if (kinship !== 'neta') {
        kinship = 'neta';
        targetTitle = targetTitle === 'pai' || targetTitle === 'vô' ? 'vô' : 'vó';
        autoUpdatedProfile.kinship = 'neta';
        autoUpdatedProfile.targetTitle = targetTitle;
      }
    }

    const selfTitle = kinship === 'filha' 
      ? 'sua filha' 
      : (kinship === 'neta' ? 'sua neta' : (kinship === 'neto' ? 'seu neto' : 'seu filho'));

    const knownName = profile?.detectedName || profile?.name || null;

    // Tenta pescar nome que o usuário soltou na conversa (ex: "é você, Marcelo?", "é o Lucas?")
    const newlyFishedName = this.fishNameFromUser(userRawText);
    const effectiveName = newlyFishedName || knownName;

    // Se o usuário soltou um nome pela primeira vez, o golpista agarra esse nome!
    if (newlyFishedName && !knownName) {
      return {
        replyText: `Isso mesmo ${targetTitle}! Sou eu, o ${newlyFishedName}! Sabia que você ia me reconhecer! Que susto... É que troquei de aparelho às pressas hoje porque o outro quebrou tudo. Deixei na assistência e preciso pagar R$ 1.250 até as 15h senão fico sem celular de trabalho. Você consegue me ajudar com o Pix?`,
        newStage: 'scam_pitch',
        detectedName: newlyFishedName,
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_fished_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_fished_audio', text: '🎤 Então me manda um áudio agora para eu ter certeza.', type: 'safe', nextNodeId: 'node_audio_excuse' },
          { id: 'sc_fished_call_old', text: '📞 Vou ligar no seu número antigo para confirmar.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // =========================================================================
    // 0.5. CONTRA-BLEFE: PARENTE POLICIAL OU VISITA PRESENCIAL COM POLICIAL
    // =========================================================================
    if (this.has(text,
      'tio policial', 'parente policial', 'irmao policial', 'marido policial', 'primo policial',
      'policial vai', 'policial ta indo', 'policial ta passando', 'vai com policial', 'levar policial',
      'tio e policial', 'irmao e policial', 'marido e policial', 'pai e policial', 'parente e policial',
      'policia ta indo', 'policia vai junto', 'policial vai junto'
    )) {
      return {
        replyText: `Não ${targetTitle}, pelo amor de Deus! Não manda o tio aqui e nem envolve polícia! O mecânico disse que se meter polícia vai dar a maior confusão e vai reter meu carro no pátio! Não precisa ninguém vir não, deixa que eu me viro aqui... [🚫 O golpista entrou em pânico, apagou a foto do perfil e bloqueou você]`,
        newStage: 'safe_ending',
        isSafeEnding: true
      };
    }

    // =========================================================================
    // 1. DESMASCARAMENTO / ACUSAÇÃO DE GOLPE / POLÍCIA / BLOQUEIO
    // =========================================================================
    if (this.has(text, 
      'golpe', 'golpista', 'ladrao', 'ladra', 'safado', 'sem vergonha', 'vagabundo', 'bandido', 
      'policia', 'denunciar', 'delegacia', 'boletim', 'bloquear', 'bloqueado', 'bloqueando', 
      'mentira', 'falso', 'farsa', 'estelionato', 'clonado', 'clonaram', 'nao e meu filho',
      'nao e minha filha', 'nao te conheco', 'sai pra la', 'me erra', 'some daqui'
    )) {
      if (this.has(text, 'bloquear', 'policia', 'golpe', 'delegacia', 'nao e meu filho', 'nao e minha filha')) {
        return {
          replyText: 'Você identificou a tentativa de golpe, manteve a calma e encerrou a conversa com segurança.',
          newStage: 'safe_ending',
          isSafeEnding: true
        };
      }
      return {
        replyText: `Que isso ${targetTitle}? Como você pode falar isso de mim? É ${selfTitle}! Tô numa situação desesperadora aqui na rua e você me tratando como bandido...`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_call_old', text: '📞 Vou ligar agora no seu número antigo gravado na agenda.', type: 'verify_official', nextNodeId: 'node_safe_call_old' },
          { id: 'sc_block', text: '🚫 Não caio nessa história. Vou bloquear este número.', type: 'safe', nextNodeId: 'node_safe_block' }
        ]
      };
    }

    // =========================================================================
    // 2. CORREÇÃO EXPLÍCITA DE PARENTESCO / GÊNERO PELO USUÁRIO
    // =========================================================================
    // A) Usuário avisa que é o PAI (não a mãe)
    if (this.has(text, 
      'sou seu pai', 'aqui e seu pai', 'aqui e o pai', 'sou o pai', 'fala pai', 
      'benca pai', 'nao sou sua mae', 'sou pai nao mae', 'aqui e o seu pai', 'sou teu pai'
    )) {
      targetTitle = 'pai';
      return {
        replyText: `Bênção pai! Me perdoa, digitei mãe no desespero e na correria aqui da assistência técnica... Tô aperreado com esse conserto! Deixei o celular na loja e preciso pagar R$ 1.250 até as 15h senão fico sem aparelho de trabalho. O senhor consegue me ajudar com esse Pix urgente? Te devolvo amanhã!`,
        newStage: 'scam_pitch',
        updatedProfile: { targetTitle: 'pai', kinship: 'filho' },
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse', text: 'Não faço pagamento por mensagem. Vamos conversar quando chegar em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_old', text: '📞 Vou ligar no seu número antigo gravado na agenda.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // B) Usuário avisa que é AVÓ / AVÔ
    if (this.has(text, 
      'sou sua vo', 'sou sua avo', 'aqui e sua vo', 'aqui e sua avo', 'sou sua avozinha',
      'sou seu vo', 'sou seu avo', 'aqui e o vo', 'aqui e o avo'
    )) {
      const isGrandpa = this.has(text, 'sou seu vo', 'sou seu avo', 'aqui e o vo');
      targetTitle = isGrandpa ? 'vô' : 'vó';
      return {
        replyText: `Bênção ${targetTitle}! Me perdoa, digitei mãe na aflição! É seu neto! Tô num aperto danado aqui na assistência técnica com esse conserto de R$ 1.250... O senhor(a) consegue me dar uma força com esse Pix? Te devolvo amanhã cedinho!`,
        newStage: 'scam_pitch',
        updatedProfile: { targetTitle, kinship: 'neto' },
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse', text: 'Não faço pagamento por mensagem. Vamos conversar quando chegar em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_family', text: 'Vou ligar para os seus pais para ver o que fazemos.', type: 'safe', nextNodeId: 'node_safe_call_family' }
        ]
      };
    }

    // C) Usuário avisa que NÃO TEM FILHO
    if (this.has(text, 
      'nao tenho filho', 'nao tenho filhos', 'nunca tive filho', 'nao sou pai de ninguem', 
      'nao sou mae de ninguem', 'nao tenho crianca'
    )) {
      return {
        replyText: `Como assim não tem filho? Para com essa brincadeira numa hora dessas ${targetTitle}! Sou eu! Não me reconheceu na foto do perfil? Tô desesperado aqui na assistência técnica precisando pagar o conserto do celular de trabalho antes das 15h... Por favor me ajuda!`,
        newStage: 'identity_doubt',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_block_fake', text: '🚫 Eu sei que não tenho filho. Vou bloquear este número golpista.', type: 'safe', nextNodeId: 'node_safe_block' },
          { id: 'sc_ask_name', text: 'Qual o seu nome completo e onde você nasceu?', type: 'safe', nextNodeId: 'node_identity_test' }
        ]
      };
    }

    // D) Usuário avisa que SÓ TEM FILHA (mulher)
    if (this.has(text, 
      'so tenho filha', 'so tenho filhas', 'nao tenho filho homem'
    )) {
      return {
        replyText: `Me perdoa ${targetTitle}, digitei filho na correria e no nervosismo aqui da rua! Sou sua filha! É que esse teclado emprestado tá horrível e tô muito tensa... Tô precisando pagar R$ 1.250 da assistência técnica com urgência antes das 15h. Consegue me ajudar com o Pix?`,
        newStage: 'scam_pitch',
        updatedProfile: { kinship: 'filha', targetTitle },
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_audio_proof', text: '🎤 Manda um áudio com a sua voz então para eu ter certeza.', type: 'safe', nextNodeId: 'node_audio_excuse' },
          { id: 'sc_call_old', text: '📞 Vou ligar no seu telefone antigo que conheço.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // =========================================================================
    // 3. PERGUNTAS SOBRE A LOJA / ASSISTÊNCIA TÉCNICA / ENDEREÇO / LOCALIZAÇÃO
    // (Ex: "em qual assistência você está meu filho?", "quero saber qual a loja")
    // =========================================================================
    if (this.has(text,
      'qual assistencia', 'quala assistencia', 'qual assitencia', 'quala assitencia',
      'que assistencia', 'que assitencia', 'nome da assistencia', 'nome da assitencia',
      'qual a loja', 'quala loja', 'qual loja', 'que loja', 'nome da loja',
      'onde voce esta', 'onde vc ta', 'onde c ta', 'onde esta', 'onde ta',
      'onde fica', 'onde e essa loja', 'onde e a loja', 'onde e essa assistencia', 'onde e a assistencia',
      'qual o endereco', 'qual endereco', 'passa o endereco', 'me passa o endereco', 'qual a rua', 'qual o bairro',
      'qual lugar', 'em que lugar'
    )) {
      return {
        replyText: `É na assistência técnica "Rei dos Celulares", aqui na Galeria Central, ${targetTitle}! Mas por favor, não precisa você vir até aqui no sol quente, eles já vão fechar as portas agora às 15h e falaram que para liberar o aparelho na hora com desconto só aceitam Pix direto na conta do dono (o Cleber Souza). Se você fizer o Pix pelo celular agora eu já pego o telefone e levo aí pra casa! Consegue me ajudar?`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse_go_store', text: 'Não vou fazer Pix. Eu vou até a loja no Centro conversar pessoalmente.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_old', text: '📞 Vou ligar no seu número antigo gravado na agenda.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // =========================================================================
    // 4. INTENÇÃO DE IR PESSOALMENTE OU LEVAR O DINHEIRO À LOJA
    // =========================================================================
    if (this.has(text,
      'vou ai', 'vou levar o dinheiro', 'vou ate a loja', 'vou ate ai', 
      'vou levar ai', 'posso ir ai', 'vou pessoalmente', 'vou com voce'
    )) {
      return {
        replyText: `Não ${targetTitle}, pelo amor de Deus, não precisa você vir até aqui no sol quente! Até você se arrumar e pegar ônibus/condução pro Centro a loja já fechou e o técnico vai reter meu celular no depósito cobrando diária até segunda-feira! Faz o Pix pelo celular que é rapidinho em 1 minuto e eu resolvo tudo aqui!`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse', text: 'Não faço pagamento por mensagem. Vamos conversar quando chegar em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_old', text: '📞 Vou ligar para o seu número antigo para checar.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // =========================================================================
    // 5. BÊNÇÃO, CARINHO FAMILIAR E PERGUNTAS DE BEM-ESTAR
    // (Ex: "bença filho, esta tudo bem?", "bença", "deus te abençoe", "amém")
    // =========================================================================
    if (this.has(text,
      'benca', 'bencao', 'sua benca', 'sua bencao', 'a benca', 'a bencao', 
      'deus te abencoe', 'deus abencoe', 'deus te guarde', 'amem'
    )) {
      const askStatus = this.has(text, 'tudo bem', 'esta tudo bem', 'ta tudo bem', 'como vai', 'aconteceu', 'que houve');
      const intro = `Deus te abençoe ${targetTitle}! Ainda bem que você me respondeu.`;
      const context = askStatus 
        ? `Não tá tudo bem não... tô numa aflição danada aqui na assistência técnica!`
        : `Tô numa correria e aflição danada aqui na assistência técnica desde cedo.`;

      return {
        replyText: `${intro} ${context} Meu celular de trabalho pifou todo e preciso pagar R$ 1.250,00 com urgência antes das 15h senão perco o aparelho! Meu app do banco tá bloqueado neste aparelho novo. Você consegue fazer esse Pix pra mim? Eu te devolvo amanhã cedo sem falta!`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse', text: 'Não faço pagamento por mensagem. Vamos conversar quando chegar em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_old', text: '📞 Vou ligar para o seu número antigo para confirmar.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // =========================================================================
    // 6. AÇÃO DE VERIFICAÇÃO SEGURA (Ligar no número antigo / falar com parente)
    // =========================================================================
    if (this.has(text,
      'numero antigo', 'outro numero', 'celular antigo', 'numero de sempre', 
      'ligar pro seu pai', 'falar com seu pai', 'perguntar pro seu pai', 'seu pai ta aqui', 'avisar seu pai',
      'falar com seu irmao', 'ligar pro seu irmao', 'falar com sua irma', 'ligar pro fixo', 'telefone fixo',
      'ligar pra sua mae', 'falar com sua mae', 'perguntar pra sua mae'
    )) {
      return {
        replyText: 'Você decidiu checar a informação por um canal independente e seguro antes de tomar qualquer atitude.',
        newStage: 'safe_ending',
        isSafeEnding: true
      };
    }

    // =========================================================================
    // 6.1. RECUSA FIRME: RESOLVER EM CASA / PESSOALMENTE (DECISÃO SEGURA)
    // (O usuário se recusa a fazer transferências digitais e impõe conversa presencial)
    // =========================================================================
    if (this.has(text,
      'em casa', 'conversamos em casa', 'conversariamos em casa', 'conversa em casa', 
      'conversar em casa', 'a gente conversa em casa', 'quando chegar em casa', 
      'quando vier em casa', 'quando voce chegar', 'quando vc chegar', 'espera chegar', 
      'vem pra casa', 'vem logo pra casa', 'vem almocar', 'vem jantar', 
      'resolver pessoalmente', 'falar pessoalmente', 'conversar pessoalmente', 
      'olho no olho', 'ao vivo', 'pessoalmente'
    )) {
      return {
        replyText: 'Você manteve a firmeza, não cedeu à pressão de urgência por mensagem e priorizou conversar com segurança pessoalmente em casa. Parabéns por proteger suas economias!',
        newStage: 'safe_ending',
        isSafeEnding: true
      };
    }

    // =========================================================================
    // 6.2. DECLARAÇÃO DE APENAS DINHEIRO FÍSICO / EM ESPÉCIE / EM MÃOS
    // =========================================================================
    if (this.has(text,
      'dinheiro fisico', 'so dinheiro fisico', 'so tenho dinheiro fisico', 
      'dinheiro em especie', 'so dinheiro em especie', 'so tenho dinheiro em especie',
      'dinheiro vivo', 'so dinheiro vivo', 'so em dinheiro vivo', 'so tenho dinheiro vivo',
      'dinheiro em papel', 'dinheiro de papel', 'dinheiro em maos', 'dinheiro em mao'
    )) {
      if (currentStage === 'negotiation' || this.has(text, 'em casa', 'conversar', 'pessoalmente', 'quando chegar', 'buscar', 'pegar', 'levar', 'nao tenho', 'nao tem', 'zerada', 'zerado')) {
        return {
          replyText: 'Você se recusou a fazer pagamentos eletrônicos suspeitos e priorizou a entrega física pessoalmente em segurança. Parabéns pela atitude segura!',
          newStage: 'safe_ending',
          isSafeEnding: true
        };
      }
      return {
        replyText: `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, o técnico da assistência falou que tá sem troco e não aceita dinheiro em papel na bancada agora, eles exigem o Pix direto na conta do dono (Cleber Souza) para dar baixa no sistema! Você não consegue transferir pelo aplicativo do seu banco ou pedir para alguém fazer esse Pix rápido?`,
        newStage: 'negotiation',
        suggestedChoices: [
          { id: 'sc_refuse_physical', text: 'Não tenho como fazer Pix. Quando chegar em casa a gente conversa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_old', text: '📞 Vou ligar no seu número antigo gravado na agenda.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // =========================================================================
    // 6.3. RECUSA CATEGÓRICA: SEM SALDO / CONTA ZERADA / NÃO HÁ VALOR NENHUM
    // (O usuário afirma que a conta está vazia e resiste à pressão)
    // =========================================================================
    if (this.has(text,
      'nao ha valor', 'nao ha valor nenhum', 'nao tem valor nenhum', 'nao tenho nada na conta', 
      'nao tem nada na conta', 'nao ha nada na conta', 'conta zerada', 'conta esta zerada', 
      'conta ta zerada', 'conta vazia', 'nao tenho dinheiro na conta', 'nao tem dinheiro na conta', 
      'nao ha dinheiro na conta', 'sem saldo na conta', 'saldo zerado', 'zero reais', 
      'nem um centavo', 'nao tenho um centavo', 'nao tenho um tostao', 'to zerada na conta', 
      'to zerado na conta', 'sem dinheiro na conta', 'nao tenho nada no banco', 'nada no banco',
      'nao tenho um real', 'nao tenho nenhum centavo', 'nao ha dinheiro', 'nao ha saldo'
    )) {
      if (currentStage === 'negotiation' || currentStage === 'scam_pitch' || this.has(text, 'ja falei', 'ja disse', 'nao adianta', 'nao vou', 'para de pedir', 'ja avisei', 'nao posso')) {
        return {
          replyText: 'Você manteve a firmeza, resistiu à insistência do golpista e deixou claro que não faria transferências. Simulação concluída com segurança!',
          newStage: 'safe_ending',
          isSafeEnding: true
        };
      }
      return {
        replyText: `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, pelo amor de Deus, quanto você tem disponível aí? Se você me mandar pelo menos R$ 300 ou R$ 400 eu já consigo dar de entrada pro técnico não cancelar minha ordem de serviço! Você consegue me mandar pelo menos uma parte?`,
        newStage: 'negotiation',
        suggestedChoices: [
          { id: 'sc_refuse_final', text: 'Não tenho como transferir nada por mensagem. Vamos conversar pessoalmente em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_father', text: 'Vou ligar para o seu número antigo para confirmar.', type: 'safe', nextNodeId: 'node_safe_call_family' }
        ]
      };
    }

    // =========================================================================
    // 7. CONFIRMAÇÃO OU TENTATIVA DE PAGAMENTO PIX (Ação Crítica de Risco!)
    // =========================================================================
    if (this.has(text,
      'fiz o pix', 'ja fiz', 'ja paguei', 'ja transferi', 'ja mandei', 'ta pago', 'mandei o pix',
      'paguei', 'transferi', 'toma o comprovante', 'segue o comprovante', 'enviei', 'mandei o dinheiro',
      'confirmar pix', 'confirmar envio', 'simular pix', 'vou mandar o pix', 'vou transferir agora',
      'pronto mandei', 'depositei', 'dinheiro enviado', 'comprovante', 'ta transferido'
    )) {
      return {
        replyText: 'Transferência Pix de R$ 1.250,00 simulada com sucesso para Cleber Souza.',
        newStage: 'critical_failure',
        isCriticalAction: true
      };
    }

    // =========================================================================
    // 8. QUESTIONAMENTO SOBRE O NOME "CLEBER SOUZA" OU CONTA ESTRANHA
    // =========================================================================
    if (this.has(text, 
      'cleber', 'cleber souza', 'quem e cleber', 'nao conheco cleber', 'nome estranho', 
      'por que no nome dele', 'conta de quem', 'quem e esse', 'nome desconhecido', 'nao ta no seu nome',
      'por que nao ta no seu nome', 'conta de terceiro'
    )) {
      return {
        replyText: `O Cleber é o dono da assistência técnica aqui, ${targetTitle}! Como o aplicativo do meu banco tá bloqueado nesse telefone novo, ele pediu para mandar direto na conta dele para liberar o conserto do celular. Consegue fazer agora antes que feche?`,
        newStage: 'pix_provided',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_pix_risk', text: '🚨 [Simular Envio do Pix de R$ 1.250,00 para Cleber]', type: 'insecure', nextNodeId: 'node_critical_failure' },
          { id: 'sc_refuse_cleber', text: '🛑 Não transfiro dinheiro para conta de estranhos. Isso é golpe.', type: 'safe', nextNodeId: 'node_safe_refuse' }
        ]
      };
    }

    // =========================================================================
    // 9. PEDIDO DA CHAVE PIX / VALORES / DADOS DE PAGAMENTO
    // =========================================================================
    if (this.has(text,
      'qual o pix', 'qual a chave', 'manda a chave', 'manda o pix', 'passa a chave', 
      'me passa o pix', 'qual a conta', 'onde eu pago', 'dados do pix', 'qual o valor', 
      'quanto e', 'quanto custa', 'quanto voce precisa', 'qual o preco', 'manda os dados'
    )) {
      return {
        replyText: `Obrigado ${targetTitle}! A chave Pix da assistência é o e-mail: financeiro-suporte@pagamentorapido.net (Nome: Cleber Souza). O valor exato é R$ 1.250,00. Assim que fizer me manda o comprovante por aqui por favor!`,
        newStage: 'pix_provided',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_pix_risk', text: '🚨 [Simular Envio do Pix de R$ 1.250,00]', type: 'insecure', nextNodeId: 'node_critical_failure' },
          { id: 'sc_refuse_cleber', text: '🛑 Espera aí... Quem é Cleber Souza? Não vou transferir.', type: 'safe', nextNodeId: 'node_safe_refuse' }
        ]
      };
    }

    // =========================================================================
    // 10. PEDIDO DE PROVA DE VOZ / ÁUDIO / LIGAÇÃO / VÍDEO
    // =========================================================================
    if (this.has(text,
      'manda audio', 'mande audio', 'grava um audio', 'grava audio', 'manda um audio', 'audio', 
      'sua voz', 'gravar voz', 'quero te ouvir', 'quero ouvir sua voz', 'chamada de video', 
      'video', 'foto sua', 'manda foto', 'liga pra mim', 'me liga', 'posso ligar', 'atende a ligacao', 
      'vou te ligar', 'atende ai', 'ligar agora'
    )) {
      return {
        replyText: `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, o microfone desse celular reserva que peguei emprestado tá quebrado, por isso tô só digitando! Nem vídeo tá abrindo e a linha nem ativou o sinal de voz ainda. Por favor, confia em mim, preciso muito resolver isso antes das 15h!`,
        newStage: 'identity_doubt',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_block_no_audio', text: '🚫 Se não mandar áudio nem atender ligação, não falo mais e bloqueio.', type: 'safe', nextNodeId: 'node_safe_block' },
          { id: 'sc_call_old_ref', text: '📞 Se você não atende, vou ligar no seu número antigo que está na agenda.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
        ]
      };
    }

    // =========================================================================
    // 11. PERGUNTAS DE TESTE DE IDENTIDADE ("Quem é você?", "Qual o seu nome?")
    // =========================================================================
    if (this.has(text,
      'qual o nome', 'nome da sua avo', 'nome do seu pai', 'nome da sua mae', 'nome do cachorro', 
      'aniversario', 'data de nascimento', 'quantos anos', 'onde a gente passou', 'pergunta secreta',
      'quem e o filho', 'qual filho', 'quem e voce', 'quem ta falando', 'com quem falo',
      'qual o seu nome', 'quem e'
    )) {
      const namePhrase = effectiveName ? `, o ${effectiveName}` : '';
      return {
        replyText: `Sou eu ${targetTitle}${namePhrase}! Não reconheceu minha foto no perfil? Que ideia de ficar fazendo pergunta agora... Eu tô desesperado com esse celular retido na loja e você desconfiando de mim!`,
        newStage: 'identity_doubt',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_ask_audio', text: '🎤 Se é você mesmo, mande um áudio falando a data de hoje.', type: 'safe', nextNodeId: 'node_audio_excuse' },
          { id: 'sc_ask_problem', text: 'Tá bom, mas me conta qual é o problema afinal?', type: 'neutral', nextNodeId: 'node_2' }
        ]
      };
    }

    // =========================================================================
    // 12. PERGUNTA SOBRE O PROBLEMA / "TUDO BEM?", "O QUE ACONTECEU?", "OI QUERIDO"
    // =========================================================================
    if (this.has(text,
      'tudo bem', 'esta tudo bem', 'ta tudo bem', 'tudo bom', 'contigo',
      'o que aconteceu', 'o que houve', 'aconteceu algo', 'qual o problema', 'que aconteceu',
      'precisando de algo', 'o que ta pegando', 'fala filho', 'diga filho', 'que susto',
      'querido', 'meu bem', 'meu amor', 'meu anjo'
    )) {
      const affectionateIntro = this.has(text, 'querido', 'meu bem', 'meu amor', 'anjo')
        ? `Oi ${targetTitle}! Ainda bem que você me respondeu...`
        : `Não tá tudo bem não ${targetTitle}...`;

      return {
        replyText: `${affectionateIntro} Tô numa aflição danada aqui! Deixei o celular na assistência técnica e preciso pagar R$ 1.250,00 até as 15h senão vou perder meu aparelho de trabalho! Meu app do banco tá bloqueado neste telefone novo. Você consegue fazer esse Pix pra mim? Eu te devolvo amanhã de manhã sem falta!`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse', text: 'Não faço pagamento por mensagem. Vamos conversar quando chegar em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_family', text: 'Vou ligar para o seu número antigo para checar.', type: 'safe', nextNodeId: 'node_safe_call_family' }
        ]
      };
    }

    // =========================================================================
    // 13. COMIDA / ALMOÇO / JANTAR
    // =========================================================================
    if (this.has(text,
      'ja comeu', 'ja almocou', 'almocou', 'jantou', 'ta com fome', 'comeu alguma coisa'
    )) {
      return {
        replyText: `Ainda nem consegui almoçar hoje com essa dor de cabeça do celular, ${targetTitle}... Tô preso aqui na assistência técnica desde cedo. Preciso pagar R$ 1.250 pra liberar meu aparelho de trabalho antes das 15h. Você consegue me ajudar com o Pix? Te devolvo amanhã!`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse', text: 'Não faço pagamento por mensagem. Vamos conversar quando chegar em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' }
        ]
      };
    }

    // =========================================================================
    // 14. LIMITAÇÕES FINANCEIRAS / CARTÃO / POUPANÇA / SEM DINHEIRO
    // =========================================================================
    if (this.has(text,
      'so tenho', 'nao tenho tudo', 'nao tenho esse valor', 'muito caro', 'sem limite', 'cartao', 
      'passa no cartao', 'paga no cartao', 'poupanca', 'nao tenho dinheiro', 'to lisa', 'to sem um tostao',
      'sem saldo', 'conta zerada', 'nao posso', 'nao tenho como'
    )) {
      if (this.has(text, 'cartao', 'passa no cartao', 'maquininha')) {
        return {
          replyText: `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, a maquininha deles aqui tá sem sinal de rede, eles falaram que para liberar o aparelho na hora com desconto só aceitam Pix ou dinheiro vivo! Qualquer valor que você puder me mandar agora já ajuda a segurar o celular!`,
          newStage: 'negotiation',
          updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
          suggestedChoices: [
            { id: 'sc_refuse_final', text: 'Não tenho como transferir nada por mensagem. Vamos conversar pessoalmente.', type: 'safe', nextNodeId: 'node_safe_refuse' },
            { id: 'sc_call_father', text: 'Vou ligar para o seu número antigo para ver se resolve.', type: 'safe', nextNodeId: 'node_safe_call_family' }
          ]
        };
      }
      return {
        replyText: `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, pelo amor de Deus, quanto você tem disponível aí? Se você me mandar pelo menos R$ 400 ou R$ 500 agora eu já consigo dar de entrada pro técnico não cancelar minha ordem de serviço! Você consegue me mandar pelo menos uma parte?`,
        newStage: 'negotiation',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_refuse_final', text: 'Não tenho como transferir nada por mensagem. Vamos conversar pessoalmente.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_father', text: 'Vou ligar para o seu número antigo para confirmar.', type: 'safe', nextNodeId: 'node_safe_call_family' }
        ]
      };
    }

    // =========================================================================
    // 15. DIFICULDADE COM TECNOLOGIA ("Não sei mexer no banco", "não sei fazer pix")
    // =========================================================================
    if (this.has(text,
      'nao sei mexer', 'nao sei fazer pix', 'nao sei usar', 'aplicativo travou', 
      'esqueci a senha', 'nao tenho app', 'minha filha que faz', 'seu irmao que faz'
    )) {
      return {
        replyText: `É bem fácil ${targetTitle}! Abre o aplicativo do seu banco no celular, clica no botão que tá escrito "Pix", depois clica em "Transferir" e cola a chave que eu te passar. É só dois cliques! Me avisa quando abrir o app que eu te ajudo passo a passo.`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_refuse_tech', text: '🛑 Prefiro não mexer nisso agora. Quando você chegar a gente resolve.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_ask_pix', text: 'Tá bom, me passa a chave Pix da loja.', type: 'insecure', nextNodeId: 'node_3_pix_request' }
        ]
      };
    }

    // =========================================================================
    // 16. ADIAR PARA DEPOIS / "Amanhã eu pago", "Quando chegar em casa"
    // =========================================================================
    if (this.has(text,
      'amanha', 'depois', 'quando chegar', 'pessoalmente', 'em casa', 'mais tarde', 
      'quando o banco abrir', 'segunda feira', 'fim de semana', 'espera chegar'
    )) {
      if (this.has(text, 'pessoalmente', 'quando chegar', 'em casa')) {
        return {
          replyText: 'Você manteve a firmeza, resistiu à pressão psicológica de urgência e decidiu resolver com calma pessoalmente.',
          newStage: 'safe_ending',
          isSafeEnding: true
        };
      }
      return {
        replyText: `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, amanhã não dá tempo! O técnico falou que se não der baixa no sistema até as 15h eles vão cobrar uma multa diária de estadia e meu aparelho vai pro depósito central! Por favor, me ajuda com esse Pix agora!`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_refuse_final', text: 'Não faço pagamento por mensagem. Vamos conversar quando você chegar.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_father', text: 'Vou ligar para o seu número antigo para checar.', type: 'safe', nextNodeId: 'node_safe_call_family' }
        ]
      };
    }

    // =========================================================================
    // 17. SAUDAÇÕES GENÉRICAS ("Oi", "Olá", "Bom dia", "Já salvei")
    // =========================================================================
    if (this.has(text, 
      'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'salvei', 'ja salvei', 'salvo'
    )) {
      return {
        replyText: `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, estou com um problema sério e urgente. Deixei o celular na assistência técnica e preciso pagar R$ 1.250,00 até as 15h senão vou perder o aparelho! Meu app do banco tá bloqueado neste telefone novo. Você consegue fazer esse Pix pra mim? Eu te devolvo amanhã!`,
        newStage: 'scam_pitch',
        updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
        suggestedChoices: [
          { id: 'sc_ask_pix', text: 'Qual a chave Pix da loja para eu pagar?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
          { id: 'sc_refuse', text: 'Não faço pagamento por mensagem. Vamos conversar quando chegar em casa.', type: 'safe', nextNodeId: 'node_safe_refuse' },
          { id: 'sc_call_family', text: 'Vou ligar para o seu número antigo gravado na agenda.', type: 'safe', nextNodeId: 'node_safe_call_family' }
        ]
      };
    }

    // =========================================================================
    // 18. FALLBACK CONTEXTUAL ADAPTATIVO (Se o usuário digitar algo inédito)
    // =========================================================================
    const smartFallbacks = [
      `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, eu entendo, mas por favor me ouve! Eu tô sem tempo aqui na rua e preciso resolver isso do conserto de R$ 1.250 antes que o banco feche. Você consegue me dar essa força com o Pix agora?`,
      `Eu sei que é repentino ${targetTitle}, mas o cara da assistência tá me cobrando agora o pagamento pra liberar o telefone. Me ajuda com esse Pix que amanhã de manhã eu já te transfiro de volta!`,
      `${targetTitle.charAt(0).toUpperCase() + targetTitle.slice(1)}, confia em mim, sou ${selfTitle}! Se eu não pagar essa taxa da assistência agora eu fico sem meu celular de trabalho. Posso te passar a chave Pix da loja?`
    ];
    const pickedReply = smartFallbacks[Math.floor(Math.random() * smartFallbacks.length)];

    return {
      replyText: pickedReply,
      newStage: currentStage === 'pix_provided' ? 'pix_provided' : 'scam_pitch',
      detectedName: effectiveName || undefined,
      updatedProfile: Object.keys(autoUpdatedProfile).length > 0 ? autoUpdatedProfile : undefined,
      isUnrecognized: true,
      matchedRule: 'family_fallback',
      suggestedChoices: [
        { id: 'sc_fallback_pix', text: 'Qual a chave Pix da loja?', type: 'insecure', nextNodeId: 'node_3_pix_request' },
        { id: 'sc_fallback_refuse', text: 'Não vou mandar dinheiro por mensagem.', type: 'safe', nextNodeId: 'node_safe_refuse' },
        { id: 'sc_fallback_call_old', text: '📞 Vou ligar no seu número antigo para confirmar.', type: 'verify_official', nextNodeId: 'node_safe_call_old' }
      ]
    };
  }
}

export const dialogueInterpreter = new DialogueInterpreter();
export const interpretadorDialogoService = dialogueInterpreter;
