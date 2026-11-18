@echo off
chcp 65001 >nul
title Desinstalar FitWe Bridge
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\uninstall.ps1" %*
echo.
pause
