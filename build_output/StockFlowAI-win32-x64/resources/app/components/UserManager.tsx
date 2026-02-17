import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Shield, User, Pencil, RefreshCw, X } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UserManagerProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onAddUser: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ users, currentUser, onAddUser, onEditUser, onDeleteUser }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [error, setError] = useState<string | null>(null);
  
  // Edit Mode State
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password.trim().length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    // Check for duplicate usernames (exclude current user if editing)
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== editingId)) {
      setError('El nombre de usuario ya existe');
      return;
    }

    if (editingId) {
      // Edit Mode
      const updatedUser: UserProfile = {
        id: editingId,
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role
      };
      onEditUser(updatedUser);
      setEditingId(null);
    } else {
      // Create Mode
      const newUser: UserProfile = {
        id: uuidv4(),
        name: name.trim(),
        username: username.trim(),
        password: password.trim(),
        role
      };
      onAddUser(newUser);
    }
    
    // Reset form
    setName('');
    setUsername('');
    setPassword('');
    setRole('user');
  };

  const handleEdit = (user: UserProfile) => {
    setEditingId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('user');
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300 h-full flex flex-col">
      <div className="flex items-center mb-4 text-indigo-600 dark:text-indigo-300">
        <Users className="w-5 h-5 mr-2" />
        <h3 className="text-lg font-semibold">Gestión de Usuarios</h3>
      </div>
      
      {/* Add/Edit User Form */}
      <form onSubmit={handleSubmit} className={`space-y-3 mb-6 p-4 rounded-lg border transition-colors ${
          editingId 
            ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-700' 
            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700/50'
      }`}>
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {editingId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h4>
            {editingId && (
                <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="text-xs flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <X className="w-3 h-3 mr-1" /> Cancelar
                </button>
            )}
        </div>
        
        {error && (
            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">
                {error}
            </div>
        )}

        <div className="grid grid-cols-1 gap-2">
            <div className="relative">
                <User className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nombre Completo"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Usuario"
                    className="w-1/2 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                <input
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Contraseña (mín. 8 caracteres)"
                    className="w-1/2 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
            </div>
            <div className="flex gap-2">
                <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="flex-1 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                    <option value="user">Operador</option>
                    <option value="admin">Administrador</option>
                </select>
                <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center text-white ${
                        editingId 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {editingId ? <RefreshCw className="w-4 h-4 mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
                    {editingId ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </div>
      </form>

      {/* User List */}
      <div className="flex-1 overflow-y-auto min-h-[150px]">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Usuarios Activos</h4>
        <div className="space-y-2">
            {users.map(u => (
                <div 
                    key={u.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        editingId === u.id 
                            ? 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-700' 
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    }`}
                >
                    <div className="flex items-center min-w-0">
                        <div className={`p-2 rounded-full mr-3 ${u.role === 'admin' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                            {u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                {u.name} {u.id === '1' && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded ml-1 text-slate-500">ROOT</span>}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{u.username} • {u.role === 'admin' ? 'Admin' : 'Operador'}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => handleEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded transition-colors"
                            title="Editar usuario"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        {/* Protect main admin (id: 1) from deletion */}
                        {u.id !== '1' && u.id !== currentUser.id && (
                            <button 
                                onClick={() => onDeleteUser(u.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="Eliminar usuario"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};