import { bancoDadosService } from './bancoDadosService';
import { UnrecognizedExpression } from '../types/bancoDados';

// Stopwords estritas em Português do Brasil (PT-BR) para filtrar ruído e manter apenas termos analíticos
const STOPWORDS_PT_BR = new Set([
  'a', 'as', 'o', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'dum', 'duma', 'deste', 'desta', 'disso', 'daqui',
  'em', 'no', 'na', 'nos', 'nas', 'num', 'numa', 'neste', 'nesta', 'nisso',
  'por', 'pelo', 'pela', 'pelos', 'pelas',
  'para', 'pra', 'pro', 'pras', 'pros',
  'com', 'sem', 'sob', 'sobre', 'tras', 'ate', 'apos',
  'e', 'ou', 'mas', 'que', 'se', 'ja', 'so', 'nem', 'tambem',
  'eu', 'tu', 'ele', 'ela', 'nos', 'vos', 'eles', 'elas', 'voce', 'voces',
  'me', 'te', 'se', 'lhe', 'lhes',
  'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa',
  'esse', 'essa', 'esses', 'essas', 'este', 'esta', 'estes', 'estas', 'aquele', 'aquela',
  'isso', 'isto', 'aquilo',
  'deu', 'foi', 'era', 'sou', 'somos', 'sao', 'ser', 'ter', 'tinha', 'tem', 'temos', 'estou', 'esta', 'estao',
  'muito', 'muita', 'pouco', 'pouca', 'mais', 'menos', 'bem', 'mal', 'tudo', 'nada'
]);

class VocabularioService {
  /**
   * Extrai e normaliza palavras em Português do Brasil (PT-BR)
   */
  public tokenize(text: string): string[] {
    if (!text) return [];

    const cleaned = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos para unificar frequências
      .replace(/[^a-z0-9\s]/g, ' '); // remove pontuações

    const rawTokens = cleaned.split(/\s+/).filter(Boolean);
    const meaningfulWords: string[] = [];

    for (const token of rawTokens) {
      if (token.length >= 3 && !STOPWORDS_PT_BR.has(token) && isNaN(Number(token))) {
        meaningfulWords.push(token);
      }
    }

    return meaningfulWords;
  }

  /**
   * Registra a entrada do idoso (digitação ou áudio) no banco de dados PT-BR
   */
  public async recordInput(
    rawText: string,
    inputType: 'typed' | 'audio',
    scenarioId: string,
    scenarioTitle: string,
    stage: string,
    isUnrecognized: boolean,
    notes?: string
  ): Promise<void> {
    if (!rawText || !rawText.trim()) return;

    const trimmed = rawText.trim();
    const tokens = this.tokenize(trimmed);
    const seniorId = bancoDadosService.getActiveSeniorId();

    // 1. Atualiza frequências das palavras em Português
    if (tokens.length > 0) {
      await bancoDadosService.incrementWordFrequencies(tokens, inputType, scenarioId);
    }

    // 2. Se a entrada não foi compreendida pelo motor offline, armazena para aprimoramento pedagógico
    if (isUnrecognized) {
      const entry: UnrecognizedExpression = {
        id: `unrec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        seniorId,
        scenarioId,
        scenarioTitle,
        rawText: trimmed,
        normalizedText: tokens.join(' '),
        inputType,
        timestamp: new Date().toISOString(),
        stage,
        status: 'pending',
        notes: notes || 'Entrada em Português não mapeada nas regras heurísticas offline',
        idioma: 'pt-BR'
      };

      await bancoDadosService.logUnrecognizedExpression(entry);
    }
  }

  /**
   * Exporta expressões não reconhecidas em formato CSV (PT-BR) para pesquisa
   */
  public async exportUnrecognizedAsCsv(): Promise<string> {
    const list = await bancoDadosService.getUnrecognizedExpressions();
    const headers = ['ID', 'Data/Hora', 'Canal (Áudio/Texto)', 'Cenário', 'Expressão Bruta (PT-BR)', 'Termos Extraídos', 'Etapa', 'Status', 'Observações'];

    const rows = list.map(item => [
      `"${item.id}"`,
      `"${new Date(item.timestamp).toLocaleString('pt-BR')}"`,
      `"${item.inputType === 'audio' ? 'Áudio/Voz' : 'Digitação'}"`,
      `"${item.scenarioTitle.replace(/"/g, '""')}"`,
      `"${item.rawText.replace(/"/g, '""')}"`,
      `"${item.normalizedText.replace(/"/g, '""')}"`,
      `"${item.stage}"`,
      `"${item.status === 'mapped' ? 'Mapeada' : item.status === 'ignored' ? 'Ignorada' : 'Pendente'}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  }

  /**
   * Exporta palavras mais usadas em formato CSV (PT-BR)
   */
  public async exportWordFrequenciesAsCsv(): Promise<string> {
    const list = await bancoDadosService.getWordFrequencies(500);
    const headers = ['Palavra (PT-BR)', 'Categoria', 'Ocorrências', 'Último Uso', 'Canal de Entrada', 'Cenários Onde Ocorreu'];

    const rows = list.map(item => [
      `"${item.word}"`,
      `"${item.categoria || 'geral'}"`,
      item.count,
      `"${new Date(item.lastUsedAt).toLocaleString('pt-BR')}"`,
      `"${item.source === 'audio' ? 'Áudio' : item.source === 'typed' ? 'Digitação' : 'Ambos'}"`,
      `"${item.scenarioContexts.join(', ')}"`
    ]);

    return [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  }
}

export const vocabularioService = new VocabularioService();
export const vocabularyService = vocabularioService;
