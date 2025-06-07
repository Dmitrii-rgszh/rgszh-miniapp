@echo off
echo Starting the services...

rem Задержка перед запуском, чтобы убедиться, что процесс будет запущен
timeout /t 5 /nobreak

rem Запуск cloudflared tunnel с правильной командой
cd C:\Users\shapeless\Desktop\miniapp
start cloudflared tunnel run

rem Запуск Flask-сервера
cd C:\Users\shapeless\Desktop\miniapp
start python server.py

echo Services started successfully!
pause
