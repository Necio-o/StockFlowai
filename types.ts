
export interface DailyRecord {
  id: string;
  date: string;
  timestamp: string;
  productName: string;
  ingressQty: number;
  usageQty: number;
}

export interface Recordatorio {
  id: string;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  leido: boolean;
  tipo: 'tarea' | 'reunion';
}

export interface Anomaly {
  recordId: string;
  type: 'DEVIATION_HIGH' | 'DEVIATION_LOW' | 'MISMATCH_INGRESS_USAGE';
  severity: 'warning' | 'critical';
  message: string;
  details: string;
}

export interface ProductStats {
  productName: string;
  averageIngress: number;
  averageUsage: number;
  totalRecords: number;
  standardDeviation: number;
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;
  username: string;
  password?: string; // Optional for session object, required for storage
  role: UserRole;
  name: string;
  // New Profile Fields
  nickname?: string;
  avatar?: string; // Base64 string for the image
  description?: string;
  jobTitle?: string;
}

export interface ProductSettings {
  targetAverage: number | null; // If null, use calculated average
  tolerancePercent: number; // e.g., 20 for 20%
}

export interface SettingsMap {
  [productName: string]: ProductSettings;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  // --- CAMPOS PARA RECORDATORIOS ---
  reminderTime?: string;
  reminderSent?: boolean;
}
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  text: string;
  timestamp: any;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}