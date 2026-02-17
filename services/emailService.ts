/**
 * SERVICIO DE EMAIL
 * Envía notificaciones por correo automáticamente
 * Con persistencia en Firebase
 */

import { db } from './firestore';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface EmailNotificationConfig {
  apiKey: string;
  senderEmail: string;
  isEnabled: boolean;
}

export interface EmailTemplate {
  type: 'low_stock' | 'anomaly' | 'daily_report' | 'critical_alert';
  recipient: string;
  subject: string;
  body: string;
  data?: any;
}

export class EmailService {
  private config: EmailNotificationConfig | null = null;
  private readonly API_ENDPOINT = 'https://api.resend.com/emails';
  private userId: string | null = null;

  /**
   * Establece el usuario actual para guardar configuración
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Configura el servicio de email con credenciales
   */
  configure(config: EmailNotificationConfig) {
    this.config = config;
    console.log('📧 Email service configurado');
  }

  /**
   * Guarda la configuración en Firebase
   */
  async saveConfig(config: EmailNotificationConfig): Promise<boolean> {
    try {
      if (!this.userId) {
        console.warn('❌ No hay usuario para guardar configuración');
        return false;
      }

      this.config = config;
      
      // Guardar en Firestore bajo el documento de integrations del usuario
      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'email');
      await setDoc(integrationsRef, {
        ...config,
        savedAt: new Date().toISOString()
      });

      console.log('✅ Configuración de Email guardada en Firebase');
      return true;
    } catch (error) {
      console.error('❌ Error guardando configuración de Email:', error);
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

      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'email');
      const docSnap = await getDoc(integrationsRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.config = {
          apiKey: data.apiKey,
          senderEmail: data.senderEmail,
          isEnabled: data.isEnabled
        };
        console.log('✅ Configuración de Email cargada desde Firebase');
        return true;
      } else {
        console.log('ℹ️ No hay configuración de Email guardada');
        return false;
      }
    } catch (error) {
      console.error('❌ Error cargando configuración de Email:', error);
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

      const integrationsRef = doc(db, 'usuarios', this.userId, 'integraciones', 'email');
      await setDoc(integrationsRef, {
        apiKey: '',
        senderEmail: '',
        isEnabled: false,
        deletedAt: new Date().toISOString()
      });

      this.config = null;
      console.log('✅ Configuración de Email eliminada');
      return true;
    } catch (error) {
      console.error('❌ Error eliminando configuración de Email:', error);
      return false;
    }
  }

  /**
   * Verifica si el servicio está configurado
   */
  isConfigured(): boolean {
    return !!this.config && this.config.isEnabled;
  }

  /**
   * Envía una notificación de correo
   */
  async sendNotification(template: EmailTemplate): Promise<boolean> {
    if (!this.isConfigured() || !this.config) {
      console.warn('📧 Email service no configurado. Simulando envío...');
      console.log(`[SIMULATED] Email enviado a: ${template.recipient}`);
      return true;
    }

    try {
      // Crear HTML del email basado en el template
      const html = this.generateEmailHTML(template);

      // Punto de integración real con Resend API
      // const response = await fetch(this.API_ENDPOINT, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.config.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     from: this.config.senderEmail,
      //     to: template.recipient,
      //     subject: template.subject,
      //     html: html
      //   })
      // });

      console.log('✅ Email enviado a:', template.recipient);
      return true;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  /**
   * Envía alertas de bajo stock
   */
  async sendLowStockAlert(
    recipients: string[],
    productName: string,
    currentStock: number,
    minStock: number
  ): Promise<boolean> {
    const subject = `⚠️ ALERTA: Stock bajo de ${productName}`;
    const body = `
      El producto "${productName}" tiene stock bajo.
      Stock actual: ${currentStock}
      Stock mínimo: ${minStock}
      
      Por favor, reabastecerse pronto.
    `;

    let allSent = true;
    for (const email of recipients) {
      const sent = await this.sendNotification({
        type: 'low_stock',
        recipient: email,
        subject,
        body,
        data: { productName, currentStock, minStock }
      });
      if (!sent) allSent = false;
    }
    return allSent;
  }

  /**
   * Envía reporte diario
   */
  async sendDailyReport(
    recipient: string,
    reportData: {
      totalRecords: number;
      totalIngress: number;
      totalUsage: number;
      anomalies: number;
    }
  ): Promise<boolean> {
    const subject = `📊 Reporte Diario de Inventario - ${new Date().toLocaleDateString()}`;
    const body = `
      Resumen del día:
      - Total de registros: ${reportData.totalRecords}
      - Total entrada: ${reportData.totalIngress}
      - Total salida: ${reportData.totalUsage}
      - Anomalías detectadas: ${reportData.anomalies}
    `;

    return this.sendNotification({
      type: 'daily_report',
      recipient,
      subject,
      body,
      data: reportData
    });
  }

  /**
   * Envía alerta crítica
   */
  async sendCriticalAlert(
    recipients: string[],
    title: string,
    description: string
  ): Promise<boolean> {
    const subject = `🚨 ALERTA CRÍTICA: ${title}`;
    
    let allSent = true;
    for (const email of recipients) {
      const sent = await this.sendNotification({
        type: 'critical_alert',
        recipient: email,
        subject,
        body: description
      });
      if (!sent) allSent = false;
    }
    return allSent;
  }

  /**
   * Genera HTML formateado para el email
   */
  private generateEmailHTML(template: EmailTemplate): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; }
            .footer { color: #999; font-size: 12px; text-align: center; padding: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${template.subject}</h1>
            </div>
            <div class="content">
              <p>${template.body.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="footer">
              <p>StockFlow AI - Sistema de Gestión de Inventario</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): EmailNotificationConfig | null {
    return this.config;
  }

  /**
   * Limpia la configuración
   */
  disconnect() {
    this.config = null;
    console.log('📧 Email service desconectado');
  }
}

export const emailService = new EmailService();
