import { auth, loginConGoogle } from './firebase-config'; 
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RecordForm } from './components/RecordForm';
import { Charts } from './components/Charts';
import { StatsCard } from './components/StatsCard';
import { AnomalyList } from './components/AnomalyList';
import { GeminiInsight } from './components/GeminiInsight';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { RecordsTable } from './components/RecordsTable';
import { DateFilter } from './components/DateFilter';
import { ErrorReportModal } from './components/ErrorReportModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { ProfileModal } from './components/ProfileModal';
import { TaskList } from './components/TaskList';
import { ToastContainer, ToastMessage } from './components/ui/Toast';
import { NotificationCenter, NotificationItem } from './components/NotificationCenter';
import { generateProductReport } from './services/pdfService';
import { calculateStats, detectAnomalies } from './utils/mathUtils';
import { createDesktopShortcut } from './utils/desktopShortcut';
import { DailyRecord, UserProfile, ProductSettings, SettingsMap, Task } from './types';
import { LayoutDashboard, AlertOctagon, LogOut, UserCircle, FileDown, Moon, Sun, Loader2, Settings, ShieldAlert, Cloud, User, Users, Keyboard, Plug, Download, BarChart3, ClipboardList, ListTodo, ChevronLeft, ChevronRight, Package, MessageCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { 
  db,
  guardarRegistro, 
  obtenerRegistros, 
  obtenerUsuarios, 
  guardarUsuarioNube, 
  eliminarUsuarioNube, 
  obtenerConfiguracionGeneral,
  guardarTareaNube,
  obtenerTareasNube,
  eliminarTareaNube,
  eliminarRegistroNube,
  guardarNotificacionNube,
  obtenerNotificacionesNube
} from "./services/firestore";
import { 
  cargarTodosDatos,
  syncRegistro,
  syncTodosRegistros,
  syncTarea,
  syncTodasTareas,
  syncEliminarTarea,
  syncUsuario,
  syncTodosUsuarios,
  syncConfiguracion,
  AutoSyncManager
} from "./services/syncService";
import { exportToExcel } from './services/excelService';
import { FileSpreadsheet } from 'lucide-react'; // Icono de Excel
import { ChatSystem } from './components/ChatSystem';
import { IntegrationModal } from './components/IntegrationModal';
import IntegrationConfigModal from './components/IntegrationConfigModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { KeyboardShortcut } from './services/keyboardService';
import { emailService } from './services/emailService';
import { googleSheetsService } from './services/googleSheetsService';
import { whatsappService } from './services/whatsappService';

const MOCK_DATA: DailyRecord[] = [
  { id: '1', date: '2023-10-01', timestamp: '2023-10-01T08:30', productName: 'Materia Prima A', ingressQty: 100, usageQty: 0 },
  { id: '2', date: '2023-10-01', timestamp: '2023-10-01T14:15', productName: 'Materia Prima A', ingressQty: 0, usageQty: 100 },
  { id: '3', date: '2023-10-02', timestamp: '2023-10-02T09:00', productName: 'Materia Prima A', ingressQty: 105, usageQty: 0 },
  { id: '4', date: '2023-10-02', timestamp: '2023-10-02T16:45', productName: 'Materia Prima A', ingressQty: 0, usageQty: 105 },
  { id: '5', date: '2023-10-03', timestamp: '2023-10-03T08:00', productName: 'Materia Prima A', ingressQty: 98, usageQty: 98 },
  { id: '6', date: '2023-10-04', timestamp: '2023-10-04T10:20', productName: 'Materia Prima A', ingressQty: 102, usageQty: 0 },
  { id: '7', date: '2023-10-04', timestamp: '2023-10-04T11:00', productName: 'Materia Prima A', ingressQty: 0, usageQty: 102 },
  { id: '8', date: '2023-10-05', timestamp: '2023-10-05T09:30', productName: 'Materia Prima A', ingressQty: 100, usageQty: 0 },
  { id: '9', date: '2023-10-05', timestamp: '2023-10-05T13:00', productName: 'Materia Prima A', ingressQty: 0, usageQty: 60 },
  { id: '10', date: '2023-10-06', timestamp: '2023-10-06T08:00', productName: 'Materia Prima A', ingressQty: 150, usageQty: 0 },
  { id: '11', date: '2023-10-06', timestamp: '2023-10-06T15:30', productName: 'Materia Prima A', ingressQty: 0, usageQty: 150 },
];

const DEFAULT_SETTINGS: ProductSettings = {
  targetAverage: null,
  tolerancePercent: 20
};

const INITIAL_PRODUCTS = [
  'COAGULANTE SULFATO', 
  'CARBON', 
  'CAL VIVA', 
  'SODA', 
  'CLORO', 
  'HIPOCLORITO', 
  'POLIMERO'
];

const INITIAL_USERS: UserProfile[] = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin', name: 'Administrador Principal', jobTitle: 'Gerente de Planta' },
  { id: '2', username: 'operador', password: 'user123', role: 'user', name: 'Operador de Planta', jobTitle: 'Supervisor de Turno' }
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', text: 'Revisar inventario de Empaque X', completed: false, createdAt: Date.now() },
  { id: 't2', text: 'Calibrar báscula de entrada', completed: true, createdAt: Date.now() - 100000 },
];

// 5 minutes in milliseconds
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

function App() {

const [products, setProducts] = useState<string[]>(['COAGULANTE SULFATO', 'CARBON', 'CAL VIVA', 'SODA', 'CLORO', 'HIPOCLORITO', 'POLIMERO']);
const [semanasLabel, setSemanasLabel] = useState<string[]>(['1-07*', '08-14*', '15-21*', '22-28*', '29-31*']);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('COAGULANTE SULFATO');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [settingsMap, setSettingsMap] = useState<SettingsMap>({});
  const [logoutReason, setLogoutReason] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'records' | 'tasks' | 'analysis' | 'chat'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Modals State
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isErrorReportOpen, setIsErrorReportOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false);
  const [integrationConfigOpen, setIntegrationConfigOpen] = useState<'email' | 'sheets' | 'whatsapp' | null>(null);
  const [isCreatingShortcut, setIsCreatingShortcut] = useState(false);
  
   // --- 1. PEDIR PERMISOS DE NOTIFICACIÓN ---
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  // Date Filter State
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Loading State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Inactivity Logic
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setUser(null);
        setLogoutReason("La sesión se cerró automáticamente debido a inactividad (5 min).");
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  // --- ATAJOS DE TECLADO ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Permitir Ctrl+K en inputs
        if (!(e.ctrlKey && e.key.toLowerCase() === 'k')) {
          return;
        }
      }

      // Nuevo Registro (Shift+N)
      if (e.shiftKey && e.key === 'N') {
        e.preventDefault();
        addToast('Abre el formulario para crear un nuevo registro', 'info');
      }
      // Nueva Tarea (Shift+T)
      else if (e.shiftKey && e.key === 'T') {
        e.preventDefault();
        addToast('Abre el modal para crear una nueva tarea', 'info');
      }
      // Búsqueda Rápida (Ctrl+K)
      else if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        addToast('Búsqueda rápida activada', 'info');
      }
      // Exportar (Shift+E)
      else if (e.shiftKey && e.key === 'E') {
        e.preventDefault();
        handleDownloadReport();
      }
      // Panel Admin (Shift+A)
      else if (e.shiftKey && e.key === 'A' && user?.role === 'admin') {
        e.preventDefault();
        setIsAdminPanelOpen(true);
      }
      // Cambiar Cuenta (Shift+C)
      else if (e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handleChangeAccount();
      }
      // Mostrar Atajos (Shift+/)
      else if (e.shiftKey && e.key === '?') {
        e.preventDefault();
        setIsKeyboardShortcutsOpen(true);
      }
      // Cerrar Modal (Escape)
      else if (e.key === 'Escape') {
        setIsAdminPanelOpen(false);
        setIsErrorReportOpen(false);
        setIsCloudSyncOpen(false);
        setIsProfileModalOpen(false);
        setIsIntegrationModalOpen(false);
        setIsKeyboardShortcutsOpen(false);
        setIntegrationConfigOpen(null);
      }
      // Modo Oscuro (Ctrl+M)
      else if (e.ctrlKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleTheme();
      }
      // Cerrar Sesión (Ctrl+L)
      else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setUser(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

// --- CARGADOR TOTAL DESDE LA NUBE (AUTO-SINCRONIZACIÓN AL INICIAR) ---
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        console.log('🔄 Iniciando sincronización automática de datos...');
        const datosCloud = await cargarTodosDatos();

        // Cargar registros de inventario
        if (datosCloud.registros.length > 0) {
          setRecords(datosCloud.registros);
          console.log('✅ Registros cargados:', datosCloud.registros.length);
        }

        // Cargar tareas
        if (datosCloud.tareas.length > 0) {
          setTasks(datosCloud.tareas);
          console.log('✅ Tareas cargadas:', datosCloud.tareas.length);
        }

        // Cargar usuarios
        if (datosCloud.usuarios.length > 0) {
          setUsers(datosCloud.usuarios);
          console.log('✅ Usuarios cargados:', datosCloud.usuarios.length);

          // Actualizar sesión actual si existe
          if (user) {
            const usuarioActualizado = datosCloud.usuarios.find(u => u.id === user.id);
            if (usuarioActualizado) {
              setUser(usuarioActualizado);
              console.log('✅ Sesión de usuario actualizada');
            }
          }
        }

        // Cargar configuración (ajustes de productos)
        if (datosCloud.configuracion && Object.keys(datosCloud.configuracion).length > 0) {
          if (datosCloud.configuracion.settingsMap) {
            setSettingsMap(datosCloud.configuracion.settingsMap);
          }
          if (datosCloud.configuracion.products) {
            setProducts(datosCloud.configuracion.products);
          }
          if (datosCloud.configuracion.semanasLabel) {
            setSemanasLabel(datosCloud.configuracion.semanasLabel);
          }
          console.log('✅ Configuración cargada');
        }

        // Cargar notificaciones (LIMITADO a últimas 50 para no sobrecargar)
        if (datosCloud.notificaciones.length > 0) {
          const ultimasNotificaciones = datosCloud.notificaciones.slice(0, 50);
          setNotificationHistory(ultimasNotificaciones as any[]);
          console.log('✅ Notificaciones cargadas:', ultimasNotificaciones.length);
        }

        console.log('✨ Sincronización completada exitosamente');
        setIsDataLoaded(true);
      } catch (error) {
        console.error('❌ Error en sincronización:', error);
        setIsDataLoaded(true); // Marcar como cargado aunque falle, para permitir uso offline
      }
    };

    cargarDatos();
  }, []); // Se ejecuta solo una vez al montar el componente

  // --- CARGAR CONFIGURACIÓN DE INTEGRACIONES EXTERNAS ---
  useEffect(() => {
    const cargarIntegraciones = async () => {
      if (!user?.id) return;

      try {
        console.log('🔄 Cargando configuración de integraciones...');

        // Establecer userId en los servicios
        emailService.setUserId(user.id);
        googleSheetsService.setUserId(user.id);
        whatsappService.setUserId(user.id);

        // Cargar cada integración
        await emailService.loadConfig();
        await googleSheetsService.loadConfig();
        await whatsappService.loadConfig();

        console.log('✅ Integraciones cargadas correctamente');
      } catch (error) {
        console.error('❌ Error cargando integraciones:', error);
      }
    };

    cargarIntegraciones();
  }, [user?.id]);

  // --- AUTO-SINCRONIZACIÓN DE REGISTROS ---
  // Sincroniza cambios en registros con un delay de 5 segundos (OPTIMIZADO: era 2)
  useEffect(() => {
    if (!isDataLoaded || records.length === 0) return;
    
    let timeoutId: any;
    timeoutId = setTimeout(() => {
      syncTodosRegistros(records).catch(err => 
        console.error('Error sincronizando registros:', err)
      );
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [records]);

  // --- AUTO-SINCRONIZACIÓN DE TAREAS ---
  // Sincroniza cambios en tareas con un delay de 5 segundos (OPTIMIZADO: era 2)
  useEffect(() => {
    if (!isDataLoaded || tasks.length === 0) return;
    
    let timeoutId: any;
    timeoutId = setTimeout(() => {
      syncTodasTareas(tasks).catch(err => 
        console.error('Error sincronizando tareas:', err)
      );
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [tasks]);

  // --- AUTO-SINCRONIZACIÓN DE USUARIOS ---
  // Sincroniza cambios en usuarios con un delay de 5 segundos (OPTIMIZADO: era 2)
  useEffect(() => {
    if (!isDataLoaded || users.length === 0) return;
    
    let timeoutId: any;
    timeoutId = setTimeout(() => {
      syncTodosUsuarios(users).catch(err => 
        console.error('Error sincronizando usuarios:', err)
      );
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [users]);

  // --- AUTO-SINCRONIZACIÓN DE CONFIGURACIÓN ---
  // Sincroniza cambios en ajustes de productos con un delay de 5 segundos (OPTIMIZADO: era 3)
  useEffect(() => {
    if (!isDataLoaded || Object.keys(settingsMap).length === 0) return;
    
    let timeoutId: any;
    timeoutId = setTimeout(() => {
      const configuracion = {
        settingsMap,
        products,
        semanasLabel
      };
      syncConfiguracion(configuracion).catch(err => 
        console.error('Error sincronizando configuración:', err)
      );
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [settingsMap, products, semanasLabel]);

  // --- VIGILANTE DE RECORDATORIOS (SISTEMA DE ALARMAS) ---
  // --- VIGILANTE DE RECORDATORIOS (OPTIMIZADO - SIN RECREARSE) ---
  const tasksRefForReminders = useRef<Task[]>([]);
  tasksRefForReminders.current = tasks;

  useEffect(() => {
    // 1. Pedir permiso a Windows para notificaciones
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    // Intervalo optimizado: cada 10 segundos en lugar de cada 1 (10x más rápido)
    const revisarReloj = setInterval(() => {
      const ahora = new Date();
      
      // Solo procesar tareas que no están completadas y no han enviado recordatorio
      tasksRefForReminders.current.forEach(task => {
        if (task.reminderTime && !task.completed && !task.reminderSent) {
          const tiempoProgramado = new Date(task.reminderTime);

          // Si ya es la hora o ya pasó
          if (ahora >= tiempoProgramado) {
            console.log("⏰ ¡Alarma activada para:", task.text);

            // A. NOTIFICACIÓN DE WINDOWS (Externa)
            if (Notification.permission === "granted") {
              new Notification("StockFlow AI: Recordatorio", {
                body: task.text,
                icon: "./icon.ico"
              });
            }

            // B. NOTIFICACIÓN DENTRO DE LA APP (Toast morado)
            addToast(`RECORDATORIO: ${task.text}`, 'info');

            // C. MARCAR COMO ENVIADA (Para que no repita el aviso)
            setTasks(prev => prev.map(t => 
              t.id === task.id ? { ...t, reminderSent: true } : t
            ));
          }
        }
      });
    }, 10000); // Revisa cada 10 segundos (OPTIMIZADO: era 1 segundo)

    return () => clearInterval(revisarReloj);
  }, []); // Dependencias vacías - se ejecuta una sola vez

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Notification History State
  const [notificationHistory, setNotificationHistory] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dismissedCriticalCount, setDismissedCriticalCount] = useState(0);

  // Refs
  const prevCriticalCountRef = useRef<number>(0);
  const prevProductRef = useRef<string>(selectedProduct);
  const isFirstRender = useRef(true);

  const currentSettings = settingsMap[selectedProduct] || DEFAULT_SETTINGS;

  const productRecords = useMemo(() => {
    let filtered = records.filter(r => r.productName === selectedProduct);
    if (dateRange.start) {
      filtered = filtered.filter(r => r.date >= dateRange.start);
    }
    if (dateRange.end) {
      filtered = filtered.filter(r => r.date <= dateRange.end);
    }
    return filtered;
  }, [records, selectedProduct, dateRange]);

  const stats = useMemo(() => calculateStats(productRecords, selectedProduct), [productRecords, selectedProduct]);
  
  // Modified: Pass settingsMap to detect anomalies properly per product
  const anomalies = useMemo(() => detectAnomalies(productRecords, settingsMap), [productRecords, settingsMap]);
  const allAnomalies = useMemo(() => detectAnomalies(records, settingsMap), [records, settingsMap]);
  
  const criticalFailureCount = allAnomalies.filter(a => a.severity === 'critical').length;

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

const addToast = async (message: string, type: 'critical' | 'success' | 'info') => {
  const id = Math.random().toString(36).substring(2, 9);
  const nuevaNotificacion = { id, message, type, timestamp: new Date() };

  // 1. Mostrar en pantalla (flotante)
  setToasts(prev => [...prev, { id, message, type }]);
  
  // 2. Guardar en el historial de la campana (local)
  setNotificationHistory(prev => [nuevaNotificacion, ...prev]);

  // 3. Incrementar contador de no leídas
  setUnreadCount(prev => prev + 1);

  // 4. GUARDAR EN GOOGLE CLOUD (Historial permanente)
  await guardarNotificacionNube(nuevaNotificacion);
};

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearHistory = () => {
    setNotificationHistory([]);
    setUnreadCount(0);
    setIsNotificationOpen(false);
  };

  const handleToggleNotifications = () => {
    if (!isNotificationOpen) {
      setUnreadCount(0);
    }
    setIsNotificationOpen(!isNotificationOpen);
  };

  // Task Handlers
const handleAddTask = async (text: string, reminderTime?: string) => {
  const newTask: Task = {
    id: uuidv4(),
    text,
    completed: false,
    createdAt: Date.now(),
    reminderTime: reminderTime || undefined,
    reminderSent: false
  };
  
  await guardarTareaNube(newTask); // <--- GUARDAR EN NUBE
  setTasks(prev => [newTask, ...prev]);
  addToast('Tarea guardada en la nube ✅', 'success');
};

const handleToggleTask = async (id: string) => {
    const taskToToggle = tasks.find(t => t.id === id);
    if (!taskToToggle) return;
    const updatedTask = { 
      ...taskToToggle, 
      completed: !taskToToggle.completed 
    };

    try {
      await guardarTareaNube(updatedTask);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      if (updatedTask.completed) {
        addToast('Tarea marcada como completada ✅', 'success');
      }
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
      addToast('Error de sincronización con la nube ❌', 'critical');
    }
  };

const handleEditTask = (id: string, newText: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
  }; 


  // --- EFECTO: Detectar nuevas anomalías críticas ---
  useEffect(() => {
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    
    if (isFirstRender.current) {
      prevCriticalCountRef.current = criticalAnomalies.length;
      prevProductRef.current = selectedProduct;
      isFirstRender.current = false;
      return;
    }

    if (selectedProduct !== prevProductRef.current) {
      prevProductRef.current = selectedProduct;
      prevCriticalCountRef.current = criticalAnomalies.length;
      return;
    }

    if (criticalAnomalies.length > prevCriticalCountRef.current) {
      const latestAnomaly = criticalAnomalies[criticalAnomalies.length - 1];
      const notificationText = `FALLO DEL SISTEMA: ${latestAnomaly.message}`;
      addToast(notificationText, 'critical');
    }

    prevCriticalCountRef.current = criticalAnomalies.length;
  }, [anomalies, selectedProduct]);

  // --- 2. ESCUCHA DE MENSAJES PARA NOTIFICACIONES ---
  useEffect(() => {
    if (!user) return; 

    const q = query(
      collection(db, "chat"), 
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const m = change.doc.data();
          const esParaMi = m.receiverId === user.id || m.receiverId === 'general';
          const noEsMio = m.senderId !== user.id;
          const ahora = Date.now();
          const fechaMsg = m.timestamp?.toMillis() || ahora;

          if (esParaMi && noEsMio && (ahora - fechaMsg < 10000)) {
            addToast(`Mensaje de ${m.senderName}: ${m.text}`, "info");
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = (u: UserProfile) => {
    setUser(u);
    setLogoutReason(null);
  };

  const handleChangeAccount = () => {
    // Cambiar de cuenta sin cerrar la app
    setUser(null);
    setLogoutReason('Cambiando de cuenta...');
    addToast('Cargando pantalla de login...', 'info');
  };

const handleUpdateProfile = async (updatedData: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updatedData };

      await guardarUsuarioNube(updatedUser);

      setUser(updatedUser);

      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));

      addToast("Perfil actualizado en la nube ✅", "success");
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      addToast("Error al guardar cambios de perfil ❌", "critical");
    }
  };

const handleAddRecord = async (newRecord: DailyRecord) => {
    try {
      await guardarRegistro(newRecord);
      setRecords(prev => [...prev, newRecord]);
      addToast(newRecord.ingressQty > 0 ? "Ingreso guardado en la nube ✅" : "Salida guardada en la nube ✅", 'success');
    } catch (error) {
      console.error("Error al guardar en Firebase:", error);
      addToast("Error de conexión con la nube ❌", "critical");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await eliminarRegistroNube(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      addToast('Registro eliminado correctamente', 'info');
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      setRecords(prev => prev.filter(r => r.id !== id));
      addToast('Registro eliminado localmente (error en la nube)', 'info');
    }
  };

  const handleUpdateSettings = (product: string, newSettings: ProductSettings) => {
    setSettingsMap(prev => ({
      ...prev,
      [product]: newSettings
    }));
    addToast(`Configuración de ${product} actualizada`, 'info');
  };

  const handleAddProduct = (newProduct: string) => {
    if (products.includes(newProduct)) {
      addToast('Este material ya existe en el inventario', 'critical');
      return;
    }
    setProducts(prev => [...prev, newProduct]);
    addToast(`Material "${newProduct}" añadido al inventario`, 'success');
  };

  const handleRenameProduct = (oldName: string, newName: string) => {
    if (products.includes(newName)) {
      addToast('El nombre del material ya existe', 'critical');
      return;
    }

    setProducts(prev => prev.map(p => p === oldName ? newName : p));
    setRecords(prev => prev.map(r => r.productName === oldName ? { ...r, productName: newName } : r));
    setSettingsMap(prev => {
      const newMap = { ...prev };
      if (newMap[oldName]) {
        newMap[newName] = newMap[oldName];
        delete newMap[oldName];
      }
      return newMap;
    });

    if (selectedProduct === oldName) {
      setSelectedProduct(newName);
    }
    addToast(`Material renombrado a "${newName}"`, 'success');
  };

const handleAddUser = async (newUser: UserProfile) => {
    try {
      console.log("Intentando guardar usuario en la nube...", newUser);
      
      // 1. Guardar en Google Cloud
      await guardarUsuarioNube(newUser); 
      
      // 2. Actualizar la lista localmente
      setUsers(prev => [...prev, newUser]);
      
      addToast('Usuario sincronizado con la nube ✅', 'success');
    } catch (error) {
      console.error("Error al crear usuario:", error);
      addToast('Error al guardar en la nube ❌', 'critical');
    }
  };

const handleEditUser = async (updatedUser: UserProfile) => {
    try {
      // 1. Guardar cambios en Google Cloud
      await guardarUsuarioNube(updatedUser);
      
      // 2. Actualizar lista local
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
      }
      addToast('Usuario actualizado en la nube ✅', 'success');
    } catch (error) {
      console.error("Error al editar usuario:", error);
      addToast('Error al sincronizar cambios ❌', 'critical');
    }
  };

const handleDeleteUser = async (id: string) => {
    if (id === '1') {
      addToast('No se puede eliminar al admin principal', 'critical');
      return;
    }
    try {
      // 1. Borrar de la nube
      await eliminarUsuarioNube(id);
      // 2. Actualizar lista local
      setUsers(prev => prev.filter(u => u.id !== id));
      addToast('Usuario eliminado de la nube 🗑️', 'info');
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      addToast('Error al eliminar de la nube ❌', 'critical');
    }
  };

const handleDeleteTask = async (id: string) => {
    try {
      // 1. Borrar de la nube
      await eliminarTareaNube(id);
      // 2. Actualizar lista local
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast('Tarea eliminada permanentemente 🗑️', 'info');
    } catch (error) {
      console.error("Error al borrar tarea:", error);
      addToast('Error al conectar con la nube ❌', 'critical');
    }
  };

  const handleDownloadReport = () => {
    if (isGeneratingReport) return;
    setIsGeneratingReport(true);
    setTimeout(() => {
      try {
        generateProductReport(selectedProduct, stats, productRecords, anomalies, currentSettings);
        addToast('Informe PDF generado', 'success');
      } catch (error) {
        addToast('Error al generar el reporte', 'critical');
      } finally {
        setIsGeneratingReport(false);
      }
    }, 500);
  };

  const handleCreateDesktopShortcut = async () => {
    setIsCreatingShortcut(true);
    try {
      const result = await createDesktopShortcut();
      if (result.success) {
        addToast('✅ Acceso directo creado en el escritorio', 'success');
      } else {
        addToast(`❌ ${result.error || 'Error al crear el acceso directo'}`, 'critical');
      }
    } catch (error) {
      addToast('❌ Error al crear el acceso directo', 'critical');
    } finally {
      setIsCreatingShortcut(false);
    }
  };

  // Si no hay usuario autenticado, mostramos la pantalla de login
  if (!user) {
    return (
      <LoginScreen 
        users={users}
        onLogin={handleLogin} 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme}
        logoutReason={logoutReason}
      />
    );
  }

  // Pantalla de carga mientras se sincronizan datos
  if (!isDataLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25 animate-pulse">
            <LayoutDashboard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Cargando datos...</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sincronizando con la nube</p>
          </div>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-300">

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Profile Modal */}
<ProfileModal 
  isOpen={isProfileModalOpen}
  onClose={() => setIsProfileModalOpen(false)}
  currentUser={user}
  onSave={handleUpdateProfile}
/>

{user?.role === 'admin' && ( //
        <>
          <AdminPanel 
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            products={products}
            setProducts={setProducts}
            semanasLabel={semanasLabel}
            setSemanasLabel={setSemanasLabel}
            initialProductName={selectedProduct}
            records={records}
            settingsMap={settingsMap}
            onSaveSettings={handleUpdateSettings}
            onRenameProduct={handleRenameProduct}
            onAddProduct={handleAddProduct}
            users={users}
            currentUser={user}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
          <ErrorReportModal 
            isOpen={isErrorReportOpen}
            onClose={() => setIsErrorReportOpen(false)}
            anomalies={allAnomalies}
            records={records}
          />
          <CloudSyncModal 
            isOpen={isCloudSyncOpen}
            onClose={() => setIsCloudSyncOpen(false)}
            dataToBackup={{
                records,
                users,
                products,
                settings: settingsMap,
                tasks
            }}
          />

          <IntegrationModal 
            isOpen={isIntegrationModalOpen}
            onClose={() => setIsIntegrationModalOpen(false)}
            onConfigureClick={(type) => {
              setIntegrationConfigOpen(type);
            }}
          />

          <KeyboardShortcutsModal 
            isOpen={isKeyboardShortcutsOpen}
            onClose={() => setIsKeyboardShortcutsOpen(false)}
          />

          {integrationConfigOpen && (
            <IntegrationConfigModal 
              isOpen={true}
              onClose={() => setIntegrationConfigOpen(null)}
              integationType={integrationConfigOpen}
              userId={user?.id}
            />
          )}
        </>
      )}

      {/* ─── SIDEBAR ─── */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'}`}>
        {/* Logo + Collapse */}
        <div className="flex items-center h-14 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="bg-indigo-600 p-1.5 rounded-lg shrink-0">
            <LayoutDashboard className="text-white w-5 h-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <h1 className="text-sm font-bold text-slate-800 dark:text-white truncate">StockFlow AI</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{user?.role === 'admin' ? 'Administrador' : 'Operador'}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'}`}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Product Selector */}
        <div className={`py-3 border-b border-slate-200 dark:border-slate-700 shrink-0 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
          {sidebarCollapsed ? (
            <div className="flex justify-center" title={selectedProduct}>
              <Package className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">Producto</label>
              <select
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                {products.map(p => (
                  <option key={p} value={p} className="dark:bg-slate-700">{p}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {([
            { id: 'dashboard' as const, label: 'Panel', icon: LayoutDashboard },
            { id: 'records' as const, label: 'Registros', icon: ClipboardList },
            { id: 'analysis' as const, label: 'Gráficos', icon: BarChart3 },
            { id: 'tasks' as const, label: 'Tareas', icon: ListTodo },
            { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
          ]).map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Admin Actions */}
        {user?.role === 'admin' && (
          <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 space-y-1 shrink-0">
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-3">Admin</p>
            )}
            <button onClick={() => setIsAdminPanelOpen(true)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Configuración">
              <Settings className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Configuración</span>}
            </button>
            <button onClick={() => setIsCloudSyncOpen(true)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Sincronización">
              <Cloud className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Sincronización</span>}
            </button>
            <button onClick={() => { setIsErrorReportOpen(true); setDismissedCriticalCount(criticalFailureCount); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors relative ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Errores">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Errores</span>}
              {criticalFailureCount > dismissedCriticalCount && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">{criticalFailureCount - dismissedCriticalCount}</span>
              )}
            </button>
            <button onClick={() => setIsIntegrationModalOpen(true)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Integraciones">
              <Plug className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Integraciones</span>}
            </button>
            <button onClick={() => setIsKeyboardShortcutsOpen(true)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : ''}`} title="Atajos">
              <Keyboard className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Atajos</span>}
            </button>
          </div>
        )}

        {/* User Profile + Logout */}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-slate-200 dark:ring-slate-600" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0"><User className="w-4 h-4" /></div>
            )}
            {!sidebarCollapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.jobTitle || user?.role}</p>
              </div>
            )}
          </button>
          <button
            onClick={() => setUser(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'}`}>

      {/* Compact Top Bar */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {activeSection === 'dashboard' ? 'Panel' : activeSection === 'records' ? 'Registros' : activeSection === 'analysis' ? 'Gráficos' : activeSection === 'tasks' ? 'Tareas' : 'Chat'}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">{selectedProduct}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToExcel(records, products, semanasLabel)}
              className="flex items-center text-xs font-medium px-3 py-1.5 rounded-lg transition-all text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
              className={`flex items-center text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                isGeneratingReport
                ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
              }`}
              title="Descargar PDF"
            >
              {isGeneratingReport ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 mr-1.5" />
                  <span className="hidden sm:inline">PDF</span>
                </>
              )}
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 rounded-lg transition-all">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <NotificationCenter
              notifications={notificationHistory}
              unreadCount={unreadCount}
              isOpen={isNotificationOpen}
              onToggle={handleToggleNotifications}
              onClear={clearHistory}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>
      </header>

      {/* Content Area */}
      <main className={`flex-1 overflow-y-auto p-6 ${activeSection === 'chat' ? 'flex flex-col' : ''}`}>

        {/* ── DASHBOARD ── */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <StatsCard stats={stats} settings={currentSettings} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Charts data={productRecords} stats={stats} key={selectedProduct} isDarkMode={isDarkMode} />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <AnomalyList anomalies={anomalies} records={records} />
                <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <div className="flex items-start">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-lg mr-3">
                      <AlertOctagon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Reglas de Seguimiento</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        1. El ingreso debe ser igual al uso (JIT). <br/>
                        2. Alertas si el uso se desvía &gt;{currentSettings.tolerancePercent}% del {currentSettings.targetAverage ? 'Objetivo' : 'Promedio'}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REGISTROS ── */}
        {activeSection === 'records' && (
          <div className="space-y-6">
            <RecordForm
              onAdd={handleAddRecord}
              currentProduct={selectedProduct}
              availableProducts={products}
            />
            <DateFilter
              startDate={dateRange.start}
              endDate={dateRange.end}
              onStartDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
              onEndDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
              onClear={() => setDateRange({ start: '', end: '' })}
            />
            <RecordsTable
              records={productRecords}
              productos={products}
              setProducts={setProducts}
              isUserAdmin={user?.role === 'admin'}
              addToast={addToast}
            />
          </div>
        )}

        {/* ── GRÁFICOS / ANÁLISIS ── */}
        {activeSection === 'analysis' && (
          <div className="space-y-6">
            <RecordForm
              onAdd={handleAddRecord}
              currentProduct={selectedProduct}
              availableProducts={products}
            />
            <DateFilter
              startDate={dateRange.start}
              endDate={dateRange.end}
              onStartDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
              onEndDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
              onClear={() => setDateRange({ start: '', end: '' })}
            />
            <Charts data={productRecords} stats={stats} key={`analysis-${selectedProduct}`} isDarkMode={isDarkMode} />
            <AnomalyList anomalies={anomalies} records={records} />
          </div>
        )}

        {/* ── TAREAS ── */}
        {activeSection === 'tasks' && (
          <div className="max-w-2xl">
            <TaskList
              tasks={tasks}
              userRole={user?.role}
              onAdd={handleAddTask}
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          </div>
        )}

        {/* ── CHAT ── */}
        {activeSection === 'chat' && (
          <div className="w-full flex-1 min-h-0">
            {user && <ChatSystem currentUser={user} allUsers={users} />}
          </div>
        )}

      </main>
      </div>

      
    </div>
  );
    

}
export default App;