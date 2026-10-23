import { useState } from 'react';
import { AlertCircle, Check, Clipboard, X } from 'lucide-react';
import { cleanAndParseJson, importAllData } from '../lib/storage';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function JsonImportModal({
  isOpen,
  onClose,
  onSuccess,
}: JsonImportModalProps) {
  const [text, setText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handlePasteFromClipboard() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText && clipText.trim()) {
          setText(clipText);
          setErrorMessage(null);
        } else {
          setErrorMessage('Gli appunti sono vuoti.');
        }
      } else {
        setErrorMessage(
          'Accesso agli appunti non consentito dal browser. Tieni premuto nella casella per incollare manualmente.',
        );
      }
    } catch {
      setErrorMessage(
        'Permesso di lettura appunti negato. Tieni premuto nella casella di testo e seleziona Incolla.',
      );
    }
  }

  function handleConfirm() {
    setErrorMessage(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setErrorMessage('La casella di testo è vuota. Incolla prima il JSON.');
      return;
    }

    const { data, error } = cleanAndParseJson(trimmed);
    if (error || !data) {
      setErrorMessage(
        error ?? 'Formato JSON non valido. Controlla di aver copiato tutto il testo.',
      );
      return;
    }

    const result = importAllData(data);
    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    alert(`${result.message}\nL'applicazione verrà riavviata per aggiornare tutti i dati.`);
    onSuccess();
    window.location.reload();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ripristina da Testo JSON
            </h2>
            <p className="text-xs text-slate-500">
              Incolla il testo del backup estratto dallo smartphone
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-50 border border-brand-200 px-3 py-2.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 active:scale-[0.98]"
          >
            <Clipboard size={15} /> Incolla direttamente dagli appunti
          </button>

          <div className="relative">
            <textarea
              rows={8}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder='Incolla qui il JSON (es. {"version":1, "expenses":[...], ...})'
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 transition resize-none"
            />
            {text.length > 0 && (
              <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400">
                {text.length} caratteri
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <p className="font-semibold">Errore di importazione</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-brand-600 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <Check size={16} /> Ripristina Dati
          </button>
        </div>
      </div>
    </div>
  );
}
