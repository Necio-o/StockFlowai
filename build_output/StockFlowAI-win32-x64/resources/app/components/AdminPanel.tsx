import React, { useState, useEffect } from 'react';
import { X, Settings, Users, Tags, Shield } from 'lucide-react';
import { AdminSettings } from './AdminSettings';
import { ProductManager } from './ProductManager';
import { UserManager } from './UserManager';
import { UserProfile, ProductSettings, DailyRecord, SettingsMap } from '../types';
import { calculateStats } from '../utils/mathUtils';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: string[];
  setProducts: React.Dispatch<React.SetStateAction<string[]>>;
  semanasLabel: string[];
  setSemanasLabel: React.Dispatch<React.SetStateAction<string[]>>;
  initialProductName: string;
  records: DailyRecord[];
  settingsMap: SettingsMap;
  onSaveSettings: (productName: string, settings: ProductSettings) => void;
  onRenameProduct: (oldName: string, newName: string) => void;
  onAddProduct: (newName: string) => void;
  users: UserProfile[];
  currentUser: UserProfile;
  onAddUser: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
}

type TabType = 'general' | 'products' | 'users';

const DEFAULT_SETTINGS: ProductSettings = {
    targetAverage: null,
    tolerancePercent: 20
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  initialProductName,
  records,
  settingsMap,
  onSaveSettings,
  products,
  onRenameProduct,
  onAddProduct,
  users,
  currentUser,
  onAddUser,
  onEditUser,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  // State to manage which product we are currently editing in the Admin Panel
  const [selectedAdminProduct, setSelectedAdminProduct] = useState(initialProductName);

  // Sync with initial prop if the modal is opened
  useEffect(() => {
    if (isOpen) {
        setSelectedAdminProduct(initialProductName);
    }
  }, [isOpen, initialProductName]);

  if (!isOpen) return null;

  // Calculate stats and settings for the LOCALLY selected product
  const stats = calculateStats(records, selectedAdminProduct);
  const currentSettings = settingsMap[selectedAdminProduct] || DEFAULT_SETTINGS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center text-slate-800 dark:text-white">
            <div className="bg-indigo-50 dark:bg-slate-700 p-2 rounded-lg mr-3">
              <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Panel de Administración</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Configuración global del sistema</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs & Content Container */}
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible flex-shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'general' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4 mr-3" />
              Reglas y Alertas
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'products' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Tags className="w-4 h-4 mr-3" />
              Materias en Inventario
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'users' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4 mr-3" />
              Gestión Usuarios
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100 dark:bg-slate-950/50">
            {activeTab === 'general' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <AdminSettings 
                  products={products}
                  selectedProduct={selectedAdminProduct}
                  onProductChange={setSelectedAdminProduct}
                  currentSettings={currentSettings}
                  calculatedAverage={stats.averageUsage}
                  onSave={(newSettings) => onSaveSettings(selectedAdminProduct, newSettings)}
                />
              </div>
            )}
            {activeTab === 'products' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
                <ProductManager 
                  products={products}
                  onRename={onRenameProduct}
                  onAdd={onAddProduct}
                />
              </div>
            )}
            {activeTab === 'users' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full">
                <UserManager 
                  users={users}
                  currentUser={currentUser}
                  onAddUser={onAddUser}
                  onEditUser={onEditUser}
                  onDeleteUser={onDeleteUser}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};