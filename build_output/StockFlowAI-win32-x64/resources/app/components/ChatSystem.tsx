import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, User, Users, Search, ChevronLeft, Camera, Paperclip, FileText, Download, Image, XCircle } from 'lucide-react';
import { enviarMensajeNube, escucharChat, guardarFotoGeneral, obtenerFotoGeneral } from '../services/firestore';
import { Message, UserProfile } from '../types';

export const ChatSystem = ({ currentUser, allUsers }: { currentUser: UserProfile, allUsers: UserProfile[] }) => {
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [activeChat, setActiveChat] = useState<{id: string, name: string, avatar?: string}>({ id: 'general', name: 'Chat General' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [generalPhoto, setGeneralPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{url: string, name: string} | null>(null);
  
  // REFS para el auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null);

  // LÓGICA: Cambiar automáticamente a vista de chat cuando se selecciona un usuario
  useEffect(() => {
    if (activeChat.id !== 'general') {
      setView('chat');
    }
  }, [activeChat.id]);

  // Escuchar mensajes en tiempo real
  useEffect(() => {
    obtenerFotoGeneral().then(setGeneralPhoto);
    if (view === 'chat') {
      const unsub = escucharChat(currentUser.id, activeChat.id, (msgs) => setMessages(msgs));
      return () => unsub();
    }
  }, [view, activeChat.id, currentUser.id]);

  // Auto-scroll
  useEffect(() => { 
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, view]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si hay una foto en preview, enviarla
    if (photoPreview) {
      const caption = inputText.trim() || 'Envió una foto 📷';
      setInputText('');
      const preview = photoPreview;
      setPhotoPreview(null);
      await enviarMensajeNube(caption, currentUser, activeChat.id, {
        url: preview.url,
        name: preview.name,
        type: 'image/jpeg'
      });
      return;
    }

    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await enviarMensajeNube(text, currentUser, activeChat.id);
  };

  // HANDLER: Subir foto con vista previa
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = ''; // Reset input para permitir re-seleccionar

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setPhotoPreview({ url: compressedBase64, name: file.name });
      };
    };
    reader.readAsDataURL(file);
  };

  // HANDLER: Subir archivo (documentos, no imágenes)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // Si seleccionan una imagen desde el clip, redirigir al handler de fotos
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setPhotoPreview({ url: compressedBase64, name: file.name });
        };
      };
      reader.readAsDataURL(file);
      return;
    }

    // Archivos (PDF, Excel, Word) - límite 1MB
    if (file.size > 1000000) {
      alert("El archivo supera el límite de 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await enviarMensajeNube(`Envió un archivo: ${file.name}`, currentUser, activeChat.id, {
        url: reader.result as string,
        name: file.name,
        type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleGeneralPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser.role === 'admin') {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setGeneralPhoto(base64);
        await guardarFotoGeneral(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full h-full flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      
      {/* ─── LISTA DE CHATS (IZQUIERDA) ─── */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white mb-3">Chats</h3>
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-lg text-xs outline-none border border-slate-200 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-400/30" 
          />
        </div>

        {/* Chat General */}
        <button 
          onClick={() => { setActiveChat({id: 'general', name: 'Chat General'}); setView('chat'); }}
          className={`w-full p-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 transition-colors text-left ${
            activeChat.id === 'general' 
              ? 'bg-indigo-50 dark:bg-indigo-500/10' 
              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0">
            {generalPhoto ? <img src={generalPhoto} className="w-full h-full object-cover" /> : <Users size={20}/>}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-800 dark:text-white">Chat General</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Grupo de trabajo</p>
          </div>
        </button>

        {/* Lista de Usuarios */}
        <div className="flex-1 overflow-y-auto">
          {allUsers
            .filter(u => u.id !== currentUser.id && (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase())))
            .map(u => (
              <button 
                key={u.id}
                onClick={() => { setActiveChat({id: u.id, name: u.nickname || u.name, avatar: u.avatar}); setView('chat'); }}
                className={`w-full p-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 transition-colors text-left ${
                  activeChat.id === u.id 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600">
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : <User size={20}/>}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{u.nickname || u.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* ─── ÁREA DE MENSAJES (DERECHA) ─── */}
      <div className="flex-1 flex flex-col">
        
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.senderId === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden flex-shrink-0 mt-1 shadow-sm flex items-center justify-center">
                 {msg.senderAvatar ? <img src={msg.senderAvatar} className="w-full h-full object-cover" /> : <User size={12} className="text-slate-500 dark:text-slate-400" />}
              </div>
              <div className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 mb-0.5 px-1">{msg.senderName}</span>
                <div className={`p-2.5 rounded-2xl text-sm shadow-sm ${msg.senderId === currentUser.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700 rounded-tl-none'}`}>
                  {msg.fileUrl && msg.fileType?.startsWith('image/') && (
                     <img src={msg.fileUrl} alt="Adjunto" className="rounded-lg mb-2 max-w-xs h-auto border border-white/20 cursor-pointer" onClick={() => window.open(msg.fileUrl)} />
                  )}
                  {msg.fileUrl && !msg.fileType?.startsWith('image/') && (
                    <div className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg mb-2">
                      <FileText size={16} />
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-bold text-xs">{msg.fileName}</p>
                        <a href={msg.fileUrl} download={msg.fileName} className="text-xs underline opacity-80 flex items-center gap-1"><Download size={10} /> Descargar</a>
                      </div>
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Vista previa de foto */}
        {photoPreview && (
          <div className="px-4 pt-2 pb-1 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="relative inline-block">
              <img src={photoPreview.url} alt="Preview" className="h-24 rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg hover:bg-red-600 transition-colors"
              >
                <XCircle size={16} />
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[150px]">{photoPreview.name}</p>
            </div>
          </div>
        )}

        {/* Input de Mensaje */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2 items-center shrink-0">
          <label className="cursor-pointer text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 transition-colors" title="Enviar foto">
            <Image size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </label>
          <label className="cursor-pointer text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 transition-colors" title="Adjuntar archivo">
            <Paperclip size={18} />
            <input type="file" className="hidden" accept="image/*, .pdf, .xlsx, .docx" onChange={handleFileUpload} />
          </label>
          <input 
            type="text" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            placeholder={photoPreview ? "Añade un comentario..." : "Escribe un mensaje..."} 
            className="flex-1 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/30" 
          />
          <button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};