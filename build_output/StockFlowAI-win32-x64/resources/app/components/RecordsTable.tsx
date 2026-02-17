import React, { useState, useMemo, useEffect } from 'react';
import { DailyRecord } from '../types';
import { Edit2, Check, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Package, ArrowDownCircle, ArrowUpCircle, BarChart3 } from 'lucide-react';
import { guardarConfiguracionGeneral } from '../services/firestore';

interface RecordsTableProps {
  records: DailyRecord[];
  productos: string[];
  setProducts: (prods: string[]) => void;
  isUserAdmin: boolean;
  addToast: (msg: string, type: 'success' | 'critical' | 'info') => void;
}

// --- SUB-COMPONENTE PARA CADA CELDA DE TÍTULO (Corrige el error de escritura) ---
const EditableHeaderCell = ({ value, onChange, isEditing }: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  if (!isEditing) return <>{value}</>;

  return (
    <input 
      type="text" 
      className="bg-white dark:bg-slate-800 border border-indigo-500 rounded p-1 text-center w-full dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
      value={localValue} 
      onChange={(e) => {
        const val = e.target.value.toUpperCase();
        setLocalValue(val);
        onChange(val);
      }} 
    />
  );
};

// --- SUB-COMPONENTE DE TABLA ---
const RenderTable = ({ titulo, tipo, icon: Icon, color, openSections, toggleSection, isEditing, tempProducts, setTempProducts, bloquesSemanas, records }: any) => {
  return (
    <div className="rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-md">
      <div className="relative z-10">
      <button 
        onClick={() => toggleSection(tipo)}
        className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all ${color}`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} />
          <span className="font-bold text-sm tracking-wide uppercase dark:text-white">{titulo}</span>
        </div>
        {openSections[tipo] ? <ChevronUp className="dark:text-white" size={20} /> : <ChevronDown className="dark:text-white" size={20} />}
      </button>

      <div className={`${openSections[tipo] ? 'block' : 'hidden'} overflow-x-auto`}>
        <table className="w-full text-[11px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50">
              <th className="p-3 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">SEMANAS (JUE-MIÉ)</th>
              {tempProducts.map((p: string, i: number) => (
                <th key={`head-${i}`} className="p-3 border border-slate-200 dark:border-slate-600 text-center text-slate-700 dark:text-white">
                  <EditableHeaderCell 
                    value={p} 
                    isEditing={isEditing} 
                    onChange={(newVal: string) => {
                      const n = [...tempProducts];
                      n[i] = newVal;
                      setTempProducts(n);
                    }} 
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloquesSemanas.map((sem: any, idx: number) => (
              <tr key={`row-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="p-3 border border-slate-200 dark:border-slate-600 font-bold text-slate-600 dark:text-white">{sem.label}</td>
                {tempProducts.map((prod: string) => {
                  const r_semana = records.filter((r: any) => {
                    const d = new Date(r.date + 'T12:00:00');
                    return r.productName === prod && d >= sem.inicio && d <= sem.end;
                  });

                  let valor = 0;
                  if (tipo === 'entradas') valor = r_semana.reduce((acc: number, r: any) => acc + r.ingressQty, 0);
                  if (tipo === 'consumos') valor = r_semana.reduce((acc: number, r: any) => acc + r.usageQty, 0);
                  if (tipo === 'inicial') {
                    valor = records.filter((r: any) => {
                      const d = new Date(r.date + 'T12:00:00');
                      return r.productName === prod && d < sem.inicio;
                    }).reduce((acc: number, r: any) => acc + (r.ingressQty - r.usageQty), 0);
                  }
                  if (tipo === 'final') {
                    valor = records.filter((r: any) => {
                      const d = new Date(r.date + 'T12:00:00');
                      return r.productName === prod && d <= sem.end;
                    }).reduce((acc: number, r: any) => acc + (r.ingressQty - r.usageQty), 0);
                  }

                  return <td key={prod} className="p-3 border border-slate-200 dark:border-slate-600 text-center font-mono text-slate-700 dark:text-slate-200">{valor.toLocaleString()}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const RecordsTable = ({ records, productos, setProducts, isUserAdmin, addToast }: RecordsTableProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempProducts, setTempProducts] = useState(productos);
  const [monthOffset, setMonthOffset] = useState(0);
  const [openSections, setOpenSections] = useState({ inicial: true, entradas: true, consumos: true, final: true });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof openSections] }));
  };

  useEffect(() => { setTempProducts(productos); }, [productos]);

  const { nombreMes, añoActual, bloquesSemanas } = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    const month = date.getMonth();
    const year = date.getFullYear();
    const name = date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
    const ultimoDia = new Date(year, month + 1, 0).getDate();
    let primerJueves = new Date(year, month, 1);
    while (primerJueves.getDay() !== 4) { primerJueves.setDate(primerJueves.getDate() + 1); }
    const semanas: { label: string; inicio: Date; end: Date }[] = [];
    let fechaIteracion = new Date(primerJueves);
    while (fechaIteracion.getMonth() === month) {
      let inicio = new Date(fechaIteracion);
      let fin = new Date(fechaIteracion);
      fin.setDate(inicio.getDate() + 6);
      if (fin.getMonth() !== month) fin = new Date(year, month, ultimoDia);
      semanas.push({
        label: `${String(inicio.getDate()).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`,
        inicio: new Date(inicio.setHours(0,0,0,0)),
        end: new Date(fin.setHours(23,59,59,999))
      });
      fechaIteracion.setDate(fechaIteracion.getDate() + 7);
    }
    // Extender la primera semana para cubrir desde el día 1 del mes
    // Esto evita que registros antes del primer jueves queden fuera de las tablas
    if (semanas.length > 0 && semanas[0].inicio.getDate() > 1) {
      const primerDia = new Date(year, month, 1, 0, 0, 0, 0);
      semanas[0].inicio = primerDia;
      semanas[0].label = `01-${semanas[0].label.split('-')[1]}`;
    }
    return { nombreMes: name, añoActual: year, bloquesSemanas: semanas };
  }, [monthOffset]);

  const handleSave = async () => {
    try {
      setProducts(tempProducts);
      await guardarConfiguracionGeneral({ productos: tempProducts, semanas: bloquesSemanas.map(s => s.label) });
      setIsEditing(false);
      // USAMOS EL TOAST EN LUGAR DE ALERT
      addToast("Configuración guardada en la nube ✅", "success");
    } catch (e) {
      addToast("Error al guardar en la nube ❌", "critical");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl shadow-sm overflow-hidden flex justify-between items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-md">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-50 dark:from-slate-800 dark:to-slate-800"></div>
        
        <div className="relative flex items-center gap-4 px-4 py-1">
          <button onClick={() => setMonthOffset(p => p - 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full dark:text-white transition-colors"><ChevronLeft /></button>
          <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-lg">{nombreMes} {añoActual}</h2>
          <button onClick={() => setMonthOffset(p => p + 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full dark:text-white transition-colors"><ChevronRight /></button>
        </div>
        {isUserAdmin && (
          <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="relative mr-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 hover:scale-105 transition-all">
            {isEditing ? '✓ GUARDAR CAMBIOS' : '✎ EDITAR MATERIAS PRIMAS'}
          </button>
        )}
      </div>

      <RenderTable 
        titulo="Inventario Inicial (KG)" tipo="inicial" icon={Package} color="text-indigo-600" 
        openSections={openSections} toggleSection={toggleSection} isEditing={isEditing} 
        tempProducts={tempProducts} setTempProducts={setTempProducts}
        bloquesSemanas={bloquesSemanas} records={records} 
      />
      <RenderTable 
        titulo="Entradas Materia Prima (KG)" tipo="entradas" icon={ArrowDownCircle} color="text-sky-600" 
        openSections={openSections} toggleSection={toggleSection} isEditing={isEditing} 
        tempProducts={tempProducts} setTempProducts={setTempProducts}
        bloquesSemanas={bloquesSemanas} records={records} 
      />
      <RenderTable 
        titulo="Consumos Materia Prima (KG)" tipo="consumos" icon={ArrowUpCircle} color="text-amber-600" 
        openSections={openSections} toggleSection={toggleSection} isEditing={isEditing} 
        tempProducts={tempProducts} setTempProducts={setTempProducts}
        bloquesSemanas={bloquesSemanas} records={records} 
      />
      <RenderTable 
        titulo="Inventario Final (KG)" tipo="final" icon={BarChart3} color="text-emerald-600" 
        openSections={openSections} toggleSection={toggleSection} isEditing={isEditing} 
        tempProducts={tempProducts} setTempProducts={setTempProducts}
        bloquesSemanas={bloquesSemanas} records={records} 
      />
    </div>
  );
};