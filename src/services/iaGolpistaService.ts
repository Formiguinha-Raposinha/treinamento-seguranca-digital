import { Scenario, MessageNode, UserChoice, RelativeProfile } from '../types/cenario';

export interface AiScammerResponse {
  replyText: string;
  outcome: 'continue' | 'critical_action' | 'safe_exit';
  scamReason?: string;
  suggestedChoices: UserChoice[];
}

const STORAGE_API_KEY = 'antigravity_gemini_api_key';
const STORAGE_AI_ENABLED = 'antigravity_ai_mode_enabled';

// Lista de palavras que NUNCA podem ser consideradas nomes de parentes
const INVALID_NAME_WORDS = new Set([
  'deixou', 'salvou', 'mandou', 'enviou', 'pagou', 'transferiu', 'falou', 'disse',
  'pediu', 'queria', 'precisa', 'precisou', 'conseguiu', 'fez', 'esta', 'estava',
  'ficou', 'ligou', 'avisou', 'banco', 'pix', 'cleber', 'souza', 'filho', 'filha',
  'neto', 'neta', 'pai', 'mae', 'tio', 'tia', 'dinheiro', 'celular', 'numero',
  'conta', 'agencia', 'cartao', 'carro', 'guincho', 'loja', 'onde', 'salvo'
]);

export class AiScammerService {
  private customApiKey: string = '';
  private aiEnabled: boolean = true;

  constructor() {
    this.customApiKey = localStorage.getItem(STORAGE_API_KEY) || '';
    const savedEnabled = localStorage.getItem(STORAGE_AI_ENABLED);
    this.aiEnabled = savedEnabled !== null ? savedEnabled === 'true' : true;
  }

  public getApiKey(): string {
    const rawKey = this.customApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
    return rawKey.trim();
  }

  public setApiKey(key: string): void {
    this.customApiKey = key.trim();
    localStorage.setItem(STORAGE_API_KEY, this.customApiKey);
  }

  public isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  public isAiEnabled(): boolean {
    return this.aiEnabled && this.isConfigured();
  }

  public toggleAiEnabled(enabled: boolean): void {
    this.aiEnabled = enabled;
    localStorage.setItem(STORAGE_AI_ENABLED, String(enabled));
  }

  /**
   * Sanitiza nomes para evitar alucinações (ex: transformar o verbo 'deixou' no nome do filho)
   */
  private sanitizeRelativeName(candidateName?: string): string {
    if (!candidateName) return '';
    const clean = candidateName.trim().toLowerCase();
    if (INVALID_NAME_WORDS.has(clean) || clean.length < 3 || clean.length > 15) {
      return '';
    }
    return candidateName.charAt(0).toUpperCase() + candidateName.slice(1);
  }

  /**
   * Gera uma resposta dinâmica do golpista utilizando o Gemini 3.5 Flash Lite
   * com isolamento rigoroso de cenário e guardrail de interceptação pós-geração.
   */
  public async generateReply(
    scenario: Scenario,
    conversationHistory: MessageNode[],
    userMessage: string,
    relativeProfile?: RelativeProfile
  ): Promise<AiScammerResponse | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;

    // 1. Identificação Rígida do Tipo de Cenário (sem ambiguidades)
    const isRelativeScam = scenario.id === 'falso-familiar-novo-numero' || scenario.id === 'falso-familiar' || scenario.category.toLowerCase().includes('familiar');
    const isInssScam = scenario.id === 'falsa-prova-vida-inss' || scenario.category.toLowerCase().includes('inss');
    const isMotoboyScam = scenario.id === 'golpe-falso-motoboy' || scenario.category.toLowerCase().includes('motoboy');
    const isGiftScam = scenario.id === 'golpe-presente-taxa-entrega' || scenario.category.toLowerCase().includes('entregas');
    const isBankLinkScam = scenario.id === 'falso-aviso-banco-link' || (scenario.category.toLowerCase().includes('links') && !isInssScam);
    const isCallCenterScam = scenario.id === 'falsa-central-0800' || (scenario.environment === 'phone' && !isMotoboyScam);

    // 2. Higienização do histórico de mensagens para não contaminar cenários institucionais com termos de outros testes
    const formattedHistory = conversationHistory
      .filter(m => m.sender === 'user' || m.sender === 'opponent')
      .filter(m => {
        // Se estiver em cenário não familiar, EXPURGA do histórico mensagens familiares herdadas
        if (!isRelativeScam) {
          return !/\b(m[aã]e|pai|filh[oa]|net[oa]|ti[oa]|sobrinh[oa]|guincho|cleber|b[eê]n[cç][aã]o)\b/i.test(m.text);
        }
        return true;
      })
      .map(m => `${m.sender === 'user' ? (isBankLinkScam || isInssScam ? 'Cliente' : 'Idoso(a)') : (scenario.sender.name)}: "${m.text}"`)
      .slice(-6)
      .join('\n');

    // 3. Blindagem de variáveis familiares (usadas ESTRITAMENTE no golpe do parente)
    const kinship = relativeProfile?.kinship || 'filho';
    const targetTitle = relativeProfile?.targetTitle || 'mãe';
    const validRelativeName = this.sanitizeRelativeName(relativeProfile?.detectedName || relativeProfile?.name);

    let personaInstructions = '';
    let fewShotTraining = '';

    if (isBankLinkScam) {
      // =========================================================================
      // TREINAMENTO ESPECÍFICO: GOLPE DE SMS / LINK BANCÁRIO FALSO
      // =========================================================================
      personaInstructions = `
🚨 REGRA CRÍTICA INVIOLÁVEL - PROIBIÇÃO TOTAL DE MUDANÇA DE PAPEL:
- VOCÊ É A NOTIFICAÇÃO AUTOMATIZADA / CENTRAL DE SEGURANÇA BANCÁRIA (Phishing por SMS).
- REMETENTE: ${scenario.sender.name} (${scenario.sender.phoneNumber || 'SMS'}).
- ESTILO: Formal, institucional, urgente, impessoal e corporativo.
- 🛑 PROIBIÇÃO ABSOLUTA: JAMAIS chame o usuário de "mãe", "pai", "filho" e NUNCA invente parentes!
  NÃO EXISTE FILHO AQUI! NÃO EXISTE MÃE AQUI! NÃO EXISTE GUINCHO AQUI!
  SE O USUÁRIO FALAR DE MÃE OU FILHO, IGNORE COMPLETAMENTE E RESPONDA COMO CENTRAL BANCÁRIA.
- SEU OBJETIVO: Fazer o cliente clicar no link seguro simulado "banco-seguro-cancelamento.xyz" para contestar uma compra de R$ 3.890,00 nas Casas Bahia.

DIRETRIZES DE RESPOSTA OBRIGATÓRIAS:
1. Se o usuário perguntar "qual é o banco?", "tenho conta em 4 bancos, qual é?", "de qual cartão é?":
   - Responda formalmente:
     "Prezado(a) cliente, o monitoramento preventivo abrange os cartões e contas sob seu CPF no sistema interbancário conveniado. Para identificar o banco emissor específico e contestar a compra de R$ 3.890,00 antes do faturamento, acesse a validação pelo link: banco-seguro-cancelamento.xyz"
2. Se o usuário disser que não reconhece a compra e quer cancelar:
   - Responda formalmente insistindo no link:
     "Alerta: Para concluir o cancelamento preventivo e garantir o estorno imediato de R$ 3.890,00, confirme a contestação no portal de segurança: banco-seguro-cancelamento.xyz"
3. Se o usuário disser que é golpe, que vai abrir o aplicativo oficial do banco ou ligar no verso do cartão:
   - Avalie o desfecho como "safe_exit"!
`;

      fewShotTraining = `
DEMONSTRAÇÕES DE TREINAMENTO (FEW-SHOT BANCÁRIO):
Exemplo 1:
Cliente: "Eu tenho uns 4 bancos, qual deles é esse?"
Central Bancária (SMS): "Prezado(a) cliente, o alerta abrange todas as instituições conveniadas ao seu CPF. Para verificar o banco emissor específico e cancelar a cobrança de R$ 3.890,00, acesse a validação pelo link informado: banco-seguro-cancelamento.xyz"
outcome: "continue"

Exemplo 2:
Cliente: "Minha mãe me disse que isso é golpe."
Central Bancária (SMS): "Prezado(a) cliente, o monitoramento de segurança é preventivo. Caso a transação nas Casas Bahia não seja cancelada pelo link oficial antes do fechamento, o valor será faturado."
outcome: "continue"

Exemplo 3:
Cliente: "Não fiz nenhuma compra nas Casas Bahia, quero cancelar agora!"
Central Bancária (SMS): "Para efetuar o cancelamento imediato e evitar a cobrança na fatura, acesse o link seguro para validação do estorno antes do encerramento do prazo: banco-seguro-cancelamento.xyz"
outcome: "continue"

Exemplo 4:
Cliente: "Isso é golpe! Vou abrir meu aplicativo oficial do banco para conferir."
Central Bancária (SMS): "Atenção: A transação será processada caso não haja validação."
outcome: "safe_exit"
scamReason: "O participante desconfiou do link no SMS e decidiu verificar pelo canal oficial do próprio banco."
`;
    } else if (isRelativeScam) {
      // =========================================================================
      // TREINAMENTO ESPECÍFICO: GOLPE DO FALSO FAMILIAR (WHATSAPP NOVO NÚMERO)
      // =========================================================================
      personaInstructions = `
PAPEL DO GOLPISTA NESTE CENÁRIO:
- Você é o GOLPISTA fingindo ser o ${kinship} ${validRelativeName ? `(chamado ${validRelativeName})` : ''} falando com ${targetTitle}.
- Remetente: Número novo desconhecido fingindo que trocou de aparelho porque o celular quebrou ou caiu na água.
- Estilo: Informal, coloquial, brasileiro autêntico, afetuoso, mas com muita pressa e nervosismo.
- 🚨 REGRA CRÍTICA DE NOMES: NUNCA interprete verbos como nomes de pessoas (ex: 'deixou', 'salvou', 'mandou' NÃO são nomes!).
  Se o usuário disser "já enviei para onde o filho deixou salvo", responda imediatamente que a conta antiga está bloqueada e que precisa do Pix nesta chave nova!
- Objetivo: Conseguir um Pix urgente de R$ 1.250 para pagar o mecânico/guincho.
`;

      fewShotTraining = `
DEMONSTRAÇÕES DE TREINAMENTO (FEW-SHOT FAMILIAR):
Exemplo 1:
Idoso(a): "Já enviei o pix para onde meu filho deixou salvo no aplicativo."
Golpista: "Não ${targetTitle}! Aquela conta antiga tá bloqueada junto com o celular que quebrou! Você tem que mandar nessa chave Pix que te passei agora senão não libera meu carro!"
outcome: "continue"

Exemplo 2:
Idoso(a): "Vou ligar agora no seu número antigo que está na minha agenda pra confirmar."
Golpista: "Não adianta ligar lá, tá sem sinal e quebrado!"
outcome: "safe_exit"
scamReason: "O participante aplicou a Regra de Ouro: ligou para o número antigo gravado na agenda telefônica."

Exemplo 3 (Contra-blefe com visita presencial de parente / policial):
Idoso(a): "O seu tio que é policial está passando aí na oficina agora para te ajudar."
Golpista: "Não ${targetTitle}, pelo amor de Deus! Não manda o tio aqui e nem envolve polícia! O mecânico falou que se meter polícia ele vai prender meu carro e vai dar a maior confusão! Não precisa ninguém vir não, deixa que eu me viro aqui... [🚫 O golpista entrou em pânico, apagou a foto do perfil e bloqueou você]"
outcome: "safe_exit"
scamReason: "O participante usou uma estratégia de checagem presencial com parente/policial, fazendo o golpista entrar em pânico e desistir da tentativa de fraude."
`;
    } else if (isCallCenterScam) {
      // =========================================================================
      // TREINAMENTO ESPECÍFICO: FALSA CENTRAL TELEFÔNICA (FALSO 0800)
      // =========================================================================
      personaInstructions = `
PAPEL DO GOLPISTA NESTE CENÁRIO:
- Você é um OPERADOR FALSO DA CENTRAL DE PREVENÇÃO A FRAUDES BANCÁRIAS (Vishing / Falsa Central).
- Estilo: Extremamente formal, calmo, técnico, usando termos bancários fictícios ("protocolo de segurança", "procedimento de estorno preventivo").
- NUNCA aja como familiar ou filho!
- Objetivo: Fazer a pessoa realizar uma "transferência de segurança" ou passar dados e senhas.
`;
      fewShotTraining = `
DEMONSTRAÇÕES DE TREINAMENTO (FEW-SHOT):
Exemplo 1:
Idoso(a): "Recebi um SMS mandando ligar para este 0800 sobre uma compra de R$ 4.750."
Golpista: "Central de Segurança Bancária, boa tarde. Localizamos uma tentativa de compra em análise. Para cancelamento, confirme seu CPF."
outcome: "continue"
`;
    } else if (isInssScam) {
      // =========================================================================
      // TREINAMENTO ESPECÍFICO: GOLPE DA FALSA PROVA DE VIDA DO INSS
      // =========================================================================
      personaInstructions = `
PAPEL DO GOLPISTA NESTE CENÁRIO:
- Você é a NOTIFICAÇÃO AUTOMATIZADA DO PORTAL MEU INSS / GOV.BR (Phishing Previdenciário).
- Remetente: ${scenario.sender.name} (${scenario.sender.phoneNumber || 'SMS'}).
- Estilo: Formal, institucional, frio, burocrático e extremamente alarmista sobre a suspensão do pagamento do benefício de aposentadoria.
- 🛑 NUNCA use termos familiares (mãe, pai, filho, guincho).
- Objetivo: Fazer a pessoa clicar no link "meu-inss-recadastramento-biometria.xyz" para enviar selfie biométrica e senha do Gov.br.
- DIRETRIZES:
  1. Se a pessoa perguntar por que tem que fazer: diga que a Prova de Vida anual 2026 não foi identificada e que o benefício será suspenso em 48h caso não valide pelo link.
  2. Se a pessoa disser que vai abrir o aplicativo oficial Meu INSS, ir na agência do INSS ou ligar para o 135: avalie como "safe_exit"!
`;
      fewShotTraining = `
DEMONSTRAÇÕES DE TREINAMENTO (FEW-SHOT INSS):
Exemplo 1:
Idoso(a): "Minha prova de vida não é automática agora?"
Notificação INSS: "Aviso: O cruzamento de dados biométricos da sua conta restou inconclusivo no sistema do INSS. Para evitar a suspensão imediata do pagamento em 48 horas, acesse a regularização facial pelo portal oficial: meu-inss-recadastramento-biometria.xyz"
outcome: "continue"

Exemplo 2:
Idoso(a): "Isso é golpe, o INSS não pede senha por SMS! Vou ligar no 135 para conferir."
Notificação INSS: "Alerta: Prazo de regularização em contagem regressiva."
outcome: "safe_exit"
scamReason: "O participante reconheceu que o INSS não bloqueia benefícios por SMS e optou pelo canal oficial 135."
`;
    } else if (isMotoboyScam) {
      // =========================================================================
      // TREINAMENTO ESPECÍFICO: GOLPE DO FALSO MOTOBOY / CARTÃO CLONADO
      // =========================================================================
      personaInstructions = `
PAPEL DO GOLPISTA NESTE CENÁRIO:
- Você é o ATENDENTE ANDRÉ DO SETOR DE FRAUDES DE CARTÕES BANCÁRIOS (Golpe do Falso Motoboy).
- Estilo: Extremamente educado, calmo, técnico, fingindo preocupação com a segurança e o dinheiro da vítima.
- Objetivo: Convencer o idoso de que o cartão foi clonado em outra cidade (São Paulo), fazê-lo digitar a senha no telefone e fazê-lo cortar o cartão ao meio e entregá-lo no envelope ao motoboy credenciado que passará na casa dele.
- DIRETRIZES:
  1. Insista que o cartão cortado ao meio é exigência da Perícia da Polícia Civil para estornar a compra.
  2. Diga que o motoboy com crachá já está a caminho.
  3. Se o usuário falar que banco não manda motoboy buscar cartão ou que vai chamar a polícia: avalie imediatamente como "safe_exit"!
`;
      fewShotTraining = `
DEMONSTRAÇÕES DE TREINAMENTO (FEW-SHOT MOTOBOY):
Exemplo 1:
Idoso(a): "Mas se eu já cortei o cartão no meio, por que o motoboy precisa vir buscar?"
Golpista: "Senhora, a recolha física do cartão cortado no envelope lacrado é exigência da Perícia Policial e da seguradora para emitir o laudo de estorno da compra de R$ 3.850. Nosso motoboy credenciado já está na sua rua para recolher."
outcome: "continue"

Exemplo 2:
Idoso(a): "Banco nenhum manda motoboy na casa do cliente! Vou desligar e chamar a polícia militar!"
Golpista: "Senhora, aguarde um instante..."
outcome: "safe_exit"
scamReason: "O participante aplicou a Regra de Ouro da Febraban: desmascarou o falso motoboy e encerrou a chamada."
`;
    } else if (isGiftScam) {
      // =========================================================================
      // TREINAMENTO ESPECÍFICO: GOLPE DO PRESENTE / TAXA NA MAQUININHA
      // =========================================================================
      personaInstructions = `
PAPEL DO GOLPISTA NESTE CENÁRIO:
- Você é o ENTREGADOR MARCOS DA EMPRESA EXPRESS CESTAS & FLORES (Golpe do Presente Surpresa).
- Estilo: Simpático, afobado, insistente e prestativo.
- Objetivo: Dizer que há uma cesta de café e flores de aniversário para a senhora, mas que falta pagar uma taxa de frete de R$ 9,50 exclusivamente no cartão na maquininha, ou pedir uma foto do rosto com documento para "liberar a entrega no app".
- DIRETRIZES:
  1. Recuse dinheiro em espécie alegando "norma de segurança da empresa".
  2. Insista que o presente é lindo e que seria uma pena devolver.
  3. Se o usuário recusar o presente, recusar pagar taxa na maquininha ou mandar embora: avalie imediatamente como "safe_exit"!
`;
      fewShotTraining = `
DEMONSTRAÇÕES DE TREINAMENTO (FEW-SHOT PRESENTE):
Exemplo 1:
Idoso(a): "Quem foi que me mandou essa cesta?"
Golpista: "No cartão vem escrito 'com carinho de quem te ama muito', é surpresa de aniversário! Só falta passar a taxinha de frete de R$ 9,50 no cartão na minha maquininha para eu descarregar aqui no portão!"
outcome: "continue"

Exemplo 2:
Idoso(a): "Presente não se paga taxa de entrega! Não vou passar cartão nenhum, pode levar de volta."
Golpista: "Puxa senhora, tem certeza que vai perder o presente?"
outcome: "safe_exit"
scamReason: "O participante aplicou a Regra de Ouro: presente não tem taxa de entrega e recusou passar cartão na maquininha."
`;
    } else {
      personaInstructions = `
PAPEL DO GOLPISTA:
- Atue como o interlocutor suspeito deste cenário (${scenario.title}).
- Mantenha a coerência estrita com a categoria: ${scenario.category}.
`;
      fewShotTraining = '';
    }

    const systemPrompt = `
Você é o motor de simulação de um projeto de extensão universitária no IFMT para treinar pessoas idosas contra golpes digitais.
Seu papel neste momento é INTERPRETAR O GOLPISTA (Engenheiro Social) de forma realista, verossímil e adaptativa, mantendo a coerência total com o cenário.

CENÁRIO ATUAL:
- Título do Golpe: ${scenario.title}
- Categoria: ${scenario.category}
- Identidade do Golpista: ${scenario.sender.name} (${scenario.sender.statusText || 'Golpista'})
- Regra de Ouro deste cenário: ${scenario.summary.goldenRule}

${personaInstructions}

${fewShotTraining}

HISTÓRICO RECENTE DA CONVERSA:
${formattedHistory}

ÚLTIMA FALA DO USUÁRIO:
"${userMessage}"

AVALIAÇÃO DE DESFECHO (outcome):
- "critical_action": Se o usuário aceitou pagar, pediu a chave Pix para transferir, confirmou que pagou na chave nova do golpista, passou senha ou código SMS.
- "safe_exit": Se o usuário recusou com firmeza, disse que vai ligar para o número antigo gravado na agenda, que vai olhar o verso do cartão físico ou abrir o aplicativo oficial do banco.
- "continue": Se a conversa ainda está em andamento.

GERE OBRIGATORIAMENTE 2 A 3 BOTÕES DE ESCOLHAS RÁPIDAS para o usuário poder responder clicando caso não queira digitar.

RESPONDA OBRIGATORIAMENTE EM JSON VÁLIDO com o seguinte formato:
{
  "replyText": "sua resposta no papel do golpista (máximo 2 a 3 frases, verossímil)",
  "outcome": "continue" | "critical_action" | "safe_exit",
  "scamReason": "breve explicação do motivo caso seja critical_action ou safe_exit",
  "suggestedChoices": [
    { "id": "c1", "text": "opção 1 para o usuário responder", "type": "neutral" | "safe" | "insecure" },
    { "id": "c2", "text": "opção 2 para o usuário responder", "type": "neutral" | "safe" | "insecure" },
    { "id": "c3", "text": "opção 3 para o usuário responder", "type": "neutral" | "safe" | "insecure" }
  ]
}
`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: 'application/json'
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('Falha na resposta da API Gemini:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;

      const parsed = JSON.parse(rawText) as AiScammerResponse;

      // 🛡️ BARREIRA RIGOROSA DE SAÍDA (Output Guardrail Anti-Alucinação):
      // Se NÃO for golpe de familiar (ou seja, se for Banco, INSS, Motoboy ou Presente),
      // e o modelo por ventura alucinar termos familiares ("mãe", "filho", etc.),
      // INTERCEPTA E SUBSTITUI IMEDIATAMENTE pela resposta adequada do cenário!
      if (!isRelativeScam) {
        const forbiddenFamily = /\b(m[aã]e|pai|filh[oa]|net[oa]|ti[oa]|sobrinh[oa]|b[eê]n[cç][aã]o|guincho|cleber\s+souza|celular\s+quebrou)\b/i;
        if (forbiddenFamily.test(parsed.replyText)) {
          console.error('🚨 [Output Guardrail] ALUCINAÇÃO INTERCEPTADA: IA tentou usar termo familiar em cenário não familiar!');
          if (isBankLinkScam) {
            parsed.replyText = "Prezado(a) cliente, esta notificação refere-se à segurança do seu cartão. Para verificar a instituição emissora e contestar a compra de R$ 2.490,00 antes do faturamento, acesse a validação pelo link informado acima: bb-seguranca-cancelamento.xyz";
            parsed.outcome = 'continue';
          } else if (isInssScam) {
            parsed.replyText = "Notificação Previdenciária: Consta pendência anual de Prova de Vida. Para evitar o bloqueio da sua aposentadoria em 48 horas, acesse a regularização biométrica pelo portal: meu-inss-recadastramento-biometria.xyz";
            parsed.outcome = 'continue';
          } else if (isMotoboyScam) {
            parsed.replyText = "Atendente André: Senhora, nosso setor de segurança já bloqueou a compra suspeita. Para a perícia da Polícia Civil, precisamos que a senhora confirme se reconhece a transação e aguarde a coleta do cartão periciado pelo motoboy credenciado.";
            parsed.outcome = 'continue';
          } else if (isGiftScam) {
            parsed.replyText = "Marcos Entregador: Senhora, a cesta de presentes está aqui no portão! Só precisamos passar a taxa de entrega de R$ 9,50 no cartão ou confirmar a entrega no app da transportadora.";
            parsed.outcome = 'continue';
          } else {
            parsed.replyText = "Central de Atendimento e Prevenção a Fraudes: Para contestar a transação sob suspeita e proteger sua conta, confirme se você reconhece a compra de R$ 4.750,00.";
            parsed.outcome = 'continue';
          }
        }
      }

      // Formata escolhas sugeridas para bater com a interface UserChoice
      const formattedChoices: UserChoice[] = (parsed.suggestedChoices || []).map((choice, i) => {
        let choiceType: 'safe' | 'insecure' | 'neutral' = 'neutral';
        if (choice.type === 'safe') choiceType = 'safe';
        if (choice.type === 'insecure' || (choice.type as string) === 'danger' || (choice.type as string) === 'risk') choiceType = 'insecure';
        return {
          id: choice.id || `ai_choice_${i}_${Date.now()}`,
          text: choice.text,
          type: choiceType,
          nextNodeId: 'node_ai_dynamic'
        };
      });

      return {
        replyText: parsed.replyText,
        outcome: parsed.outcome || 'continue',
        scamReason: parsed.scamReason,
        suggestedChoices: formattedChoices
      };
    } catch (err) {
      console.warn('Erro ao chamar o Agente de IA Golpista (Gemini):', err);
      return null;
    }
  }
}

export const aiScammerService = new AiScammerService();
export const iaGolpistaService = aiScammerService;
