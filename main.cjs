const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "StockFlow AI",
    icon: path.join(__dirname, 'public/icon.ico'), 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
  });
  
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('[DEV MODE] Loading from localhost:3001');
    win.loadURL('http://localhost:3001');
  } else {
    console.log('[PRODUCTION MODE] Loading from dist/');
    
    // En producción, usar file:// protocol de forma segura
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
    console.log(`Cargando: ${fileUrl}`);
    
    if (fs.existsSync(indexPath)) {
      win.loadURL(fileUrl);
    } else {
      console.error(`❌ No se encontró ${indexPath}`);
      win.loadURL(`file://${path.join(__dirname, 'index.html').replace(/\\/g, '/')}`);
    }
  }
  
  win.setMenuBarVisibility(false);
  
  // Mostrar errores en consola
  win.webContents.on('crashed', () => {
    console.error('La ventana colapsó');
  });

  return win;
}

// Función para obtener la ruta REAL del escritorio (soporta OneDrive y español)
function getDesktopPath() {
  try {
    // Método más confiable: usar PowerShell para obtener la ruta real
    const result = execSync(
      'powershell -NoProfile -Command "[Environment]::GetFolderPath(\'Desktop\')"',
      { encoding: 'utf8', stdio: 'pipe', windowsHide: true }
    ).trim();
    
    if (result && fs.existsSync(result)) {
      console.log('📂 Escritorio detectado (Environment):', result);
      return result;
    }
  } catch (e) {
    console.warn('⚠️  No se pudo detectar escritorio con Environment:', e.message);
  }

  // Fallback: buscar rutas comunes
  const home = os.homedir();
  const possiblePaths = [
    path.join(home, 'OneDrive', 'Escritorio'),
    path.join(home, 'OneDrive', 'Desktop'),
    path.join(home, 'OneDrive - Personal', 'Escritorio'),
    path.join(home, 'OneDrive - Personal', 'Desktop'),
    path.join(home, 'Escritorio'),
    path.join(home, 'Desktop'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log('📂 Escritorio detectado (fallback):', p);
      return p;
    }
  }

  // Último recurso
  console.warn('⚠️  No se encontró escritorio, usando homedir/Desktop');
  return path.join(home, 'Desktop');
}

// Función para crear acceso directo en el escritorio
async function createDesktopShortcutWindows() {
  try {
    console.log('📌 Iniciando creación de acceso directo...');
    
    if (process.platform !== 'win32') {
      return { success: false, error: 'Solo disponible en Windows' };
    }

    const desktop = getDesktopPath();
    const exePath = process.execPath;
    const appName = 'StockFlow AI';
    const shortcutPath = path.join(desktop, `${appName}.lnk`);
    const iconPath = path.join(__dirname, 'public', 'icon.ico');
    const appPath = path.dirname(exePath);

    console.log('📋 Rutas para el acceso directo:');
    console.log('   Escritorio:', desktop);
    console.log('   Acceso directo:', shortcutPath);
    console.log('   Ejecutable:', exePath);
    console.log('   Icono:', iconPath);

    // Eliminar acceso directo si ya existe
    if (fs.existsSync(shortcutPath)) {
      console.log('ℹ️  Eliminando acceso directo existente...');
      try { fs.unlinkSync(shortcutPath); } catch (e) {}
    }

    // Crear acceso directo usando PowerShell inline (método probado)
    const psCmd = `powershell -NoProfile -Command "$WshShell = New-Object -ComObject WScript.Shell; $lnk = $WshShell.CreateShortcut('${shortcutPath}'); $lnk.TargetPath = '${exePath}'; $lnk.WorkingDirectory = '${appPath}'; $lnk.IconLocation = '${iconPath}'; $lnk.Description = 'StockFlow AI'; $lnk.Save()"`;

    console.log('⚙️  Ejecutando comando PowerShell...');
    execSync(psCmd, {
      encoding: 'utf8',
      stdio: 'pipe',
      windowsHide: true
    });

    // Verificar
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (fs.existsSync(shortcutPath)) {
      console.log('✅ Acceso directo creado exitosamente en:', shortcutPath);
      return { success: true, message: 'Acceso directo creado en el escritorio' };
    } else {
      console.error('❌ El archivo .lnk no se creó');
      return { success: false, error: 'El acceso directo no se generó. Verifica permisos.' };
    }
  } catch (error) {
    console.error('❌ Error al crear acceso directo:', error.message);
    return { success: false, error: error.message };
  }
}

// Función para verificar si ya se preguntó sobre el acceso directo
function shouldAskForShortcut() {
  try {
    const configPath = path.join(app.getPath('userData'), 'shortcut_asked.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const asked = config.askedForShortcut === true;
      console.log(`📋 Acceso directo preguntado antes: ${asked}`);
      return !asked;
    }
    console.log('📋 Primera ejecución detectada');
    return true;
  } catch (e) {
    console.log('⚠️  Error leyendo config, asumiendo primera ejecución');
    return true;
  }
}

// Función para marcar que ya se preguntó
function markShortcutAsked() {
  try {
    const configPath = path.join(app.getPath('userData'), 'shortcut_asked.json');
    const dir = path.dirname(configPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const config = { askedForShortcut: true, timestamp: new Date().toISOString() };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Marcado como preguntado');
  } catch (e) {
    console.error('❌ Error marcando como preguntado:', e.message);
  }
}

// IPC Handler para crear acceso directo en el escritorio (llamado desde la app)
ipcMain.handle('create-desktop-shortcut', async () => {
  return createDesktopShortcutWindows();
});

app.whenReady().then(async () => {
  console.log('🚀 Aplicación iniciando...');
  const win = createWindow();

  // En desarrollo, mostrar DevTools si es necesario
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Modo desarrollo habilitado');
  }

  // Esperar a que la ventana esté lista
  win.webContents.once('did-finish-load', async () => {
    console.log('✅ Ventana cargada correctamente');

    // Preguntar sobre acceso directo solo si no se ha preguntado antes
    if (shouldAskForShortcut()) {
      setTimeout(async () => {
        try {
          const response = await dialog.showMessageBox(win, {
            type: 'question',
            title: 'Crear acceso directo',
            message: '¿Deseas crear un acceso directo de StockFlow AI en el escritorio?',
            detail: 'Podrás abrir la aplicación directamente desde tu escritorio.',
            buttons: ['Sí, crear acceso directo', 'No, gracias'],
            defaultId: 0,
            cancelId: 1
          });

          if (response.response === 0) {
            const result = await createDesktopShortcutWindows();
            if (result.success) {
              dialog.showMessageBox(win, {
                type: 'info',
                title: 'Éxito',
                message: '✅ Acceso directo creado en el escritorio correctamente.'
              });
            } else {
              dialog.showMessageBox(win, {
                type: 'warning',
                title: 'Aviso',
                message: 'No se pudo crear el acceso directo.',
                detail: result.error || 'Intenta usar el botón "Escritorio" dentro de la aplicación.'
              });
            }
          }
          markShortcutAsked();
        } catch (err) {
          console.error('Error en diálogo:', err.message);
          markShortcutAsked();
        }
      }, 1500);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});