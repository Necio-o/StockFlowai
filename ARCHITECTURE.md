# 🏗️ ARQUITECTURA DE PERSISTENCIA - DOCUMENTACIÓN TÉCNICA

## 📐 Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO EN APP                          │
│              (Abre StockFlow AI en Desktop)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │   App Monta (useEffect[])        │
        │  cargarTodosDatos() ejecuta      │
        └────────────┬─────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────┐
    │  Firebase Firestore (Nube)     │
    │  - Collections:                │
    │    • inventario                │
    │    • tareas                    │
    │    • usuarios                  │
    │    • configuracion             │
    │    • chat                      │
    │    • historial_notificaciones  │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │   syncService.ts               │
    │   cargarTodosDatos()           │
    │   → Retorna objeto con todos   │
    │     los datos de Firebase      │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │   App.tsx Estados              │
    │   setRecords(datos)            │
    │   setTasks(datos)              │
    │   setUsers(datos)              │
    │   setSettingsMap(datos)        │
    └────────────┬────────────────────┘
                 │
                 ▼
        ┌───────────────────────┐
        │   UI Renderiza        │
        │   (Usuario ve datos)  │
        └───────────────┬───────┘
                        │
           ┌────────────┴────────────┐
           │                         │
           ▼                         ▼
    ┌──────────────┐        ┌──────────────────┐
    │ Usuario crea │        │ Usuario modifica │
    │ nuevo record │        │  datos existentes│
    └──────┬───────┘        └────────┬─────────┘
           │                         │
           └────────────┬────────────┘
                        │
                        ▼
            ┌─────────────────────────┐
            │ Estado Local Actualiza  │
            │ setRecords([...prev])   │
            │ setTasks([...prev])     │
            └────────────┬────────────┘
                         │
                         ▼
        ┌──────────────────────────────┐
        │  useEffect([records])        │
        │  fired!                      │
        │  Espera 2 segundos (debounce)│
        └────────────┬─────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │  syncTodosRegistros()        │
        │  (llama a guardarRegistro()) │
        └────────────┬─────────────────┘
                     │
                     ▼
        ┌──────────────────────────────┐
        │  Firebase Firestore          │
        │  [C]reate/[U]pdate Docs      │
        └────────────┬─────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │✅ Datos guardados│
            │   en la nube     │
            └──────────────────┘
```

---

## 📂 Estructura de Archivos

```
services/
├── syncService.ts          ⭐ NUEVO - Gestión central de sincronización
│   ├── cargarTodosDatos()                    ← Carga al iniciar
│   ├── syncRegistro()                        ← Guarda 1 registro
│   ├── syncTodosRegistros()                  ← Guarda array
│   ├── syncTarea()                           ← Guarda 1 tarea
│   ├── syncTodasTareas()                     ← Guarda array
│   ├── syncUsuario()                         ← Guarda 1 usuario
│   ├── syncTodosUsuarios()                   ← Guarda array
│   ├── syncConfiguracion()                   ← Guarda ajustes
│   ├── crearYGuardarRegistro()               ← Create + Save
│   ├── crearYGuardarTarea()                  ← Create + Save
│   └── AutoSyncManager                       ← Clase para debouncing
│
└── firestore.ts            ✅ EXISTENTE - Funciones Firebase
    ├── guardarRegistro()
    ├── obtenerRegistros()
    ├── guardarTareaNube()
    ├── obtenerTareasNube()
    ├── guardarUsuarioNube()
    ├── obtenerUsuarios()
    └── ... (otras funciones)
```

---

## 🔄 Flujo de Sincronización

### 1. CARGA INICIAL (Al montar App.tsx)

```typescript
// App.tsx - useEffect[]
useEffect(() => {
  const cargarDatos = async () => {
    // Llamar a syncService
    const datosCloud = await cargarTodosDatos();
    
    // datosCloud contiene:
    // {
    //   registros: DailyRecord[],
    //   tareas: Task[],
    //   usuarios: UserProfile[],
    //   configuracion: { settingsMap, products, semanasLabel },
    //   notificaciones: any[]
    // }
    
    // Actualizar estados locales
    setRecords(datosCloud.registros);
    setTasks(datosCloud.tareas);
    setUsers(datosCloud.usuarios);
    setSettingsMap(datosCloud.configuracion.settingsMap);
    // ... etc
  };
  
  cargarDatos();
}, []); // Solo una vez al montar
```

### 2. AUTO-SINCRONIZACIÓN (Cuando cambian datos)

```typescript
// Auto-sync Registros
useEffect(() => {
  if (records.length === 0) return;
  
  let timeoutId = setTimeout(() => {
    syncTodosRegistros(records)  // Guarda después de 2 segundos
  }, 2000);
  
  return () => clearTimeout(timeoutId);
}, [records]); // Se ejecuta cada vez que records cambia
```

### 3. SINCRONIZACIÓN MANUAL (En funciones específicas)

```typescript
const handleAddRecord = async (newRecord: DailyRecord) => {
  try {
    // Guarda en Firebase
    await guardarRegistro(newRecord);
    
    // Actualiza estado local
    setRecords(prev => [...prev, newRecord]);
    
    // useEffect auto-sync se activará después
    addToast("Guardado ✅", 'success');
  } catch (error) {
    addToast("Error ❌", 'critical');
  }
};
```

---

## 🏢 Estructura de Firebase Firestore

```
firestore/
└── stockflow-ai-486913
    ├── inventario/                    (Collection)
    │   ├── doc1: { id, date, timestamp, productName, ingressQty, usageQty }
    │   ├── doc2: { ... }
    │   └── docN: { ... }
    │
    ├── tareas/                        (Collection)
    │   ├── task-1234567: { id, text, completed, createdAt, reminderTime }
    │   ├── task-2345678: { ... }
    │   └── task-N: { ... }
    │
    ├── usuarios/                      (Collection)
    │   ├── 1: { id, username, password, role, name, avatar, nickname }
    │   ├── 2: { ... }
    │   └── N: { ... }
    │
    ├── configuracion/                 (Collection)
    │   ├── global: { settingsMap, products, semanasLabel }
    │   ├── chat_general: { foto: base64 }
    │   └── ...
    │
    ├── chat/                          (Collection - Real-time)
    │   ├── msg1: { senderId, senderName, text, timestamp, receiverId }
    │   ├── msg2: { ... }
    │   └── msgN: { ... }
    │
    └── historial_notificaciones/      (Collection)
        ├── notif1: { id, type, message, timestamp, severity }
        ├── notif2: { ... }
        └── notifN: { ... }
```

---

## 🔐 Reglas de Seguridad Firebase

```javascript
// firestore.rules (recomendado)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer/escribir
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## ⚡ Debouncing y Performance

### ¿Por qué 2 segundos?

```
User Action Timeline:
─────────────────────

0ms:    User crea registro
        → setRecords() se ejecuta
        → useEffect trigger (pero espera)

2000ms: timeout termina
        → syncTodosRegistros() se ejecuta
        → Guarda en Firebase

Ventaja: Si user crea 5 records en 2 segundos,
         solo guardamos 1 vez (no 5 veces)
         
         Evita: - Spam en Firebase
                - Cuota alcanzada
                - Sincronización lenta
```

### AutoSyncManager (para casos especiales)

```typescript
const syncManager = new AutoSyncManager(2000); // 2 segundo debounce

// Uso
await syncManager.sync(records, 'registros');

// O forzar sincronización inmediata
await syncManager.syncNow(records, 'registros');

// O cancelar operación pendiente
syncManager.cancel();
```

---

## 🧪 Testing de Sincronización

### Test Unit: Verificar cargarTodosDatos()

```typescript
import { cargarTodosDatos } from './services/syncService';

test('cargarTodosDatos debe retornar objeto con datos', async () => {
  const resultado = await cargarTodosDatos();
  
  expect(resultado).toHaveProperty('registros');
  expect(resultado).toHaveProperty('tareas');
  expect(resultado).toHaveProperty('usuarios');
  expect(resultado).toHaveProperty('configuracion');
  expect(resultado).toHaveProperty('notificaciones');
  
  expect(Array.isArray(resultado.registros)).toBe(true);
});
```

### Test Manual: Verificar sincronización

```typescript
// En consola del navegador (F12)
const { cargarTodosDatos } = window.__app__;

// Ver logs de sincronización
await cargarTodosDatos();
// Output:
// 📥 Iniciando carga completa de datos...
// ✅ Datos cargados: { registros: 10, tareas: 5, usuarios: 2, ... }
```

---

## 🐛 Debugging

### Habilitar logs en consola

```typescript
// services/syncService.ts
console.log('📥 Iniciando carga completa de datos...');
console.log('✅ Registros cargados:', registros.length);
console.log('✅ Tarea guardada:', tarea.id);
```

### Ver en DevTools

```
F12 → Console

✅ Registros cargados: 15
✅ Tareas cargadas: 8
✅ Usuarios cargados: 3
✅ Configuración cargada
✅ Sincronización completada exitosamente

// Si hay error:
❌ Error cargando datos: [error details]
```

---

## 🔧 Mantenimiento

### Limpiar datos viejos

```typescript
// En services/firestore.ts
export async function limpiarDatosAntiguos(diasAntiguos: number) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - diasAntiguos);
  
  const q = query(
    collection(db, 'inventario'),
    where('date', '<', fecha.toISOString().split('T')[0])
  );
  
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  
  snap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}
```

### Monitorear cuota

```typescript
// Revisar en Firebase Console:
// 1. Firestore Database → Usage
// 2. Ver: Read ops, Write ops, Delete ops
// 3. Si se acerca al límite, optimizar queries
```

---

## 🚨 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `undefined is not a function` | syncService no importado | `import { cargarTodosDatos } from './services/syncService'` |
| `Firebase not initialized` | Firebase config inválida | Verificar `.env` con claves correctas |
| `Permission denied` | Usuario no autenticado | Verificar que usuario está loginado |
| `Slow synchronization` | Conexión lenta | Aumentar delay: `setTimeout(fn, 5000)` |
| `Datos duplicados` | Múltiples sincronizaciones | Verificar que `useEffect[]` no se repite |

---

## 📊 Optimizaciones Futuras

```typescript
// 1. Sincronización Selectiva
syncManager.syncOnly(records, {
  excludeFields: ['timestamp'], // No sincronizar cambios de timestamp
})

// 2. Compress datos antes de enviar
const compressedData = compress(records);
await syncTodosRegistros(compressedData);

// 3. Batch writes para multi-updates
const batch = writeBatch(db);
records.forEach(r => {
  batch.set(doc(db, 'inventario', r.id), r);
});
await batch.commit();

// 4. Index Firestore para queries rápidas
// Crear índice: date, productName (ascending)
```

---

## ✅ Checklist de Verify

- [ ] `.env` tiene credenciales de Firebase
- [ ] `syncService.ts` existe en `/services`
- [ ] `App.tsx` importa `cargarTodosDatos`
- [ ] useEffect de carga datos (sin dependencies)
- [ ] useEffect auto-sync para cada tipo (with [records], [tasks], etc)
- [ ] handleAddRecord llama a guardarRegistro o setRecords
- [ ] handleAddTask llama a guardarTareaNube o setTasks
- [ ] Console no muestra errores (F12)
- [ ] Datos persisten después de cerrar/abrir app
- [ ] Prueba multi-dispositivo funciona

---

**Documentación Técnica v1.0 - Febrero 2026**
