import React, { useState } from 'react';
import { User, Lock, LogIn, AlertCircle, Moon, Sun, Clock, LayoutDashboard } from 'lucide-react';
import { UserProfile } from '../types';
import { loginRateLimiter, logSecurityEvent, sanitizeInput } from '../services/securityService';

interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
  logoutReason?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin, isDarkMode, toggleTheme, logoutReason }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const usernameKey = `login_${username.toLowerCase()}`;

    // Verificar si está bloqueado por rate limiting
    if (loginRateLimiter.isLocked(usernameKey)) {
      const error = '🔒 Demasiados intentos fallidos. Intenta en 15 minutos.';
      setError(error);
      logSecurityEvent('LOGIN_FAILURE', username, { reason: 'rate_limit_exceeded' });
      return;
    }

    setIsLoading(true);

    // Simular un pequeño delay para mejor UX
    setTimeout(() => {
      const sanitizedUsername = sanitizeInput(username.toLowerCase());
      const sanitizedPassword = sanitizeInput(password);

      const foundUser = users.find(
        u => u.username.toLowerCase() === sanitizedUsername && u.password === sanitizedPassword
      );

      if (foundUser) {
        loginRateLimiter.reset(usernameKey);
        logSecurityEvent('LOGIN_ATTEMPT', username, { success: true });
        onLogin(foundUser);
      } else {
        loginRateLimiter.recordAttempt(usernameKey);
        const remaining = loginRateLimiter.getRemainingAttempts(usernameKey);
        setRemainingAttempts(remaining);

        if (remaining === 0) {
          setError('🔒 Cuenta bloqueada. Intenta en 15 minutos.');
        } else {
          setError(`❌ Credenciales incorrectas. Intentos restantes: ${remaining}`);
        }

        logSecurityEvent('LOGIN_FAILURE', username, { reason: 'invalid_credentials', remaining });
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-700">
      
      {/* Theme Toggle */}
      {toggleTheme && (
        <div className="absolute top-6 right-6 z-20">
          <button
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-all shadow-sm hover:shadow-md"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 sm:p-10 transition-all duration-300">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25 mb-6 transform hover:scale-105 transition-all duration-500">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight transition-all duration-500">
              StockFlow AI
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
              Gestión inteligente de inventario
            </p>
          </div>

          {logoutReason && (
             <div className="mb-6 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 p-4 rounded-xl flex items-start text-amber-800 dark:text-amber-200 text-sm animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
                <Clock className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{logoutReason}</span>
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-center font-medium animate-shake">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide ml-1">Usuario</label>
              <div className="relative transition-all duration-300 transform group-focus-within:scale-[1.01]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* Icon Focus Color: Violet (Light) vs Emerald (Dark) */}
                  <User className="h-5 w-5 text-slate-300 dark:text-slate-500 transition-colors group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide ml-1">Contraseña</label>
              <div className="relative transition-all duration-300 transform group-focus-within:scale-[1.01]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {/* Icon Focus Color */}
                  <Lock className="h-5 w-5 text-slate-300 dark:text-slate-500 transition-colors group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 mt-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-500 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Ingresar al Sistema
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Versión de la app */}
      <div className="absolute bottom-4 right-4 z-20 text-right">
        <span className="text-[11px] text-slate-400/60 dark:text-slate-600 font-mono block">
          v1.5.0
        </span>
        <span className="text-[10px] text-slate-400/40 dark:text-slate-700 font-mono block">
          Importación Excel · Diálogos confirmación · Badges · Correcciones
        </span>
      </div>
    </div>
  );
};