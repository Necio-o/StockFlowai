import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyRecord, ProductStats, Anomaly, ProductSettings } from '../types';

export const generateProductReport = (
  productName: string,
  stats: ProductStats,
  records: DailyRecord[],
  anomalies: Anomaly[],
  settings: ProductSettings
) => {
  const doc = new jsPDF();

  // Title Area
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('StockFlow AI', 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(`Informe de Producto: ${productName}`, 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateStr = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  doc.text(`Generado el: ${dateStr}`, 14, 38);

  // 1. Statistics Summary
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Resumen Estadístico', 14, 50);

  const statsData = [
    ['Total Registros', stats.totalRecords.toString()],
    ['Promedio Uso Diario', Math.round(stats.averageUsage).toString()],
    ['Promedio Ingreso Diario', Math.round(stats.averageIngress).toString()],
    ['Objetivo Configurado', settings.targetAverage ? settings.targetAverage.toString() : 'Automático (N/A)'],
    ['Tolerancia Permitida', `±${settings.tolerancePercent}%`],
    ['Alertas Activas', anomalies.length.toString()],
  ];

  autoTable(doc, {
    startY: 55,
    head: [['Métrica', 'Valor']],
    body: statsData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 'auto' }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // 2. Anomalies Section
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  if (anomalies.length > 0) {
    doc.text('Anomalías y Alertas Detectadas', 14, currentY);
    
    const anomaliesData = anomalies.map(a => [
       records.find(r => r.id === a.recordId)?.date || 'N/A',
       a.severity === 'critical' ? 'CRÍTICO' : 'ALERTA',
       a.message,
       a.details
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [['Fecha', 'Nivel', 'Problema', 'Detalles']],
      body: anomaliesData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }, // Red
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25, fontStyle: 'bold' },
        2: { cellWidth: 40, fontStyle: 'bold' },
        3: { cellWidth: 'auto' }
      },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14, bottom: 20 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // 3. Detailed Data Table
  // Check if we need a new page
  if (currentY > 250) {
      doc.addPage();
      currentY = 20;
  }

  doc.text('Historial Detallado de Movimientos', 14, currentY);

  const tableData = [...records]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(r => {
      const diff = r.ingressQty - r.usageQty;
      return [
        r.date,
        r.ingressQty.toString(),
        r.usageQty.toString(),
        diff === 0 ? '-' : (diff > 0 ? `+${diff}` : diff.toString()),
      ];
    });

  autoTable(doc, {
    startY: currentY + 5,
    head: [['Fecha', 'Ingreso', 'Uso', 'Diferencia (Ingreso - Uso)']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85] }, // Slate
    didParseCell: (data) => {
        // Highlight difference column if not 0 (Index 3)
        if (data.section === 'body' && data.column.index === 3) {
            const val = data.cell.raw;
            if (val !== '-') {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
            } else {
                data.cell.styles.textColor = [150, 150, 150];
            }
        }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  doc.save(`Reporte_StockFlow_${productName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateFailureReport = (
  failures: Anomaly[],
  records: DailyRecord[]
) => {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('es-ES');

  // Title
  doc.setFontSize(22);
  doc.setTextColor(220, 38, 38); // Red
  doc.text('REPORTE DIARIO DE FALLOS', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(50);
  doc.text(`Fecha del Reporte: ${today}`, 105, 30, { align: 'center' });
  doc.text(`Total de Fallos Detectados: ${failures.length}`, 105, 38, { align: 'center' });

  // Table
  const failuresData = failures.map(f => {
    const record = records.find(r => r.id === f.recordId);
    return [
      record?.productName || 'Desconocido',
      record?.date || 'N/A',
      f.type === 'MISMATCH_INGRESS_USAGE' ? 'Discrepancia Ingreso/Uso' : 'Desviación Crítica',
      f.details
    ];
  });

  autoTable(doc, {
    startY: 50,
    head: [['Producto', 'Fecha Registro', 'Tipo de Fallo', 'Detalles Técnicos']],
    body: failuresData,
    theme: 'grid',
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' }, // Dark Red
    columnStyles: {
      0: { fontStyle: 'bold' },
      3: { cellWidth: 'auto' }
    },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Footer note
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Este documento lista únicamente las anomalías críticas que requieren atención administrativa inmediata.', 14, finalY);

  doc.save(`Reporte_Fallos_${new Date().toISOString().split('T')[0]}.pdf`);
};