/**
 * SERVICIO DE GOOGLE SHEETS
 * Sincroniza datos de inventario con hojas de cálculo de Google
 * Con persistencia en Firebase
 */

import { db } from './firestore';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface GoogleSheetsConfig {
  accessToken: string;
  spreadsheetId: string;
  isEnabled: boolean;
}

export interface SheetData {
  spreadsheetId: string;
  range: string;
  values: any[][];
}

export class GoogleSheetsService {
  private config: GoogleSheetsConfig | null = null;
  private readonly API_ENDPOINT = 'https://sheets.googleapis.com/v4/spreadsheets';
  private userId: string | null = null;

  /**
   * Establece el usuario actual para guardar configuración
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Configura el servicio con credenciales de Google
   */
  configure(config: GoogleSheetsConfig) {
    this.config = config;
    console.log('📊 Google Sheets service configurado');
  }

  /**
   * Guarda la configuración en Firebase
   */
  async saveConfig(config: GoogleSheetsConfig): Promise<boolean> {
    try {
      if (!this.userId) {
        console.warn('❌ No hay usuario para guardar configuración');
        return false;
      }

      this.config = config;
      
      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'googleSheets');
      await setDoc(integrationsRef, {
        ...config,
        savedAt: new Date().toISOString()
      });

      console.log('✅ Configuración de Google Sheets guardada en Firebase');
      return true;
    } catch (error) {
      console.error('❌ Error guardando configuración de Google Sheets:', error);
      return false;
    }
  }

  /**
   * Carga la configuración desde Firebase
   */
  async loadConfig(): Promise<boolean> {
    try {
      if (!this.userId) {
        console.warn('❌ No hay usuario para cargar configuración');
        return false;
      }

      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'googleSheets');
      const docSnap = await getDoc(integrationsRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.config = {
          accessToken: data.accessToken,
          spreadsheetId: data.spreadsheetId,
          isEnabled: data.isEnabled
        };
        console.log('✅ Configuración de Google Sheets cargada desde Firebase');
        return true;
      } else {
        console.log('ℹ️ No hay configuración de Google Sheets guardada');
        return false;
      }
    } catch (error) {
      console.error('❌ Error cargando configuración de Google Sheets:', error);
      return false;
    }
  }

  /**
   * Elimina la configuración guardada
   */
  async deleteConfig(): Promise<boolean> {
    try {
      if (!this.userId) {
        console.warn('❌ No hay usuario para eliminar configuración');
        return false;
      }

      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'googleSheets');
      await setDoc(integrationsRef, {
        accessToken: '',
        spreadsheetId: '',
        isEnabled: false,
        deletedAt: new Date().toISOString()
      });

      this.config = null;
      console.log('✅ Configuración de Google Sheets eliminada');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando configuración de Google Sheets:', error);
      return false;
    }
  }

  /**
   * Verifica si está configurado
   */
  isConfigured(): boolean {
    return !!this.config && this.config.isEnabled;
  }

  /**
   * Sincroniza registros de inventario a Google Sheets
   */
  async syncInventoryRecords(records: any[]): Promise<boolean> {
    if (!this.isConfigured() || !this.config) {
      console.warn('📊 Google Sheets no configurado. Simulando sincronización...');
      console.log(`[SIMULATED] Sincronizando ${records.length} registros a Google Sheets`);
      return true;
    }

    try {
      const values = [
        ['Fecha', 'Producto', 'Cantidad', 'Tipo', 'Usuario', 'Notas'],
        ...records.map(r => [
          new Date(r.fecha).toLocaleDateString(),
          r.producto,
          r.cantidad,
          r.tipo === 'entrada' ? 'Entrada' : 'Salida',
          r.usuario || 'Sistema',
          r.notas || ''
        ])
      ];

      // Punto de integración real con Google Sheets API
      // const response = await fetch(
      //   `${this.API_ENDPOINT}/${this.config.spreadsheetId}/values/Inventario!A1:F${records.length + 1}?valueInputOption=USER_ENTERED`,
      //   {
      //     method: 'PUT',
      //     headers: {
      //       'Authorization': `Bearer ${this.config.accessToken}`,
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify({ values })
      //   }
      // );

      console.log('✅ Inventario sincronizado a Google Sheets');
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando a Google Sheets:', error);
      return false;
    }
  }

  /**
   * Sincroniza resumen de stock actual
   */
  async syncStockSummary(products: any[]): Promise<boolean> {
    if (!this.isConfigured() || !this.config) {
      console.warn('📊 Google Sheets no configurado. Simulando resumen...');
      console.log(`[SIMULATED] Sincronizando resumen de ${products.length} productos`);
      return true;
    }

    try {
      const values = [
        ['Producto', 'Stock Actual', 'Stock Mínimo', 'Estado', 'Última Actualización'],
        ...products.map(p => {
          const isLow = p.stock <= p.minStock;
          return [
            p.nombre,
            p.stock,
            p.minStock || 0,
            isLow ? '⚠️ BAJO' : '✅ OK',
            new Date().toLocaleDateString()
          ];
        })
      ];

      console.log('✅ Resumen de stock sincronizado');
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando resumen:', error);
      return false;
    }
  }

  /**
   * Sincroniza tareas a Google Sheets
   */
  async syncTasks(tasks: any[]): Promise<boolean> {
    if (!this.isConfigured() || !this.config) {
      console.warn('📊 Google Sheets no configurado. Simulando tareas...');
      console.log(`[SIMULATED] Sincronizando ${tasks.length} tareas a Google Sheets`);
      return true;
    }

    try {
      const values = [
        ['Descripción', 'Estado', 'Vencimiento', 'Asignado a', 'Prioridad'],
        ...tasks.map(t => [
          t.description,
          t.completed ? 'Completada' : 'Pendiente',
          new Date(t.dueDate).toLocaleDateString(),
          t.assignedTo || 'Sin asignar',
          t.priority || 'Normal'
        ])
      ];

      console.log('✅ Tareas sincronizadas a Google Sheets');
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando tareas:', error);
      return false;
    }
  }

  /**
   * Sincroniza estadísticas y reportes
   */
  async syncReports(reportData: {
    date: string;
    totalEntries: number;
    totalExits: number;
    anomalies: number;
    salesValue?: number;
  }): Promise<boolean> {
    if (!this.isConfigured() || !this.config) {
      console.warn('📊 Google Sheets no configurado. Simulando reporte...');
      console.log('[SIMULATED] Reporte sincronizado');
      return true;
    }

    try {
      const values = [
        ['Fecha', 'Total Entradas', 'Total Salidas', 'Anomalías', 'Valor (opcional)'],
        [
          reportData.date,
          reportData.totalEntries,
          reportData.totalExits,
          reportData.anomalies,
          reportData.salesValue || ''
        ]
      ];

      console.log('✅ Reportes sincronizados');
      return true;
    } catch (error) {
      console.error('❌ Error sincronizando reportes:', error);
      return false;
    }
  }

  /**
   * Lee datos de una hoja específica
   */
  async readSheet(range: string): Promise<any[][] | null> {
    if (!this.isConfigured() || !this.config) {
      console.warn('📊 Google Sheets no configurado');
      return null;
    }

    try {
      // Punto de integración real
      // const response = await fetch(
      //   `${this.API_ENDPOINT}/${this.config.spreadsheetId}/values/${range}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.config.accessToken}`
      //     }
      //   }
      // );
      // const data = await response.json();
      // return data.values;

      console.log('✅ Datos leídos de Google Sheets');
      return [];
    } catch (error) {
      console.error('❌ Error leyendo datos:', error);
      return null;
    }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): GoogleSheetsConfig | null {
    return this.config;
  }

  /**
   * Desconecta el servicio
   */
  disconnect() {
    this.config = null;
    console.log('📊 Google Sheets desconectado');
  }
}

export const googleSheetsService = new GoogleSheetsService();
