import React, { useState, useEffect } from 'react';
import { BarraAcessibilidade } from './components/acessibilidade/BarraAcessibilidade';
import { SimuladorWhatsapp } from './components/simulador/SimuladorWhatsapp';
import { DicionarioExpressoes } from './components/dicionario/DicionarioExpressoes';
import { PainelEvolucaoIdoso } from './components/evolucao/PainelEvolucaoIdoso';
import { ModalCertificado } from './components/certificado/ModalCertificado';
import { PortalVulnerabilidadeFamilia } from './components/familia/PortalVulnerabilidadeFamilia';
import { FeedbackModal } from './components/FeedbackModal';
import { ModalIdentificacaoIdoso } from './components/autenticacao/ModalIdentificacaoIdoso';
import { TelaLogin } from './components/autenticacao/TelaLogin';
import { CardCodigoFamilia } from './components/autenticacao/CardCodigoFamilia';
import { PainelAdmin } from './components/admin/PainelAdmin';
import { supabase, supabaseConfigurado } from './lib/supabase';
import { authService, Perfil } from './services/authService';
import { nuvemService } from './services/nuvemService';
import { bancoDadosService } from './services/bancoDadosService';
import { progressoUsuarioService } from './services/progressoUsuarioService';
import { availableScenarios } from './data/scenarios';
import { Scenario } from './types/cenario';
import { SeniorClient } from './types/bancoDados';
import { audioService } from './services/audioService';
import { 
  ShieldCheck, 
  Volume2, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  Globe, 
  PhoneCall, 
  BarChart3, 
  Award, 
  CheckCircle2, 
  Lock, 
  User, 
  Landmark, 
  Gift, 
  CreditCard,
  HeartHandshake,
  UserCheck,
  LogOut,
  Loader2
} from 'lucide-react';

export const App: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentView, setCurrentView] = useState<'catalog' | 'dashboard' | 'evolution' | 'family'>('catalog');
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [activeSenior, setActiveSenior] = useState<SeniorClient | null>(null);
  const [feedbackScenario, setFeedbackScenario] = useState<{ id: string; title: string } | null>(null);
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(1); // Padrão: Grande para facilitar leitura
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregandoAuth, setCarregandoAuth] = useState<boolean>(supabaseConfigurado);
  const [, setProgressoVersao] = useState<number>(0);

  const sincronizarIdosoDaNuvem = async (p: Perfil) => {
    await bancoDadosService.init();
    const seniorLocal: SeniorClient = {
      id: p.id,
      name: p.name || 'Participante',
      ageGroup: p.age_group || 'nao-informar',
      phone: p.phone || undefined,
      caregiverName: 'Familiar Vinculado',
      caregiverPhone: '',
      caregiverRelationship: 'filho(a)',
      riskLevel: 'moderado',
      createdAt: p.created_at,
      updatedAt: new Date().toISOString()
    };
    await bancoDadosService.saveSenior(seniorLocal);
    bancoDadosService.setActiveSeniorId(seniorLocal.id);
    setActiveSenior(seniorLocal);

    progressoUsuarioService.usarUsuario(p.id);
    progressoUsuarioService.setUserName(seniorLocal.name);

    const sessoes = await nuvemService.baixarSessoes(p.id);
    for (const s of sessoes) {
      await bancoDadosService.addSession(s, { sincronizar: false });
    }
    progressoUsuarioService.reconstruirDeSessoes(sessoes);
    setProgressoVersao(v => v + 1);
  };

  const carregarSessao = async () => {
    if (!supabaseConfigurado) return;
    setCarregandoAuth(true);
    try {
      const p = await authService.obterPerfil();
      setPerfil(p);
      if (p?.role === 'senior') {
        await sincronizarIdosoDaNuvem(p);
      } else {
        setActiveSenior(null);
      }
    } catch (err) {
      console.warn('Erro ao carregar perfil autenticado:', err);
      setPerfil(null);
    } finally {
      setCarregandoAuth(false);
    }
  };

  const handleLogout = async () => {
    audioService.stop();
    setSelectedScenario(null);
    setCurrentView('catalog');
    await authService.sair();
    setPerfil(null);
    setActiveSenior(null);
    setProgressoVersao(v => v + 1);
  };

  useEffect(() => {
    audioService.registerStateChange((speaking) => {
      setIsSpeaking(speaking);
    });

    if (!supabaseConfigurado) {
      bancoDadosService.init().then(async () => {
        const senior = await bancoDadosService.getActiveSenior();
        if (senior) {
          setActiveSenior(senior);
          progressoUsuarioService.setUserName(senior.name);
        }
      }).catch(err => console.warn('Erro ao inicializar DB:', err));
      return;
    }

    carregarSessao();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setPerfil(null);
        setActiveSenior(null);
        setSelectedScenario(null);
        setCurrentView('catalog');
        setCarregandoAuth(false);
      } else if (event === 'SIGNED_IN') {
        carregarSessao();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleWelcomeSpeech = () => {
    const text = "Olá! Bem-vindo à Plataforma de Treinamento em Segurança Digital. Aqui você pode praticar situações de mensagens, e-mails, ligações e páginas de internet em um ambiente totalmente seguro, sem nenhum perigo real. Escolha um treinamento abaixo para começar!";
    audioService.speak(text);
  };

  const fontSizeClasses = [
    'text-base',          // Normal
    'text-lg sm:text-xl', // Grande
    'text-xl sm:text-2xl' // Extra Grande
  ][fontSizeLevel] || 'text-lg';

  const totalScenarios = availableScenarios.length;
  const completedSafeCount = Math.min(progressoUsuarioService.getCompletedSafeCount(), totalScenarios);
  const userName = progressoUsuarioService.getProgress().profile.name;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      highContrast ? 'bg-black text-white' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Barra de Acessibilidade Superior */}
      <BarraAcessibilidade
        fontSizeLevel={fontSizeLevel}
        onFontSizeChange={setFontSizeLevel}
        highContrast={highContrast}
        onHighContrastToggle={() => setHighContrast(prev => !prev)}
        isSpeaking={isSpeaking}
      />

      {/* Conteúdo Principal */}
      <div className={`flex-1 flex flex-col items-center ${
        selectedScenario || currentView !== 'catalog' || (supabaseConfigurado && perfil?.role !== 'senior')
          ? 'p-0 sm:p-3 md:p-4 justify-start' 
          : 'p-3 sm:p-6 justify-center'
      }`}>
        {supabaseConfigurado && carregandoAuth ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="font-bold text-sm opacity-75">Verificando seu acesso...</p>
          </div>
        ) : supabaseConfigurado && !perfil ? (
          <TelaLogin
            onAuthSuccess={carregarSessao}
            highContrast={highContrast}
            fontSizeLevel={fontSizeLevel}
          />
        ) : supabaseConfigurado && perfil?.role === 'admin' ? (
          <PainelAdmin
            perfil={perfil}
            onLogout={handleLogout}
            highContrast={highContrast}
            fontSizeLevel={fontSizeLevel}
          />
        ) : supabaseConfigurado && perfil?.role === 'family' ? (
          <PortalVulnerabilidadeFamilia
            perfil={perfil}
            isStandaloneRole
            onBack={handleLogout}
            onLogout={handleLogout}
            highContrast={highContrast}
            fontSizeLevel={fontSizeLevel}
          />
        ) : selectedScenario ? (
          <SimuladorWhatsapp
            key={selectedScenario.id}
            scenario={selectedScenario}
            onBack={() => {
              audioService.stop();
              // Ao final de cada treino, pede o feedback do idoso
              setFeedbackScenario({ id: selectedScenario.id, title: selectedScenario.title });
              setSelectedScenario(null);
            }}
            onViewCertificate={() => setShowCertificateModal(true)}
            onSwitchScenario={(newScenario) => {
              audioService.stop();
              setSelectedScenario(newScenario);
            }}
            highContrast={highContrast}
            fontSizeLevel={fontSizeLevel}
          />
        ) : currentView === 'evolution' ? (
          /* Visualização 2: Painel de Evolução Individual do Aluno / Idoso */
          <div className="max-w-4xl w-full mx-auto">
            <PainelEvolucaoIdoso
              onBack={() => {
                audioService.stop();
                setCurrentView('catalog');
              }}
              onSelectScenario={(scen) => {
                audioService.stop();
                setSelectedScenario(scen);
                setCurrentView('catalog');
              }}
              onOpenCertificate={() => setShowCertificateModal(true)}
              highContrast={highContrast}
              fontSizeLevel={fontSizeLevel}
            />
          </div>
        ) : currentView === 'dashboard' ? (
          /* Visualização 3: Dicionário de Expressões & Métricas para o Professor */
          <div className="max-w-4xl w-full mx-auto">
            <DicionarioExpressoes
              onBack={() => {
                audioService.stop();
                setCurrentView('catalog');
              }}
              onOpenCertificate={() => setShowCertificateModal(true)}
              highContrast={highContrast}
              fontSizeLevel={fontSizeLevel}
            />
          </div>
        ) : currentView === 'family' ? (
          /* Visualização 4: Portal da Família & Diagnóstico de Vulnerabilidade */
          <div className="max-w-5xl w-full mx-auto">
            <PortalVulnerabilidadeFamilia
              onBack={() => {
                audioService.stop();
                setCurrentView('catalog');
              }}
              highContrast={highContrast}
              fontSizeLevel={fontSizeLevel}
            />
          </div>
        ) : (
          /* Visualização 4: Tela Inicial / Catálogo de Treinamentos */
          <div className="max-w-3xl w-full mx-auto space-y-6">
            {/* Aviso discreto quando rodando sem variáveis do Supabase */}
            {!supabaseConfigurado && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                Modo demonstração local: os dados ficam salvos apenas neste aparelho. Configure o Supabase no <code>.env</code> para ativar o login entre celulares.
              </div>
            )}

            {/* Barra de Ações Rápidas */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {supabaseConfigurado && perfil
                  ? `Olá, ${perfil.name || userName}!`
                  : 'Projeto de Extensão Universitária • Segurança Digital'}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {/* Botão de Identificação / Login local (apenas modo demonstração offline) */}
                {!supabaseConfigurado && (
                  <button
                    onClick={() => {
                      audioService.stop();
                      setShowLoginModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 hover:bg-purple-200 active:scale-95 transition-all text-xs font-black flex items-center gap-1.5 shadow-sm"
                    title="Alterar ou gerenciar quem está participando do treinamento"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-purple-700" />
                    <span>Participante: {activeSenior?.name || userName}</span>
                    <span className="text-[10px] bg-purple-300 text-purple-950 px-1.5 py-0.2 rounded font-black">Trocar</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    audioService.stop();
                    setCurrentView('evolution');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 active:scale-95 transition-all text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                  title="Ver meu progresso individual e onde estou errando"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Meu Progresso ({completedSafeCount}/{totalScenarios})</span>
                </button>

                {!supabaseConfigurado && (
                  <>
                    <button
                      onClick={() => {
                        audioService.stop();
                        setCurrentView('dashboard');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 active:scale-95 transition-all text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                      title="Ver métricas acadêmicas do projeto para o professor"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Painel do Professor / Métricas</span>
                    </button>

                    <button
                      onClick={() => {
                        audioService.stop();
                        setCurrentView('family');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-300 hover:bg-purple-100 active:scale-95 transition-all text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                      title="Portal da Família e Diagnóstico de Vulnerabilidade do Idoso"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-purple-700" />
                      <span>Portal da Família</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    audioService.stop();
                    setShowCertificateModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 active:scale-95 transition-all text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                  title="Emitir certificado de capacitação"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Certificado</span>
                </button>

                {supabaseConfigurado && perfil && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white active:scale-95 transition-all text-xs font-black flex items-center gap-1.5 shadow-sm"
                    title="Sair da sua conta"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                )}
              </div>
            </div>

            {/* Banner de Boas-vindas Acessível */}
            <div className={`p-6 sm:p-8 rounded-3xl border-2 shadow-xl transition-all ${
              highContrast
                ? 'bg-zinc-900 border-yellow-400 text-white'
                : 'bg-gradient-to-br from-emerald-800 to-teal-900 text-white border-emerald-700'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs sm:text-sm font-bold mb-3">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span>Treinamento Prático & Sem Riscos</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    Olá! Vamos praticar juntos?
                  </h1>
                  <p className={`mt-2 ${fontSizeClasses} text-emerald-100 max-w-xl leading-relaxed`}>
                    Aprenda a reconhecer mensagens suspeitas, links falsos e ligações perigosas praticando em um ambiente 100% simulado e seguro.
                  </p>
                </div>

                {/* Botão de Áudio de Boas-Vindas */}
                <button
                  onClick={handleWelcomeSpeech}
                  className="px-4 py-3 rounded-2xl bg-white text-emerald-900 font-extrabold flex items-center gap-2 shadow-lg hover:bg-emerald-50 active:scale-95 transition-all text-sm sm:text-base shrink-0"
                  title="Ouvir instruções de início"
                >
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                  <span>Ouvir Instruções</span>
                </button>
              </div>

              {/* Lógica Central em Destaque */}
              <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-emerald-200">
                <span>Lógica de Segurança:</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">RECEBI</span>
                <span>→</span>
                <span className="bg-amber-400 text-black px-2.5 py-1 rounded-lg">PAREI</span>
                <span>→</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">DESCONFIEI</span>
                <span>→</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">VERIFIQUEI</span>
                <span>→</span>
                <span className="bg-emerald-400 text-black px-2.5 py-1 rounded-lg">AJA COM SEGURANÇA</span>
              </div>
            </div>

            {/* Card de Atalho para o Painel de Evolução do Participante */}
            <div
              onClick={() => {
                audioService.stop();
                setCurrentView('evolution');
              }}
              className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm hover:shadow-md active:scale-[0.99] ${
                highContrast
                  ? 'bg-zinc-900 border-yellow-400 text-white'
                  : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-emerald-300 hover:border-emerald-500'
              }`}
              title="Abrir meu histórico e diagnóstico de segurança"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-10 px-2 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {completedSafeCount}/{totalScenarios}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-slate-900">
                    Olá, {userName}! Acompanhe sua Evolução em Segurança
                  </p>
                  <p className="text-xs text-slate-600">
                    Veja onde você já domina e quais pontos precisam de atenção para não cair em fraudes.
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-700 flex items-center gap-1 shrink-0">
                <span className="hidden sm:inline">Ver Meu Diagnóstico</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            {/* Card de Código para Familiar (visível para o idoso logado) */}
            {supabaseConfigurado && perfil?.role === 'senior' && (
              <CardCodigoFamilia
                perfil={perfil}
                onPerfilAtualizado={setPerfil}
                highContrast={highContrast}
              />
            )}

            {/* Card de Atalho para o Portal da Família & Cuidadores (apenas modo offline) */}
            {!supabaseConfigurado && (
              <div
                onClick={() => {
                  audioService.stop();
                  setCurrentView('family');
                }}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm hover:shadow-md active:scale-[0.99] ${
                  highContrast
                    ? 'bg-zinc-900 border-yellow-400 text-white'
                    : 'bg-gradient-to-r from-purple-50 via-white to-pink-50 border-purple-200 hover:border-purple-400'
                }`}
                title="Abrir o Portal da Família e Recomendações aos Cuidadores"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 px-2 rounded-2xl bg-purple-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Área para Filhos & Cuidadores • Diagnóstico de Vulnerabilidade
                    </p>
                    <p className="text-xs text-slate-600">
                      Veja os gráficos de vulnerabilidade daquele idoso, histórico de testes e checklist de proteção familiar.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-700 flex items-center gap-1 shrink-0">
                  <span className="hidden sm:inline">Ver Laudo Familiar</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            )}

            {/* Seção: Escolha seu Treinamento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span>Ambientes de Treinamento Disponíveis</span>
                </h2>
              </div>

              {/* Lista de Cenários de Treinamento */}
              <div className="grid grid-cols-1 gap-4">
                {availableScenarios.map((scenario) => {
                  const isInss = scenario.id === 'falsa-prova-vida-inss';
                  const isMotoboy = scenario.id === 'golpe-falso-motoboy';
                  const isGift = scenario.id === 'golpe-presente-taxa-entrega';
                  const isLinkScenario = scenario.category.includes('Links') || isInss;
                  const isPhoneScenario = scenario.category.includes('Telefone') || scenario.environment === 'phone' || isMotoboy;

                  const badgeColor = isInss
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : isMotoboy
                    ? 'bg-red-100 text-red-900 border-red-300'
                    : isGift
                    ? 'bg-pink-100 text-pink-900 border-pink-300'
                    : isPhoneScenario
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : isLinkScenario
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                  const buttonColor = isInss
                    ? 'bg-blue-700 hover:bg-blue-800 text-white'
                    : isMotoboy
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : isGift
                    ? 'bg-pink-600 hover:bg-pink-700 text-white'
                    : isPhoneScenario
                    ? 'bg-purple-700 hover:bg-purple-800 text-white'
                    : isLinkScenario
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white';

                  const cardBorder = highContrast
                    ? 'bg-zinc-900 border-yellow-400 hover:border-white text-white'
                    : isInss
                    ? 'bg-gradient-to-r from-white via-white to-blue-50/50 border-blue-300 hover:border-blue-500'
                    : isMotoboy
                    ? 'bg-gradient-to-r from-white via-white to-red-50/50 border-red-300 hover:border-red-500'
                    : isGift
                    ? 'bg-gradient-to-r from-white via-white to-pink-50/50 border-pink-300 hover:border-pink-500'
                    : isPhoneScenario
                    ? 'bg-gradient-to-r from-white via-white to-purple-50/50 border-purple-300 hover:border-purple-500'
                    : isLinkScenario
                    ? 'bg-gradient-to-r from-white via-white to-amber-50/50 border-amber-300 hover:border-amber-500'
                    : 'bg-white border-slate-200 hover:border-emerald-500';

                  return (
                    <div
                      key={scenario.id}
                      className={`p-5 sm:p-6 rounded-3xl border-2 transition-all shadow-md hover:shadow-xl ${cardBorder}`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${badgeColor}`}>
                              {isInss ? (
                                <Landmark className="w-3.5 h-3.5 text-blue-700" />
                              ) : isMotoboy ? (
                                <CreditCard className="w-3.5 h-3.5 text-red-700" />
                              ) : isGift ? (
                                <Gift className="w-3.5 h-3.5 text-pink-700" />
                              ) : isPhoneScenario ? (
                                <PhoneCall className="w-3.5 h-3.5 text-purple-700" />
                              ) : isLinkScenario ? (
                                <Globe className="w-3.5 h-3.5 text-amber-700" />
                              ) : (
                                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                              )}
                              {scenario.category}
                            </span>

                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                              Dificuldade: {scenario.difficulty}
                            </span>

                            {isInss && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                                <span>🏛️ Site Falso Meu INSS (.xyz)</span>
                              </span>
                            )}

                            {isMotoboy && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 flex items-center gap-1">
                                <span>🏍️ Ligação & Retirada de Cartão</span>
                              </span>
                            )}

                            {isGift && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-900 border border-pink-300 flex items-center gap-1">
                                <span>🎁 Fraude na Maquininha & Selfie</span>
                              </span>
                            )}

                            {isLinkScenario && !isInss && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                                <span>🌐 Inclui Navegador & Site Falso</span>
                              </span>
                            )}

                            {isPhoneScenario && !isMotoboy && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                                <span>📞 Inclui Ligação Telefônica Ativa</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg sm:text-2xl font-black text-slate-900">
                            {scenario.title}
                          </h3>

                          <p className={`text-slate-600 leading-relaxed ${fontSizeClasses}`}>
                            {scenario.description}
                          </p>
                        </div>

                        {/* Botão de Iniciar Simulação */}
                        <button
                          onClick={() => {
                            audioService.stop();
                            setSelectedScenario(scenario);
                          }}
                          className={`w-full sm:w-auto px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all text-base sm:text-lg shrink-0 ${buttonColor}`}
                          title={`Iniciar treinamento: ${scenario.title}`}
                          aria-label={`Iniciar simulação: ${scenario.title}`}
                        >
                          <span>Começar Treino</span>
                          <ArrowRight className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Garantias de Segurança & Acessibilidade para o Participante */}
            <div className={`p-5 rounded-3xl border-2 transition-all ${
              highContrast 
                ? 'bg-zinc-900 border-yellow-400 text-white' 
                : 'bg-white border-slate-200 text-slate-800 shadow-sm'
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-black text-emerald-950">Acesso Direto no Navegador</p>
                    <p className="text-emerald-800">Zero downloads e sem necessidade de criar conta.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                  <Lock className="w-6 h-6 text-blue-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-black text-blue-950">Ambiente 100% Protegido</p>
                    <p className="text-blue-800">Simulação isolada, sem vírus e sem perda de dinheiro.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <Award className="w-6 h-6 text-amber-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-black text-amber-950">Certificado de Capacitação</p>
                    <p className="text-amber-800">Disponível para imprimir ao concluir os módulos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Certificado */}
      <ModalCertificado
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        highContrast={highContrast}
        fontSizeLevel={fontSizeLevel}
      />

      {/* Modal de Identificação e Login do Participante Idoso */}
      <ModalIdentificacaoIdoso
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSeniorSelected={(senior) => {
          setActiveSenior(senior);
          progressoUsuarioService.setUserName(senior.name);
        }}
        highContrast={highContrast}
        fontSizeLevel={fontSizeLevel}
      />

      {/* Feedback do idoso ao final de cada treino (texto ou áudio) */}
      <FeedbackModal
        isOpen={!!feedbackScenario && !!activeSenior}
        participantId={activeSenior?.id || ''}
        author="senior"
        scenarioId={feedbackScenario?.id}
        scenarioTitle={feedbackScenario?.title}
        highContrast={highContrast}
        onClose={() => setFeedbackScenario(null)}
      />
    </div>
  );
};

export default App;
