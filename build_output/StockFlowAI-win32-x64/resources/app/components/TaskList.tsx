import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, ShieldAlert, Clock, Bell, CheckCircle } from 'lucide-react';
import { Task, UserRole } from '../types';

interface TaskListProps {
  tasks: Task[];
  userRole: UserRole;
  onAdd: (text: string, reminderTime?: string) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, userRole, onAdd, onToggle, onEdit, onDelete }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [showTimer, setShowTimer] = useState(false);

  const isAdmin = userRole === 'admin';
  const completedCount = tasks.filter(t => t.completed).length;

const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAdd(newTaskText.trim(), reminderTime || undefined); 
      
      setNewTaskText('');
      setReminderTime('');
      setShowTimer(false);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return b.createdAt - a.createdAt;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="rounded-xl shadow-sm overflow-hidden flex flex-col h-auto transition-all duration-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md">
      
      <div className="flex flex-col h-auto">
      {/* CABECERA */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Tareas y Reuniones</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
          {completedCount}/{tasks.length}
        </span>
      </div>

      <div className="p-4 flex flex-col">
        {/* FORMULARIO (Solo Admin) */}
        {isAdmin ? (
          <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4">
            <div className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Nueva tarea o reunión..."
                className="flex-1 bg-transparent border-none text-sm dark:text-white outline-none px-2"
              />
              <button 
                type="button"
                onClick={() => setShowTimer(!showTimer)}
                className={`p-1.5 rounded-lg transition-colors ${showTimer ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                title="Añadir recordatorio"
              >
                <Clock size={18} />
              </button>
              <button
                type="submit"
                disabled={!newTaskText.trim()}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </div>

            {showTimer && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg animate-in fade-in slide-in-from-top-2 border border-slate-200 dark:border-slate-600">
                <Bell size={14} className="text-indigo-500" />
                <input 
                  type="datetime-local"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] dark:text-white outline-none [color-scheme:dark]"
                />
              </div>
            )}
          </form>
        ) : (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center text-[10px] text-slate-500">
            <ShieldAlert className="w-3 h-3 mr-2" />
            Solo administradores pueden crear tareas.
          </div>
        )}

        {/* LISTA DE TAREAS - Se ajusta automáticamente al contenido */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">{sortedTasks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No hay pendientes</div>
          ) : (
            sortedTasks.map((task) => (
              <div key={task.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-all ${
                task.completed 
                  ? 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700 opacity-60' 
                  : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <button onClick={() => onToggle(task.id)} className="text-indigo-500 hover:scale-110 transition-transform">
                    {task.completed ? <CheckCircle size={18} /> : <Circle size={18} className="text-slate-300 dark:text-slate-600" />}
                  </button>
                  
<div className="flex flex-col flex-1 overflow-hidden">
  <span className={`text-sm truncate dark:text-white ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
    {task.text}
  </span>
  {/* VISUALIZADOR DE FECHA REFORZADO */}
  {task.reminderTime ? (
    <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded w-fit border border-indigo-200 dark:border-indigo-800">
      <Clock size={10} className="text-indigo-600 dark:text-indigo-400" /> 
      <span className="text-[9px] text-indigo-700 dark:text-indigo-300 font-bold uppercase">
        {new Date(task.reminderTime).toLocaleString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </span>
    </div>
  ) : (
    <span className="text-[8px] text-slate-400 italic mt-0.5">Sin recordatorio</span>
  )}
</div>
                </div>

                {isAdmin && (
                  <button onClick={() => onDelete(task.id)} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

// Componente de círculo auxiliar
const Circle = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);