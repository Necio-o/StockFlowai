import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  terminate,
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  where 
} from "firebase/firestore";
import { DailyRecord, UserProfile, Recordatorio, Task, Message } from "../types";

// ✅ IMPORTAR LA INSTANCIA CONFIGURADA DE FIREBASE DESDE firebase-config.js
import { db as firebaseDb } from "../firebase-config";

// Usar la instancia de Firebase ya configurada
export const db = firebaseDb;

// 1. Enviar Mensaje con Foto de Perfil
export async function enviarMensajeNube(
  texto: string, 
  usuario: UserProfile, 
  receiverId: string = 'general',
  file?: { url: string, name: string, type: string }
) {
  await addDoc(collection(db, "chat"), {
    senderId: usuario.id,
    senderName: usuario.nickname || usuario.name,
    senderAvatar: usuario.avatar || null,
    text: texto,
    receiverId: receiverId,
    timestamp: serverTimestamp(),
    fileUrl: file?.url || null,
    fileName: file?.name || null,
    fileType: file?.type || null
  });
}

// 2. Escuchar Chat (Corregido para que siempre se vean)
export function escucharChat(myId: string, receiverId: string, callback: (mensajes: Message[]) => void) {
  const chatRef = collection(db, "chat");
  const q = query(chatRef, orderBy("timestamp", "asc"), limit(100));

  return onSnapshot(q, (snapshot) => {
    const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
    
    const filtrados = todos.filter(m => {
      if (receiverId === 'general') {
        return m.receiverId === 'general';
      } else {
        // Mensajes entre tú y la otra persona
        return (m.senderId === myId && m.receiverId === receiverId) || 
        (m.senderId === receiverId && m.receiverId === myId);
      }
    });
    callback(filtrados);
  });
}

// 3. Gestionar Foto del Chat General
export async function guardarFotoGeneral(fotoBase64: string) {
  await setDoc(doc(db, "configuracion", "chat_general"), { foto: fotoBase64 });
}

export async function obtenerFotoGeneral() {
  const docSnap = await getDoc(doc(db, "configuracion", "chat_general"));
  return docSnap.exists() ? docSnap.data().foto : null;
}

// Guardar registro usando setDoc para evitar duplicados
export async function guardarRegistro(data: any) {
  try {
    const limpio = JSON.parse(JSON.stringify(data));
    const registroId = limpio.id || `reg-${Date.now()}`;
    await setDoc(doc(db, "inventario", registroId), {
      ...limpio,
      id: registroId,
      fechaGuardado: new Date().toISOString(),
    });
    return registroId;
  } catch (e) {
    console.error("Error en nube:", e);
    throw e;
  }
}

// Eliminar registro de la nube
export async function eliminarRegistroNube(id: string) {
  try {
    await deleteDoc(doc(db, "inventario", id));
    console.log("Registro eliminado de la nube ✅");
  } catch (e) {
    console.error("Error eliminando registro:", e);
    throw e;
  }
}

// OPTIMIZADO: Carga solo últimos 30 días (no toda la historia)
export async function obtenerRegistros(diasAtras: number = 30) {
  try {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - diasAtras);
    
    const q = query(
      collection(db, "inventario"),
      where("date", ">=", hace30Dias.toISOString().split('T')[0]),
      orderBy("date", "desc"),
      limit(1000)
    );
    
    const querySnapshot = await getDocs(q);
    const registros = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as DailyRecord[];
    console.log(`✅ ${registros.length} registros cargados (últimos ${diasAtras} días)`);
    return registros;
  } catch (e) { 
    console.warn("No se pudo aplicar filtro de fecha, cargando todos:", e);
    // Fallback a carga simple si falla el filtro
    try {
      const querySnapshot = await getDocs(collection(db, "inventario"));
      const registros = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as DailyRecord[];
      return registros.slice(0, 1000); // Máximo 1000
    } catch { return []; }
  }
}

// 2. GESTIÓN DE USUARIOS
export async function obtenerUsuarios() {
  try {
    const querySnapshot = await getDocs(collection(db, "usuarios"));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as UserProfile[];
  } catch (e) {
    console.error("Error obteniendo usuarios:", e);
    return [];
  }
}

export async function guardarUsuarioNube(user: UserProfile) {
  try {
    const userRef = doc(db, "usuarios", user.id);
    const limpio = JSON.parse(JSON.stringify(user));
    await setDoc(userRef, limpio, { merge: true });
    console.log("Usuario sincronizado ✅");
  } catch (e) {
    console.error("Error guardando usuario:", e);
    throw e;
  }
}

export async function eliminarUsuarioNube(userId: string) {
  try {
    const userRef = doc(db, "usuarios", userId);
    await deleteDoc(userRef);
    console.log("Usuario eliminado de la nube ✅");
  } catch (e) {
    console.error("Error eliminando:", e);
    throw e;
  }
}

// 3. CONFIGURACIÓN GENERAL
export async function guardarConfiguracionGeneral(config: any) {
  try {
    await setDoc(doc(db, "configuracion", "global"), config);
  } catch (e) { console.error(e); }
}

export async function obtenerConfiguracionGeneral() {
  try {
    const docSnap = await getDoc(doc(db, "configuracion", "global"));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) { return null; }
}

// --- GESTIÓN DE RECORDATORIOS ---
export async function guardarRecordatorio(data: Recordatorio) {
  const ref = doc(db, "recordatorios", data.id);
  await setDoc(ref, data);
}

export async function obtenerRecordatorios() {
  const querySnapshot = await getDocs(collection(db, "recordatorios"));
  return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Recordatorio[];
}

export async function eliminarRecordatorio(id: string) {
  await deleteDoc(doc(db, "recordatorios", id));
}
// --- 1. GESTIÓN DE TAREAS EN LA NUBE ---
export async function guardarTareaNube(task: Task) {
  await setDoc(doc(db, "tareas", task.id), task);
}

export async function obtenerTareasNube() {
  const snapshot = await getDocs(collection(db, "tareas"));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id })) as Task[];
}

export async function eliminarTareaNube(id: string) {
  await deleteDoc(doc(db, "tareas", id));
}

// --- 2. GESTIÓN DE NOTIFICACIONES (HISTORIAL) ---
export async function guardarNotificacionNube(note: any) {
  // Guardamos cada aviso con su ID para el historial
  await setDoc(doc(db, "historial_notificaciones", note.id), note);
}

// OPTIMIZADO: Carga solo últimas 100 notificaciones (no todo el historial)
export async function obtenerNotificacionesNube() {
  try {
    const q = query(
      collection(db, "historial_notificaciones"),
      orderBy("timestamp", "desc"),
      limit(100) // Máximo 100 - OPTIMIZADO!
    );
    const snapshot = await getDocs(q);
    const notificaciones = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
      };
    });
    console.log(`✅ ${notificaciones.length} notificaciones cargadas (últimas 100)`);
    return notificaciones;
  } catch (e) {
    console.warn("Error cargando notificaciones:", e);
    return [];
  }
}

export async function limpiarNotificacionesNube() {
  const snapshot = await getDocs(collection(db, "historial_notificaciones"));
  const promesas = snapshot.docs.map(d => deleteDoc(d.ref));
  await Promise.all(promesas);
}