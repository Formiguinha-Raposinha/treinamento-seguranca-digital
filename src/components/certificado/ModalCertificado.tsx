import React, { useState } from 'react';
import { Award, Printer, X, Volume2, CheckCircle2, School } from 'lucide-react';
import { audioService } from '../../services/audioService';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultName?: string;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  defaultName = 'Dona Maria da Silva',
  highContrast,
  fontSizeLevel
}) => {
  const [studentName, setStudentName] = useState<string>(defaultName);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  if (!isOpen) return null;

  const fontSizeClasses = [
    'text-sm sm:text-base',
    'text-base sm:text-lg',
    'text-lg sm:text-xl'
  ][fontSizeLevel] || 'text-base';

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleHearCertificate = () => {
    const text = `Certificado Oficial de Capacitação em Segurança Digital. Certificamos que ${studentName} concluiu com êxito o treinamento prático de prevenção a golpes no WhatsApp e na Internet, tornando-se um Cidadão Digital Protegido com carga horária de 4 horas práticas. Parabéns!`;
    audioService.speak(text);
  };

  const handlePrint = () => {
    audioService.stop();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in print:p-0 print:bg-white">
      <div className={`my-auto max-w-3xl w-full rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border-4 relative transition-all print:border-none print:shadow-none print:max-w-none print:w-full ${
        highContrast 
          ? 'bg-black text-white border-yellow-400' 
          : 'bg-white text-slate-900 border-amber-400'
      }`}>
        {/* Botão Fechar no Topo (Oculto na impressão) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors print:hidden"
          title="Fechar certificado"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Borda Clássica Estilo Diploma */}
        <div className="border-4 border-double border-amber-500/60 p-5 sm:p-8 rounded-2xl relative bg-gradient-to-b from-amber-50/20 via-white to-amber-50/10">
          {/* Cabeçalho do Certificado */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-700 font-extrabold text-xs sm:text-sm tracking-widest uppercase">
              <School className="w-4 h-4" />
              <span>Universidade • Projeto de Extensão I • Segurança Digital</span>
            </div>

            <div className="inline-block p-2.5 bg-amber-100 rounded-full border border-amber-300 text-amber-800 my-1">
              <Award className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-amber-950 uppercase">
              Certificado de Conclusão
            </h1>

            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
              Programa de Defesa e Cidadania Digital da Pessoa Idosa
            </p>
          </div>

          {/* Corpo do Certificado */}
          <div className="my-6 text-center space-y-4">
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              Certificamos com louvor que
            </p>

            {/* Nome do Participante (Editável ao clicar) */}
            <div className="py-2 px-4 border-b-2 border-dashed border-amber-400 inline-block max-w-lg mx-auto">
              {isEditing ? (
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onBlur={() => setIsEditing(false)}
                  autoFocus
                  className="text-xl sm:text-3xl font-serif font-black text-center text-emerald-900 bg-amber-50 rounded-lg px-2 py-1 outline-none border border-amber-300 w-full"
                />
              ) : (
                <span 
                  onClick={() => setIsEditing(true)}
                  className="text-xl sm:text-3xl font-serif font-black text-emerald-950 hover:text-amber-800 cursor-pointer transition-colors block"
                  title="Clique para editar seu nome"
                >
                  {studentName}
                  <span className="text-[11px] font-sans font-normal text-slate-400 block print:hidden">
                    (clique no nome para alterar)
                  </span>
                </span>
              )}
            </div>

            <p className={`${fontSizeClasses} text-slate-700 max-w-2xl mx-auto leading-relaxed font-normal`}>
              concluiu com êxito todas as etapas práticas da <strong>Oficina de Prevenção e Imunização contra Golpes Digitais</strong>, demonstrando autonomia, pensamento crítico e habilidade prática para reconhecer fraudes por mensagens, redes sociais e navegação na internet.
            </p>

            {/* Competências Desenvolvidas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-4 max-w-xl mx-auto text-left">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reconhecimento de Falsos Familiares</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Inspeção Crítica de Links (Phishing)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aplicação Prática da Regra de Ouro</span>
              </div>
            </div>
          </div>

          {/* Rodapé e Assinaturas */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="text-center sm:text-left">
              <p className="font-bold text-slate-800">Carga Horária: 4 Horas Práticas</p>
              <p className="text-slate-500">Emitido em: {currentDate}</p>
            </div>

            <div className="flex items-center gap-6 text-center">
              <div className="space-y-0.5">
                <div className="w-36 border-b border-slate-400 mx-auto"></div>
                <p className="font-bold text-[11px] text-slate-800">Coordenação de Extensão</p>
                <p className="text-[10px] text-slate-500">Universidade / Colegiado</p>
              </div>

              <div className="space-y-0.5">
                <div className="w-36 border-b border-slate-400 mx-auto"></div>
                <p className="font-bold text-[11px] text-slate-800">Responsável Técnica</p>
                <p className="text-[10px] text-slate-500">Desenvolvimento do Projeto</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações (Oculta na impressão) */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            onClick={handleHearCertificate}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 text-sm transition-all"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>Ouvir Certificado</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 text-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalCertificado = CertificateModal;
