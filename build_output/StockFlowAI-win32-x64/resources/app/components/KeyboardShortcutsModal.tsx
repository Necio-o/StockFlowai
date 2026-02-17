import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  category: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts: Shortcut[] = [
    {
      category: 'Registros de Inventario',
      shortcuts: [
        { keys: 'Shift + N', description: 'Crear nuevo registro' },
        { keys: 'Shift + E', description: 'Exportar registros a Excel' },
        { keys: 'Ctrl + S', description: 'Guardar cambios (si aplica)' }
      ]
    },
    {
      category: 'Tareas',
      shortcuts: [
        { keys: 'Shift + T', description: 'Crear nueva tarea' },
        { keys: 'Ctrl + H', description: 'Mostrar historial de tareas' }
      ]
    },
    {
      category: 'Navegación Global',
      shortcuts: [
        { keys: 'Ctrl + K', description: 'Búsqueda rápida' },
        { keys: 'Escape', description: 'Cerrar modal/dropdown' },
        { keys: 'Ctrl + M', description: 'Alternar modo oscuro' }
      ]
    },
    {
      category: 'Admin',
      shortcuts: [
        { keys: 'Shift + A', description: 'Abrir panel de administración' },
        { keys: 'Shift + U', description: 'Gestionar usuarios' },
        { keys: 'Shift + D', description: 'Ver dashboard' }
      ]
    },
    {
      category: 'Sesión',
      shortcuts: [
        { keys: 'Shift + C', description: 'Cambiar cuenta' },
        { keys: 'Ctrl + L', description: 'Cerrar sesión' }
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Atajos de Teclado</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Usa estos atajos para trabajar más rápido. Algunos atajos pueden tener diferentes comportamientos según tu contexto.
          </p>

          {/* Shortcuts por Categoría */}
          <div className="space-y-8">
            {shortcuts.map((category, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                  {category.category}
                </h3>

                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, shortcutIdx) => (
                    <div 
                      key={shortcutIdx}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm font-semibold shadow-sm">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-2">💡 Consejo</h4>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Los atajos funcionan en cualquier parte de la app. Si estás en un input de texto, algunos atajos pueden no funcionar (como Shift+N para crear registro). En esos casos, cierra el input primero.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-8 py-4 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
