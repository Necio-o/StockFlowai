import React from 'react';
import { Calendar, Filter, X } from 'lucide-react';

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear
}) => {
  const hasFilter = startDate || endDate;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300">
      <div className="flex items-center text-slate-700 dark:text-slate-200">
        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg mr-3">
            <Filter className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </div>
        <span className="font-semibold text-sm">Filtrar Historial</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none w-full sm:w-40 transition-colors"
            placeholder="Desde"
          />
        </div>
        
        <span className="text-slate-300 hidden sm:inline">-</span>

        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none w-full sm:w-40 transition-colors"
            placeholder="Hasta"
          />
        </div>

        {hasFilter && (
          <button
            onClick={onClear}
            className="flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};