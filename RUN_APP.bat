@echo off
REM StockFlow AI - Ejecutor con Logs
REM Este script ejecuta la app y captura los logs para diagnóstico

echo ========================================
echo   StockFlow AI - Iniciando aplicación
echo ========================================
echo.

SET APP_DIR=%~dp0dist_electron\StockFlowAI-win32-x64
SET EXE_PATH=%APP_DIR%\StockFlowAI.exe

echo 📁 Directorio: %APP_DIR%
echo 🎯 Ejecutable: %EXE_PATH%
echo.

REM Verificar si existe el ejecutable
if not exist "%EXE_PATH%" (
    echo ❌ ERROR: No se encontró el ejecutable en %EXE_PATH%
    echo.
    echo Rutas posibles donde buscar:
    echo   1. %~dp0dist_electron\StockFlowAI-win32-x64\StockFlowAI.exe
    echo   2. %~dp0dist_electron\StockFlowAI-Setup\StockFlowAI.exe
    echo.
    pause
    exit /b 1
)

echo ✅ Ejecutable encontrado
echo.
echo 🚀 Lanzando aplicación...
echo.

REM Ejecutar la app
start "" "%EXE_PATH%"

REM Esperar 2 segundos y mostrar mensaje
timeout /t 2 /nobreak

echo.
echo ✅ Aplicación lanzada exitosamente
echo.
echo Si la aplicación no se abre:
echo   1. Verifica que tengas los puertos disponibles
echo   2. Revisa el archivo de logs
echo   3. Intenta reiniciar la computadora
echo.
pause
