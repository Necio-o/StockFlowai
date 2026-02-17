import React, { useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const ReminderManager = ({ onAdd, recordatorios, onDelete }: any) => {
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');

  const handleAdd = () => {
    if (!titulo || !fecha) return;
    onAdd({
      id: uuidv4(),
      titulo,
      descripcion: "Tienes una tarea pendiente ahora.",
      fechaHora: fecha,
      leido: false,
      tipo: 'tarea'
    });
    setTitulo('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
      <h3 className="text-white font-bold flex items-center gap-2 mb-4"><Bell size={18}/> RECORDATORIOS</h3>
      <div className="space-y-2">
        <input 
          type="text" placeholder="¿Qué recordar?" 
          className="w-full p-2 rounded bg-slate-100 dark:bg-slate-800 text-white border-none text-sm"
          value={titulo} onChange={e => setTitulo(e.target.value)}
        />
        <input 
          type="datetime-local" 
          className="w-full p-2 rounded bg-slate-100 dark:bg-slate-800 text-white border-none text-sm"
          value={fecha} onChange={e => setFecha(e.target.value)}
        />
        <button onClick={handleAdd} className="w-full bg-indigo-600 text-white p-2 rounded font-bold text-xs">AGREGAR</button>
      </div>

      <div className="mt-4 max-h-40 overflow-y-auto">
        {recordatorios.map((r: any) => (
          <div key={r.id} className="flex justify-between items-center p-2 border-b border-slate-800 text-[10px]">
            <span className="text-slate-300">{r.titulo} ({new Date(r.fechaHora).toLocaleString()})</span>
            <button onClick={() => onDelete(r.id)}><Trash2 size={12} className="text-red-500"/></button>
          </div>
        ))}
      </div>
    </div>
  );
};