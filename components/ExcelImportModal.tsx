import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { DailyRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (records: DailyRecord[]) => void;
  existingProducts: string[];
}

interface ParsedRow {
  date: string;
  productName: string;
  ingressQty: number;
  usageQty: number;
  valid: boolean;
  error?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onImport, existingProducts }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [importCount, setImportCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setParsedRows([]);
    setStep('upload');
    setImportCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const rows: ParsedRow[] = [];

      wb.eachSheet((ws) => {
        // Try to detect the format: 
        // Format A: Simple table with columns: Fecha | Producto | Ingreso | Uso
        // Format B: App's own export format (tables per section with product headers)
        
        const headerRow = ws.getRow(1);
        const headers: string[] = [];
        headerRow.eachCell((cell) => {
          headers.push(String(cell.value || '').toLowerCase().trim());
        });

        // Check if it's a simple format
        const hasDate = headers.some(h => h.includes('fecha') || h.includes('date'));
        const hasProduct = headers.some(h => h.includes('producto') || h.includes('product') || h.includes('materia'));
        
        if (hasDate && hasProduct) {
          // Simple format: Fecha | Producto | Ingreso/Entrada | Uso/Salida
          const dateIdx = headers.findIndex(h => h.includes('fecha') || h.includes('date'));
          const productIdx = headers.findIndex(h => h.includes('producto') || h.includes('product') || h.includes('materia'));
          const ingressIdx = headers.findIndex(h => h.includes('ingreso') || h.includes('entrada') || h.includes('ingress') || h.includes('input'));
          const usageIdx = headers.findIndex(h => h.includes('uso') || h.includes('salida') || h.includes('consumo') || h.includes('usage') || h.includes('output'));

          ws.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const dateVal = row.getCell(dateIdx + 1).value;
            const productVal = String(row.getCell(productIdx + 1).value || '').trim().toUpperCase();
            const ingressVal = Number(row.getCell(ingressIdx + 1).value) || 0;
            const usageVal = usageIdx >= 0 ? (Number(row.getCell(usageIdx + 1).value) || 0) : 0;

            if (!dateVal || !productVal) return;

            let dateStr = '';
            if (dateVal instanceof Date) {
              dateStr = dateVal.toISOString().split('T')[0];
            } else if (typeof dateVal === 'string') {
              // Try to parse various date formats
              const d = new Date(dateVal);
              if (!isNaN(d.getTime())) {
                dateStr = d.toISOString().split('T')[0];
              } else {
                // Try DD/MM/YYYY or DD-MM-YYYY
                const parts = dateVal.split(/[\/\-\.]/);
                if (parts.length === 3) {
                  const [day, month, year] = parts.map(Number);
                  if (year > 100) {
                    dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  }
                }
              }
            } else if (typeof dateVal === 'number') {
              // Excel serial date
              const d = new Date((dateVal - 25569) * 86400 * 1000);
              dateStr = d.toISOString().split('T')[0];
            }

            if (!dateStr) {
              rows.push({ date: '', productName: productVal, ingressQty: ingressVal, usageQty: usageVal, valid: false, error: 'Fecha inválida' });
              return;
            }

            if (ingressVal > 0) {
              rows.push({ date: dateStr, productName: productVal, ingressQty: ingressVal, usageQty: 0, valid: true });
            }
            if (usageVal > 0) {
              rows.push({ date: dateStr, productName: productVal, ingressQty: 0, usageQty: usageVal, valid: true });
            }
            if (ingressVal === 0 && usageVal === 0) {
              rows.push({ date: dateStr, productName: productVal, ingressQty: 0, usageQty: 0, valid: false, error: 'Sin cantidades' });
            }
          });
        } else {
          // Try app's own export format: Look for section headers and product columns
          // Sections like "ENTRADA MATERIA PRIMA (KG)" and "CONSUMOS MATERIA PRIMA (KG)"
          let currentSection: 'entradas' | 'consumos' | null = null;
          let productColumns: string[] = [];
          const sheetName = ws.name || '';
          
          // Determine month/year from sheet name
          const mesesMap: Record<string, number> = {
            'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
            'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
          };
          
          let sheetMonth = -1;
          let sheetYear = new Date().getFullYear();
          for (const [mes, idx] of Object.entries(mesesMap)) {
            if (sheetName.toLowerCase().includes(mes)) {
              sheetMonth = idx;
              break;
            }
          }
          const yearMatch = sheetName.match(/(\d{4})/);
          if (yearMatch) sheetYear = parseInt(yearMatch[1]);
          if (sheetMonth === -1) return; // Can't determine month

          ws.eachRow((row, rowNumber) => {
            const firstCell = String(row.getCell(1).value || '').trim().toUpperCase();
            
            // Detect section headers
            if (firstCell.includes('ENTRADA') || firstCell.includes('INGRESO')) {
              currentSection = 'entradas';
              productColumns = [];
              return;
            }
            if (firstCell.includes('CONSUMO') || firstCell.includes('USO') || firstCell.includes('SALIDA')) {
              currentSection = 'consumos';
              productColumns = [];
              return;
            }
            if (firstCell.includes('INVENTARIO') || firstCell.includes('FINAL') || firstCell.includes('INICIAL')) {
              currentSection = null;
              return;
            }

            // Detect product header row (SEMANAS column)
            if (firstCell.includes('SEMANA') && currentSection) {
              productColumns = [];
              row.eachCell((cell, colNumber) => {
                if (colNumber > 1) {
                  const val = String(cell.value || '').trim().toUpperCase();
                  if (val) productColumns.push(val);
                }
              });
              return;
            }

            // Data rows (week ranges like "01-07")
            if (currentSection && productColumns.length > 0 && /^\d{2}-\d{2}/.test(firstCell)) {
              const parts = firstCell.split('-').map(Number);
              const dayStart = parts[0];
              const dateStr = `${sheetYear}-${String(sheetMonth + 1).padStart(2, '0')}-${String(dayStart).padStart(2, '0')}`;

              productColumns.forEach((prod, pIdx) => {
                const val = Number(row.getCell(pIdx + 2).value) || 0;
                if (val > 0) {
                  rows.push({
                    date: dateStr,
                    productName: prod,
                    ingressQty: currentSection === 'entradas' ? val : 0,
                    usageQty: currentSection === 'consumos' ? val : 0,
                    valid: true
                  });
                }
              });
            }
          });
        }
      });

      setParsedRows(rows);
      setStep('preview');
    } catch (err) {
      console.error('Error parsing Excel:', err);
      setParsedRows([{ date: '', productName: '', ingressQty: 0, usageQty: 0, valid: false, error: 'Error al leer el archivo Excel' }]);
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    const validRows = parsedRows.filter(r => r.valid);
    const newRecords: DailyRecord[] = validRows.map(r => ({
      id: uuidv4(),
      date: r.date,
      timestamp: `${r.date}T12:00`,
      productName: r.productName,
      ingressQty: r.ingressQty,
      usageQty: r.usageQty,
    }));

    onImport(newRecords);
    setImportCount(newRecords.length);
    setStep('done');
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;
  const newProducts = [...new Set(parsedRows.filter(r => r.valid).map(r => r.productName))].filter(p => !existingProducts.includes(p));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Importar Excel</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Carga registros desde un archivo .xlsx</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div 
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isLoading ? 'Procesando archivo...' : 'Haz clic o arrastra un archivo Excel'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Formatos: .xlsx</p>
                {isLoading && <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto mt-3" />}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleFileChange} 
                className="hidden" 
              />

              {/* Format guide */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Download className="w-4 h-4" /> Formatos aceptados
                </h3>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Formato simple (columnas):</p>
                    <div className="overflow-x-auto">
                      <table className="text-[10px] w-full">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-700">
                            <th className="px-2 py-1 border dark:border-slate-600">Fecha</th>
                            <th className="px-2 py-1 border dark:border-slate-600">Producto</th>
                            <th className="px-2 py-1 border dark:border-slate-600">Ingreso</th>
                            <th className="px-2 py-1 border dark:border-slate-600">Uso</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-2 py-1 border dark:border-slate-600">2026-02-17</td>
                            <td className="px-2 py-1 border dark:border-slate-600">COAGULANTE</td>
                            <td className="px-2 py-1 border dark:border-slate-600">500</td>
                            <td className="px-2 py-1 border dark:border-slate-600">0</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Formato StockFlow AI:</p>
                    <p>El archivo exportado por esta app también es compatible.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-3">
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{validCount}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Registros válidos</p>
                </div>
                {invalidCount > 0 && (
                  <div className="flex-1 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{invalidCount}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">Con errores</p>
                  </div>
                )}
              </div>

              {/* New products warning */}
              {newProducts.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Productos nuevos detectados:</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{newProducts.join(', ')}</p>
                  </div>
                </div>
              )}

              {/* Table preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Estado</th>
                        <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Fecha</th>
                        <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400">Producto</th>
                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Ingreso</th>
                        <th className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">Uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 100).map((row, i) => (
                        <tr key={i} className={`border-t border-slate-100 dark:border-slate-700 ${!row.valid ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                          <td className="px-3 py-2">
                            {row.valid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <span title={row.error}><AlertTriangle className="w-3.5 h-3.5 text-red-500" /></span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.date || '—'}</td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-white">{row.productName || '—'}</td>
                          <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400 font-mono">{row.ingressQty > 0 ? row.ingressQty.toLocaleString() : '—'}</td>
                          <td className="px-3 py-2 text-right text-sky-600 dark:text-sky-400 font-mono">{row.usageQty > 0 ? row.usageQty.toLocaleString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 100 && (
                  <div className="text-center py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50">
                    Mostrando 100 de {parsedRows.length} registros
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="text-center py-10">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">¡Importación exitosa!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{importCount} registros importados y sincronizados con la nube</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          {step === 'preview' && validCount > 0 && (
            <>
              <button onClick={reset} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleImport}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Importar {validCount} registros
              </button>
            </>
          )}
          {step === 'preview' && validCount === 0 && (
            <button onClick={reset} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Volver
            </button>
          )}
          {step === 'done' && (
            <button onClick={handleClose} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all">
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
