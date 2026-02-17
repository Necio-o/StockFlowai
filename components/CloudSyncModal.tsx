import React, { useState, useEffect } from 'react';
import { X, Cloud, Lock, Save, LogOut, CheckCircle, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { initGapi, initGis, handleAuthClick, signOut, uploadToDrive } from '../services/driveService';
import { DailyRecord, UserProfile, SettingsMap, Task } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataToBackup: {
    records: DailyRecord[];
    users: UserProfile[];
    products: string[];
    settings: SettingsMap;
    tasks: Task[];
  };
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose, dataToBackup }) => {
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error' | null, msg: string}>({ type: null, msg: '' });

  // Load saved credentials on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gdrive_api_key');
    const savedClientId = localStorage.getItem('gdrive_client_id');
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedClientId) setClientId(savedClientId);
  }, []);

  const handleConfigure = async () => {
    if (!apiKey || !clientId) {
      setStatus({ type: 'error', msg: 'Se requieren API Key y Client ID' });
      return;
    }

    try {
      await initGapi(apiKey, clientId);
      await initGis(clientId);
      setIsConfigured(true);
      setStatus({ type: 'success', msg: 'Conexión configurada correctamente' });
      
      // Save for future use
      localStorage.setItem('gdrive_api_key', apiKey);
      localStorage.setItem('gdrive_client_id', clientId);
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Error al inicializar Google API. Verifica tus credenciales.' });
    }
  };

  const handleLogin = async () => {
    try {
      await handleAuthClick();
      setIsSignedIn(true);
      setStatus({ type: 'success', msg: 'Sesión iniciada en Google' });
    } catch (error) {
      setStatus({ type: 'error', msg: 'Error de autenticación' });
    }
  };

  const handleLogout = () => {
    signOut();
    setIsSignedIn(false);
    setStatus({ type: null, msg: '' });
  };

  const handleBackup = async () => {
    setIsUploading(true);
    setStatus({ type: null, msg: '' });
    
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `StockFlow_Backup_${dateStr}.json`;
      
      await uploadToDrive(fileName, dataToBackup);
      
      setStatus({ type: 'success', msg: `Copia de seguridad guardada: ${fileName}` });
    } catch (error: any) {
      setStatus({ type: 'error', msg: 'Error al subir el archivo: ' + error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('gdrive_api_key');
    localStorage.removeItem('gdrive_client_id');
    setApiKey('');
    setClientId('');
    setIsConfigured(false);
    setIsSignedIn(false);
    setStatus({ type: null, msg: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
          <div className="flex items-center text-indigo-600 dark:text-indigo-400">
            <div className="bg-indigo-50 dark:bg-slate-700 p-2 rounded-lg mr-3">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Respaldo en Nube</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Google Drive Integration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Messages */}
          {status.msg && (
            <div className={`p-3 rounded-lg text-sm flex items-center ${
              status.type === 'success' ? 'bg-slate-50 text-indigo-700 border border-slate-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
              {status.msg}
            </div>
          )}

          {!isConfigured ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Configuración Inicial</p>
                Necesitas un <strong>Google Cloud Project</strong> con la API de Drive habilitada.
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Google API Key</label>
                <input 
                  type="text" 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                  placeholder="AIzaSy..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Client ID</label>
                <input 
                  type="text" 
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"
                  placeholder="12345...apps.googleusercontent.com"
                />
              </div>

              <button 
                onClick={handleConfigure}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar y Conectar
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {!isSignedIn ? (
                <div className="text-center py-6">
                  <p className="text-slate-600 dark:text-slate-300 mb-4">Configuración cargada correctamente.</p>
                  <button 
                    onClick={handleLogin}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto shadow-sm"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Iniciar Sesión con Google
                  </button>
                  <button onClick={handleClearConfig} className="text-xs text-slate-400 underline mt-4">Cambiar Credenciales</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg flex items-start">
                    <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Conexión Segura Establecida</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                            Puedes guardar una copia de seguridad de todos los registros, usuarios y configuraciones en tu Google Drive.
                        </p>
                    </div>
                  </div>

                  <button 
                    onClick={handleBackup}
                    disabled={isUploading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                  >
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                        <UploadCloud className="w-5 h-5 mr-2" />
                    )}
                    {isUploading ? 'Subiendo archivo...' : 'Realizar Copia de Seguridad Ahora'}
                  </button>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between items-center">
                    <span className="text-xs text-slate-400">Usuario autenticado</span>
                    <button 
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-700 flex items-center"
                    >
                        <LogOut className="w-4 h-4 mr-1" /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};