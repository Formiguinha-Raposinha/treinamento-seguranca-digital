import { supabase, supabaseConfigurado } from '../lib/supabase';
import type { SimulationSession, UnrecognizedExpression } from '../types/bancoDados';
import type { Feedback } from './bancoDadosService';

export type StatusFeedback = 'novo' | 'em_analise' | 'resolvido';

export interface FeedbackNuvem {
  id: number;
  senior_id: string;
  author_id: string;
  author_role: 'senior' | 'family';
  scenario_id: string | null;
  scenario_title: string | null;
  category: Feedback['category'] | null;
  rating: number | null;
  comment: string;
  audio_path: string | null;
  status: StatusFeedback;
  created_at: string;
}

export interface MetricaCenario {
  scenario_id: string;
  titulo: string | null;
  categoria: string | null;
  tentativas: number;
  participantes: number;
  taxa_acerto: number | null;
  acerto_primeira: number | null;
  media_ate_acertar: number | null;
  aprenderam: number;
}

export interface MetricasAdmin {
  participantes: number;
  familiares: number;
  ativos_30d: number;
  treinos: number;
  taxa_acerto_geral: number;
  feedbacks_novos: number;
  por_cenario: MetricaCenario[];
  por_semana: { semana: string; treinos: number; taxa_acerto: number | null }[];
}

const BUCKET_AUDIO = 'feedback-audio';

/** Id do usuário logado, ou null (sem login ou Supabase não configurado) */
const usuarioAtual = async (): Promise<string | null> => {
  if (!supabaseConfigurado) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

export const nuvemService = {
  // ------------------------------------------------------------------ TREINOS
  async enviarSessao(s: SimulationSession) {
    const uid = await usuarioAtual();
    if (!uid || s.seniorId !== uid) return; // só o próprio idoso grava os treinos dele
    const { error } = await supabase.from('sessions').upsert({
      id: s.id,
      senior_id: uid,
      scenario_id: s.scenarioId,
      scenario_title: s.scenarioTitle,
      category: s.category,
      outcome: s.outcome,
      completed_at: s.completedAt,
      data: s
    });
    if (error) console.warn('Falha ao enviar treino para a nuvem:', error.message);
  },

  async baixarSessoes(seniorId: string): Promise<SimulationSession[]> {
    if (!(await usuarioAtual())) return [];
    const { data, error } = await supabase
      .from('sessions')
      .select('data')
      .eq('senior_id', seniorId)
      .order('completed_at', { ascending: true });
    if (error) {
      console.warn('Falha ao baixar treinos:', error.message);
      return [];
    }
    return (data || []).map((linha: any) => linha.data as SimulationSession);
  },

  async estatisticaCenario(scenarioId: string): Promise<{ total: number; safe_pct: number; fallen_pct: number } | null> {
    if (!(await usuarioAtual())) return null;
    const { data, error } = await supabase.rpc('scenario_stats', { p_scenario_id: scenarioId });
    if (error) return null;
    return (Array.isArray(data) ? data[0] : data) || null;
  },

  // ---------------------------------------------------------------- FEEDBACKS
  async enviarFeedback(fb: Feedback) {
    const uid = await usuarioAtual();
    if (!uid) return;

    let audioPath: string | null = null;
    if (fb.audioBlob) {
      const extensao = fb.audioBlob.type.includes('mp4') ? 'm4a' : fb.audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
      audioPath = `${fb.participantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
      const { error: erroAudio } = await supabase.storage
        .from(BUCKET_AUDIO)
        .upload(audioPath, fb.audioBlob, { contentType: fb.audioBlob.type || 'audio/webm' });
      if (erroAudio) {
        console.warn('Falha ao enviar áudio:', erroAudio.message);
        audioPath = null;
      }
    }

    const { error } = await supabase.from('feedback').insert({
      senior_id: fb.participantId,
      author_id: uid,
      author_role: fb.author,
      scenario_id: fb.scenarioId ?? null,
      scenario_title: fb.scenarioTitle ?? null,
      category: fb.category ?? null,
      rating: fb.rating ?? null,
      comment: fb.comment || '',
      audio_path: audioPath
    });
    if (error) throw new Error('Não foi possível enviar o feedback: ' + error.message);
  },

  /** Sem seniorId: todos os feedbacks que o usuário pode ver (o admin vê todos) */
  async listarFeedbacks(seniorId?: string): Promise<FeedbackNuvem[]> {
    if (!(await usuarioAtual())) return [];
    let consulta = supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(500);
    if (seniorId) consulta = consulta.eq('senior_id', seniorId);
    const { data, error } = await consulta;
    if (error) {
      console.warn('Falha ao listar feedbacks:', error.message);
      return [];
    }
    return (data || []) as FeedbackNuvem[];
  },

  async urlDoAudio(caminho: string): Promise<string | null> {
    const { data, error } = await supabase.storage.from(BUCKET_AUDIO).createSignedUrl(caminho, 60 * 60);
    return error ? null : data.signedUrl;
  },

  async atualizarStatusFeedback(id: number, status: StatusFeedback) {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  // -------------------------------------------------- EXPRESSÕES (anônimas)
  async enviarExpressao(e: UnrecognizedExpression) {
    if (!(await usuarioAtual())) return;
    const { error } = await supabase.from('unrecognized_expressions').upsert(
      {
        id: e.id,
        scenario_id: e.scenarioId,
        scenario_title: e.scenarioTitle,
        raw_text: e.rawText,
        normalized_text: e.normalizedText,
        input_type: e.inputType,
        stage: e.stage,
        status: e.status
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error) console.warn('Falha ao enviar expressão:', error.message);
  },

  async listarExpressoes(): Promise<UnrecognizedExpression[]> {
    if (!(await usuarioAtual())) return [];
    const { data, error } = await supabase
      .from('unrecognized_expressions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) return [];
    return (data || []).map((r: any) => ({
      id: r.id,
      seniorId: 'anonimo',
      scenarioId: r.scenario_id,
      scenarioTitle: r.scenario_title,
      rawText: r.raw_text,
      normalizedText: r.normalized_text,
      inputType: r.input_type,
      timestamp: r.created_at,
      stage: r.stage,
      status: r.status,
      idioma: 'pt-BR'
    }));
  },

  // -------------------------------------------------------------------- ADMIN
  async metricasAdmin(): Promise<MetricasAdmin> {
    const { data, error } = await supabase.rpc('admin_metrics');
    if (error) throw new Error(error.message);
    return data as MetricasAdmin;
  }
};
