import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Users, 
  Volume2, 
  X, 
  Sparkles, 
  Phone, 
  Calendar, 
  ArrowRight,
  User,
  Trash2
} from 'lucide-react';
import { dbService } from '../../services/bancoDadosService';
import { progressoUsuarioService } from '../../services/progressoUsuarioService';
import { audioService } from '../../services/audioService';
import { SeniorClient } from '../../types/bancoDados';

interface ModalIdentificacaoIdosoProps {
  isOpen: boolean;
  onClose: () => void;
  onSeniorSelected: (senior: SeniorClient) => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const ModalIdentificacaoIdoso: React.FC<ModalIdentificacaoIdosoProps> = ({
  isOpen,
  onClose,
  onSeniorSelected,
  highContrast,
  fontSizeLevel
}) => {
  const [seniors, setSeniors] = useState<SeniorClient[]>([]);
  const [activeSeniorId, setActiveSeniorId] = useState<string>('');
  const [mode, setMode] = useState<'create' | 'select'>('create');

  // Form states
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'60-69' | '70-79' | '80+'>('70-79');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSeniors = async () => {
    await dbService.init();
    const list = await dbService.getSeniors();
    setSeniors(list);
    const currentActiveId = dbService.getActiveSeniorId();
    setActiveSeniorId(currentActiveId);

    // Se já existirem participantes cadastrados, abre na aba de seleção se nenhum estiver em digitação
    if (list.length > 0 && !name) {
      setMode('select');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSeniors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleHearInstructions = () => {
    const text = mode === 'create'
      ? "Olá! Esta é a tela de identificação do participante. Digite como você gostaria de ser chamado, escolha sua faixa de idade e clique em Começar Treinamento. Seus dados ficam salvos apenas neste aparelho para acompanhar sua evolução e emitir seu certificado."
      : "Escolha na lista abaixo quem vai praticar agora. Você pode tocar no seu nome para continuar de onde parou, ou clicar em Novo Participante para cadastrar outra pessoa.";
    audioService.speak(text);
  };

  const handleSelectExisting = async (senior: SeniorClient) => {
    dbService.setActiveSeniorId(senior.id);
    progressoUsuarioService.setUserName(senior.name);
    if (senior.phone) {
      progressoUsuarioService.setUserPhone(senior.phone);
    }
    setActiveSeniorId(senior.id);
    audioService.speak(`Bem-vindo de volta, ${senior.name}! Vamos praticar juntos.`);
    onSeniorSelected(senior);
    onClose();
  };

  const handleCreateSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, digite seu nome ou como prefere ser chamado(a).');
      return;
    }

    setErrorMessage('');
    const newSenior: SeniorClient = {
      id: `senior_${Date.now()}`,
      name: name.trim(),
      ageGroup,
      phone: phone.trim() || undefined,
      caregiverName: 'Familiar / Apoio',
      caregiverPhone: '(65) 99999-9999',
      caregiverRelationship: 'filho(a)',
      riskLevel: 'moderado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dbService.saveSenior(newSenior);
    dbService.setActiveSeniorId(newSenior.id);
    progressoUsuarioService.setUserName(newSenior.name);
    if (newSenior.phone) {
      progressoUsuarioService.setUserPhone(newSenior.phone);
    }

    audioService.speak(`Muito prazer, ${newSenior.name}! Seu cadastro foi realizado com sucesso. Bons treinamentos!`);
    onSeniorSelected(newSenior);
    onClose();
  };

  const handleGuestLogin = () => {
    progressoUsuarioService.setUserName('Visitante');
    audioService.speak("Entrando como visitante. Bons treinamentos!");
    onClose();
  };

  const handleDeleteSenior = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Deseja realmente remover este participante deste aparelho?')) {
      await dbService.deleteSenior(id);
      await loadSeniors();
    }
  };

  const fontSizeClasses = [
    'text-sm sm:text-base',
    'text-base sm:text-lg',
    'text-lg sm:text-xl'
  ][fontSizeLevel] || 'text-base';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className={`max-w-xl w-full rounded-3xl p-5 sm:p-7 shadow-2xl border-4 transition-all ${
        highContrast 
          ? 'bg-black text-white border-yellow-400' 
          : 'bg-white text-slate-900 border-emerald-500'
      }`}>
        {/* Topo do Modal */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${highContrast ? 'bg-yellow-400 text-black' : 'bg-emerald-600 text-white'}`}>
              <UserCheck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Projeto de Extensão IFMT • Validação Prática</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Quem vai treinar hoje?
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleHearInstructions}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
              title="Ouvir instruções em voz alta"
              aria-label="Ouvir instruções"
            >
              <Volume2 className="w-5 h-5 text-emerald-700" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
              title="Fechar janela"
              aria-label="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas de Navegação (Novo Participante vs. Participante Já Cadastrado) */}
        <div className="grid grid-cols-2 gap-2 my-4 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'create'
                ? highContrast
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Participante</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('select')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'select'
                ? highContrast
                  ? 'bg-yellow-400 text-black shadow-md'
                  : 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Já Participei ({seniors.length})</span>
          </button>
        </div>

        {/* Conteúdo Modo 1: Cadastro Rápido de Novo Idoso */}
        {mode === 'create' ? (
          <form onSubmit={handleCreateSenior} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-black mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Como você prefere ser chamado(a)? *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Ex: Dona Francisca, Seu Manoel, Maria..."
                className={`w-full px-4 py-3 rounded-2xl border-2 outline-none font-semibold transition-all ${fontSizeClasses} ${
                  highContrast
                    ? 'bg-zinc-950 border-yellow-400 text-white placeholder-zinc-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                }`}
                autoFocus
              />
              {errorMessage && (
                <p className="text-xs text-red-600 font-bold mt-1.5 animate-pulse">
                  ⚠️ {errorMessage}
                </p>
              )}
            </div>

            {/* Faixa Etária (Botões de Toque Fácil para Idosos) */}
            <div>
              <label className="block text-xs sm:text-sm font-black mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Sua faixa de idade:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['60-69', '70-79', '80+'] as const).map((range) => {
                  const isSelected = ageGroup === range;
                  const label = range === '60-69' ? '60 a 69 anos' : range === '70-79' ? '70 a 79 anos' : '80 anos ou mais';
                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setAgeGroup(range)}
                      className={`p-2.5 sm:p-3 rounded-2xl border-2 font-black text-xs sm:text-sm text-center transition-all active:scale-95 ${
                        isSelected
                          ? highContrast
                            ? 'bg-yellow-400 text-black border-yellow-500 shadow-md'
                            : 'bg-emerald-50 text-emerald-950 border-emerald-600 ring-2 ring-emerald-200 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Telefone / WhatsApp (Opcional) */}
            <div>
              <label className="block text-xs sm:text-sm font-black mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Seu WhatsApp ou Celular (Opcional):</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (65) 99999-9999"
                className={`w-full px-4 py-2.5 rounded-2xl border-2 outline-none font-semibold transition-all text-sm ${
                  highContrast
                    ? 'bg-zinc-950 border-yellow-400 text-white placeholder-zinc-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
                }`}
              />
            </div>

            {/* Botão de Conclusão de Cadastro */}
            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${
                  highContrast
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                }`}
              >
                <span>▶️ Começar Meus Treinamentos</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        ) : (
          /* Conteúdo Modo 2: Seleção de Idoso Já Cadastrado */
          <div className="space-y-3">
            {seniors.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-600">
                <p className="font-semibold text-sm">
                  Nenhum participante cadastrado ainda neste aparelho.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                >
                  Cadastrar Primeiro Participante
                </button>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {seniors.map((senior) => {
                  const isCurrent = senior.id === activeSeniorId;
                  return (
                    <div
                      key={senior.id}
                      onClick={() => handleSelectExisting(senior)}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between gap-3 transition-all active:scale-[0.99] ${
                        isCurrent
                          ? highContrast
                            ? 'bg-zinc-900 border-yellow-400 text-yellow-300 shadow-md'
                            : 'bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-200'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-300 hover:bg-white text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-base shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {senior.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm sm:text-base leading-tight">
                              {senior.name}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full">
                                Atual
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Faixa etária: {senior.ageGroup} anos {senior.phone ? `• ${senior.phone}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                          <span>Entrar</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                        {seniors.length > 1 && (
                          <button
                            onClick={(e) => handleDeleteSenior(e, senior.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remover participante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setMode('create')}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-emerald-400 text-emerald-800 font-bold text-xs sm:text-sm hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 transition-all"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>+ Cadastrar Outra Pessoa Neste Aparelho</span>
            </button>
          </div>
        )}

        {/* Rodapé: Acesso Direto como Visitante (Zero Barreiras) */}
        <div className="mt-5 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500">
            🔒 Dados protegidos na memória deste navegador (LGPD).
          </span>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="font-bold text-slate-600 hover:text-slate-900 underline active:scale-95"
            title="Experimentar sem salvar dados de perfil"
          >
            Continuar como Visitante
          </button>
        </div>
      </div>
    </div>
  );
};
