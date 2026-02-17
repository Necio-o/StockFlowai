// Declarar el type de window.electronAPI
declare global {
  interface Window {
    electronAPI?: {
      createDesktopShortcut: () => Promise<{ success: boolean; message?: string; error?: string }>;
    };
  }
}

export async function createDesktopShortcut(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!window.electronAPI?.createDesktopShortcut) {
      return { 
        success: false, 
        error: 'La API de Electron no está disponible. Esta función solo funciona en la versión de escritorio.' 
      };
    }

    const result = await window.electronAPI.createDesktopShortcut();
    return result;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al crear el acceso directo' 
    };
  }
}
