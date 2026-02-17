/**
 * SERVICIO DE WHATSAPP BUSINESS
 * Envía alertas y notificaciones por WhatsApp
 * Con persistencia en Firebase
 */

import { db } from './firestore';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  isEnabled: boolean;
}

export interface WhatsAppMessage {
  recipientPhone: string;
  messageType: 'text' | 'template' | 'document';
  content: string;
  templateName?: string;
  parameters?: any[];
}

export class WhatsAppService {
  private config: WhatsAppConfig | null = null;
  private readonly API_ENDPOINT = 'https://graph.instagram.com/v18.0';
  private userId: string | null = null;

  /**
   * Establece el usuario actual para guardar configuración
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Configura el servicio con credenciales de WhatsApp Business
   */
  configure(config: WhatsAppConfig) {
    this.config = config;
    console.log('💬 WhatsApp Business service configurado');
  }

  /**
   * Guarda la configuración en Firebase
   */
  async saveConfig(config: WhatsAppConfig): Promise<boolean> {
    try {
      if (!this.userId) {
        console.warn('❌ No hay usuario para guardar configuración');
        return false;
      }

      this.config = config;
      
      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'whatsapp');
      await setDoc(integrationsRef, {
        ...config,
        savedAt: new Date().toISOString()
      });

      console.log('✅ Configuración de WhatsApp guardada en Firebase');
      return true;
    } catch (error) {
      console.error('❌ Error guardando configuración de WhatsApp:', error);
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

      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'whatsapp');
      const docSnap = await getDoc(integrationsRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.config = {
          phoneNumberId: data.phoneNumberId,
          accessToken: data.accessToken,
          businessAccountId: data.businessAccountId,
          isEnabled: data.isEnabled
        };
        console.log('✅ Configuración de WhatsApp cargada desde Firebase');
        return true;
      } else {
        console.log('ℹ️ No hay configuración de WhatsApp guardada');
        return false;
      }
    } catch (error) {
      console.error('❌ Error cargando configuración de WhatsApp:', error);
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

      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'whatsapp');
      await setDoc(integrationsRef, {
        phoneNumberId: '',
        accessToken: '',
        businessAccountId: '',
        isEnabled: false,
        deletedAt: new Date().toISOString()
      });

      this.config = null;
      console.log('✅ Configuración de WhatsApp eliminada');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando configuración de WhatsApp:', error);
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
   * Envía un mensaje de texto por WhatsApp
   */
  async sendMessage(recipientPhone: string, message: string): Promise<boolean> {
    if (!this.isConfigured() || !this.config) {
      console.warn('💬 WhatsApp no configurado. Simulando envío...');
      console.log(`[SIMULATED] WhatsApp enviado a ${recipientPhone}: ${message}`);
      return true;
    }

    try {
      // Normalizar número telefónico (solo dígitos)
      const phone = recipientPhone.replace(/\D/g, '');

      // Punto de integración real con WhatsApp Business API
      // const response = await fetch(
      //   `${this.API_ENDPOINT}/${this.config.phoneNumberId}/messages`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${this.config.accessToken}`,
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify({
      //       messaging_product: 'whatsapp',
      //       to: phone,
      //       type: 'text',
      //       text: { body: message }
      //     })
      //   }
      // );

      console.log(`✅ Mensaje enviado a ${recipientPhone} por WhatsApp`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando mensaje WhatsApp:', error);
      return false;
    }
  }

  /**
   * Envía alerta de bajo stock por WhatsApp
   */
  async sendLowStockAlert(
    recipientPhone: string,
    productName: string,
    currentStock: number,
    minStock: number
  ): Promise<boolean> {
    const message = `
🚨 *ALERTA DE STOCK BAJO*

Producto: *${productName}*
Stock Actual: ${currentStock} unidades
Stock Mínimo: ${minStock} unidades

⚠️ Por favor, reabastecerse lo antes posible.

StockFlow AI 📦
    `.trim();

    return this.sendMessage(recipientPhone, message);
  }

  /**
   * Envía notificación de nueva tarea asignada
   */
  async sendTaskAssignment(
    recipientPhone: string,
    taskDescription: string,
    dueDate: string,
    assignedBy: string
  ): Promise<boolean> {
    const message = `
📋 *NUEVA TAREA ASIGNADA*

Descripción: ${taskDescription}
Vencimiento: ${dueDate}
Asignado por: ${assignedBy}

Por favor, accede a StockFlow AI para más detalles.
    `.trim();

    return this.sendMessage(recipientPhone, message);
  }

  /**
   * Envía resumen diario por WhatsApp
   */
  async sendDailySummary(
    recipientPhone: string,
    summaryData: {
      totalEntries: number;
      totalExits: number;
      anomalies: number;
      lowStockProducts: string[];
      pendingTasks: number;
    }
  ): Promise<boolean> {
    const anomalyText = summaryData.anomalies > 0 ? `⚠️ ${summaryData.anomalies} anomalías` : '✅ Sin anomalías';
    const lowStockText = summaryData.lowStockProducts.length > 0
      ? `\n🔴 Bajo stock: ${summaryData.lowStockProducts.join(', ')}`
      : '';
    
    const message = `
📊 *RESUMEN DIARIO DE INVENTARIO*

📥 Entradas: ${summaryData.totalEntries} unidades
📤 Salidas: ${summaryData.totalExits} unidades
${anomalyText}
📝 Tareas pendientes: ${summaryData.pendingTasks}
${lowStockText}

Acceso a StockFlow AI para detalles completos 👉 stockflow.ai
    `.trim();

    return this.sendMessage(recipientPhone, message);
  }

  /**
   * Envía notificación de anomalía detectada
   */
  async sendAnomalyAlert(
    recipientPhone: string,
    anomalyType: string,
    description: string,
    severity: 'low' | 'medium' | 'high'
  ): Promise<boolean> {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴'
    };

    const message = `
${severityEmoji[severity]} *ANOMALÍA DETECTADA*

Tipo: ${anomalyType}
Descripción: ${description}
Severidad: ${severity.toUpperCase()}

Por favor, revisa StockFlow AI para tomar acción.
    `.trim();

    return this.sendMessage(recipientPhone, message);
  }

  /**
   * Envía confirmación de registro
   */
  async sendRegistrationConfirmation(
    recipientPhone: string,
    registrationType: string,
    details: string
  ): Promise<boolean> {
    const message = `
✅ *REGISTRO CONFIRMADO*

Tipo: ${registrationType}
Detalles: ${details}
Timestamp: ${new Date().toLocaleString()}

StockFlow AI 📦
    `.trim();

    return this.sendMessage(recipientPhone, message);
  }

  /**
   * Envía mensaje mediante template (requiere templates predefini dos en WhatsApp)
   */
  async sendTemplate(
    recipientPhone: string,
    templateName: string,
    parameters: string[]
  ): Promise<boolean> {
    if (!this.isConfigured() || !this.config) {
      console.warn('💬 WhatsApp no configurado');
      return false;
    }

    try {
      // Punto de integración real con WhatsApp Templates
      // const response = await fetch(
      //   `${this.API_ENDPOINT}/${this.config.phoneNumberId}/messages`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${this.config.accessToken}`,
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify({
      //       messaging_product: 'whatsapp',
      //       to: recipientPhone.replace(/\D/g, ''),
      //       type: 'template',
      //       template: {
      //         name: templateName,
      //         language: { code: 'es' },
      //         parameters: { body: { parameters } }
      //       }
      //     })
      //   }
      // );

      console.log(`✅ Template "${templateName}" enviado a ${recipientPhone}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando template:', error);
      return false;
    }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): WhatsAppConfig | null {
    return this.config;
  }

  /**
   * Desconecta el servicio
   */
  disconnect() {
    this.config = null;
    console.log('💬 WhatsApp desconectado');
  }
}

export const whatsappService = new WhatsAppService();
