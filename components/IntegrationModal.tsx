import React, { useState } from 'react';
import { X, Plug, Check, AlertCircle, Github, Mail, MessageSquare, Zap, ExternalLink } from 'lucide-react';
import { emailService } from '../services/emailService';
import { googleSheetsService } from '../services/googleSheetsService';
import { whatsappService } from '../services/whatsappService';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigureClick?: (integrationType: 'email' | 'sheets' | 'whatsapp') => void;
}

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  status: 'connected' | 'disconnected' | 'coming_soon';
  color: string;
  action?: () => void;
  integrationType?: 'email' | 'sheets' | 'whatsapp';
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, onConfigureClick }) => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  // Determinar estado actual de las integraciones
  const getIntegrationStatus = (id: string) => {
    if (id === 'email') {
      return emailService.isConfigured() ? 'connected' : 'disconnected';
    } else if (id === 'google-sheets') {
      return googleSheetsService.isConfigured() ? 'connected' : 'disconnected';
    } else if (id === 'whatsapp') {
      return whatsappService.isConfigured() ? 'connected' : 'disconnected';
    }
    return 'coming_soon';
  };

  const integrations: Integration[] = [
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      icon: <Zap className="w-8 h-8" />,
      description: 'Sincroniza datos automáticamente con Google Sheets. Crea reportes dinámicos.',
      status: getIntegrationStatus('google-sheets') as any,
      color: 'from-green-500 to-indigo-600',
      integrationType: 'sheets',
      action: () => onConfigureClick?.('sheets')
    },
    {
      id: 'email',
      name: 'Email Notifications',
      icon: <Mail className="w-8 h-8" />,
      description: 'Recibe alertas, reportes y notificaciones por correo automáticamente.',
      status: getIntegrationStatus('email') as any,
      color: 'from-blue-500 to-cyan-600',
      integrationType: 'email',
      action: () => onConfigureClick?.('email')
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: <MessageSquare className="w-8 h-8" />,
      description: 'Integración con Slack para notificaciones y alertas en tiempo real.',
      status: 'coming_soon',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: <Plug className="w-8 h-8" />,
      description: 'Sync inventory con tu tienda Shopify automáticamente.',
      status: 'coming_soon',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-8 h-8" />,
      description: 'Backup automático de tus datos en un repositorio privado.',
      status: 'coming_soon',
      color: 'from-slate-700 to-slate-900'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: <MessageSquare className="w-8 h-8" />,
      description: 'Alertas y notificaciones vía WhatsApp a múltiples números.',
      status: getIntegrationStatus('whatsapp') as any,
      color: 'from-green-400 to-green-600',
      integrationType: 'whatsapp',
      action: () => onConfigureClick?.('whatsapp')
    }
  ];

  const handleIntegrationClick = (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      return;
    }
    if (integration.action) {
      integration.action();
    } else {
      setSelectedIntegration(integration.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Plug className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Integraciones Externas</h2>
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
            Conecta StockFlow AI con tus herramientas favoritas para automatizar flujos de trabajo y mejorar productividad.
          </p>

          {/* Grid de Integraciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map(integration => (
              <div 
                key={integration.id}
                onClick={() => handleIntegrationClick(integration)}
                className={`group bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all ${ 
                  integration.status === 'coming_soon' ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500'
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${integration.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {integration.icon}
                </div>

                {/* Name */}
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                  {integration.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  {integration.description}
                </p>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">Conectado</span>
                    </>
                  ) : integration.status === 'coming_soon' ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Proximamente</span>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">Desconectado</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">¿No ves la integración que necesitas?</h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              Puedes solicitar nuevas integraciones o crear webhooks personalizados. Contacta al equipo de desarrollo.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-semibold">
              <ExternalLink className="w-4 h-4" />
              Solicitar Integración
            </button>
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
