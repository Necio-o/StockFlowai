import DOMPurify from 'dompurify';

/**
 * SERVICIO DE SEGURIDAD PARA STOCKFLOW AI
 * Maneja encriptación, validación y sanitización
 */

// ============== VALIDACIÓN DE INPUTS ==============
/**
 * Sanitiza strings para prevenir XSS
 */
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

/**
 * Valida una contraseña según reglas de seguridad
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }

  if (!/[!@#$%^&*()_+-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial (!@#$%^&*...)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida un email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida un username
 */
export const validateUsername = (username: string): boolean => {
  // Solo alfanuméricos, guiones y guiones bajos, entre 3-20 caracteres
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Detecta y previene inyección SQL básica
 */
export const preventSQLInjection = (input: string): string => {
  const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 'UNION', 'EXEC'];
  let result = input;
  
  dangerous.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    result = result.replace(regex, '');
  });
  
  return result;
};

// ============== HASH DE CONTRASEÑAS ==============
/**
 * Para producción: Usar bcryptjs (backend solamente)
 * Para desarrollo: Versión simplificada
 */

export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Intentar usar bcryptjs si está disponible
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (e) {
    // Fallback simple (NO usar en producción)
    console.warn('⚠️ Usando hash simple. Para producción usa bcryptjs en el servidor.');
    return btoa(password); // Base64 encoding (no es seguro, solo para desarrollo)
  }
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(password, hash);
  } catch (e) {
    // Fallback simple
    return btoa(password) === hash;
  }
};

// ============== ENCRIPTACIÓN SIMPLE ==============
/**
 * Encriptación básica (para valores no críticos)
 * Para datos sensibles: usar TweetNaCl.js o libsodium
 */
export const encryptSimple = (text: string, key: string = 'stockflow-default-key'): string => {
  try {
    const encoded = new TextEncoder().encode(text);
    const keyEncoded = new TextEncoder().encode(key);
    
    // Simple XOR cipher (NO usar para datos críticos)
    const encrypted = Array.from(encoded).map((byte, i) => 
      byte ^ keyEncoded[i % keyEncoded.length]
    );
    
    return btoa(String.fromCharCode(...encrypted));
  } catch (e) {
    console.error('Error en encriptación:', e);
    return text;
  }
};

export const decryptSimple = (encryptedText: string, key: string = 'stockflow-default-key'): string => {
  try {
    const decoded = atob(encryptedText);
    const keyEncoded = new TextEncoder().encode(key);
    
    const decrypted = Array.from(decoded).map((char, i) => 
      char.charCodeAt(0) ^ keyEncoded[i % keyEncoded.length]
    );
    
    return String.fromCharCode(...decrypted);
  } catch (e) {
    console.error('Error en desencriptación:', e);
    return encryptedText;
  }
};

// ============== RATE LIMITING ==============
/**
 * Rate limiter en memoria (para cliente)
 * Para servidor: usar express-rate-limit
 */
class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  private maxAttempts = 5;
  private lockoutMinutes = 15;

  isLocked(key: string): boolean {
    const record = this.attempts.get(key);
    if (!record) return false;

    const now = Date.now();
    const lockoutTime = this.lockoutMinutes * 60 * 1000;

    if (now - record.timestamp > lockoutTime) {
      this.attempts.delete(key);
      return false;
    }

    return record.count >= this.maxAttempts;
  }

  recordAttempt(key: string): void {
    const record = this.attempts.get(key) || { count: 0, timestamp: Date.now() };

    if (Date.now() - record.timestamp > this.lockoutMinutes * 60 * 1000) {
      record.count = 1;
      record.timestamp = Date.now();
    } else {
      record.count++;
    }

    this.attempts.set(key, record);
  }

  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return this.maxAttempts;

    const remaining = this.maxAttempts - record.count;
    return Math.max(0, remaining);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  setConfig(maxAttempts: number, lockoutMinutes: number): void {
    this.maxAttempts = maxAttempts;
    this.lockoutMinutes = lockoutMinutes;
  }
}

export const loginRateLimiter = new RateLimiter();

// ============== VALIDACIÓN DE ARCHIVOS ==============
/**
 * Valida archivos subidos
 */
export const validateFileUpload = (
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): { valid: boolean; error?: string } => {
  
  // Verificar tamaño
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Archivo excede ${maxSizeMB}MB` };
  }

  // Verificar tipo MIME
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Tipo de archivo no permitido: ${file.type}` };
  }

  // Verificar extensión (adicional)
  const validExtensions = allowedTypes.map(type => type.split('/')[1]);
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!validExtensions.includes(fileExtension)) {
    return { valid: false, error: `Extensión no válida: .${fileExtension}` };
  }

  return { valid: true };
};

/**
 * Comprime y valida imágenes
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/webp',
          quality
        );
      };
    };

    reader.readAsDataURL(file);
  });
};

// ============== LOGGING SEGURO ==============
/**
 * Log de eventos de seguridad (sin datos sensibles)
 */
export const logSecurityEvent = (
  eventType: 'LOGIN_ATTEMPT' | 'LOGIN_FAILURE' | 'FILE_UPLOAD' | 'DATA_ACCESS' | 'SUSPICIOUS_ACTIVITY',
  userId: string,
  details?: Record<string, any>
): void => {
  const timestamp = new Date().toISOString();
  const sanitizedDetails = details ? JSON.parse(JSON.stringify(details)) : {};

  // NO loguear contraseñas ni datos sensibles
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  delete sanitizedDetails.apiKey;

  console.log(`[${timestamp}] ${eventType} - User: ${userId}`, sanitizedDetails);

  // En producción: enviar a servicio de logging (Sentry, LogRocket, etc.)
};

export default {
  sanitizeInput,
  validatePassword,
  validateEmail,
  validateUsername,
  preventSQLInjection,
  hashPassword,
  comparePassword,
  encryptSimple,
  decryptSimple,
  loginRateLimiter,
  validateFileUpload,
  compressImage,
  logSecurityEvent
};
