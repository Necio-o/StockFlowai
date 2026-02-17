/**
 * SERVICIO DE SINCRONIZACIÓN AUTOMÁTICA
 * Gestiona la persistencia automática de todos los datos en Firebase
 * Carga datos al iniciar, sincroniza cambios en tiempo real
 */

import { 
  guardarRegistro, 
  obtenerRegistros,
  guardarTareaNube,
  obtenerTareasNube,
  eliminarTareaNube,
  guardarUsuarioNube,
  obtenerUsuarios,
  guardarNotificacionNube,
  obtenerNotificacionesNube,
  guardarConfiguracionGeneral,
  obtenerConfiguracionGeneral
} from './firestore';
import { DailyRecord, Task, UserProfile, SettingsMap, ProductSettings } from '../types';

/**
 * CARGA COMPLETA - Ejecutar al iniciar la app
 */
export async function cargarTodosDatos() {
  try {
    console.log('📥 Iniciando carga completa de datos...');
    
    const [registros, tareas, usuarios, configuracion, notificaciones] = await Promise.all([
      obtenerRegistros(),
      obtenerTareasNube(),
      obtenerUsuarios(),
      obtenerConfiguracionGeneral(),
      obtenerNotificacionesNube()
    ]);

    console.log('✅ Datos cargados:', {
      registros: registros.length,
      tareas: tareas.length,
      usuarios: usuarios.length,
      notificaciones: notificaciones.length
    });

    return {
      registros: registros || [],
      tareas: tareas || [],
      usuarios: usuarios || [],
      configuracion: configuracion || {},
      notificaciones: notificaciones || []
    };
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    return {
      registros: [],
      tareas: [],
      usuarios: [],
      configuracion: {},
      notificaciones: []
    };
  }
}

/**
 * GUARDAR REGISTRO - Ejecutar cuando se añade/edita un inventario
 */
export async function syncRegistro(registro: DailyRecord) {
  try {
    await guardarRegistro(registro);
    console.log('✅ Registro guardado:', registro.id);
  } catch (error) {
    console.error('❌ Error guardando registro:', error);
  }
}

/**
 * GUARDAR TODOS LOS REGISTROS - OPTIMIZADO
 * Solo sincroniza registros modificados recientemente (últimas 2 horas)
 */
export async function syncTodosRegistros(registros: DailyRecord[]) {
  try {
    if (registros.length === 0) {
      console.log('ℹ️ No hay registros para sincronizar');
      return;
    }

    // Solo sincronizar registros de hoy y ayer (máximo 2 días recientes)
    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const registrosRecientes = registros.filter(r => 
      r.date === hoy || r.date === ayer
    );

    if (registrosRecientes.length === 0) {
      console.log('ℹ️ No hay registros recientes para sincronizar');
      return;
    }

    // Guardar solo los recientes
    const promesas = registrosRecientes.map(r => guardarRegistro(r));
    await Promise.all(promesas);
    console.log(`✅ ${registrosRecientes.length} registros recientes sincronizados (de ${registros.length} totales)`);
  } catch (error) {
    console.error('❌ Error sincronizando registros:', error);
  }
}

/**
 * GUARDAR TAREA - Ejecutar cuando se añade/edita una tarea
 */
export async function syncTarea(tarea: Task) {
  try {
    await guardarTareaNube(tarea);
    console.log('✅ Tarea guardada:', tarea.id);
  } catch (error) {
    console.error('❌ Error guardando tarea:', error);
  }
}

/**
 * GUARDAR TODAS LAS TAREAS
 */
export async function syncTodasTareas(tareas: Task[]) {
  try {
    const promesas = tareas.map(t => guardarTareaNube(t));
    await Promise.all(promesas);
    console.log('✅ Todas las tareas guardadas:', tareas.length);
  } catch (error) {
    console.error('❌ Error guardando tareas:', error);
  }
}

/**
 * ELIMINAR TAREA
 */
export async function syncEliminarTarea(tareaId: string) {
  try {
    await eliminarTareaNube(tareaId);
    console.log('✅ Tarea eliminada:', tareaId);
  } catch (error) {
    console.error('❌ Error eliminando tarea:', error);
  }
}

/**
 * GUARDAR USUARIO - Ejecutar cuando se crea/edita un usuario
 */
export async function syncUsuario(usuario: UserProfile) {
  try {
    await guardarUsuarioNube(usuario);
    console.log('✅ Usuario guardado:', usuario.id);
  } catch (error) {
    console.error('❌ Error guardando usuario:', error);
  }
}

/**
 * GUARDAR TODOS LOS USUARIOS
 */
export async function syncTodosUsuarios(usuarios: UserProfile[]) {
  try {
    const promesas = usuarios.map(u => guardarUsuarioNube(u));
    await Promise.all(promesas);
    console.log('✅ Todos los usuarios guardados:', usuarios.length);
  } catch (error) {
    console.error('❌ Error guardando usuarios:', error);
  }
}

/**
 * GUARDAR CONFIGURACIÓN (Ajustes de productos)
 */
export async function syncConfiguracion(config: {
  settingsMap?: SettingsMap;
  products?: string[];
  semanasLabel?: string[];
  [key: string]: any;
}) {
  try {
    await guardarConfiguracionGeneral(config);
    console.log('✅ Configuración guardada');
  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
  }
}

/**
 * GUARDAR NOTIFICACIÓN
 */
export async function syncNotificacion(notificacion: any) {
  try {
    await guardarNotificacionNube(notificacion);
    console.log('✅ Notificación guardada:', notificacion.id);
  } catch (error) {
    console.error('❌ Error guardando notificación:', error);
  }
}

/**
 * CREAR NUEVO REGISTRO Y GUARDAR AUTOMÁTICAMENTE
 */
export async function crearYGuardarRegistro(data: Omit<DailyRecord, 'id'>): Promise<DailyRecord | null> {
  try {
    const nuevoRegistro: DailyRecord = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    await syncRegistro(nuevoRegistro);
    return nuevoRegistro;
  } catch (error) {
    console.error('❌ Error creando registro:', error);
    return null;
  }
}

/**
 * CREAR NUEVA TAREA Y GUARDAR AUTOMÁTICAMENTE
 */
export async function crearYGuardarTarea(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task | null> {
  try {
    const nuevaTarea: Task = {
      ...data,
      id: `task-${Date.now()}`,
      createdAt: Date.now()
    };
    await syncTarea(nuevaTarea);
    return nuevaTarea;
  } catch (error) {
    console.error('❌ Error creando tarea:', error);
    return null;
  }
}

/**
 * HOOK PARA AUTO-SINCRONIZACIÓN
 * Uso: useAutoSync(records, 'registros')
 * Sincroniza automáticamente cuando los datos cambian
 */
export function useAutoSync(
  data: any, 
  tipo: 'registros' | 'tareas' | 'usuarios' | 'configuracion' | 'notificaciones',
  delayMs: number = 1000
) {
  let timeoutId: any;

  return () => {
    // Limpiar timeout anterior
    if (timeoutId) clearTimeout(timeoutId);

    // Esperar un poco para evitar múltiples sincronizaciones
    timeoutId = setTimeout(() => {
      switch (tipo) {
        case 'registros':
          if (Array.isArray(data)) syncTodosRegistros(data);
          break;
        case 'tareas':
          if (Array.isArray(data)) syncTodasTareas(data);
          break;
        case 'usuarios':
          if (Array.isArray(data)) syncTodosUsuarios(data);
          break;
        case 'configuracion':
          syncConfiguracion(data);
          break;
        case 'notificaciones':
          if (Array.isArray(data) && data.length > 0) {
            data.forEach(n => syncNotificacion(n));
          }
          break;
      }
    }, delayMs);
  };
}

/**
 * SINCRONIZACIÓN EN TIEMPO REAL CON DEBOUNCE
 * Evita guardar demasiado frecuentemente
 */
export class AutoSyncManager {
  private timeoutId: any = null;
  private delayMs: number;

  constructor(delayMs: number = 2000) {
    this.delayMs = delayMs;
  }

  /**
   * Registra un cambio y sincroniza después del delay
   */
  async sync(
    data: any,
    tipo: 'registros' | 'tareas' | 'usuarios' | 'configuracion'
  ) {
    // Limpiar timeout anterior
    if (this.timeoutId) clearTimeout(this.timeoutId);

    // Programar nueva sincronización
    return new Promise<void>((resolve) => {
      this.timeoutId = setTimeout(async () => {
        try {
          switch (tipo) {
            case 'registros':
              if (Array.isArray(data)) await syncTodosRegistros(data);
              break;
            case 'tareas':
              if (Array.isArray(data)) await syncTodasTareas(data);
              break;
            case 'usuarios':
              if (Array.isArray(data)) await syncTodosUsuarios(data);
              break;
            case 'configuracion':
              await syncConfiguracion(data);
              break;
          }
          resolve();
        } catch (error) {
          console.error('Error en sincronización:', error);
          resolve();
        }
      }, this.delayMs);
    });
  }

  /**
   * Cancelar cualquier sincronización pendiente
   */
  cancel() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Forzar sincronización inmediata
   */
  async syncNow(
    data: any,
    tipo: 'registros' | 'tareas' | 'usuarios' | 'configuracion'
  ) {
    this.cancel();
    switch (tipo) {
      case 'registros':
        if (Array.isArray(data)) await syncTodosRegistros(data);
        break;
      case 'tareas':
        if (Array.isArray(data)) await syncTodasTareas(data);
        break;
      case 'usuarios':
        if (Array.isArray(data)) await syncTodosUsuarios(data);
        break;
      case 'configuracion':
        await syncConfiguracion(data);
        break;
    }
  }
}
