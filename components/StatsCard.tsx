import React from 'react';
import { ProductStats, ProductSettings } from '../types';
import { TrendingUp, Activity, Package, Target } from 'lucide-react';

interface StatsCardProps {
  stats: ProductStats;
  settings: ProductSettings;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats, settings }) => {
  // Determine if we are using manual target or calculated average
  const isManualTarget = settings.targetAverage && settings.targetAverage > 0;
  const baseline = isManualTarget ? settings.targetAverage! : stats.averageUsage;
  
  // Calculate range based on settings
  const toleranceDecimal = settings.tolerancePercent / 100;
  const rangeLow = Math.round(baseline * (1 - toleranceDecimal));
  const rangeHigh = Math.round(baseline * (1 + toleranceDecimal));

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(Math.round(num));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* STAT 1: Promedio/Objetivo */}
      <div className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
        <div className="relative p-5 flex items-center">
          {isManualTarget && (
            <div className="absolute top-3 right-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-1 rounded-lg font-bold">
              OBJETIVO
            </div>
          )}
          <div className={`p-3 rounded-xl mr-4 transition-all duration-300 ${isManualTarget ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400'}`}>
            {isManualTarget ? <Target className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide">
              {isManualTarget ? "Objetivo" : "Promedio"}
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{formatNumber(baseline)}</p>
            {isManualTarget && (
               <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Cálculo: {formatNumber(stats.averageUsage)}</p>
            )}
          </div>
        </div>
      </div>

      {/* STAT 2: Rango Tolerancia */}
      <div className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
        <div className="relative p-5 flex items-center">
          <div className="p-3 rounded-xl mr-4 transition-all duration-300 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide">Rango (±{settings.tolerancePercent}%)</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">
               {formatNumber(rangeLow)} - {formatNumber(rangeHigh)}
            </p>
          </div>
        </div>
      </div>

      {/* STAT 3: Total Entradas */}
      <div className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        <div className="relative p-5 flex items-center">
          <div className="p-3 rounded-xl mr-4 transition-all duration-300 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide">Total Registros</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalRecords}</p>
          </div>
        </div>
      </div>
    </div>
  );
};