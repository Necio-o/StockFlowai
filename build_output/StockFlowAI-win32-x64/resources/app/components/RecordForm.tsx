import React, { useState, useEffect } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Clock, Calendar, Package, Hash } from 'lucide-react';
import { DailyRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface RecordFormProps {
  onAdd: (record: DailyRecord) => void;
  currentProduct: string;
  availableProducts?: string[];
}

type RecordType = 'ingress' | 'usage';

export const RecordForm: React.FC<RecordFormProps> = ({ onAdd, currentProduct, availableProducts }) => {
  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // ESTADOS
  const [recordType, setRecordType] = useState<RecordType>('ingress');
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [productName, setProductName] = useState(currentProduct);
  const [quantity, setQuantity] = useState<string>('');

  const productOptions = availableProducts || ['Materia Prima A', 'Materia Prima B', 'Empaque X'];

  useEffect(() => {
    setProductName(currentProduct);
  }, [currentProduct]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) return;
    let integerPart = parts[0].replace(/\./g, '');
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const formattedValue = parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
    setQuantity(formattedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawValue = parseFloat(quantity.replace(/\./g, '').replace(',', '.'));
    if (isNaN(rawValue) || rawValue <= 0) {
      alert('Por favor ingrese una cantidad válida mayor a 0');
      return;
    }

    const fullTimestamp = `${date}T${time}`;

const newRecord: DailyRecord = {
      id: uuidv4(),
      date: date,
      timestamp: fullTimestamp,
      productName,
      ingressQty: recordType === 'ingress' ? rawValue : 0,
      usageQty: recordType === 'usage' ? rawValue : 0,
    };

    onAdd(newRecord);
    setQuantity('');
    setTime(getCurrentTime());
  };

  return (
    <div className="rounded-xl shadow-sm overflow-hidden transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md">
      
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setRecordType('ingress')}
          className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center transition-all ${
            recordType === 'ingress'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4 mr-2" />
          Ingreso (Entrada)
        </button>
        <button
          onClick={() => setRecordType('usage')}
          className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center transition-all ${
            recordType === 'usage'
              ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-b-2 border-sky-500'
              : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 mr-2" />
          Uso (Salida)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center"><Calendar className="w-3 h-3 mr-1"/> Fecha</label>
            <input type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center"><Clock className="w-3 h-3 mr-1"/> Hora</label>
            <input type="time" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center"><Package className="w-3 h-3 mr-1"/> Producto</label>
            <select className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all" value={productName} onChange={(e) => setProductName(e.target.value)}>
              {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase flex items-center"><Hash className="w-3 h-3 mr-1"/> Cantidad</label>
            <input type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all" value={quantity} onChange={handleQuantityChange} placeholder="0" />
          </div>
        </div>
        <button
          type="submit"
          className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition-all flex items-center justify-center ${
            recordType === 'ingress' 
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-sky-600 hover:bg-sky-700'
          }`}
        >
          <Plus className="w-5 h-5 mr-2" />
          {recordType === 'ingress' ? 'Registrar Ingreso' : 'Registrar Uso'}
        </button>
      </form>
    </div>
  );
};