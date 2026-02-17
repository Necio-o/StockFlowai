import React, { useState } from 'react';
import { Tags, Pencil, Check, X, AlertCircle, Plus } from 'lucide-react';

interface ProductManagerProps {
  products: string[];
  onRename: (oldName: string, newName: string) => void;
  onAdd: (newName: string) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ products, onRename, onAdd }) => {
  // State for renaming
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  
  // State for adding new
  const [newProductName, setNewProductName] = useState('');

  // Shared error state
  const [error, setError] = useState<string | null>(null);

  // --- Add Logic ---
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newProductName.trim();

    if (!trimmed) {
      setError('El nombre de la materia no puede estar vacío');
      return;
    }

    if (products.includes(trimmed)) {
      setError('Ya existe una materia con este nombre');
      return;
    }

    onAdd(trimmed);
    setNewProductName('');
    setError(null);
  };

  // --- Rename Logic ---
  const startEditing = (name: string) => {
    setEditingName(name);
    setTempName(name);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingName(null);
    setTempName('');
    setError(null);
  };

  const handleSaveRename = () => {
    const trimmed = tempName.trim();
    
    if (!trimmed) {
      setError('El nombre no puede estar vacío');
      return;
    }

    if (trimmed !== editingName && products.includes(trimmed)) {
      setError('Ya existe una materia con este nombre');
      return;
    }

    if (editingName) {
      onRename(editingName, trimmed);
      cancelEditing();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300 h-full flex flex-col">
      <div className="flex items-center mb-4 text-indigo-600 dark:text-indigo-300">
        <Tags className="w-5 h-5 mr-2" />
        <h3 className="text-lg font-semibold">Materias en Inventario</h3>
      </div>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Gestiona el catálogo de materias primas. Puedes añadir nuevos materiales o corregir nombres existentes.
      </p>

      {/* Add New Product Section */}
      <form onSubmit={handleAdd} className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
         <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Añadir Nueva Materia</h4>
         <div className="flex gap-2">
            <input
                type="text"
                value={newProductName}
                onChange={(e) => {
                    setNewProductName(e.target.value);
                    if (error) setError(null);
                }}
                placeholder="Nombre del material..."
                className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
                <Plus className="w-4 h-4 mr-1" />
                Añadir
            </button>
         </div>
         {error && (
            <div className="flex items-center mt-2 text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {error}
            </div>
        )}
      </form>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto min-h-[150px]">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Catálogo Actual ({products.length})</h4>
        <div className="space-y-2">
            {products.map((product) => (
            <div 
                key={product} 
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                editingName === product 
                    ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-700' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
            >
                {editingName === product ? (
                <div className="flex-1 flex items-center gap-2 animate-in fade-in duration-200">
                    <div className="flex-1">
                    <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="w-full text-sm px-2 py-1 rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                    />
                    </div>
                    <button 
                    onClick={handleSaveRename}
                    className="p-1.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 dark:bg-slate-700 dark:text-indigo-400 dark:hover:bg-slate-600 transition-colors"
                    title="Guardar"
                    >
                    <Check className="w-4 h-4" />
                    </button>
                    <button 
                    onClick={cancelEditing}
                    className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 transition-colors"
                    title="Cancelar"
                    >
                    <X className="w-4 h-4" />
                    </button>
                </div>
                ) : (
                <>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mr-2">
                    {product}
                    </span>
                    <button 
                    onClick={() => startEditing(product)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Editar nombre"
                    >
                    <Pencil className="w-4 h-4" />
                    </button>
                </>
                )}
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};