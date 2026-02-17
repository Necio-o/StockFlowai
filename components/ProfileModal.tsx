import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, User, Trash2, Save, Briefcase, FileText, AtSign } from 'lucide-react';
import { UserProfile } from '../types';
interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (updatedData: Partial<UserProfile>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nickname: currentUser.nickname || '',
        jobTitle: currentUser.jobTitle || '',
        description: currentUser.description || '',
        name: currentUser.name
      });
      setPreviewImage(currentUser.avatar || null);
    }
  }, [isOpen, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          // --- LÓGICA DE COMPRESIÓN ---
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setPreviewImage(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSave({
    ...formData,
    avatar: previewImage 
  });
  onClose();
};
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-indigo-500/10 w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header with Cover Effect */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Image Section - Overlapping Header */}
        <div className="px-8 relative flex justify-center -mt-16 mb-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 shadow-lg overflow-hidden flex items-center justify-center">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              )}
            </div>
            {/* BOTÓN PARA BORRAR FOTO */}
          {previewImage && (
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all transform hover:scale-110 z-10 border-2 border-white dark:border-slate-900"
              title="Eliminar Foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors border-2 border-white dark:border-slate-800"
              title="Cambiar Foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
        </div>

        <div className="px-8 pb-8 overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {formData.nickname || currentUser.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{currentUser.username} • {currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1">
              <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5 mr-1.5" /> Nombre Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                placeholder="Tu nombre real"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  <AtSign className="w-3.5 h-3.5 mr-1.5" /> Apodo / Nick
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="Como te llaman"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Cargo
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle || ''}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="Ej. Supervisor"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Descripción / Bio
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
                placeholder="Escribe algo breve sobre tu rol..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center mt-4"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Perfil
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
