import { supabase } from '../lib/supabase';
import { dbService } from './bancoDadosService';
import { progressoUsuarioService } from './progressoUsuarioService';

export type PapelUsuario = 'senior' | 'family' | 'admin';

export interface Perfil {
  id: string;
  role: PapelUsuario;
  name: string;
  phone: string | null;
  age_group: string | null;
  invite_code: string | null;
  created_at: string;
}

export interface IdosoVinculado {
  id: string;
  name: string;
  age_group: string | null;
  phone: string | null;
  relationship: string | null;
}

// O idoso entra com celular + PIN. Por baixo, o Supabase precisa de um e-mail e
// de uma senha com no mínimo 6 caracteres, então montamos os dois a partir disso.
const DOMINIO_IDOSO = 'idoso.seguranca-digital.app';

export const normalizarTelefone = (telefone: string): string => {
  const digitos = telefone.replace(/\D/g, '');
  return digitos.startsWith('55') && digitos.length >= 12 ? digitos : `55${digitos}`;
};

const emailDoIdoso = (telefone: string) => `${normalizarTelefone(telefone)}@${DOMINIO_IDOSO}`;
const senhaDoIdoso = (pin: string) => `sd-pin-${pin}`;

const PINS_OBVIOS = new Set([
  '1234', '4321', '0123', '3210', '1122', '1212', '0101', '1020',
  '2020', '2021', '2022', '2023', '2024', '2025', '2026'
]);

export const validarPinIdoso = (pin: string, telefone: string): string | null => {
  if (!/^\d{4}$/.test(pin)) {
    return 'O PIN deve ter exatamente 4 números.';
  }
  if (/^(\d)\1{3}$/.test(pin) || PINS_OBVIOS.has(pin)) {
    return 'Escolha um PIN menos óbvio (evite sequências como 1234, números repetidos ou o ano atual).';
  }
  const telDigitos = telefone.replace(/\D/g, '');
  if (telDigitos.length >= 4 && pin === telDigitos.slice(-4)) {
    return 'Por segurança, não use os 4 últimos números do seu celular como PIN.';
  }
  return null;
};

const traduzirErro = (mensagem: string): string => {
  const m = mensagem.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Dados incorretos. Confira e tente de novo.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Já existe um cadastro com esses dados. Use a opção "Entrar".';
  if (m.includes('email not confirmed')) return 'E-mail ainda não confirmado. Abra o link que chegou no seu e-mail.';
  if (m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sem conexão com a internet. Verifique e tente de novo.';
  if (m.includes('unable to validate email')) return 'E-mail inválido.';
  return mensagem;
};

const falhar = (erro: { message: string } | null): never => {
  throw new Error(traduzirErro(erro?.message || 'Erro desconhecido.'));
};

const exigirSessao = (sessao: unknown) => {
  if (!sessao) {
    throw new Error(
      'Cadastro criado, mas o Supabase está pedindo confirmação de e-mail. ' +
      'Desative em Authentication → Sign In / Providers → Email → "Confirm email".'
    );
  }
};

export const authService = {
  async cadastrarIdoso(dados: { nome: string; telefone: string; pin: string; faixaEtaria: string }) {
    const telDigitos = dados.telefone.replace(/\D/g, '');
    if (telDigitos.length < 10) {
      throw new Error('Digite o número de celular completo com DDD (ex.: 65 99999-9999).');
    }
    const erroPin = validarPinIdoso(dados.pin, dados.telefone);
    if (erroPin) throw new Error(erroPin);

    const { data, error } = await supabase.auth.signUp({
      email: emailDoIdoso(dados.telefone),
      password: senhaDoIdoso(dados.pin),
      options: {
        data: { role: 'senior', name: dados.nome.trim(), phone: normalizarTelefone(dados.telefone), age_group: dados.faixaEtaria }
      }
    });
    if (error) falhar(error);
    exigirSessao(data.session);
  },

  async entrarIdoso(telefone: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('O PIN deve ter 4 números.');
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: emailDoIdoso(telefone),
      password: senhaDoIdoso(pin)
    });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('Celular ou PIN incorretos. Se é sua primeira vez, toque em "Primeiro acesso".');
      }
      falhar(error);
    }
  },

  async cadastrarFamiliar(dados: { nome: string; email: string; senha: string }) {
    if (dados.senha.length < 8) {
      throw new Error('Por segurança, a senha deve ter pelo menos 8 caracteres.');
    }
    const { data, error } = await supabase.auth.signUp({
      email: dados.email.trim().toLowerCase(),
      password: dados.senha,
      options: { data: { role: 'family', name: dados.nome.trim() } }
    });
    if (error) falhar(error);
    exigirSessao(data.session);
  },

  async entrarComEmail(email: string, senha: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
    if (error) falhar(error);
  },

  async sair() {
    await supabase.auth.signOut();
    await dbService.limparCacheLocal();
    progressoUsuarioService.limparUsuarioAtual();
  },

  async regenerarCodigoConvite(): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_invite_code');
    if (error) falhar(error);
    return data as string;
  },

  async obterPerfil(): Promise<Perfil | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) falhar(error);
    return (data as Perfil) || null;
  },

  async vincularIdoso(codigo: string, parentesco?: string): Promise<{ senior_id: string; senior_name: string }> {
    const { data, error } = await supabase.rpc('link_family_by_code', { code: codigo, rel: parentesco || null });
    if (error) falhar(error);
    const linha = Array.isArray(data) ? data[0] : data;
    return linha as { senior_id: string; senior_name: string };
  },

  async listarIdososVinculados(): Promise<IdosoVinculado[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('family_links')
      .select('relationship, senior:profiles!family_links_senior_id_fkey (id, name, age_group, phone)')
      .eq('family_id', user.id);
    if (error) falhar(error);
    return (data || []).flatMap((linha: any) => {
      const s = Array.isArray(linha.senior) ? linha.senior[0] : linha.senior;
      return s ? [{ id: s.id, name: s.name, age_group: s.age_group, phone: s.phone, relationship: linha.relationship }] : [];
    });
  },

  async listarFamiliaresDoIdoso(): Promise<{ id: string; name: string; relationship: string | null }[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('family_links')
      .select('relationship, family:profiles!family_links_family_id_fkey (id, name)')
      .eq('senior_id', user.id);
    if (error) falhar(error);
    return (data || []).flatMap((linha: any) => {
      const f = Array.isArray(linha.family) ? linha.family[0] : linha.family;
      return f ? [{ id: f.id, name: f.name, relationship: linha.relationship }] : [];
    });
  },

  async removerVinculo(familyId: string, seniorId: string) {
    const { error } = await supabase.from('family_links').delete().eq('family_id', familyId).eq('senior_id', seniorId);
    if (error) falhar(error);
  }
};
