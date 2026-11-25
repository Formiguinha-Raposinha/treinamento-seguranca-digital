import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Users, Trash2, HeartHandshake } from 'lucide-react';
import { authService, Perfil } from '../../services/authService';

interface CardCodigoFamiliaProps {
  perfil: Perfil;
  onPerfilAtualizado: (perfilAtualizado: Perfil) => void;
  highContrast: boolean;
}

export const CardCodigoFamilia: React.FC<CardCodigoFamiliaProps> = ({
  perfil,
  onPerfilAtualizado,
  highContrast
}) => {
  const [copiado, setCopiado] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [familiares, setFamiliares] = useState<{ id: string; name: string; relationship: string | null }[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregarFamiliares = async () => {
    try {
      const lista = await authService.listarFamiliaresDoIdoso();
      setFamiliares(lista);
    } catch {
      // Silencioso se offline
    }
  };

  useEffect(() => {
    carregarFamiliares();
  }, [perfil.id]);

  const copiarCodigo = async () => {
    if (!perfil.invite_code) return;
    try {
      await navigator.clipboard.writeText(perfil.invite_code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro('Não foi possível copiar automaticamente. Anote o código acima.');
    }
  };

  const gerarNovoCodigo = async () => {
    if (!window.confirm('Deseja gerar um novo código? O código antigo deixará de funcionar para novos convites (quem já está vinculado continua com acesso).')) {
      return;
    }
    setGerando(true);
    setErro(null);
    try {
      const novo = await authService.regenerarCodigoConvite();
      onPerfilAtualizado({ ...perfil, invite_code: novo });
    } catch (err: any) {
      setErro(err?.message || 'Erro ao gerar novo código.');
    } finally {
      setGerando(false);
    }
  };

  const removerFamiliar = async (familyId: string, nome: string) => {
    if (!window.confirm(`Remover o acesso de ${nome || 'este familiar'} ao seu progresso?`)) return;
    try {
      await authService.removerVinculo(familyId, perfil.id);
      setFamiliares(prev => prev.filter(f => f.id !== familyId));
    } catch (err: any) {
      setErro(err?.message || 'Não foi possível remover o acesso.');
    }
  };

  return (
    <div className={`p-5 rounded-3xl border-2 space-y-4 ${
      highContrast
        ? 'bg-zinc-900 border-yellow-400 text-white'
        : 'bg-gradient-to-r from-purple-50 via-white to-indigo-50 border-purple-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-700 text-white shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg">
              Código para seu Familiar Acompanhar
            </h3>
            <p className="text-xs sm:text-sm opacity-80">
              Passe este código para um filho(a) ou cuidador acompanhar seus treinos pelo celular dele.
            </p>
          </div>
        </div>
      </div>

      {/* Código em destaque */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border-2 ${
        highContrast ? 'bg-black border-yellow-400' : 'bg-white border-purple-300'
      }`}>
        <span className="text-xl sm:text-2xl font-black tracking-widest text-purple-800 dark:text-yellow-300 select-all">
          {perfil.invite_code || 'Sem código'}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copiarCodigo}
            disabled={!perfil.invite_code}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? 'Copiado!' : 'Copiar Código'}</span>
          </button>

          <button
            type="button"
            onClick={gerarNovoCodigo}
            disabled={gerando}
            className={`px-3 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all ${
              highContrast
                ? 'border-yellow-400 text-yellow-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Invalidar este código e criar um novo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gerando ? 'animate-spin' : ''}`} />
            <span>Gerar Novo</span>
          </button>
        </div>
      </div>

      {erro && <p className="text-xs font-bold text-red-600">{erro}</p>}

      {/* Lista de familiares vinculados */}
      {familiares.length > 0 && (
        <div className="pt-2 border-t border-purple-200/70 space-y-2">
          <p className="text-xs font-black flex items-center gap-1.5 opacity-80">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Familiares com acesso ao seu progresso:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {familiares.map(f => (
              <div
                key={f.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  highContrast ? 'border-yellow-400 bg-black' : 'bg-white border-purple-200'
                }`}
              >
                <span>{f.name || 'Familiar'}{f.relationship ? ` (${f.relationship})` : ''}</span>
                <button
                  type="button"
                  onClick={() => removerFamiliar(f.id, f.name)}
                  className="text-red-600 hover:text-red-800 p-0.5"
                  title="Remover acesso deste familiar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
