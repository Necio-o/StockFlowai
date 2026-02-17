# 🚀 StockFlow AI - Guía de Uso

## ✅ Verificación de Diagnóstico

Todos los componentes están correctamente configurados:
- ✅ Ejecutable StockFlowAI.exe 
- ✅ Archivos de interfaz (dist)
- ✅ Node.js y NPM instalados
- ✅ Puerto 3001 disponible
- ✅ main.cjs configurado

---

## 📱 CÓMO EJECUTAR LA APLICACIÓN

### **Opción 1: Desde el Escritorio (Recomendado)**
1. Busca el icono **"StockFlow AI"** en tu escritorio
2. **Haz doble clic** → La app se abrirá automáticamente

### **Opción 2: Usando el Script RUN_APP.bat**
1. Abre la carpeta: `C:\Users\sanch\Downloads\stockflowai`
2. Haz doble clic en **RUN_APP.bat**
3. Se abrirá la aplicación

### **Opción 3: Desde la Terminal**
```bash
cd C:\Users\sanch\Downloads\stockflowai
.\dist_electron\StockFlowAI-win32-x64\StockFlowAI.exe
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### ❌ La app no abre / muestra pantalla negra

**Solución:**
```bash
# 1. Recompila los archivos
npm run build

# 2. Recompila el ejecutable
npx electron-packager . StockFlowAI --platform=win32 --arch=x64 --out=dist_electron --icon=public/icon.ico --overwrite --asar=false

# 3. Intenta ejecutar nuevamente
.\dist_electron\StockFlowAI-win32-x64\StockFlowAI.exe
```

### ❌ "No se encontró index.html"

**Solución:** El dist folder no está compilado
```bash
npm run build
```

### ❌ El puerto 3001 está en uso

**Solución:** Otro programa está usando ese puerto
```bash
# En PowerShell (como Admin):
Get-Process | Where-Object {$_.Handles -like "*3001*"} | Stop-Process
```

---

## 📝 INFORMACIÓN DE LA APLICACIÓN

### Credenciales por Defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |
| operador | user123 | Operador |

⚠️ **IMPORTANTE:** Cambiar estas contraseñas en producción

### Características Disponibles

✅ Gestión de inventario  
✅ Detección de anomalías  
✅ Análisis de estadísticas  
✅ Chat integrado con fotos  
✅ Exportación a Excel/PDF  
✅ Sincronización con Google Drive  
✅ Panel administrativo  

---

## 🔄 MANTENER LA APLICACIÓN

### Después de hacer cambios en el código

```bash
# 1. Compilar cambios
npm run build

# 2. Recompilar ejecutable
npx electron-packager . StockFlowAI --platform=win32 --arch=x64 --out=dist_electron --icon=public/icon.ico --overwrite --asar=false

# 3. El nuevo .exe está en:
# dist_electron/StockFlowAI-win32-x64/StockFlowAI.exe
```

### Actualizar acceso directo del escritorio

Si la ruta del ejecutable cambia, ejecuta en la carpeta del proyecto:
```bash
pwsh -Command "$desktopPath = [Environment]::GetFolderPath('Desktop'); $exePath = (Resolve-Path 'dist_electron\StockFlowAI-win32-x64\StockFlowAI.exe').Path; $shortcutPath = '$desktopPath\StockFlow AI.lnk'; $WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortCut($shortcutPath); $Shortcut.TargetPath = $exePath; $Shortcut.IconLocation = '$exePath,0'; $Shortcut.Save()"
```

---

## 📦 DISTRIBUIR A OTROS USUARIOS

### Opción A: Carpeta Completa (Recomendado)
1. Comprime la carpeta: `dist_electron/StockFlowAI-win32-x64`
2. Envía el archivo `.zip` a otros usuarios
3. Ellos extraen la carpeta y ejecutan `StockFlowAI.exe`

### Opción B: Solo el Ejecutable (203 MB)
1. En otros equipos solo necesitan:
   ```
   dist_electron/StockFlowAI-win32-x64/
   ├── StockFlowAI.exe (el archivo principal)
   ├── resources/
   └── [otros archivos necesarios]
   ```

### Opción C: Crear un Instalador (Avanzado)
Ver archivo: `SECURITY_IMPLEMENTATION.md` para instrucciones de NSIS

---

## 🔐 SEGURIDAD

### Variables de Entorno (.env)

Las credenciales de Firebase NO deben estar en el código. Están en `.env`:

```bash
# Copiar template
cp .env.example .env

# Editar con tus credenciales
# (Asegúrate de que .env esté en .gitignore)
```

### Rate Limiting

- ✅ Protección contra fuerza bruta automática
- ✅ Máximo 5 intentos de login por usuario
- ✅ Bloqueo de 15 minutos tras fallos

---

## 📞 SUPPORT

Si algo no funciona:

1. **Verifica el diagnóstico:**
   ```bash
   DIAGNOSTIC.bat
   ```

2. **Revisa los logs en consola** (F12 para dev tools en la app)

3. **Recompila todo:**
   ```bash
   npm install
   npm run build
   npx electron-packager . StockFlowAI --platform=win32 --arch=x64 --out=dist_electron --icon=public/icon.ico --overwrite --asar=false
   ```

4. **Reinicia la computadora** (a veces ayuda)

---

## ✨ Mejoras Disponibles

Ver archivo: `IMPROVEMENTS_ROADMAP.md` para:
- 📊 Dashboard Ejecutivo
- 🔔 Sistema de Alertas
- 🤖 Predicción con IA
- 📋 Auditoría de Cambios
- 📱 Modo Offline

---

**Última actualización:** 16 de Febrero 2026  
**Versión:** 1.0.0
