import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { DailyRecord, ProductStats } from '../types';

interface ChartsProps {
  data: DailyRecord[];
  stats: ProductStats;
  isDarkMode?: boolean;
}

export const Charts: React.FC<ChartsProps> = ({ data, stats, isDarkMode = false }) => {
  const sortedData = useMemo(() => [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((record, index) => ({
      ...record,
      sequenceIndex: index,
      displayDate: record.date
    })), [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg text-xs sm:text-sm">
          <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">{dataPoint.displayDate}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Determine colors based on theme
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const referenceColor = isDarkMode ? '#475569' : '#cbd5e1';

  return (
    <div className="rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-[400px] transition-all duration-300 hover:shadow-md">
      <div className="h-full flex flex-col p-6">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Flujo de Ingreso y Salida</h3>
      <ResponsiveContainer width="100%" height="100%" className="pb-8">
        <LineChart
          data={sortedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          
          <XAxis 
            dataKey="sequenceIndex" 
            stroke={axisColor} 
            fontSize={12} 
            tickMargin={10} 
            tickFormatter={(idx) => {
              // Show date for the corresponding index
              if (typeof idx === 'number' && sortedData[idx]) {
                return sortedData[idx].displayDate;
              }
              return '';
            }}
          />
          
          <YAxis stroke={axisColor} fontSize={12} />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <ReferenceLine y={stats.averageUsage} label={{ value: "Uso Prom.", fill: axisColor }} stroke={referenceColor} strokeDasharray="3 3" />
          
          <Line
            type="monotone"
            dataKey="ingressQty"
            name="Ingreso (Entrada)"
            stroke="#6366f1"
            strokeWidth={2}
            activeDot={{ r: 6 }}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="usageQty"
            name="Uso (Salida)"
            stroke="#06b6d4"
            strokeWidth={2}
            activeDot={{ r: 6 }}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
};