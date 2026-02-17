import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      app: {
        title: "StockFlow AI",
        mode_admin: "Modo Administrativo",
        mode_user: "Modo Operador",
        logout: "Cerrar Sesión",
        theme_light: "Cambiar a modo claro",
        theme_dark: "Cambiar a modo oscuro",
        language: "Idioma"
      },
      auth: {
        title: "StockFlow AI",
        subtitle: "Inicie sesión para acceder al sistema",
        username: "Usuario",
        username_placeholder: "Ingrese su usuario",
        password: "Contraseña",
        login_button: "Ingresar",
        credentials_error: "Credenciales incorrectas. Intente de nuevo.",
        default_users: "Usuarios por defecto",
        logout_reason: "La sesión se cerró automáticamente debido a inactividad (5 min)."
      },
      record: {
        tab_ingress: "Registrar Ingreso (Entrada)",
        tab_usage: "Registrar Uso (Salida)",
        date: "Fecha",
        time: "Hora",
        product: "Producto",
        quantity: "Cantidad",
        btn_ingress: "Ingresar",
        btn_save: "Guardar",
        toast_ingress: "Ingreso registrado correctamente",
        toast_usage: "Salida registrada correctamente"
      },
      stats: {
        target_fixed: "OBJETIVO FIJO",
        target_usage: "Uso Objetivo",
        calculated_avg: "Promedio Calculado",
        calc_label: "Calc",
        tolerance_range: "Rango Tolerancia",
        total_entries: "Total Entradas"
      },
      common: {
        loading: "Generando...",
        report: "Reporte",
        save: "Guardar",
        cancel: "Cancelar",
        delete: "Eliminar",
        edit: "Editar",
        success: "Éxito",
        error: "Error",
        info: "Información",
        critical: "¡Alerta Crítica!"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "es", // Force Spanish
    fallbackLng: "es",
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;