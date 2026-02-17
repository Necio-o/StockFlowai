import React from 'react';
import { X, AlertOctagon, FileDown, ShieldAlert } from 'lucide-react';
import { Anomaly, DailyRecord } from '../types';
import { generateFailureReport } from '../services/pdfService';

interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  anomalies: Anomaly[];
  records: DailyRecord[];
}

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  isOpen,
  onClose,
  anomalies,
  records
}) => {
  if (!isOpen) return null;

  // Filter only Critical anomalies (Fallos)
  const criticalFailures = anomalies.filter(a => a.severity === 'critical');

  const handleDownload = () => {
    generateFailureReport(criticalFailures, records);
  };

  const getProductName = (id: string) => records.find(r => r.id === id)?.productName || 'Desconocido';
  const getRecordDate = (id: string) => records.find(r => r.id === id)?.date || 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-red-200 dark:border-red-900 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 flex justify-between items-center">
          <div className="flex items-center text-red-700 dark:text-red-400">
            <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg mr-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Reporte Diario de Fallos</h2>
              <p className="text-xs opacity-80">Incidencias críticas del sistema</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {criticalFailures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
              <ShieldAlert className="w-16 h-16 mb-4 text-emerald-500 opacity-20" />
              <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">Sin fallos detectados hoy</p>
              <p className="text-sm">El sistema opera con normalidad.</p>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    Se han detectado <span className="font-bold">{criticalFailures.length}</span> fallos críticos que requieren revisión administrativa.
                  </p>
               </div>

               {criticalFailures.map((fail, idx) => (
                 <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                            CRÍTICO
                        </span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {getRecordDate(fail.recordId)}
                        </span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-1">
                        {fail.message}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {fail.details}
                    </p>
                    <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center">
                        <AlertOctagon className="w-3 h-3 mr-1" />
                        Producto afectado: <span className="font-medium ml-1 text-slate-600 dark:text-slate-300">{getProductName(fail.recordId)}</span>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button
                onClick={handleDownload}
                disabled={criticalFailures.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${
                    criticalFailures.length === 0 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-red-900/20'
                }`}
            >
                <FileDown className="w-4 h-4 mr-2" />
                Descargar Reporte PDF
            </button>
        </div>

      </div>
    </div>
  );
};