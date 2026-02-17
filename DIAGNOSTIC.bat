@echo off
REM StockFlow AI - Script de Diagnóstico
REM Verifica que todo esté configurado correctamente

setlocal enabledelayedexpansion

echo ========================================
echo   StockFlow AI - Diagnóstico del Sistema
echo ========================================
echo.

REM 1. Verificar estructura de carpetas
echo [1/5] Verificando estructura de carpetas...
if exist "dist_electron\StockFlowAI-win32-x64" (
    echo ✅ Carpeta dist_electron encontrada
) else (
    echo ❌ Carpeta dist_electron NO encontrada
)

if exist "dist\index.html" (
    echo ✅ dist\index.html encontrado
) else (
    echo ⚠️  dist\index.html NO encontrado (necesario compilar)
)

if exist "main.cjs" (
    echo ✅ main.cjs encontrado
) else (
    echo ❌ main.cjs NO encontrado
)

echo.

REM 2. Verificar Node y npm
echo [2/5] Verificando Node.js y NPM...
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i
) else (
    echo ❌ Node.js NO instalado
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do echo ✅ NPM: %%i
) else (
    echo ❌ NPM NO instalado
)

echo.

REM 3. Verificar ejecutable
echo [3/5] Verificando ejecutable...
if exist "dist_electron\StockFlowAI-win32-x64\StockFlowAI.exe" (
    echo ✅ StockFlowAI.exe encontrado
    for /f %%A in ('dir /b dist_electron\StockFlowAI-win32-x64\StockFlowAI.exe') do (
        echo   Tamaño obtenido correctamente
    )
) else (
    echo ❌ StockFlowAI.exe NO encontrado - Necesita recompilar
)

echo.

REM 4. Verificar puerto disponible (3001)
echo [4/5] Verificando puerto 3001...
netstat -ano | findstr :3001 >nul 2>nul
if %errorlevel% equ 0 (
    echo ⚠️  Puerto 3001 está en uso (puede ocasionar conflictos)
) else (
    echo ✅ Puerto 3001 disponible
)

echo.

REM 5. Resumen y recomendaciones
echo [5/5] Resumen:
echo.
echo ========================================
echo   Recomendaciones:
echo ========================================
echo.
echo Para USAR la aplicación:
echo   1. Haz doble clic en el acceso directo "StockFlow AI" en el escritorio
echo   2. O ejecuta: RUN_APP.bat en esta carpeta
echo.
echo Para RECOMPILAR si hay cambios:
echo   1. npm run build          (compila UI)
echo   2. npx electron-packager . StockFlowAI --platform=win32 --arch=x64 --out=dist_electron --icon=public/icon.ico --overwrite --asar=false
echo.
echo Archivos de interés:
echo   - main.cjs              (configuración de Electron)
echo   - vite.config.ts        (configuración de compilación)
echo   - package.json          (dependencias)
echo   - RUN_APP.bat           (ejecutar la app con logs)
echo.
pause
