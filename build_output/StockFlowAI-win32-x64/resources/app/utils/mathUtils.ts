import { DailyRecord, Anomaly, ProductStats, ProductSettings, SettingsMap } from '../types';

// Helper to group records by date to sum daily quantities
const groupRecordsByDate = (records: DailyRecord[]) => {
  const groups: { [date: string]: DailyRecord[] } = {};
  records.forEach(r => {
    if (!groups[r.date]) groups[r.date] = [];
    groups[r.date].push(r);
  });
  return groups;
};

export const calculateStats = (records: DailyRecord[], productName: string): ProductStats => {
  const productRecords = records.filter(r => r.productName === productName);
  
  if (productRecords.length === 0) {
    return {
      productName,
      averageIngress: 0,
      averageUsage: 0,
      totalRecords: 0,
      standardDeviation: 0
    };
  }

  // 1. Agrupar por día (Daily Grouping)
  // Esto asegura que si hay 3 entradas en un día, se sumen como "Ingreso del Día".
  const dailyGroups = groupRecordsByDate(productRecords);
  const uniqueDays = Object.keys(dailyGroups).length;
  
  let totalIngress = 0;
  let totalUsage = 0;
  let dailyUsages: number[] = [];

  Object.values(dailyGroups).forEach(dayRecords => {
    // Suma de todas las transacciones de ese día específico
    const dayIngress = dayRecords.reduce((sum, r) => sum + r.ingressQty, 0);
    const dayUsage = dayRecords.reduce((sum, r) => sum + r.usageQty, 0);
    
    totalIngress += dayIngress;
    totalUsage += dayUsage;
    
    // Guardamos el uso diario para calcular la desviación estándar basada en DÍAS, no en transacciones
    dailyUsages.push(dayUsage);
  });

  // 2. Calcular Promedios Diarios
  const avgIngress = uniqueDays > 0 ? totalIngress / uniqueDays : 0;
  const avgUsage = uniqueDays > 0 ? totalUsage / uniqueDays : 0;

  // 3. Calcular Desviación Estándar (Volatilidad del uso diario)
  const variance = dailyUsages.reduce((sum, usage) => sum + Math.pow(usage - avgUsage, 2), 0) / (uniqueDays || 1);
  const stdDev = Math.sqrt(variance);

  return {
    productName,
    averageIngress: avgIngress,
    averageUsage: avgUsage,
    totalRecords: productRecords.length,
    standardDeviation: stdDev
  };
};

export const detectAnomalies = (
  records: DailyRecord[], 
  settingsMap: SettingsMap = {}
): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  
  // Analizar cada producto por separado
  const productGroups = Array.from(new Set(records.map(r => r.productName)));

  productGroups.forEach(product => {
    const productRecords = records.filter(r => r.productName === product);
    
    // Obtener configuración específica para ESTE producto o usar defaults
    const productSettings = settingsMap[product] || { targetAverage: null, tolerancePercent: 20 };
    
    // Calcular estadísticas base
    const stats = calculateStats(productRecords, product); 
    const dailyGroups = groupRecordsByDate(productRecords);

    // Determinar la línea base (Objetivo manual o Promedio calculado)
    const baselineUsage = (productSettings.targetAverage && productSettings.targetAverage > 0) 
      ? productSettings.targetAverage 
      : stats.averageUsage;

    const toleranceDecimal = productSettings.tolerancePercent / 100;

    // Analizar día por día
    Object.entries(dailyGroups).forEach(([date, dayRecords]) => {
      const dayIngress = dayRecords.reduce((sum, r) => sum + r.ingressQty, 0);
      const dayUsage = dayRecords.reduce((sum, r) => sum + r.usageQty, 0);
      
      // Asociar la anomalía al último registro del día para visualización
      const referenceRecord = dayRecords[dayRecords.length - 1];

      // Detectar Discrepancia: Ingreso vs Uso (Balance Diario)
      // La regla de negocio es que normalmente se usa lo que ingresa.
      if (dayIngress !== dayUsage) {
        anomalies.push({
          recordId: referenceRecord.id,
          type: 'MISMATCH_INGRESS_USAGE',
          severity: 'critical',
          message: `Discrepancia de Balance (${date})`,
          details: `Producto: ${product}. Ingreso: ${dayIngress} | Uso: ${dayUsage}. Diferencia: ${dayIngress - dayUsage}`
        });
      }

      // Detectar Desviación Estadística: Uso Diario vs Promedio
      if (baselineUsage > 0 && dayUsage > 0) {
        const diff = dayUsage - baselineUsage;
        const percentageDiff = Math.abs(diff / baselineUsage);

        if (percentageDiff > toleranceDecimal) {
           const isHigh = diff > 0;
           anomalies.push({
             recordId: referenceRecord.id,
             type: isHigh ? 'DEVIATION_HIGH' : 'DEVIATION_LOW',
             severity: percentageDiff > (toleranceDecimal * 2) ? 'critical' : 'warning',
             message: isHigh ? 'Pico de Consumo' : 'Consumo Bajo',
             details: `El uso de ${product} (${dayUsage}) se desvía un ${Math.round(percentageDiff * 100)}% del promedio esperado (${Math.round(baselineUsage)}). Tolerancia: ${productSettings.tolerancePercent}%`
           });
        }
      }
    });
  });

  return anomalies;
};