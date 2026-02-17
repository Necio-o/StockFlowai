import React from 'react';
import { DailyRecord, Anomaly } from '../types';
import { AlertBadge } from './ui/AlertBadge';
import { AlertOctagon, AlertTriangle } from 'lucide-react';

interface AnomalyListProps {
  anomalies: Anomaly[];
  records: DailyRecord[];
}

export const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies, records }) => {
  if (anomalies.length === 0) {
    return (
      <div className="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center h-full min-h-[200px] transition-all duration-300 hover:shadow-md">
        
        <div className="relative flex flex-col items-center justify-center h-full w-full p-6">
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/10 p-4 rounded-full mb-3 border border-green-200/30 dark:border-green-700/30">
          <AlertBadge type="success" text="Todo Normal" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-center font-medium">No se detectaron anomalías en el conjunto de datos actual.</p>
        </div>
      </div>
    );
  }

  // Helper to get date from record ID
  const getDate = (id: string) => records.find(r => r.id === id)?.date || 'Fecha Desconocida';
  
  // Sort anomalies so critical ones appear first
  const sortedAnomalies = [...anomalies].sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return 0;
  });

  return (
    <div className="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[400px] transition-all duration-300 hover:shadow-md">
      
      <div className="relative z-10">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Anomalías Detectadas</h3>
        <span className={`${anomalies.some(a => a.severity === 'critical') ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'} text-xs font-bold px-2 py-1 rounded-full`}>
            {anomalies.length} Problemas
        </span>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700 overflow-y-auto flex-1">
        {sortedAnomalies.map((anomaly, idx) => {
          const isCritical = anomaly.severity === 'critical';
          return (
            <div 
                key={`${anomaly.recordId}-${idx}`} 
                className={`p-4 transition-all duration-200 ${
                    isCritical 
                    ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border-l-4 border-l-red-500 pl-3' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent pl-3'
                }`}
            >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center">
                  {isCritical ? (
                    <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-bold ${isCritical ? 'text-red-900 dark:text-red-200' : 'text-slate-700 dark:text-slate-200'}`}>
                    {getDate(anomaly.recordId)}
                  </span>
              </div>
              <AlertBadge 
                type={isCritical ? 'critical' : 'warning'} 
                text={anomaly.type === 'MISMATCH_INGRESS_USAGE' ? 'Discrepancia' : 'Desviación'} 
              />
            </div>
            
            <div className="mt-2 ml-6">
                <p className={`text-sm font-semibold ${isCritical ? 'text-red-800 dark:text-red-200' : 'text-slate-800 dark:text-slate-200'}`}>
                    {anomaly.message}
                </p>
                <p className={`text-xs mt-1 ${isCritical ? 'text-red-700/80 dark:text-red-300/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    {anomaly.details}
                </p>
            </div>
          </div>
        );
      })}
      </div>
      </div>
    </div>
  );
};
