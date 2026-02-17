import React, { useState } from 'react';
import { X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { emailService } from '../services/emailService';
import { googleSheetsService } from '../services/googleSheetsService';
import { whatsappService } from '../services/whatsappService';

interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  integationType: 'email' | 'sheets' | 'whatsapp';
  userId?: string;
}

const IntegrationConfigModal: React.FC<IntegrationConfigModalProps> = ({
  isOpen,
  onClose,
  integationType,
  userId
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [emailConfig, setEmailConfig] = useState({
    apiKey: '',
    senderEmail: '',
    isEnabled: false
  });

  const [sheetsConfig, setSheetsConfig] = useState({
    accessToken: '',
    spreadsheetId: '',
    isEnabled: false
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    businessAccountId: '',
    isEnabled: false
  });

  const handleEmailConnect = async () => {
    if (!emailConfig.apiKey || !emailConfig.senderEmail) {
      setMessage('⚠️ Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (userId) {
        emailService.setUserId(userId);
        const saved = await emailService.saveConfig({
          ...emailConfig,
          isEnabled: true
        });
        if (!saved) {
          setMessage('⚠️ No se pudo guardar en la base de datos');
          setLoading(false);
          return;
        }
      }

      emailService.configure({
        ...emailConfig,
        isEnabled: true
      });
      setMessage('✅ Email conectado y guardado correctamente');
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage('❌ Error al conectar email');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetsConnect = async () => {
    if (!sheetsConfig.accessToken || !sheetsConfig.spreadsheetId) {
      setMessage('⚠️ Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (userId) {
        googleSheetsService.setUserId(userId);
        const saved = await googleSheetsService.saveConfig({
          ...sheetsConfig,
          isEnabled: true
        });
        if (!saved) {
          setMessage('⚠️ No se pudo guardar en la base de datos');
          setLoading(false);
          return;
        }
      }

      googleSheetsService.configure({
        ...sheetsConfig,
        isEnabled: true
      });
      setMessage('✅ Google Sheets conectado y guardado correctamente');
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage('❌ Error al conectar Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappConnect = async () => {
    if (!whatsappConfig.phoneNumberId || !whatsappConfig.accessToken || !whatsappConfig.businessAccountId) {
      setMessage('⚠️ Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (userId) {
        whatsappService.setUserId(userId);
        const saved = await whatsappService.saveConfig({
          ...whatsappConfig,
          isEnabled: true
        });
        if (!saved) {
          setMessage('⚠️ No se pudo guardar en la base de datos');
          setLoading(false);
          return;
        }
      }

      whatsappService.configure({
        ...whatsappConfig,
        isEnabled: true
      });
      setMessage('✅ WhatsApp conectado y guardado correctamente');
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage('❌ Error al conectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (type: string) => {
    try {
      if (type === 'email') {
        if (userId) {
          emailService.setUserId(userId);
          await emailService.deleteConfig();
        }
        setEmailConfig({ apiKey: '', senderEmail: '', isEnabled: false });
        setMessage('✅ Email desconectado');
      } else if (type === 'sheets') {
        if (userId) {
          googleSheetsService.setUserId(userId);
          await googleSheetsService.deleteConfig();
        }
        setSheetsConfig({ accessToken: '', spreadsheetId: '', isEnabled: false });
        setMessage('✅ Google Sheets desconectado');
      } else if (type === 'whatsapp') {
        if (userId) {
          whatsappService.setUserId(userId);
          await whatsappService.deleteConfig();
        }
        setWhatsappConfig({ phoneNumberId: '', accessToken: '', businessAccountId: '', isEnabled: false });
        setMessage('✅ WhatsApp desconectado');
      }
    } catch (error) {
      console.error('Error desconectando:', error);
      setMessage('❌ Error al desconectar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-2xl font-bold dark:text-white">
            {integationType === 'email' && '📧 Configurar Email'}
            {integationType === 'sheets' && '📊 Configurar Google Sheets'}
            {integationType === 'whatsapp' && '💬 Configurar WhatsApp'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' :
              message.includes('❌') ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100' :
              'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
            }`}>
              {message}
            </div>
          )}

          {/* EMAIL CONFIG */}
          {integationType === 'email' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm dark:text-slate-300 mb-3">
                  Para configurar email, necesitas:
                </p>
                <ul className="text-sm dark:text-slate-400 space-y-1 ml-4">
                  <li>✓ Una cuenta en <strong>Resend</strong> (resend.com) o similar</li>
                  <li>✓ API Key de tu servicio de email</li>
                  <li>✓ Dominio verificado o email sender address</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold dark:text-white mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailConfig.apiKey}
                    onChange={(e) => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2 pr-10 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold dark:text-white mb-2">
                  Email Remitente
                </label>
                <input
                  type="email"
                  value={emailConfig.senderEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                  placeholder="noreply@tudominio.com"
                  className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleEmailConnect}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
                >
                  {loading ? 'Conectando...' : '🔗 Conectar Email'}
                </button>
                {emailService.isConfigured() && (
                  <button
                    onClick={() => handleDisconnect('email')}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-100 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* GOOGLE SHEETS CONFIG */}
          {integationType === 'sheets' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm dark:text-slate-300 mb-3">
                  Para configurar Google Sheets, necesitas:
                </p>
                <ul className="text-sm dark:text-slate-400 space-y-1 ml-4">
                  <li>✓ Crear un proyecto en <strong>Google Cloud Console</strong></li>
                  <li>✓ Habilitar Sheets API</li>
                  <li>✓ Generar OAuth 2.0 credentials</li>
                  <li>✓ Access Token del usuario</li>
                  <li>✓ ID de la hoja compartida contigo</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold dark:text-white mb-2">
                  Access Token
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={sheetsConfig.accessToken}
                    onChange={(e) => setSheetsConfig({ ...sheetsConfig, accessToken: e.target.value })}
                    placeholder="ya29.a0AfH6SMB..."
                    className="w-full px-4 py-2 pr-10 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold dark:text-white mb-2">
                  Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={sheetsConfig.spreadsheetId}
                  onChange={(e) => setSheetsConfig({ ...sheetsConfig, spreadsheetId: e.target.value })}
                  placeholder="1BxiMVs0XRA5nFMKUVfseKMyWWAqSE8Cs8z8H3kSf9Uc"
                  className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lo encuentras en la URL: docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSheetsConnect}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-2 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50"
                >
                  {loading ? 'Conectando...' : '🔗 Conectar Google Sheets'}
                </button>
                {googleSheetsService.isConfigured() && (
                  <button
                    onClick={() => handleDisconnect('sheets')}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-100 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* WHATSAPP CONFIG */}
          {integationType === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm dark:text-slate-300 mb-3">
                  Para configurar WhatsApp Business, necesitas:
                </p>
                <ul className="text-sm dark:text-slate-400 space-y-1 ml-4">
                  <li>✓ Una cuenta de <strong>Meta (Facebook) Business</strong></li>
                  <li>✓ WhatsApp Business Account verificado</li>
                  <li>✓ Access Token de la aplicación</li>
                  <li>✓ Phone Number ID (de tu número de WhatsApp)</li>
                  <li>✓ Business Account ID</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold dark:text-white mb-2">
                  Access Token
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={whatsappConfig.accessToken}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, accessToken: e.target.value })}
                    placeholder="EAAxxxxxxxxxx..."
                    className="w-full px-4 py-2 pr-10 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold dark:text-white mb-2">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={whatsappConfig.phoneNumberId}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })}
                  placeholder="102000xxxxx"
                  className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold dark:text-white mb-2">
                  Business Account ID
                </label>
                <input
                  type="text"
                  value={whatsappConfig.businessAccountId}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, businessAccountId: e.target.value })}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleWhatsappConnect}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50"
                >
                  {loading ? 'Conectando...' : '🔗 Conectar WhatsApp'}
                </button>
                {whatsappService.isConfigured() && (
                  <button
                    onClick={() => handleDisconnect('whatsapp')}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-100 rounded-lg hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              ℹ️ <strong>Nota de seguridad:</strong> Tus credenciales se almacenan de forma segura en tu dispositivo.
              Nunca compartimos datos sensibles con servidores externos innecesarios.
            </p>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 border-t dark:border-slate-700 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700 font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationConfigModal;

export { IntegrationConfigModal };
