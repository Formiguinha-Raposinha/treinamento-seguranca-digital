import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  RotateCcw, 
  X, 
  ArrowLeft, 
  ShieldAlert, 
  Volume2, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Package,
  Landmark
} from 'lucide-react';
import { SimulatedWebPage } from '../../types/cenario';
import { ModalInspecaoLink } from './ModalInspecaoLink';
import { audioService } from '../../services/audioService';

interface BrowserSimulatorProps {
  page: SimulatedWebPage;
  onClose: () => void;
  onSubmitRisk: () => void;
  onSafeExit: () => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const BrowserSimulator: React.FC<BrowserSimulatorProps> = ({
  page,
  onClose,
  onSubmitRisk,
  onSafeExit,
  highContrast,
  fontSizeLevel
}) => {
  const [showInspector, setShowInspector] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Narração automática de entrada na página web simulada
    const introText = `Você acessou a página da web: ${page.title}. Endereço do site: ${page.url}. No topo, você pode inspecionar o link para checar a segurança.`;
    audioService.speak(introText);
  }, [page]);

  const handleHearPageContent = () => {
    let text = `${page.title}. ${page.headline}. `;
    if (page.subheadline) text += `${page.subheadline}. `;
    if (page.alertBox) text += `Aviso: ${page.alertBox.title}: ${page.alertBox.message}. `;
    text += `Dica: Antes de preencher seus dados, observe a barra de endereços no topo ou clique em Inspecionar Link.`;
    audioService.speak(text);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleAction = (button: typeof page.actionButtons[0]) => {
    audioService.stop();

    if (button.type === 'inspect_url') {
      setShowInspector(true);
      return;
    }

    if (button.type === 'submit_risk') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onSubmitRisk();
      }, 700);
      return;
    }

    if (button.type === 'cancel_safe') {
      onSafeExit();
    }
  };

  const fontSizeClasses = [
    'text-base',
    'text-lg sm:text-xl',
    'text-xl sm:text-2xl'
  ][fontSizeLevel] || 'text-base';

  const getBrandIcon = () => {
    if (page.theme === 'bank') return <Building2 className="w-6 h-6 text-blue-600" />;
    if (page.theme === 'delivery') return <Package className="w-6 h-6 text-amber-600" />;
    return <Landmark className="w-6 h-6 text-emerald-600" />;
  };

  return (
    <div className={`w-full max-w-2xl mx-auto flex flex-col h-[calc(100dvh-44px)] sm:h-[88vh] sm:max-h-[850px] sm:rounded-3xl sm:shadow-2xl overflow-hidden border transition-all ${
      highContrast 
        ? 'bg-black border-yellow-400' 
        : 'bg-white border-slate-300'
    }`}>
      {/* 1. Barra de Navegador Móvel (Chrome / Safari Simulado) */}
      <header className={`p-2.5 sm:p-3 border-b flex flex-col gap-2 shrink-0 ${
        highContrast ? 'bg-zinc-950 border-yellow-400 text-white' : 'bg-slate-200 border-slate-300 text-slate-800'
      }`}>
        {/* Linha Superior: Botão Voltar, Cadeado, URL e Botão Fechar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Voltar para as mensagens */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/10 active:scale-95 transition-all text-slate-700 shrink-0"
            title="Voltar para a conversa"
            aria-label="Voltar para a conversa"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Barra de Endereço URL com Cadeado e Alerta */}
          <div className={`flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all ${
            highContrast 
              ? 'bg-zinc-900 border-yellow-400 text-white' 
              : 'bg-white border-slate-300 text-slate-900 shadow-inner'
          }`}>
            <button 
              onClick={() => setShowInspector(true)}
              className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-transform active:scale-95 shrink-0"
              title="Cadeado com aviso de segurança. Clique para analisar."
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Suspeito</span>
            </button>

            <span className="font-mono text-xs sm:text-sm font-semibold truncate flex-1 select-all" title={page.url}>
              {page.url}
            </span>

            {/* Botão de Inspecionar Link Rápido */}
            <button
              onClick={() => setShowInspector(true)}
              className="text-[11px] sm:text-xs font-black text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0 active:scale-95"
              title="Inspecionar este link e descobrir o risco"
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Inspecionar Link</span>
            </button>
          </div>

          {/* Recarregar */}
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 400);
            }}
            className="p-2 rounded-xl hover:bg-black/10 active:scale-95 transition-all text-slate-700 shrink-0"
            title="Recarregar página simulada"
            aria-label="Recarregar página"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Fechar Navegador */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-300 hover:bg-slate-400 text-slate-800 active:scale-95 transition-all shrink-0"
            title="Fechar página web simulada"
            aria-label="Fechar página"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Faixa Didática: Ambiente Seguro */}
        <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-600">
          <div className="flex items-center gap-1.5 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Navegador 100% Simulado (Nenhum site externo é acessado)</span>
          </div>

          <button
            onClick={handleHearPageContent}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 active:scale-95"
            title="Ouvir conteúdo desta página"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Ouvir Página</span>
          </button>
        </div>
      </header>

      {/* 2. Conteúdo da Página Web Simulada */}
      <main className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 transition-colors ${
        highContrast ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}>
        {/* Cabeçalho Falso da Instituição */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          highContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100">
              {getBrandIcon()}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight">
                {page.brandName}
              </h1>
              <span className="text-xs text-slate-500 font-medium">
                Portal de Atendimento Eletrônico ao Cliente
              </span>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-extrabold uppercase tracking-wide border border-red-200">
            Página Falsa
          </span>
        </div>

        {/* Caixa de Alerta de Urgência / Falsa Notificação */}
        {page.alertBox && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 space-y-1 animate-pulse">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-red-700">
                {page.alertBox.title}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-red-900 font-medium leading-relaxed pl-8">
              {page.alertBox.message}
            </p>
          </div>
        )}

        {/* Headline da Página */}
        <div className="space-y-1.5 pt-1">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
            {page.headline}
          </h2>
          {page.subheadline && (
            <p className={`text-slate-600 ${fontSizeClasses} leading-relaxed`}>
              {page.subheadline}
            </p>
          )}
        </div>

        {/* Formulário Fictício de Dados / Senha */}
        {page.formFields && page.formFields.length > 0 && (
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
            highContrast ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Confirmação de Dados Pessoais (Simulação)
            </h3>

            {page.formFields.map(field => (
              <div key={field.id} className="space-y-1">
                <label className="block text-xs sm:text-sm font-bold text-slate-800">
                  {field.label}
                </label>
                <input
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder || 'Digite aqui...'}
                  value={formData[field.id] || field.defaultValue || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border-2 outline-none transition-all ${fontSizeClasses} ${
                    highContrast
                      ? 'bg-black border-yellow-400 text-white placeholder-zinc-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-500 focus:bg-white'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Simulação de Pagamento Pix Fictício */}
        {page.pixPayment && (
          <div className={`p-4 sm:p-5 rounded-2xl border-2 border-red-300 bg-red-50/70 space-y-2.5 ${
            highContrast ? 'bg-zinc-900 text-white' : ''
          }`}>
            <div className="flex items-center gap-2 text-red-800 font-black text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Chave Pix Fictícia de Destino</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-red-200 space-y-1 text-xs sm:text-sm text-slate-800">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Beneficiário:</span>
                <span className="font-bold text-red-950">{page.pixPayment.receiverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Instituição:</span>
                <span className="font-medium">{page.pixPayment.receiverBank}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-bold text-slate-700">Valor Cobrado:</span>
                <span className="font-black text-red-600 text-base">{page.pixPayment.amount}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Botões de Ação Decisória */}
        <div className="pt-2 space-y-2.5">
          {page.actionButtons.map(button => (
            <button
              key={button.id}
              onClick={() => handleAction(button)}
              disabled={isLoading}
              className={`w-full p-3.5 sm:p-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] ${fontSizeClasses} ${
                button.type === 'submit_risk'
                  ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 animate-bounce'
                  : button.type === 'inspect_url'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700'
              }`}
            >
              {button.type === 'submit_risk' && <AlertTriangle className="w-5 h-5" />}
              {button.type === 'inspect_url' && <Search className="w-5 h-5" />}
              {button.type === 'cancel_safe' && <CheckCircle2 className="w-5 h-5" />}
              <span>{button.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* Modal de Inspeção de URL Didático */}
      {showInspector && (
        <ModalInspecaoLink
          page={page}
          onClose={() => setShowInspector(false)}
          highContrast={highContrast}
          fontSizeLevel={fontSizeLevel}
        />
      )}
    </div>
  );
};

export const SimuladorNavegador = BrowserSimulator;
