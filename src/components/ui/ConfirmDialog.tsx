import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, Info, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const themes = {
    danger: {
      icon: XCircle,
      color: 'rose',
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
      button: 'bg-rose-600 hover:bg-rose-700'
    },
    warning: {
      icon: AlertCircle,
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700'
    },
    info: {
      icon: Info,
      color: 'indigo',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      button: 'bg-indigo-600 hover:bg-indigo-700'
    },
    success: {
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    }
  };

  const theme = themes[type];
  const Icon = theme.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 ${theme.bg} rounded-2xl flex items-center justify-center shrink-0`}>
              <Icon className={`w-8 h-8 ${theme.text}`} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight uppercase italic">{title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfirmasi Diperlukan</p>
            </div>
          </div>
          
          <p className="text-slate-600 font-medium leading-relaxed mb-8">
            {message}
          </p>
        </div>
        
        <div className="p-6 bg-slate-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase text-xs tracking-widest"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-[1.5] py-4 px-6 ${theme.button} text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase text-xs tracking-widest`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
