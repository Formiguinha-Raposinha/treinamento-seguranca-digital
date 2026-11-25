import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, X, MessageSquareHeart, Trash2 } from 'lucide-react';
import { dbService, Feedback } from '../services/bancoDadosService';
import { audioService } from '../services/audioService';

export type FeedbackModalProps = {
  isOpen: boolean;
  participantId: string;
  author: Feedback['author'];
  scenarioId?: string;
  scenarioTitle?: string;
  highContrast?: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const CARINHAS = [
  { valor: 1, emoji: '😟', texto: 'Difícil' },
  { valor: 3, emoji: '😐', texto: 'Mais ou menos' },
  { valor: 5, emoji: '😄', texto: 'Gostei' }
];

const CATEGORIAS_FAMILIA: { valor: NonNullable<Feedback['category']>; texto: string }[] = [
  { valor: 'ocorrido', texto: 'Relatar algo que aconteceu (golpe, tentativa, ligação estranha)' },
  { valor: 'dificuldade', texto: 'Dificuldade do idoso em usar o treinamento' },
  { valor: 'sugestao', texto: 'Sugestão de melhoria' },
  { valor: 'outro', texto: 'Outro assunto' }
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  participantId,
  author,
  scenarioId,
  scenarioTitle,
  highContrast = false,
  onClose,
  onSaved
}) => {
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<Feedback['category']>(author === 'family' ? 'ocorrido' : undefined);
  const [comment, setComment] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  // Limpa o formulário sempre que o modal abrir
  useEffect(() => {
    if (isOpen) {
      setRating(undefined);
      setCategory(author === 'family' ? 'ocorrido' : undefined);
      setComment('');
      setAudioBlob(null);
      setMicError(null);
    }
  }, [isOpen, author]);

  useEffect(() => {
    if (!audioBlob) { setAudioUrl(null); return; }
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  if (!isOpen) return null;

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorder.current = rec;
      chunks.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.onstop = () => {
        setAudioBlob(new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }));
        chunks.current = [];
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      setRecording(true);
    } catch {
      setMicError('Não foi possível usar o microfone. Verifique a permissão do navegador ou escreva sua mensagem.');
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const handleClose = () => {
    if (recording) stopRecording();
    onClose();
  };

  const canSend = !recording && (comment.trim().length > 0 || !!audioBlob || rating !== undefined);

  const handleSubmit = async () => {
    if (!canSend) return;
    setSaving(true);
    await dbService.addFeedback({
      participantId,
      author,
      scenarioId,
      scenarioTitle,
      category,
      rating,
      comment: comment.trim(),
      audioBlob: audioBlob ?? undefined,
      date: new Date().toISOString()
    });
    setSaving(false);
    audioService.speak('Obrigado! Sua opinião foi registrada.');
    onSaved?.();
    onClose();
  };

  const isFamily = author === 'family';
  const titulo = isFamily ? 'Relatar ocorrido / Enviar feedback' : 'O que você achou deste treino?';
  const card = highContrast ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white text-slate-900';
  const campo = highContrast
    ? 'bg-black text-white border-2 border-yellow-400'
    : 'bg-white border border-slate-300';

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-0 sm:p-4 print:hidden">
      <div className={`${card} w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 space-y-4 max-h-[95vh] overflow-y-auto`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-7 h-7 text-purple-600 shrink-0" />
            <div>
              <h3 className="text-xl font-black leading-tight">{titulo}</h3>
              {scenarioTitle && <p className="text-sm opacity-70">Treino: {scenarioTitle}</p>}
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-slate-200/50" title="Fechar">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Avaliação por carinhas (idoso) */}
        {!isFamily && (
          <div className="grid grid-cols-3 gap-2">
            {CARINHAS.map(c => (
              <button
                key={c.valor}
                type="button"
                onClick={() => setRating(c.valor)}
                className={`rounded-2xl py-3 flex flex-col items-center border-2 transition-all active:scale-95 ${
                  rating === c.valor
                    ? 'border-purple-600 bg-purple-100 text-purple-950'
                    : highContrast ? 'border-yellow-400' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-4xl">{c.emoji}</span>
                <span className="text-sm font-bold mt-1">{c.texto}</span>
              </button>
            ))}
          </div>
        )}

        {/* Categoria (familiar) */}
        {isFamily && (
          <div className="space-y-2">
            <p className="font-bold text-sm">Sobre o que você quer falar?</p>
            {CATEGORIAS_FAMILIA.map(c => (
              <label key={c.valor} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer text-sm ${
                category === c.valor ? 'bg-purple-100 text-purple-950 font-bold' : ''
              }`}>
                <input
                  type="radio"
                  name="categoria"
                  checked={category === c.valor}
                  onChange={() => setCategory(c.valor)}
                  className="w-4 h-4"
                />
                {c.texto}
              </label>
            ))}
          </div>
        )}

        {/* Áudio */}
        <div className="space-y-2">
          <p className="font-bold text-sm">
            {isFamily ? 'Prefere falar? Grave um áudio explicando:' : 'Quer falar em vez de escrever? Aperte o botão:'}
          </p>
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-lg flex items-center justify-center gap-2 animate-pulse"
            >
              <Square className="w-6 h-6" /> Parar gravação
            </button>
          ) : !audioBlob ? (
            <button
              type="button"
              onClick={startRecording}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <Mic className="w-6 h-6" /> Gravar áudio
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {audioUrl && <audio controls src={audioUrl} className="flex-1" />}
              <button
                type="button"
                onClick={() => setAudioBlob(null)}
                className="p-3 rounded-xl border border-red-300 text-red-700"
                title="Apagar áudio"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
          {micError && <p className="text-sm text-red-600">{micError}</p>}
        </div>

        {/* Texto */}
        <div className="space-y-1">
          <label className="font-bold text-sm">{isFamily ? 'Descreva o que aconteceu:' : 'Ou escreva aqui (opcional):'}</label>
          <textarea
            rows={isFamily ? 5 : 3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={isFamily
              ? 'Ex.: Minha mãe recebeu uma ligação dizendo ser do banco e quase passou a senha...'
              : 'Ex.: Achei difícil entender a mensagem...'}
            className={`${campo} w-full p-3 rounded-xl text-base`}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-2xl border-2 font-bold">
            {isFamily ? 'Cancelar' : 'Agora não'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend || saving}
            className="flex-[2] py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white font-black text-lg flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" /> {saving ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};
