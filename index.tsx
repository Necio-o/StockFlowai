import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import i18n configuration directly with relative path
import './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("ERROR CRÍTICO: No se encontró el elemento raíz para montar la aplicación");
  throw new Error("No se encontró el elemento raíz");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">Cargando sistema StockFlow...</div>}>
        <App />
      </React.Suspense>
    </React.StrictMode>
  );
} catch (error) {
  console.error("Error de renderizado de la aplicación:", error);
  rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error crítico al iniciar la aplicación. Revise la consola. <br/> ${error}</div>`;
}