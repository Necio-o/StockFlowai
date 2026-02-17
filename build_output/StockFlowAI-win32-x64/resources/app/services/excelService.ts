import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DailyRecord } from '../types';

/**
 * Genera el Excel con formato visual idéntico al archivo de referencia:
 * 4 tablas con bordes, negritas, colores, celdas mergeadas Y FÓRMULAS.
 * Usa la misma configuración de semanas que la app (semanasLabel)
 */
export const exportToExcel = async (records: DailyRecord[], products: string[], semanasLabel?: string[]) => {
  const wb = new ExcelJS.Workbook();
  
  // Validar y loguear configuración de semanas
  if (semanasLabel && semanasLabel.length > 0) {
    console.log('✅ Excel usando semanasLabel personalizado:', semanasLabel);
  } else {
    console.warn('⚠️ semanasLabel no proporcionado, usando valor por defecto');
  }
  const mesesNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
  const año = new Date().getFullYear();

  // --- Preparar orden de productos ---
  const tieneCalViva = products.includes('CAL VIVA');
  const tieneSoda = products.includes('SODA');
  const tieneAlcalinizante = tieneCalViva || tieneSoda;

  const productosOrdenados = products.filter(p => p !== 'CAL VIVA' && p !== 'SODA');
  const idxCal = products.indexOf('CAL VIVA');
  const idxSoda = products.indexOf('SODA');
  const insertIdx = Math.min(idxCal >= 0 ? idxCal : Infinity, idxSoda >= 0 ? idxSoda : Infinity);
  if (tieneAlcalinizante && insertIdx < Infinity) {
    const alcItems: string[] = [];
    if (tieneCalViva) alcItems.push('CAL VIVA');
    if (tieneSoda) alcItems.push('SODA');
    const adjustedIdx = Math.min(insertIdx, productosOrdenados.length);
    productosOrdenados.splice(adjustedIdx, 0, ...alcItems);
  }

  const totalCols = productosOrdenados.length + 1;

  // --- Estilos reutilizables ---
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  const titleFont: Partial<ExcelJS.Font> = { bold: true, size: 14, name: 'Calibri' };
  const sectionTitleFont: Partial<ExcelJS.Font> = { bold: true, size: 11, name: 'Calibri' };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri' };
  const dataFont: Partial<ExcelJS.Font> = { size: 10, name: 'Calibri' };
  const totalFont: Partial<ExcelJS.Font> = { bold: true, size: 10, name: 'Calibri' };
  const centerAlign: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const rightAlign: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' };

  const headerFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  const sectionFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
  const totalFill: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };

  // --- Helper: convertir número de columna a letra Excel (1=A, 2=B, ..., 27=AA) ---
  const colLetter = (colNum: number): string => {
    let letter = '';
    let num = colNum;
    while (num > 0) {
      const mod = (num - 1) % 26;
      letter = String.fromCharCode(65 + mod) + letter;
      num = Math.floor((num - 1) / 26);
    }
    return letter;
  };

  // --- Iterar por cada mes ---
  mesesNames.forEach((mesNombre, mesIndex) => {
    const sheetName = mesIndex === 0 ? `${mesNombre}-${año}` : mesNombre.charAt(0) + mesNombre.slice(1).toLowerCase();
    const ws = wb.addWorksheet(sheetName);

    // Configurar ancho de columnas
    ws.getColumn(1).width = 14;
    productosOrdenados.forEach((p, i) => {
      ws.getColumn(i + 2).width = Math.max(p.length + 3, 13);
    });

    // --- Calcular semanas del mes ---
    const ultimoDiaMes = new Date(año, mesIndex + 1, 0).getDate();
    const bloquesSemanas: { label: string; inicio: Date; end: Date }[] = [];

    // Usar semanasLabel si se proporciona, con ajuste para cada mes
    if (semanasLabel && semanasLabel.length > 0) {
      console.log(`📋 Procesando ${mesNombre} (${ultimoDiaMes} días) con semanasLabel:`, semanasLabel);
      
      semanasLabel.forEach((label, idx) => {
        try {
          const cleanLabel = label.replace('*', '').trim();
          const parts = cleanLabel.split('-').map(p => p.trim());
          const diaInicio = parseInt(parts[0]) || 1;
          let diaFin = parseInt(parts[1]) || ultimoDiaMes;
          
          // Si el día de inicio está fuera del mes, ajustar
          if (diaInicio > ultimoDiaMes) {
            console.warn(`  ⚠️ Semana ${idx + 1} (${label}): Inicio ${diaInicio} > ${ultimoDiaMes} días del mes, omitiendo`);
            return;
          }
          
          // Ajustar el día final al máximo del mes
          diaFin = Math.min(diaFin, ultimoDiaMes);
          
          // Validar que diaFin >= diaInicio
          if (diaFin < diaInicio) {
            diaFin = ultimoDiaMes;
          }
          
          const labelFormato = `${String(diaInicio).padStart(2, '0')}-${String(diaFin).padStart(2, '0')}*`;
          bloquesSemanas.push({
            label: labelFormato,
            inicio: new Date(año, mesIndex, diaInicio, 0, 0, 0, 0),
            end: new Date(año, mesIndex, diaFin, 23, 59, 59, 999)
          });
          console.log(`  ✅ Semana ${idx + 1}: ${labelFormato}`);
        } catch (err) {
          console.error(`  ❌ Error procesando semana ${idx + 1} (${label}):`, err);
        }
      });
      
      // Si todavía no hay semanas válidas, crear semanas por defecto para los días disponibles
      if (bloquesSemanas.length === 0) {
        console.warn(`⚠️ No se crearon semanas válidas para ${mesNombre}, usando configuración por defecto`);
        const defaultWeeks = [[1, 7], [8, 14], [15, 21], [22, 28], [29, ultimoDiaMes]];
        defaultWeeks.forEach(([ini, fin]) => {
          if (ini <= ultimoDiaMes) {
            const realFin = Math.min(fin, ultimoDiaMes);
            bloquesSemanas.push({
              label: `${String(ini).padStart(2, '0')}-${String(realFin).padStart(2, '0')}*`,
              inicio: new Date(año, mesIndex, ini, 0, 0, 0, 0),
              end: new Date(año, mesIndex, realFin, 23, 59, 59, 999)
            });
          }
        });
        console.log(`  ✅ Semanas por defecto creadas: ${bloquesSemanas.length}`);
      }
    } else {
      // Valor por defecto si no se proporciona semanasLabel
      console.log(`📋 No hay semanasLabel, usando configuración por defecto para ${mesNombre}`);
      const defaultWeeks = [[1, 7], [8, 14], [15, 21], [22, 28], [29, ultimoDiaMes]];
      defaultWeeks.forEach(([ini, fin]) => {
        if (ini <= ultimoDiaMes) {
          const realFin = Math.min(fin, ultimoDiaMes);
          bloquesSemanas.push({
            label: `${String(ini).padStart(2, '0')}-${String(realFin).padStart(2, '0')}*`,
            inicio: new Date(año, mesIndex, ini, 0, 0, 0, 0),
            end: new Date(año, mesIndex, realFin, 23, 59, 59, 999)
          });
        }
      });
      console.log(`  ✅ ${bloquesSemanas.length} semanas creadas`);
    }

    const numSemanas = bloquesSemanas.length;

    // --- Funciones de cálculo ---
    const getValor = (prod: string, sem: { inicio: Date; end: Date }, esEntrada: boolean): number => {
      return records.filter(r => {
        const d = new Date(r.date + 'T12:00:00');
        return r.productName === prod && d >= sem.inicio && d <= sem.end;
      }).reduce((acc, r) => acc + (esEntrada ? r.ingressQty : r.usageQty), 0);
    };

    let rowNum = 2;

    // ========== TÍTULO PRINCIPAL ==========
    const titleCell = ws.getCell(rowNum, 1);
    titleCell.value = `INVENTARIO MATERIA PRIMA  ${año}`;
    titleCell.font = titleFont;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.mergeCells(rowNum, 1, rowNum, totalCols);
    rowNum += 2;

    // ========== FUNCIÓN: Escribir encabezados de sección ==========
    const writeHeaders = (startRow: number, sectionTitle: string): number => {
      let r = startRow;

      ws.mergeCells(r, 2, r, totalCols);
      const secCell = ws.getCell(r, 2);
      secCell.value = sectionTitle;
      secCell.font = sectionTitleFont;
      secCell.alignment = centerAlign;
      secCell.fill = sectionFill;
      secCell.border = borderThin;
      ws.getCell(r, 1).border = borderThin;
      r++;

      const hdr1Row = r;
      r++;
      const hdr2Row = r;
      r++;

      ws.mergeCells(hdr1Row, 1, hdr2Row, 1);
      const semCell = ws.getCell(hdr1Row, 1);
      semCell.value = 'SEMANAS';
      semCell.font = headerFont;
      semCell.alignment = centerAlign;
      semCell.fill = headerFill;
      semCell.border = borderThin;
      ws.getCell(hdr2Row, 1).border = borderThin;

      productosOrdenados.forEach((p, colIdx) => {
        const col = colIdx + 2;

        if (p === 'CAL VIVA') {
          const alcCell = ws.getCell(hdr1Row, col);
          alcCell.value = 'ALCALINIZANTE';
          alcCell.font = headerFont;
          alcCell.alignment = centerAlign;
          alcCell.fill = headerFill;
          alcCell.border = borderThin;
          if (tieneSoda) {
            ws.mergeCells(hdr1Row, col, hdr1Row, col + 1);
          }
          const cvCell = ws.getCell(hdr2Row, col);
          cvCell.value = 'CAL VIVA';
          cvCell.font = headerFont;
          cvCell.alignment = centerAlign;
          cvCell.fill = headerFill;
          cvCell.border = borderThin;
        } else if (p === 'SODA') {
          const sCell = ws.getCell(hdr2Row, col);
          sCell.value = 'SODA';
          sCell.font = headerFont;
          sCell.alignment = centerAlign;
          sCell.fill = headerFill;
          sCell.border = borderThin;
          ws.getCell(hdr1Row, col).border = borderThin;
        } else {
          ws.mergeCells(hdr1Row, col, hdr2Row, col);
          const pCell = ws.getCell(hdr1Row, col);
          pCell.value = p;
          pCell.font = headerFont;
          pCell.alignment = centerAlign;
          pCell.fill = headerFill;
          pCell.border = borderThin;
          ws.getCell(hdr2Row, col).border = borderThin;
        }
      });

      return r;
    };

    // ====================================================
    // SECCIÓN 1: Inventario INICIAL (KG)
    // ====================================================
    rowNum = writeHeaders(rowNum, 'Inventario INICIAL (KG)');
    const inicialDataStart = rowNum;

    // Escribir datos iniciales
    // El Inventario Inicial de cada semana se calcula como:
    // Semana 1: Puede ser 0 (inicial del período) o se sobrescribe con fórmula
    // Semana 2+: Se sobrescribe con fórmula = Inventario Final de semana anterior
    let acumInicial: Record<string, number> = {};
    productosOrdenados.forEach(p => { acumInicial[p] = 0; });

    bloquesSemanas.forEach((sem, semIdx) => {
      const dataRow = ws.getRow(rowNum);
      // Mostrar la etiqueta de semana (mismo format que en la app)
      dataRow.getCell(1).value = sem.label;
      dataRow.getCell(1).font = dataFont;
      dataRow.getCell(1).alignment = centerAlign;
      dataRow.getCell(1).border = borderThin;

      productosOrdenados.forEach((prod, colIdx) => {
        const cell = dataRow.getCell(colIdx + 2);
        // Valor inicial (será sobrescrito por fórmulas para semana 2+)
        cell.value = acumInicial[prod];
        cell.font = dataFont;
        cell.alignment = rightAlign;
        cell.border = borderThin;
        cell.numFmt = '#,##0';

        // Calcular entradas y consumos usando la misma configuración de semanas que la app
        const entradas = getValor(prod, sem, true);
        const consumos = getValor(prod, sem, false);
        acumInicial[prod] += (entradas - consumos);
      });
      rowNum++;
    });
    rowNum++; // Espacio

    // ====================================================
    // SECCIÓN 2: ENTRADAS Materia Prima (KG)
    // ====================================================
    rowNum = writeHeaders(rowNum, 'ENTRADAS Materia Prima (KG)');
    const entradasDataStart = rowNum;

    bloquesSemanas.forEach((sem, semIdx) => {
      const dataRow = ws.getRow(rowNum);
      // Fórmula en columna SEMANAS referenciando la celda de semana en Inventario Inicial
      const semRefRow = inicialDataStart + semIdx;
      dataRow.getCell(1).value = { formula: `A${semRefRow}` };
      dataRow.getCell(1).font = dataFont;
      dataRow.getCell(1).alignment = centerAlign;
      dataRow.getCell(1).border = borderThin;

      productosOrdenados.forEach((prod, colIdx) => {
        const cell = dataRow.getCell(colIdx + 2);
        cell.value = getValor(prod, sem, true);
        cell.font = dataFont;
        cell.alignment = rightAlign;
        cell.border = borderThin;
        cell.numFmt = '#,##0';
      });
      rowNum++;
    });
    const entradasDataEnd = rowNum - 1;

    // Fila TOTAL con fórmula SUM
    const totalEntRow = ws.getRow(rowNum);
    totalEntRow.getCell(1).value = 'TOTAL';
    totalEntRow.getCell(1).font = totalFont;
    totalEntRow.getCell(1).alignment = centerAlign;
    totalEntRow.getCell(1).fill = totalFill;
    totalEntRow.getCell(1).border = borderThin;
    productosOrdenados.forEach((_prod, colIdx) => {
      const col = colIdx + 2;
      const cl = colLetter(col);
      const cell = totalEntRow.getCell(col);
      cell.value = { formula: `SUM(${cl}${entradasDataStart}:${cl}${entradasDataEnd})` };
      cell.font = totalFont;
      cell.alignment = rightAlign;
      cell.fill = totalFill;
      cell.border = borderThin;
      cell.numFmt = '#,##0';
    });
    rowNum++;
    rowNum++; // Espacio

    // ====================================================
    // SECCIÓN 3: CONSUMOS Materia Prima (KG)
    // ====================================================
    rowNum = writeHeaders(rowNum, 'CONSUMOS Materia Prima  (KG)');
    const consumosDataStart = rowNum;

    bloquesSemanas.forEach((sem, semIdx) => {
      const dataRow = ws.getRow(rowNum);
      // Fórmula en columna SEMANAS referenciando la celda de semana en Inventario Inicial
      const semRefRow = inicialDataStart + semIdx;
      dataRow.getCell(1).value = { formula: `A${semRefRow}` };
      dataRow.getCell(1).font = dataFont;
      dataRow.getCell(1).alignment = centerAlign;
      dataRow.getCell(1).border = borderThin;

      productosOrdenados.forEach((prod, colIdx) => {
        const col = colIdx + 2;
        const cl = colLetter(col);
        const cell = dataRow.getCell(col);
        // Fórmula: Entrada + Inicial - lo que corresponda según la imagen
        // Los consumos son datos directos
        cell.value = getValor(prod, sem, false);
        cell.font = dataFont;
        cell.alignment = rightAlign;
        cell.border = borderThin;
        cell.numFmt = '#,##0';
      });
      rowNum++;
    });
    const consumosDataEnd = rowNum - 1;

    // Fila TOTAL con fórmula SUM
    const totalConRow = ws.getRow(rowNum);
    totalConRow.getCell(1).value = 'TOTAL';
    totalConRow.getCell(1).font = totalFont;
    totalConRow.getCell(1).alignment = centerAlign;
    totalConRow.getCell(1).fill = totalFill;
    totalConRow.getCell(1).border = borderThin;
    productosOrdenados.forEach((_prod, colIdx) => {
      const col = colIdx + 2;
      const cl = colLetter(col);
      const cell = totalConRow.getCell(col);
      cell.value = { formula: `SUM(${cl}${consumosDataStart}:${cl}${consumosDataEnd})` };
      cell.font = totalFont;
      cell.alignment = rightAlign;
      cell.fill = totalFill;
      cell.border = borderThin;
      cell.numFmt = '#,##0';
    });
    rowNum++;
    rowNum++; // Espacio

    // ====================================================
    // SECCIÓN 4: Inventario FINAL (KG)
    // ====================================================
    rowNum = writeHeaders(rowNum, 'Inventario FINAL (KG)');
    const finalDataStart = rowNum;

    bloquesSemanas.forEach((sem, semIdx) => {
      const dataRow = ws.getRow(rowNum);
      // Fórmula en columna SEMANAS referenciando la celda de semana en Inventario Inicial
      const semRefRow = inicialDataStart + semIdx;
      dataRow.getCell(1).value = { formula: `A${semRefRow}` };
      dataRow.getCell(1).font = dataFont;
      dataRow.getCell(1).alignment = centerAlign;
      dataRow.getCell(1).border = borderThin;

      productosOrdenados.forEach((_prod, colIdx) => {
        const col = colIdx + 2;
        const cl = colLetter(col);
        const cell = dataRow.getCell(col);
        // Fórmula: Inventario Inicial + Entradas - Consumos
        const inicialRow = inicialDataStart + semIdx;
        const entradaRow = entradasDataStart + semIdx;
        const consumoRow = consumosDataStart + semIdx;
        cell.value = { formula: `${cl}${inicialRow}+${cl}${entradaRow}-${cl}${consumoRow}` };
        cell.font = dataFont;
        cell.alignment = rightAlign;
        cell.border = borderThin;
        cell.numFmt = '#,##0';
      });
      rowNum++;
    });

    // ====================================================
    // Sobreescribir Inventario INICIAL semanas 2+ con fórmulas
    // que referencian el Inventario Final de la semana anterior
    // ====================================================
    for (let semIdx = 1; semIdx < numSemanas; semIdx++) {
      const inicialRow = inicialDataStart + semIdx;
      const finalPrevRow = finalDataStart + semIdx - 1;
      productosOrdenados.forEach((_prod, colIdx) => {
        const col = colIdx + 2;
        const cl = colLetter(col);
        const cell = ws.getCell(inicialRow, col);
        cell.value = { formula: `${cl}${finalPrevRow}` };
        cell.font = dataFont;
        cell.alignment = rightAlign;
        cell.border = borderThin;
        cell.numFmt = '#,##0';
      });
    }
  });

  // --- Generar y descargar ---
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `INVENTARIO MATERIA PRIMA SEMANAL-${año}-LR.xlsx`);
};