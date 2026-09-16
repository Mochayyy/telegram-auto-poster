@echo off
cd /d D:\MOCHAY\TELEGRAM-AUTO-POSTER
call .venv\Scripts\activate.bat
python scheduler\worker.py
