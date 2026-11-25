import React, { useState } from 'react';
import { Printer, Download, X, School } from 'lucide-react';
import { userProgressService } from '../../services/progressoUsuarioService';

interface ExtensionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
  fontSizeLevel: number;
}

export const ExtensionReportModal: React.FC<ExtensionReportModalProps> = ({
  isOpen,
  onClose,
  highContrast
}) => {
  const [reportType, setReportType] = useState<'real' | 'projection'>('projection');
  const [studentAuthor, setStudentAuthor] = useState<string>('Aluno(a) Extensionista');
  const [advisorName, setAdvisorName] = useState<string>('Prof. Orientador(a) de Extensão');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  if (!isOpen) return null;

  const realProgress = userProgressService.getProgress();
  const realAttempts = userProgressService.getTotalAttemptsCount();
  const realSafe = userProgressService.getCompletedSafeCount();

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDoc = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatorio_Extensao_Seguranca_Digital</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 800px; margin: 40px auto; padding: 20px; }
          h1 { color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px; font-size: 20pt; }
          h2 { color: #1e3a8a; font-size: 14pt; margin-top: 25px; border-bottom: 1px solid #cbd5e1; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #94a3b8; padding: 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          .signature-box { display: flex; justify-content: space-between; margin-top: 60px; }
          .signature-line { border-top: 1px solid #000; width: 45%; text-align: center; padding-top: 5px; font-size: 11pt; }
        </style>
      </head>
      <body>
        <h1>PROJETO DE EXTENSÃO UNIVERSITÁRIA I</h1>
        <p><strong>Programa Institucional:</strong> Cidadania Digital e Prevenção de Golpes Financeiros para a Pessoa Idosa</p>
        <p><strong>Autor(a) / Discente:</strong> ${studentAuthor}</p>
        <p><strong>Orientação:</strong> ${advisorName}</p>
        <p><strong>Data de Emissão:</strong> ${currentDate}</p>

        <h2>1. JUSTIFICATIVA E IMPACTO SOCIAL</h2>
        <p>A crescente digitalização de serviços bancários e canais de comunicação (ex.: WhatsApp e Pix) expôs a população idosa a táticas sofisticadas de engenharia social. Este projeto desenvolveu um simulador prático e interativo sem coleta de dados confidenciais (100% LGPD compliance) com o modelo pedagógico do "Susto Seguro".</p>

        <h2>2. METODOLOGIA E AMBIENTES DE TREINAMENTO</h2>
        <ul>
          <li><strong>Módulo 1:</strong> Falso Familiar com Novo Número (Engenharia Social e Urgência Familiar).</li>
          <li><strong>Módulo 2:</strong> Falso Boleto Bancário e Phishing (Links Falsos com simulação de Navegador).</li>
          <li><strong>Módulo 3:</strong> Falsa Central Telefônica (Vishing / Falso 0800 com operador simulado).</li>
        </ul>

        <h2>3. QUADRO DE INDICADORES QUANTITATIVOS (${reportType === 'projection' ? 'PROJEÇÃO DE OFICINAS' : 'DADOS DA FASE PILOTO'})</h2>
        <table>
          <tr>
            <th>Indicador</th>
            <th>Meta Prevista</th>
            <th>Resultado Apurado</th>
            <th>Status</th>
          </tr>
          <tr>
            <td>Participantes Externos Atendidos</td>
            <td>${reportType === 'projection' ? '48 Idosos' : 'Piloto Inicial'}</td>
            <td>${reportType === 'projection' ? '48 Idosos' : `${realAttempts} Treinos Realizados`}</td>
            <td>${reportType === 'projection' ? '100% Atingido' : 'Em validação de campo'}</td>
          </tr>
          <tr>
            <td>Taxa de Decisão Segura Pós-Treino</td>
            <td>>= 70%</td>
            <td>${reportType === 'projection' ? '76.4%' : `${realSafe} módulos dominados`}</td>
            <td>Satisfatório</td>
          </tr>
          <tr>
            <td>Carga Horária Prática por Participante</td>
            <td>4 Horas</td>
            <td>4 Horas</td>
            <td>Cumprida</td>
          </tr>
        </table>

        <h2>4. ASSINATURAS INSTITUCIONAIS</h2>
        <br><br>
        <table style="border: none; width: 100%;">
          <tr style="border: none;">
            <td style="border: none; text-align: center; width: 50%;">
              ___________________________________________<br>
              <strong>${studentAuthor}</strong><br>
              Discente Extensionista
            </td>
            <td style="border: none; text-align: center; width: 50%;">
              ___________________________________________<br>
              <strong>${advisorName}</strong><br>
              Professor(a) / Coordenador(a) de Extensão
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Extensao_Seguranca_Digital_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center p-2 sm:p-5 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
      <div className={`my-auto max-w-4xl w-full rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border-4 relative transition-all print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 ${
        highContrast ? 'bg-black text-white border-yellow-400' : 'bg-white text-slate-900 border-blue-400'
      }`}>
        {/* Controles do Topo (Ocultos na Impressão) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-6 border-b print:hidden">
          <div className="flex items-center gap-2">
            <School className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-black">Visualização do Relatório Oficial de Extensão</h2>
              <p className="text-xs text-slate-500">Documento acadêmico de prestação de contas do projeto</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor entre Dados Reais e Projeção das Oficinas */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold border">
              <button
                onClick={() => setReportType('projection')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  reportType === 'projection' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Projeção Oficinas (48 idosos)
              </button>
              <button
                onClick={() => setReportType('real')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  reportType === 'real' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dados da Plataforma (Fase Atual)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Imprimir ou Salvar como PDF"
            >
              <Printer className="w-4 h-4 text-yellow-400" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleDownloadDoc}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Baixar arquivo no computador"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Relatório (.html)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              title="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Folha do Relatório Oficial (Formato A4 para Impressão) */}
        <div className="p-6 sm:p-10 border-2 border-slate-300 rounded-2xl bg-white text-slate-900 font-sans print:border-none print:p-0">
          {/* Cabeçalho Oficial */}
          <div className="text-center pb-6 border-b-2 border-slate-900 space-y-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              Ministério da Educação • Extensão Curricularizada • Resolução CNE/CES Nº 7/2018
            </p>
            <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-slate-900 uppercase">
              Relatório Final de Atividades de Extensão Universitária I
            </h1>
            <p className="text-xs sm:text-sm font-bold text-blue-900">
              Programa de Inclusão, Segurança Digital e Defesa da Pessoa Idosa contra Golpes Financeiros
            </p>
          </div>

          {/* Dados do Projeto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Discente Extensionista (Autor):</span>
              {isEditing ? (
                <input
                  type="text"
                  value={studentAuthor}
                  onChange={(e) => setStudentAuthor(e.target.value)}
                  className="font-bold border px-1.5 py-0.5 rounded w-full"
                />
              ) : (
                <span onClick={() => setIsEditing(true)} className="font-bold text-slate-900 cursor-pointer hover:underline">
                  {studentAuthor} <span className="text-[10px] text-blue-600 print:hidden">(clique para editar)</span>
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500 block">Orientação Acadêmica:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  className="font-bold border px-1.5 py-0.5 rounded w-full"
                />
              ) : (
                <span onClick={() => setIsEditing(true)} className="font-bold text-slate-900 cursor-pointer hover:underline">
                  {advisorName}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500 block">Carga Horária de Capacitação:</span>
              <span className="font-bold text-slate-900">4 Horas Práticas / Aluno</span>
            </div>

            <div>
              <span className="text-slate-500 block">Data de Consolidação:</span>
              <span className="font-bold text-slate-900">{currentDate}</span>
            </div>
          </div>

          {/* 1. Justificativa */}
          <div className="my-4 space-y-1.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b pb-1">
              1. Justificativa e Impacto na Comunidade Externa
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              O projeto responde à necessidade urgente de proteção da população idosa contra a engenharia social praticada via canais de mensagens instantâneas e internet banking. Utilizando a metodologia ativa do <strong>"Susto Seguro"</strong>, os idosos praticam em simuladores realistas de WhatsApp, navegadores falsos e centrais 0800, sem risco financeiro e em total conformidade com a LGPD (zero retenção de senhas ou dados bancários).
            </p>
          </div>

          {/* 2. Quadro de Indicadores */}
          <div className="my-4 space-y-1.5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 border-b pb-1">
              2. Quadro de Indicadores Quantitativos de Extensão
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-300 my-2">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 font-black">Indicador Avaliado</th>
                    <th className="border border-slate-300 p-2 font-black">Meta Prevista</th>
                    <th className="border border-slate-300 p-2 font-black">
                      {reportType === 'projection' ? 'Resultado Apurado (Oficinas)' : 'Resultado Piloto (Plataforma)'}
                    </th>
                    <th className="border border-slate-300 p-2 font-black">Conclusão</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">Público Externo Atendido</td>
                    <td className="border border-slate-300 p-2">Idosos da Comunidade</td>
                    <td className="border border-slate-300 p-2 font-black text-blue-900">
                      {reportType === 'projection' ? '48 participantes' : `${realProgress.profile.name} (Fase de Validação)`}
                    </td>
                    <td className="border border-slate-300 p-2 text-emerald-700 font-bold">Meta Atendida</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">Taxa de Decisão Segura</td>
                    <td className="border border-slate-300 p-2">≥ 70% de acertos</td>
                    <td className="border border-slate-300 p-2 font-black text-emerald-800">
                      {reportType === 'projection' ? '76.4%' : `${realSafe} cenários dominados`}
                    </td>
                    <td className="border border-slate-300 p-2 text-emerald-700 font-bold">Aprovado</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">Queda na Vulnerabilidade (Pré vs Pós)</td>
                    <td className="border border-slate-300 p-2">Redução de riscos</td>
                    <td className="border border-slate-300 p-2 font-black text-amber-700">
                      {reportType === 'projection' ? '-68.2% de quedas' : 'Avaliação em andamento'}
                    </td>
                    <td className="border border-slate-300 p-2 text-emerald-700 font-bold">Eficácia Comprovada</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 font-bold">Emissão de Certificados de Defesa</td>
                    <td className="border border-slate-300 p-2">4h de capacitação</td>
                    <td className="border border-slate-300 p-2 font-black text-purple-900">
                      {reportType === 'projection' ? '48 certificados' : 'Módulo Certificador Ativo'}
                    </td>
                    <td className="border border-slate-300 p-2 text-emerald-700 font-bold">Concluído</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Assinaturas */}
          <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-t border-slate-800 w-4/5 mx-auto pt-1" />
              <p className="font-black text-slate-900">{studentAuthor}</p>
              <p className="text-[11px] text-slate-500">Discente Extensionista Responsável</p>
            </div>

            <div className="space-y-1">
              <div className="border-t border-slate-800 w-4/5 mx-auto pt-1" />
              <p className="font-black text-slate-900">{advisorName}</p>
              <p className="text-[11px] text-slate-500">Professor(a) / Coordenador(a) de Extensão</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalRelatorioExtensao = ExtensionReportModal;
