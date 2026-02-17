import React, { useRef, useEffect } from 'react';
import { Bell, Trash2, Info, CheckCircle, AlertOctagon, X } from 'lucide-react';

export interface NotificationItem {
  id: string;
  message: string;
  type: 'critical' | 'success' | 'info';
  timestamp: Date;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onClear,
  onClose
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      default: return (
        <div className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
      );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={onToggle} className={`relative p-2 rounded-full transition-colors ${isOpen ? 'bg-indigo-50 dark:bg-slate-700' : 'text-slate-400'}`}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Notificaciones</h3>
            <button onClick={onClear} className="text-xs text-slate-500 hover:text-red-600 flex items-center">
              <Trash2 size={12} className="mr-1" /> Limpiar
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No hay notificaciones</div>
            ) : (
              notifications.map((note) => (
                <div key={note.id} className={`p-4 flex items-start gap-3 border-l-4 ${note.type === 'critical' ? 'border-l-red-500 bg-red-50/30' : 'border-l-indigo-500'}`}>
                  {getIcon(note.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{note.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};