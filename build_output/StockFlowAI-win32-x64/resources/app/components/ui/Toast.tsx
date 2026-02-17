import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'critical' | 'success' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start p-4 rounded-lg border-l-4 min-w-[320px] max-w-[400px] animate-in slide-in-from-right-full duration-500 fade-in shadow-2xl ${
            toast.type === 'critical'
              ? 'bg-red-50 border-red-600 dark:bg-red-950/90 dark:border-red-500'
              : toast.type === 'success'
              ? 'bg-white border-emerald-500 dark:bg-slate-900 dark:border-emerald-500'
              : 'bg-white border-violet-500 dark:bg-slate-900 dark:border-violet-500'
          }`}
        >
          {/* Icono */}
          <div className={`mr-3 mt-0.5 flex-shrink-0 ${
            toast.type === 'critical' ? 'text-red-600' : 
            toast.type === 'success' ? 'text-emerald-500' : 'text-violet-500'
          }`}>
            {toast.type === 'critical' ? <AlertCircle className="w-6 h-6 animate-pulse" /> : 
             toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> : 
             <Info className="w-5 h-5" />}
          </div>

          {/* Texto */}
          <div className="flex-1 mr-2">
            <p className={`text-sm font-bold uppercase tracking-wide ${
              toast.type === 'critical' ? 'text-red-900 dark:text-red-200' : 
              toast.type === 'success' ? 'text-emerald-800 dark:text-emerald-400' : 
              'text-slate-800 dark:text-violet-200'
            }`}>
              {toast.type === 'critical' ? '¡Alerta Crítica!' : 
               toast.type === 'success' ? 'Éxito' : 'Información'}
            </p>
            <p className={`text-sm mt-1 leading-tight ${
              toast.type === 'critical' ? 'text-red-800 dark:text-red-300' : 
              'text-slate-600 dark:text-slate-300'
            }`}>
              {toast.message}
            </p>
          </div>

          {/* Botón Cerrar */}
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};