import React, { useState } from 'react';
import { Sparkles, X, Key, CheckCircle2, ExternalLink } from 'lucide-react';
import { aiScammerService } from '../../services/iaGolpistaService';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
  highContrast: boolean;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  highContrast
}) => {
  const [apiKey, setApiKey] = useState<string>(aiScammerService.getApiKey());
  const [aiEnabled, setAiEnabled] = useState<boolean>(aiScammerService.isAiEnabled());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    aiScammerService.setApiKey(apiKey);
    aiScammerService.toggleAiEnabled(aiEnabled);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onKeySaved) onKeySaved();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className={`my-auto max-w-md w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-4 transition-all ${
        highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white text-slate-900 border-purple-400'
      }`}>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Agente de IA Golpista
              </h2>
              <p className="text-xs text-slate-500">
                Google Gemini 1.5 Flash (Respostas Dinâmicas)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explicação */}
        <div className="my-4 space-y-3 text-xs sm:text-sm">
          <p className="text-slate-600 leading-relaxed">
            Com a IA ativada, o golpista improvisa respostas realistas para qualquer frase que você disser, evitando respostas repetitivas.
          </p>

          {/* Campo Chave de API */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
              <Key className="w-4 h-4 text-purple-600" />
              <span>Chave da API do Gemini (Google AI Studio):</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua chave AIzaSy..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm outline-none focus:border-purple-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Ou defina em seu arquivo</span>
              <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">.env</code>
              <span>como</span>
              <code className="bg-slate-100 px-1 py-0.5 rounded font-bold">VITE_GEMINI_API_KEY</code>
            </p>
          </div>

          {/* Onde pegar chave */}
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs">
            <p className="font-bold flex items-center gap-1 mb-1">
              <span>Como obter uma chave gratuita (Google):</span>
            </p>
            <p className="text-slate-600">
              Acesse o Google AI Studio com sua conta Google e clique em "Get API key". É 100% gratuito.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-purple-700 font-extrabold underline mt-1.5"
            >
              <span>Abrir Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Toggle de Ativação */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-extrabold text-xs text-slate-900">Ativar Agente de IA na Simulação</p>
              <p className="text-[11px] text-slate-500">Se desativado ou sem internet, usa o motor offline local.</p>
            </div>
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-4 pt-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-95"
          >
            Salvar e Ativar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModalConfiguracaoIA = AiConfigModal;
