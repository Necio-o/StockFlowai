import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, Package } from 'lucide-react';
import { ProductSettings } from '../types';

interface AdminSettingsProps {
  products: string[];
  selectedProduct: string;
  onProductChange: (product: string) => void;
  currentSettings: ProductSettings;
  calculatedAverage: number;
  onSave: (settings: ProductSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  products,
  selectedProduct,
  onProductChange,
  currentSettings, 
  calculatedAverage, 
  onSave 
}) => {
  const [target, setTarget] = useState<string>(currentSettings.targetAverage?.toString() || '');
  const [tolerance, setTolerance] = useState<string>(currentSettings.tolerancePercent.toString());

  // Update local state when prop changes (e.g. switching products)
  useEffect(() => {
    setTarget(currentSettings.targetAverage?.toString() || '');
    setTolerance(currentSettings.tolerancePercent.toString());
  }, [selectedProduct, currentSettings]);

  const handleSave = () => {
    onSave({
      targetAverage: target ? Number(target) : null,
      tolerancePercent: tolerance !== '' ? Number(tolerance) : 20
    });
  };

  const handleReset = () => {
    setTarget('');
    setTolerance('20');
    onSave({
      targetAverage: null,
      tolerancePercent: 20
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center text-indigo-600 dark:text-indigo-300">
            <Settings className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-semibold">Configuración de Reglas</h3>
        </div>
        
        {/* Product Selector in Settings */}
        <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Package className="h-4 w-4 text-slate-400" />
            </div>
            <select
                value={selectedProduct}
                onChange={(e) => onProductChange(e.target.value)}
                className="pl-9 pr-3 py-2 w-full text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors cursor-pointer"
            >
                {products.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Promedio Diario Objetivo (Opcional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={`Calc: ${Math.round(calculatedAverage)}`}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-colors"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Si se deja vacío, el sistema usará el promedio histórico calculado ({Math.round(calculatedAverage)}).
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
            Rango de Tolerancia (%)
          </label>
          <input
            type="number"
            value={tolerance}
            onChange={(e) => setTolerance(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-colors"
          />
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Las alertas se activan si el uso varía más del {tolerance}% del promedio.
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={handleReset}
          className="flex items-center px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar Valores
        </button>
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center text-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};