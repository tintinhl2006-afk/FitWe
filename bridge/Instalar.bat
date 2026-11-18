@echo off
chcp 65001 >nul
title Instalador de FitWe Bridge
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\install.ps1" %*
echo.
pause
