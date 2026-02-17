import React, { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { generateAnomalyReport } from '../services/geminiService';
import { DailyRecord, ProductStats, Anomaly } from '../types';
import Markdown from 'react-markdown';

interface GeminiInsightProps {
  records: DailyRecord[];
  stats: ProductStats;
  anomalies: Anomaly[];
}

export const GeminiInsight: React.FC<GeminiInsightProps> = ({ records, stats, anomalies }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const report = await generateAnomalyReport(records, [stats], anomalies);
    setInsight(report);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-lg text-white p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-32 h-32" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Análisis de Anomalías con IA
          </h3>
          <button
            onClick={handleGenerate}
            disabled={loading || records.length === 0}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg flex items-center transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {insight ? 'Regenerar Análisis' : 'Analizar Datos'}
          </button>
        </div>

        {loading && (
          <div className="py-8 text-center animate-pulse">
            <p>Gemini está analizando tus patrones de flujo de materiales...</p>
          </div>
        )}

        {!loading && !insight && (
          <p className="text-indigo-100 text-sm">
            Haz clic en el botón para generar un resumen inteligente de tu uso diario de materiales, identificando causas potenciales de anomalías y tendencias.
          </p>
        )}

        {!loading && insight && (
          <div className="bg-white/10 rounded-lg p-4 text-sm leading-relaxed max-h-[200px] overflow-y-auto backdrop-blur-sm prose prose-invert prose-sm">
            <Markdown>{insight}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
};