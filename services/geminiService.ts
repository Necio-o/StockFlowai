import { GoogleGenAI } from "@google/genai";
import { DailyRecord, ProductStats, Anomaly } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAnomalyReport = async (
  records: DailyRecord[], 
  stats: ProductStats[], 
  anomalies: Anomaly[]
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Falta la clave API. No se puede generar el informe.";

  const recentRecords = records.slice(-10); // Analyze last 10 records for brevity

  const prompt = `
    Eres un asistente de análisis de inventario. Analiza los siguientes datos de uso de material y anomalías. Responde en español.
    
    Contexto: 
    - Esta fábrica normalmente usa exactamente lo que llega (el Ingreso debe ser igual al Uso).
    - Rastreamos las desviaciones del uso promedio.
    
    Resumen de Datos:
    ${JSON.stringify(stats, null, 2)}
    
    Anomalías Detectadas:
    ${JSON.stringify(anomalies, null, 2)}
    
    Registros Recientes:
    ${JSON.stringify(recentRecords, null, 2)}
    
    Tarea:
    Proporciona un resumen conciso y profesional en español (máximo 3 párrafos).
    1. Destaca las anomalías más críticas (especialmente discrepancias entre Ingreso vs Uso).
    2. Explica la tendencia del uso de material (aumento/disminución/estable).
    3. Sugiere causas potenciales para las anomalías (ej: "La discrepancia en la fecha [Fecha] sugiere posible desperdicio o error de registro", "El bajo uso en [Fecha] podría indicar inactividad").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No se generaron insights.";
  } catch (error) {
    console.error("Error generating report:", error);
    return "Error al generar el informe de insights. Por favor verifica tu configuración de API.";
  }
};