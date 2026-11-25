import React from 'react';
import { VolumeX, Sun, Moon, Type } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface AccessibilityBarProps {
  fontSizeLevel: number; // 0: Normal, 1: Grande, 2: Extra Grande
  onFontSizeChange: (level: number) => void;
  highContrast: boolean;
  onHighContrastToggle: () => void;
  isSpeaking: boolean;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  fontSizeLevel,
  onFontSizeChange,
  highContrast,
  onHighContrastToggle,
  isSpeaking
}) => {
  const cycleFontSize = () => {
    const nextLevel = (fontSizeLevel + 1) % 3;
    onFontSizeChange(nextLevel);
  };

  const fontSizeLabels = ['Texto Normal', 'Texto Grande', 'Texto Extra Grande'];

  return (
    <nav aria-label="Ferramentas de Acessibilidade" className={`w-full py-2 px-4 flex flex-wrap items-center justify-between gap-2 border-b text-sm font-medium transition-colors ${
      highContrast 
        ? 'bg-black text-yellow-300 border-yellow-400' 
        : 'bg-slate-800 text-slate-100 border-slate-700'
    }`}>
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wide flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Acessibilidade & Voz
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Controle de Tamanho de Fonte */}
        <button
          onClick={cycleFontSize}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-xs sm:text-sm font-semibold border border-slate-600"
          title="Alterar tamanho do texto"
          aria-label={`Tamanho do texto: ${fontSizeLabels[fontSizeLevel]}. Clique para alterar.`}
        >
          <Type className="w-4 h-4" />
          <span>{fontSizeLabels[fontSizeLevel]}</span>
        </button>

        {/* Alto Contraste */}
        <button
          onClick={onHighContrastToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-xs sm:text-sm font-semibold border border-slate-600"
          title="Alternar modo de alto contraste"
          aria-pressed={highContrast}
        >
          {highContrast ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          <span>{highContrast ? 'Contraste Alto' : 'Contraste Padrão'}</span>
        </button>

        {/* Parar Áudio se estiver falando */}
        {isSpeaking && (
          <button
            onClick={() => audioService.stop()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold animate-pulse text-xs sm:text-sm"
            title="Parar leitura em voz alta"
          >
            <VolumeX className="w-4 h-4" />
            <span>Silenciar Áudio</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export const BarraAcessibilidade = AccessibilityBar;
