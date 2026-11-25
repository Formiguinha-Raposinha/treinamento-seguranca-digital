import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  MessageSquareHeart,
  MessageSquare,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  CheckCircle2,
  Download,
  Check,
  X,
  Search,
  Lock
} from 'lucide-react';
import { Perfil } from '../../services/authService';
import {
  nuvemService,
  MetricasAdmin,
  FeedbackNuvem,
  StatusFeedback
} from '../../services/nuvemService';
import { UnrecognizedExpression } from '../../types/bancoDados';

interface PainelAdminProps {
  perfil: Perfil;
  onLogout: () => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

type AbaAdmin = 'metricas' | 'feedbacks' | 'expressoes';

export const PainelAdmin: React.FC<PainelAdminProps> = ({
  perfil,
  onLogout,
  highContrast,
  fontSizeLevel
}) => {
  const [aba, setAba] = useState<AbaAdmin>('metricas');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [metricas, setMetricas] = useState<MetricasAdmin | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackNuvem[]>([]);
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});
  const [filtroStatusFb, setFiltroStatusFb] = useState<'todos' | StatusFeedback>('todos');
  const [filtroAutorFb, setFiltroAutorFb] = useState<'todos' | 'senior' | 'family'>('todos');

  const [expressoes, setExpressoes] = useState<UnrecognizedExpression[]>([]);
  const [filtroStatusExp, setFiltroStatusExp] = useState<'todos' | 'pending' | 'mapped' | 'ignored'>('pending');
  const [buscaExp, setBuscaExp] = useState('');

  const carregarTudo = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [m, fbs, exps] = await Promise.all([
        nuvemService.metricasAdmin(),
        nuvemService.listarFeedbacks(),
        nuvemService.listarExpressoes()
      ]);
      setMetricas(m);
      setFeedbacks(fbs);
      setExpressoes(exps);

      // Gera URLs temporárias (1h) para ouvir áudios de feedback
      const entries = await Promise.all(
        fbs
          .filter(f => Boolean(f.audio_path))
          .map(async f => [f.id, await nuvemService.urlDoAudio(f.audio_path!)] as const)
      );
      const mapa: Record<number, string> = {};
      entries.forEach(([id, url]) => {
        if (url) mapa[id] = url;
      });
      setAudioUrls(mapa);
    } catch (err: any) {
      setErro(err?.message || 'Erro ao carregar dados do painel administrativo.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const mudarStatusFeedback = async (id: number, status: StatusFeedback) => {
    try {
      await nuvemService.atualizarStatusFeedback(id, status);
      setFeedbacks(prev => prev.map(f => (f.id === id ? { ...f, status } : f)));
      if (metricas) {
        const novos = feedbacks.filter(f => (f.id === id ? status === 'novo' : f.status === 'novo')).length;
        setMetricas({ ...metricas, feedbacks_novos: novos });
      }
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível atualizar o status.');
    }
  };

  const mudarStatusExpressao = async (id: string, status: 'mapped' | 'ignored') => {
    try {
      await nuvemService.atualizarStatusExpressao(id, status);
      setExpressoes(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível atualizar a expressão.');
    }
  };

  const exportarExpressoesCsv = () => {
    const cabecalho = 'id;cenario;texto_original;tipo_entrada;estagio;status;data\n';
    const linhas = expressoes
      .map(e =>
        [
          e.id,
          e.scenarioTitle || e.scenarioId,
          `"${(e.rawText || '').replace(/"/g, '""')}"`,
          e.inputType,
          e.stage,
          e.status,
          e.timestamp
        ].join(';')
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expressoes_anonimas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fontSizeClasses = ['text-sm', 'text-base', 'text-lg'][fontSizeLevel] || 'text-base';
  const cardCls = highContrast
    ? 'bg-zinc-900 border-2 border-yellow-400 text-white'
    : 'bg-white border border-slate-200 text-slate-900 shadow-sm';

  const feedbacksFiltrados = feedbacks.filter(f => {
    if (filtroStatusFb !== 'todos' && f.status !== filtroStatusFb) return false;
    if (filtroAutorFb !== 'todos' && f.author_role !== filtroAutorFb) return false;
    return true;
  });

  const expressoesFiltradas = expressoes.filter(e => {
    if (filtroStatusExp !== 'todos' && e.status !== filtroStatusExp) return false;
    if (buscaExp.trim()) {
      const q = buscaExp.toLowerCase();
      return (
        e.rawText.toLowerCase().includes(q) ||
        (e.scenarioTitle || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className={`max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6 ${fontSizeClasses} ${
      highContrast ? 'text-white' : 'text-slate-900'
    }`}>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 mb-1">
            <Lock className="w-3.5 h-3.5 text-blue-700" />
            <span>Coordenação / Administração</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Painel de Métricas, Eficiência & Feedbacks
          </h1>
          <p className="text-xs sm:text-sm opacity-75">
            Conectado como <strong>{perfil.name || 'Coordenação'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={carregarTudo}
            disabled={carregando}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-1.5 ${
              highContrast ? 'border-yellow-400 text-yellow-300' : 'bg-white hover:bg-slate-100 border-slate-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Aviso LGPD / Privacidade */}
      <div className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-center gap-2.5 ${
        highContrast
          ? 'bg-zinc-900 border-yellow-400 text-yellow-200'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span>
          <strong>Privacidade garantida:</strong> este painel exibe apenas estatísticas agregadas e anônimas. Nomes, telefones e conversas individuais dos idosos não são expostos aqui.
        </span>
      </div>

      {erro && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-sm font-bold">
          {erro}
        </div>
      )}

      {/* Abas */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <button
          type="button"
          onClick={() => setAba('metricas')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
            aba === 'metricas'
              ? 'bg-blue-700 text-white shadow'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Métricas & Eficiência</span>
        </button>

        <button
          type="button"
          onClick={() => setAba('feedbacks')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
            aba === 'feedbacks'
              ? 'bg-blue-700 text-white shadow'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MessageSquareHeart className="w-4 h-4" />
          <span>Feedbacks & Relatos</span>
          {(metricas?.feedbacks_novos ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-400 text-black font-black">
              {metricas?.feedbacks_novos}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAba('expressoes')}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
            aba === 'expressoes'
              ? 'bg-blue-700 text-white shadow'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Expressões Não Reconhecidas</span>
          {expressoes.filter(e => e.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-400 text-black font-black">
              {expressoes.filter(e => e.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ABA 1: MÉTRICAS & EFICIÊNCIA */}
      {aba === 'metricas' && (
        <div className="space-y-6">
          {!metricas ? (
            <div className={`p-6 rounded-3xl ${cardCls}`}>Carregando métricas agregadas...</div>
          ) : (
            <>
              {/* Cards resumo */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className={`p-4 rounded-2xl ${cardCls}`}>
                  <p className="text-xs opacity-70 font-bold">Idosos Cadastrados</p>
                  <p className="text-2xl font-black mt-1 flex items-center gap-1.5">
                    <Users className="w-5 h-5 text-blue-600" />
                    {metricas.participantes}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl ${cardCls}`}>
                  <p className="text-xs opacity-70 font-bold">Ativos (30 dias)</p>
                  <p className="text-2xl font-black mt-1 text-emerald-600">{metricas.ativos_30d}</p>
                </div>
                <div className={`p-4 rounded-2xl ${cardCls}`}>
                  <p className="text-xs opacity-70 font-bold">Treinos Concluídos</p>
                  <p className="text-2xl font-black mt-1">{metricas.treinos}</p>
                </div>
                <div className={`p-4 rounded-2xl ${cardCls}`}>
                  <p className="text-xs opacity-70 font-bold">Taxa de Acerto Geral</p>
                  <p className="text-2xl font-black mt-1 text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-5 h-5" />
                    {metricas.taxa_acerto_geral}%
                  </p>
                </div>
                <div className={`p-4 rounded-2xl ${cardCls}`}>
                  <p className="text-xs opacity-70 font-bold">Familiares</p>
                  <p className="text-2xl font-black mt-1 text-purple-600">{metricas.familiares}</p>
                </div>
                <div className={`p-4 rounded-2xl ${cardCls}`}>
                  <p className="text-xs opacity-70 font-bold">Feedbacks Novos</p>
                  <p className="text-2xl font-black mt-1 text-amber-600">{metricas.feedbacks_novos}</p>
                </div>
              </div>

              {/* Tabela de eficiência por cenário */}
              <div className={`p-5 rounded-3xl space-y-3 ${cardCls}`}>
                <h2 className="text-lg font-black">Aprendizagem & Eficiência por Cenário</h2>
                {metricas.por_cenario.length === 0 ? (
                  <p className="text-sm opacity-75">Ainda não há treinos registrados na nuvem.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b opacity-75">
                          <th className="py-2 pr-3">Cenário</th>
                          <th className="py-2 px-2">Participantes</th>
                          <th className="py-2 px-2">Tentativas</th>
                          <th className="py-2 px-2">Acerto 1ª vez</th>
                          <th className="py-2 px-2">Acerto geral</th>
                          <th className="py-2 px-2">Média até acertar</th>
                          <th className="py-2 pl-2">Aprenderam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricas.por_cenario.map(c => (
                          <tr key={c.scenario_id} className="border-b last:border-0">
                            <td className="py-2.5 pr-3 font-bold">
                              {c.titulo || c.scenario_id}
                              {c.categoria && <span className="block text-[11px] font-normal opacity-70">{c.categoria}</span>}
                            </td>
                            <td className="py-2.5 px-2">{c.participantes}</td>
                            <td className="py-2.5 px-2">{c.tentativas}</td>
                            <td className="py-2.5 px-2">{c.acerto_primeira ?? 0}%</td>
                            <td className="py-2.5 px-2 font-black text-emerald-600">{c.taxa_acerto ?? 0}%</td>
                            <td className="py-2.5 px-2">{c.media_ate_acertar ?? '-'}x</td>
                            <td className="py-2.5 pl-2">{c.aprenderam}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Evolução semanal */}
              <div className={`p-5 rounded-3xl space-y-3 ${cardCls}`}>
                <h2 className="text-lg font-black">Evolução Semanal (últimas 12 semanas)</h2>
                {metricas.por_semana.length === 0 ? (
                  <p className="text-sm opacity-75">Sem registros nas últimas semanas.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {metricas.por_semana.map(s => (
                      <div key={s.semana} className="p-3 rounded-2xl border flex items-center justify-between text-xs sm:text-sm">
                        <div>
                          <p className="font-bold">Semana de {new Date(s.semana + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                          <p className="opacity-75">{s.treinos} treino(s)</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black">
                          {s.taxa_acerto ?? 0}% acerto
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ABA 2: FEEDBACKS & RELATOS */}
      {aba === 'feedbacks' && (
        <div className={`p-5 rounded-3xl space-y-4 ${cardCls}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black">Feedbacks e Pedidos de Melhoria</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={filtroAutorFb}
                onChange={(e) => setFiltroAutorFb(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border bg-white text-slate-900 font-bold"
              >
                <option value="todos">Todos os autores</option>
                <option value="senior">Participante (Idoso)</option>
                <option value="family">Familiar / Cuidador</option>
              </select>

              <select
                value={filtroStatusFb}
                onChange={(e) => setFiltroStatusFb(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border bg-white text-slate-900 font-bold"
              >
                <option value="todos">Todos os status</option>
                <option value="novo">Novo</option>
                <option value="em_analise">Em análise</option>
                <option value="resolvido">Resolvido</option>
              </select>
            </div>
          </div>

          {feedbacksFiltrados.length === 0 ? (
            <p className="text-sm opacity-75 italic">Nenhum feedback encontrado com esses filtros.</p>
          ) : (
            <div className="space-y-3">
              {feedbacksFiltrados.map(f => (
                <div key={f.id} className="p-4 rounded-2xl border space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full ${
                      f.author_role === 'family' ? 'bg-amber-100 text-amber-900' : 'bg-purple-100 text-purple-900'
                    }`}>
                      {f.author_role === 'family' ? 'Familiar' : 'Idoso'}
                    </span>
                    {f.category && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {({ ocorrido: 'Ocorrido', dificuldade: 'Dificuldade', sugestao: 'Sugestão', outro: 'Outro' } as const)[f.category]}
                      </span>
                    )}
                    {f.scenario_title && <span className="opacity-75">• {f.scenario_title}</span>}
                    {f.rating !== null && <span>{f.rating >= 5 ? '😄' : f.rating >= 3 ? '😐' : '😟'}</span>}
                    <span className="ml-auto opacity-65 font-normal">
                      {new Date(f.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {f.comment && <p className="text-sm whitespace-pre-wrap">{f.comment}</p>}
                  {audioUrls[f.id] && <audio controls src={audioUrls[f.id]} className="w-full" />}

                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="font-bold opacity-75">Status:</span>
                    {(['novo', 'em_analise', 'resolvido'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => mudarStatusFeedback(f.id, st)}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                          f.status === st
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {st === 'novo' ? 'Novo' : st === 'em_analise' ? 'Em análise' : 'Resolvido'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: EXPRESSÕES NÃO RECONHECIDAS */}
      {aba === 'expressoes' && (
        <div className={`p-5 rounded-3xl space-y-4 ${cardCls}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black">Expressões Digitadas/Faladas não Mapeadas</h2>
            <button
              type="button"
              onClick={exportarExpressoesCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={buscaExp}
                onChange={(e) => setBuscaExp(e.target.value)}
                placeholder="Buscar expressão ou cenário..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border bg-white text-slate-900 text-xs font-semibold"
              />
            </div>

            <select
              value={filtroStatusExp}
              onChange={(e) => setFiltroStatusExp(e.target.value as any)}
              className="px-3 py-2 rounded-xl border bg-white text-slate-900 text-xs font-bold"
            >
              <option value="pending">Pendentes</option>
              <option value="mapped">Mapeadas</option>
              <option value="ignored">Ignoradas</option>
              <option value="todos">Todas</option>
            </select>
          </div>

          {expressoesFiltradas.length === 0 ? (
            <p className="text-sm opacity-75 italic">Nenhuma expressão encontrada.</p>
          ) : (
            <div className="space-y-2">
              {expressoesFiltradas.map(e => (
                <div key={e.id} className="p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
                  <div>
                    <p className="font-black">"{e.rawText}"</p>
                    <p className="text-xs opacity-70">
                      {e.scenarioTitle || e.scenarioId} • {e.inputType === 'audio' ? 'Áudio' : 'Texto'} • {new Date(e.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => mudarStatusExpressao(e.id, 'mapped')}
                      disabled={e.status === 'mapped'}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 disabled:opacity-40 text-emerald-900 font-bold text-xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mapeada
                    </button>
                    <button
                      type="button"
                      onClick={() => mudarStatusExpressao(e.id, 'ignored')}
                      disabled={e.status === 'ignored'}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Ignorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
