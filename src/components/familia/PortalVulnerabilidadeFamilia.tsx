import React, { useState, useEffect } from 'react';
import { dbService, Feedback } from '../../services/bancoDadosService';
import { SeniorClient, FamilyVulnerabilityReport, SimulationSession } from '../../types/bancoDados';
import { audioService } from '../../services/audioService';
import { FeedbackModal } from '../FeedbackModal';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  HeartHandshake, 
  Printer, 
  Volume2, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  FileText, 
  UserCheck,
  MessageSquareWarning
} from 'lucide-react';

interface FamilyVulnerabilityPortalProps {
  onBack: () => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const FamilyVulnerabilityPortal: React.FC<FamilyVulnerabilityPortalProps> = ({
  onBack,
  highContrast,
  fontSizeLevel
}) => {
  const [seniors, setSeniors] = useState<SeniorClient[]>([]);
  const [activeSenior, setActiveSenior] = useState<SeniorClient | null>(null);
  const [report, setReport] = useState<FamilyVulnerabilityReport | null>(null);
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [isEditingSenior, setIsEditingSenior] = useState<boolean>(false);
  const [isAddingSenior, setIsAddingSenior] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({});

  const loadFeedbacks = async (seniorId: string) => {
    const list = await dbService.getFeedbackByParticipant(seniorId);
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFeedbacks(list);
  };

  // Gera URLs de reprodução para os áudios gravados
  useEffect(() => {
    const urls: Record<number, string> = {};
    feedbacks.forEach(f => {
      if (f.id !== undefined && f.audioBlob) urls[f.id] = URL.createObjectURL(f.audioBlob);
    });
    setAudioUrls(urls);
    return () => Object.values(urls).forEach(u => URL.revokeObjectURL(u));
  }, [feedbacks]);


  // Form states
  const [editName, setEditName] = useState('');
  const [editAgeGroup, setEditAgeGroup] = useState('70-79');
  const [editCaregiverName, setEditCaregiverName] = useState('');
  const [editCaregiverPhone, setEditCaregiverPhone] = useState('');
  const [editCaregiverRelation, setEditCaregiverRelation] = useState<'filho(a)' | 'neto(a)' | 'cônjuge' | 'cuidador(a)' | 'outro'>('filho(a)');

  const loadData = async () => {
    await dbService.init();
    const allSeniors = await dbService.getSeniors();
    setSeniors(allSeniors);
    
    const active = await dbService.getActiveSenior();
    setActiveSenior(active);
    
    if (active) {
      setEditName(active.name);
      setEditAgeGroup(active.ageGroup);
      setEditCaregiverName(active.caregiverName);
      setEditCaregiverPhone(active.caregiverPhone);
      setEditCaregiverRelation(active.caregiverRelationship);

      const rep = await dbService.generateFamilyReport(active.id);
      setReport(rep);

      const sessList = await dbService.getSessions(active.id);
      setSessions(sessList.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()));
      await loadFeedbacks(active.id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSenior = async (id: string) => {
    dbService.setActiveSeniorId(id);
    await loadData();
  };

  const handleSaveSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    if (isAddingSenior) {
      const newSenior: SeniorClient = {
        id: `senior_${Date.now()}`,
        name: editName.trim(),
        ageGroup: editAgeGroup,
        caregiverName: editCaregiverName.trim() || 'Familiar Responsável',
        caregiverPhone: editCaregiverPhone.trim() || '(65) 99999-9999',
        caregiverRelationship: editCaregiverRelation,
        riskLevel: 'moderado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await dbService.saveSenior(newSenior);
      dbService.setActiveSeniorId(newSenior.id);
      setIsAddingSenior(false);
    } else if (activeSenior) {
      const updated: SeniorClient = {
        ...activeSenior,
        name: editName.trim(),
        ageGroup: editAgeGroup,
        caregiverName: editCaregiverName.trim(),
        caregiverPhone: editCaregiverPhone.trim(),
        caregiverRelationship: editCaregiverRelation,
        updatedAt: new Date().toISOString()
      };
      await dbService.saveSenior(updated);
      setIsEditingSenior(false);
    }
    await loadData();
  };

  const handleHearSummary = () => {
    if (!report || !activeSenior) return;
    const text = `Portal de Apoio à Família. Relatório de Segurança de ${activeSenior.name}. Índice de Vulnerabilidade Digital estimado em ${report.vulnerabilityIndex} por cento. Foram realizadas ${report.totalSessions} sessões de simulação com ${report.safeCount} desfechos seguros. Nível de risco identificado: ${report.riskLevel}. Principais recomendações para a família: reduza limites bancários de Pix e defina uma palavra-código de segurança familiar.`;
    audioService.speak(text);
  };

  const handlePrint = () => {
    audioService.stop();
    window.print();
  };

  const fontSizeClasses = [
    'text-sm',
    'text-base',
    'text-lg'
  ][fontSizeLevel] || 'text-base';

  if (!activeSenior || !report) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
        <p className="text-slate-600">Carregando painel da família...</p>
      </div>
    );
  }

  const riskBadgeColor = report.riskLevel === 'baixo' 
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
    : report.riskLevel === 'moderado'
    ? 'bg-amber-100 text-amber-800 border-amber-300'
    : 'bg-red-100 text-red-800 border-red-300';

  return (
    <div className={`max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 transition-all print:p-0 ${fontSizeClasses} ${
      highContrast ? 'text-white' : 'text-slate-900'
    }`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2.5 rounded-2xl border transition-all active:scale-95 ${
              highContrast 
                ? 'bg-yellow-400 text-black border-yellow-300' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
            }`}
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300 mb-1">
              <HeartHandshake className="w-3.5 h-3.5 text-purple-700" />
              <span>Portal de Apoio & Proteção Familiar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Diagnóstico de Vulnerabilidade a Golpes
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Relatório para familiares e cuidadores acompanharem o comportamento preventivo de seu parente idoso.
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleHearSummary}
            className={`px-3 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 border transition-all ${
              highContrast
                ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400/10'
                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shadow-sm'
            }`}
          >
            <Volume2 className="w-4 h-4 text-purple-600" />
            <span>Ouvir Relatório</span>
          </button>

          <button
            onClick={() => setShowFeedback(true)}
            className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Relatar algo que aconteceu ou enviar sugestão"
          >
            <MessageSquareWarning className="w-4 h-4" />
            <span>Relatar Ocorrido / Feedback</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Laudo (PDF)</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho de Impressão Oficial */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <h1 className="text-2xl font-black text-slate-900">IFMT • Instituto Federal de Mato Grosso — Campus Cuiabá</h1>
        <p className="text-sm font-bold text-slate-700">Projeto de Extensão: Segurança Digital e Proteção Prática de Idosos contra Fraudes</p>
        <p className="text-xs text-slate-500 mt-1">Laudo de Vulnerabilidade e Recomendações Familiares • Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Card do Idoso e Cuidador Responsável */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all shadow-md ${
        highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-gradient-to-r from-purple-50/60 via-white to-blue-50/60 border-purple-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
              {activeSenior.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {activeSenior.name}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  Faixa: {activeSenior.ageGroup} anos
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${riskBadgeColor}`}>
                  {report.riskLevel === 'baixo' ? '🛡️ Risco Baixo' : report.riskLevel === 'moderado' ? '⚠️ Risco Moderado' : '🚨 Risco Alto'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Cuidador(a) / Familiar Cadastrado: <strong className="text-slate-800">{activeSenior.caregiverName}</strong> ({activeSenior.caregiverRelationship}) • {activeSenior.caregiverPhone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {seniors.length > 1 && (
              <select
                value={activeSenior.id}
                onChange={(e) => handleSelectSenior(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-purple-300 bg-white text-xs font-bold text-slate-700 shadow-sm"
              >
                {seniors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => {
                setIsEditingSenior(true);
                setIsAddingSenior(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-extrabold text-slate-700 shadow-sm"
            >
              Editar Dados
            </button>

            <button
              onClick={() => {
                setEditName('');
                setEditAgeGroup('70-79');
                setEditCaregiverName('');
                setEditCaregiverPhone('');
                setIsAddingSenior(true);
                setIsEditingSenior(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-100 border border-purple-300 hover:bg-purple-200 text-xs font-black text-purple-900 flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Idoso</span>
            </button>
          </div>
        </div>

        {/* Formulário de Edição / Novo Idoso */}
        {(isEditingSenior || isAddingSenior) && (
          <form onSubmit={handleSaveSenior} className="mt-5 pt-4 border-t border-purple-200 space-y-3 bg-white/70 p-4 rounded-2xl print:hidden">
            <h3 className="font-black text-sm text-purple-900">
              {isAddingSenior ? 'Cadastrar Novo Participante Idoso' : 'Atualizar Dados do Familiar'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo do Idoso:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Dona Francisca"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Faixa Etária:</label>
                <select
                  value={editAgeGroup}
                  onChange={(e) => setEditAgeGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value="60-69">60 a 69 anos</option>
                  <option value="70-79">70 a 79 anos</option>
                  <option value="80+">80 anos ou mais</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Cuidador / Filho Responsável:</label>
                <input
                  type="text"
                  value={editCaregiverName}
                  onChange={(e) => setEditCaregiverName(e.target.value)}
                  placeholder="Ex: Carlos (Filho)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telefone do Cuidador:</label>
                <input
                  type="text"
                  value={editCaregiverPhone}
                  onChange={(e) => setEditCaregiverPhone(e.target.value)}
                  placeholder="(65) 99999-9999"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingSenior(false);
                  setIsAddingSenior(false);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-sm"
              >
                Salvar Cadastro
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Termômetro / Visão Geral da Vulnerabilidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Índice de Vulnerabilidade */}
        <div className={`p-5 rounded-3xl border-2 flex flex-col justify-between ${
          highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Índice de Vulnerabilidade</span>
              <AlertTriangle className={`w-4 h-4 ${report.vulnerabilityIndex > 30 ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{report.vulnerabilityIndex}%</span>
              <span className="text-xs font-bold text-slate-500">de chance de risco</span>
            </div>
            {/* Barra de Progresso Inversa */}
            <div className="w-full h-3 bg-slate-100 rounded-full mt-3 overflow-hidden border">
              <div 
                className={`h-full transition-all duration-700 rounded-full ${
                  report.vulnerabilityIndex <= 20 ? 'bg-emerald-500' : report.vulnerabilityIndex <= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(report.vulnerabilityIndex, 5)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {report.vulnerabilityIndex === 0 
              ? 'Nenhum risco detectado nas simulações até o momento.'
              : 'Baseado no comportamento sob pressão e identificação de links suspeitos.'}
          </p>
        </div>

        {/* Card 2: Taxa de Sobrevivência / Defesa */}
        <div className={`p-5 rounded-3xl border-2 flex flex-col justify-between ${
          highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Taxa de Proteção Segura</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-600">{report.safeRate}%</span>
              <span className="text-xs font-bold text-slate-500">acertos defensivos</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full mt-3 overflow-hidden border">
              <div 
                className="h-full bg-emerald-600 transition-all duration-700 rounded-full"
                style={{ width: `${Math.max(report.safeRate, 5)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {report.safeCount} de {report.totalSessions} testes concluídos com atitude 100% segura.
          </p>
        </div>

        {/* Card 3: Nível de Risco Familiar */}
        <div className={`p-5 rounded-3xl border-2 flex flex-col justify-between ${
          highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Classificação de Risco</span>
              <UserCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-3">
              <span className={`inline-block text-xl font-black px-3 py-1 rounded-2xl border ${riskBadgeColor}`}>
                {report.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            {report.riskLevel === 'baixo' 
              ? 'O idoso demonstra forte postura de cautela e busca canais oficiais.'
              : report.riskLevel === 'moderado'
              ? 'Atenção especial necessária para pedidos imediatos de Pix e links no SMS.'
              : 'Intervenção familiar recomendada: proteger limites bancários imediatamente.'}
          </p>
        </div>
      </div>

      {/* Gráfico / Barras de Vulnerabilidade por Categoria de Golpe */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all ${
        highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>Vulnerabilidade por Tipo de Golpe no Cotidiano</span>
        </h3>

        <div className="space-y-4">
          {Object.entries(report.categoryMetrics).length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 italic py-2">
              Nenhuma simulação registrada ainda para este participante. Inicie os treinamentos no catálogo para gerar o gráfico!
            </p>
          ) : (
            Object.entries(report.categoryMetrics).map(([catName, stats]) => {
              const rate = stats.vulnerabilityRate;
              const barColor = rate <= 20 ? 'bg-emerald-500' : rate <= 50 ? 'bg-amber-500' : 'bg-red-500';

              return (
                <div key={catName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-slate-800 flex items-center gap-2">
                      <span>{catName}</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({stats.fallen} quedas em {stats.total} testes)
                      </span>
                    </span>
                    <span className={rate > 40 ? 'text-red-600 font-black' : 'text-slate-700'}>
                      {rate}% de risco
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border">
                    <div 
                      className={`h-full transition-all duration-700 rounded-full ${barColor}`} 
                      style={{ width: `${Math.max(rate, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Vulnerabilidades Específicas Detectadas */}
      {report.detectedVulnerabilities.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Pontos de Alerta Específicos Identificados</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.detectedVulnerabilities.map((v, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl border-2 border-red-200 bg-red-50/50 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-red-800">{v.title}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-200 text-red-900">
                    Severidade {v.severity}
                  </span>
                </div>
                <p className="text-xs text-red-900/80 leading-relaxed">
                  {v.description}
                </p>
                <p className="text-[11px] font-bold text-slate-500 pt-1">
                  Detectado em: {v.scenarios.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist / Plano de Ação para a Família */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 transition-all ${
        highContrast ? 'bg-zinc-900 border-yellow-400' : 'bg-gradient-to-r from-purple-50 via-white to-pink-50 border-purple-300 shadow-md'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <HeartHandshake className="w-6 h-6 text-purple-700" />
          <h3 className="text-base sm:text-lg font-black text-purple-950">
            Plano de Ação para a Família & Cuidadores
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mb-4">
          Medidas práticas e simples para aplicar na rotina da casa e blindar seu familiar contra criminosos:
        </p>

        <div className="space-y-3">
          {report.familyRecommendations.map((rec, idx) => (
            <div 
              key={idx} 
              className="p-3.5 bg-white rounded-2xl border border-purple-200 flex items-start gap-3 shadow-sm"
            >
              <div className="mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">{rec.title}</h4>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    rec.urgency === 'imediata' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.urgency}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {rec.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Histórico Recente de Treinamentos do Idoso */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          <span>Histórico de Sessões Realizadas pelo Idoso</span>
        </h3>

        {sessions.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-2xl border text-center text-xs text-slate-500">
            Nenhuma sessão registrada no banco de dados ainda. Faça uma simulação para visualizar o histórico aqui!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {sessions.slice(0, 10).map((sess) => (
              <div 
                key={sess.id}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  sess.outcome === 'safe' ? 'bg-white border-emerald-200' : 'bg-white border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    sess.outcome === 'safe' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {sess.outcome === 'safe' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">{sess.scenarioTitle}</h4>
                    <p className="text-xs text-slate-500">{sess.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                  <span className="text-slate-400">
                    {new Date(sess.completedAt).toLocaleDateString('pt-BR')} às {new Date(sess.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                    sess.outcome === 'safe' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {sess.outcome === 'safe' ? 'Defendeu-se' : 'Caiu no Golpe'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de relatos e feedbacks (familiar e idoso) */}
      <div className={`rounded-3xl border p-5 space-y-3 print:hidden ${
        highContrast ? 'border-yellow-400' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-amber-600" />
            Relatos e Feedbacks
          </h2>
          <button
            onClick={() => setShowFeedback(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Novo relato
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Use este espaço quando {activeSenior.name} não conseguir explicar o que aconteceu: descreva tentativas de golpe,
          dificuldades no treino ou sugestões. Você pode escrever ou gravar um áudio.
        </p>

        {feedbacks.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Nenhum relato registrado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {feedbacks.map(f => (
              <li key={f.id} className={`rounded-2xl border p-3 text-sm space-y-1.5 ${
                highContrast ? 'border-yellow-400' : f.author === 'family' ? 'bg-amber-50 border-amber-200' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className={`px-2 py-0.5 rounded-full ${f.author === 'family' ? 'bg-amber-200 text-amber-900' : 'bg-purple-200 text-purple-900'}`}>
                    {f.author === 'family' ? 'Familiar' : 'Idoso'}
                  </span>
                  {f.category && <span className="text-slate-600">{({ ocorrido: 'Ocorrido', dificuldade: 'Dificuldade', sugestao: 'Sugestão', outro: 'Outro' } as const)[f.category]}</span>}
                  {f.scenarioTitle && <span className="text-slate-600">• {f.scenarioTitle}</span>}
                  {f.rating !== undefined && <span>{f.rating >= 5 ? '😄' : f.rating >= 3 ? '😐' : '😟'}</span>}
                  <span className="ml-auto text-slate-500 font-normal">{new Date(f.date).toLocaleString('pt-BR')}</span>
                </div>
                {f.comment && <p className="whitespace-pre-wrap">{f.comment}</p>}
                {f.id !== undefined && audioUrls[f.id] && <audio controls src={audioUrls[f.id]} className="w-full" />}
              </li>
            ))}
          </ul>
        )}
      </div>

      <FeedbackModal
        isOpen={showFeedback}
        participantId={activeSenior.id}
        author="family"
        highContrast={highContrast}
        onClose={() => setShowFeedback(false)}
        onSaved={() => loadFeedbacks(activeSenior.id)}
      />
    </div>
  );
};

export const PortalVulnerabilidadeFamilia = FamilyVulnerabilityPortal;
