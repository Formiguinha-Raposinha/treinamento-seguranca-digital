import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  HeartHandshake,
  Lock,
  Volume2,
  ArrowRight,
  AlertCircle,
  Loader2,
  Phone,
  KeyRound,
  Mail
} from 'lucide-react';
import { authService } from '../../services/authService';
import { audioService } from '../../services/audioService';

interface TelaLoginProps {
  onAuthSuccess: () => Promise<void> | void;
  highContrast: boolean;
  fontSizeLevel: number;
}

type AbaLogin = 'senior' | 'family' | 'admin';

export const TelaLogin: React.FC<TelaLoginProps> = ({
  onAuthSuccess,
  highContrast,
  fontSizeLevel
}) => {
  const [aba, setAba] = useState<AbaLogin>('senior');
  const [modoCadastro, setModoCadastro] = useState<boolean>(false);

  // Campos Idoso
  const [nomeIdoso, setNomeIdoso] = useState('');
  const [telefoneIdoso, setTelefoneIdoso] = useState('');
  const [pinIdoso, setPinIdoso] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('70-79');

  // Campos Familiar / Admin
  const [nomeFamiliar, setNomeFamiliar] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fontSizeClasses = [
    'text-sm sm:text-base',
    'text-base sm:text-lg',
    'text-lg sm:text-xl'
  ][fontSizeLevel] || 'text-base sm:text-lg';

  const trocarAba = (novaAba: AbaLogin) => {
    audioService.stop();
    setAba(novaAba);
    setModoCadastro(false);
    setErro(null);
  };

  const ouvirInstrucoes = () => {
    if (aba === 'senior') {
      audioService.speak(
        modoCadastro
          ? 'Para fazer seu primeiro acesso, digite seu nome, o número do seu celular com DDD e escolha um PIN de 4 números fáceis de lembrar, mas que não seja 1 2 3 4.'
          : 'Para entrar nos seus treinamentos, digite o número do seu celular com DDD e o seu PIN de 4 números. Se for sua primeira vez, toque em Primeiro acesso.'
      );
    } else if (aba === 'family') {
      audioService.speak(
        'Área para familiares e cuidadores. Entre com seu e-mail e senha ou crie sua conta. Depois você poderá digitar o código de convite que aparece no celular do seu familiar idoso.'
      );
    } else {
      audioService.speak('Acesso restrito à coordenação do projeto.');
    }
  };

  const formatarPin = (valor: string) => valor.replace(/\D/g, '').slice(0, 4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      if (aba === 'senior') {
        if (modoCadastro) {
          if (!nomeIdoso.trim()) {
            throw new Error('Por favor, informe o seu nome.');
          }
          await authService.cadastrarIdoso({
            nome: nomeIdoso,
            telefone: telefoneIdoso,
            pin: pinIdoso,
            faixaEtaria
          });
        } else {
          await authService.entrarIdoso(telefoneIdoso, pinIdoso);
        }
      } else if (aba === 'family') {
        if (modoCadastro) {
          if (!nomeFamiliar.trim()) {
            throw new Error('Por favor, informe o seu nome.');
          }
          await authService.cadastrarFamiliar({
            nome: nomeFamiliar,
            email,
            senha
          });
        } else {
          await authService.entrarComEmail(email, senha);
        }
      } else {
        await authService.entrarComEmail(email, senha);
      }

      await onAuthSuccess();
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível concluir o acesso. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const cardBg = highContrast
    ? 'bg-zinc-900 border-2 border-yellow-400 text-white'
    : 'bg-white border border-slate-200 text-slate-900 shadow-xl';

  const inputCls = highContrast
    ? 'bg-black text-white border-2 border-yellow-400 placeholder:text-zinc-400'
    : 'bg-white text-slate-900 border-2 border-slate-300 focus:border-emerald-600 focus:outline-none';

  return (
    <div className={`max-w-xl w-full mx-auto p-3 sm:p-6 space-y-5 ${fontSizeClasses}`}>
      {/* Cabeçalho Institucional */}
      <div className={`p-5 sm:p-6 rounded-3xl border-2 text-center space-y-2 ${
        highContrast
          ? 'bg-zinc-900 border-yellow-400 text-white'
          : 'bg-gradient-to-br from-emerald-800 to-teal-900 border-emerald-700 text-white shadow-lg'
      }`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Segurança Digital • Projeto de Extensão</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Quem vai acessar agora?
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100">
          Escolha o seu perfil abaixo para entrar com segurança.
        </p>
        <button
          type="button"
          onClick={ouvirInstrucoes}
          className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-emerald-900 font-black text-xs sm:text-sm shadow hover:bg-emerald-50 active:scale-95 transition-all"
        >
          <Volume2 className="w-4 h-4 text-emerald-600" />
          <span>Ouvir Instruções</span>
        </button>
      </div>

      {/* Seletor dos 3 perfis */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => trocarAba('senior')}
          className={`p-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center gap-1.5 transition-all ${
            aba === 'senior'
              ? highContrast
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : highContrast
                ? 'bg-black text-white border-yellow-400/50'
                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Participante (Idoso)</span>
        </button>

        <button
          type="button"
          onClick={() => trocarAba('family')}
          className={`p-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center gap-1.5 transition-all ${
            aba === 'family'
              ? highContrast
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'bg-purple-700 text-white border-purple-700 shadow-md'
              : highContrast
                ? 'bg-black text-white border-yellow-400/50'
                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400'
          }`}
        >
          <HeartHandshake className="w-5 h-5" />
          <span>Familiar / Cuidador</span>
        </button>

        <button
          type="button"
          onClick={() => trocarAba('admin')}
          className={`p-3 rounded-2xl border-2 font-black text-xs sm:text-sm flex flex-col items-center gap-1.5 transition-all ${
            aba === 'admin'
              ? highContrast
                ? 'bg-yellow-400 text-black border-yellow-400'
                : 'bg-blue-700 text-white border-blue-700 shadow-md'
              : highContrast
                ? 'bg-black text-white border-yellow-400/50'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
          }`}
        >
          <Lock className="w-5 h-5" />
          <span>Coordenação (Admin)</span>
        </button>
      </div>

      {/* Formulário da aba ativa */}
      <form onSubmit={handleSubmit} className={`p-5 sm:p-6 rounded-3xl space-y-4 ${cardBg}`}>
        {/* Alternador Entrar / Cadastrar (só para Idoso e Familiar) */}
        {aba !== 'admin' ? (
          <div className="flex rounded-2xl p-1 bg-slate-100 dark:bg-zinc-800 gap-1">
            <button
              type="button"
              onClick={() => { setModoCadastro(false); setErro(null); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                !modoCadastro
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Já tenho conta (Entrar)
            </button>
            <button
              type="button"
              onClick={() => { setModoCadastro(true); setErro(null); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all ${
                modoCadastro
                  ? 'bg-white text-slate-900 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {aba === 'senior' ? 'Primeiro acesso' : 'Criar conta'}
            </button>
          </div>
        ) : (
          <div className={`p-3 rounded-2xl text-xs font-semibold border ${
            highContrast ? 'border-yellow-400 text-yellow-200' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            Acesso exclusivo para coordenação do projeto. Novos administradores são habilitados apenas diretamente no banco de dados.
          </div>
        )}

        {/* ABA IDOSO */}
        {aba === 'senior' && (
          <div className="space-y-4">
            {modoCadastro && (
              <>
                <div>
                  <label className="block font-black text-sm mb-1">Seu Nome:</label>
                  <input
                    type="text"
                    value={nomeIdoso}
                    onChange={(e) => setNomeIdoso(e.target.value)}
                    placeholder="Ex.: Dona Maria da Silva"
                    required
                    className={`w-full px-4 py-3 rounded-2xl text-base font-semibold ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="block font-black text-sm mb-1">Sua Faixa de Idade:</label>
                  <select
                    value={faixaEtaria}
                    onChange={(e) => setFaixaEtaria(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl text-base font-semibold ${inputCls}`}
                  >
                    <option value="60-69">60 a 69 anos</option>
                    <option value="70-79">70 a 79 anos</option>
                    <option value="80+">80 anos ou mais</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block font-black text-sm mb-1 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Número do seu Celular (com DDD):</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={telefoneIdoso}
                onChange={(e) => setTelefoneIdoso(e.target.value)}
                placeholder="Ex.: (65) 99999-9999"
                required
                className={`w-full px-4 py-3 rounded-2xl text-lg font-bold tracking-wide ${inputCls}`}
              />
            </div>

            <div>
              <label className="block font-black text-sm mb-1 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>{modoCadastro ? 'Escolha um PIN de 4 números:' : 'Seu PIN de 4 números:'}</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={pinIdoso}
                onChange={(e) => setPinIdoso(formatarPin(e.target.value))}
                placeholder="••••"
                required
                className={`w-full px-4 py-3 rounded-2xl text-2xl font-black tracking-[0.5em] text-center ${inputCls}`}
              />
              {modoCadastro && (
                <p className="text-xs opacity-75 mt-1">
                  Dica: evite sequências óbvias (como 1234), números repetidos (0000) ou os 4 últimos números do seu celular.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ABA FAMILIAR OU ADMIN */}
        {aba !== 'senior' && (
          <div className="space-y-4">
            {aba === 'family' && modoCadastro && (
              <>
                <div className={`p-3 rounded-2xl text-xs border ${
                  highContrast ? 'border-yellow-400 text-yellow-200' : 'bg-purple-50 border-purple-200 text-purple-900'
                }`}>
                  Após criar sua conta, você poderá digitar o <strong>código de convite</strong> que aparece no celular do idoso para acompanhar os treinos dele.
                </div>
                <div>
                  <label className="block font-black text-sm mb-1">Seu Nome Completo:</label>
                  <input
                    type="text"
                    value={nomeFamiliar}
                    onChange={(e) => setNomeFamiliar(e.target.value)}
                    placeholder="Ex.: Ana Paula da Silva"
                    required
                    className={`w-full px-4 py-3 rounded-2xl text-base font-semibold ${inputCls}`}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block font-black text-sm mb-1 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-purple-600" />
                <span>E-mail:</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className={`w-full px-4 py-3 rounded-2xl text-base font-semibold ${inputCls}`}
              />
            </div>

            <div>
              <label className="block font-black text-sm mb-1 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>Senha:</span>
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={modoCadastro ? 'Mínimo 8 caracteres' : 'Digite sua senha'}
                minLength={modoCadastro ? 8 : 6}
                required
                className={`w-full px-4 py-3 rounded-2xl text-base font-semibold ${inputCls}`}
              />
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-sm font-bold flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
            aba === 'senior'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : aba === 'family'
                ? 'bg-purple-700 hover:bg-purple-800 text-white'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
          }`}
        >
          {carregando ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <span>{modoCadastro ? 'Cadastrar e Entrar' : 'Entrar'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
