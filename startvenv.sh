#!/bin/bash

echo "=== Ollama Web Chat Setup ==="

# Проверка Python
if ! command -v python3 &> /dev/null; then
  echo "Python3 не найден. Установите Python 3.10+ вручную и повторите запуск."
  exit 1
fi

# Создание виртуального окружения
echo "Создание виртуального окружения..."
python3 -m venv venv
source venv/bin/activate

# Установка pip и обновление
echo "Обновление pip..."
python -m pip install --upgrade pip

# Установка зависимостей backend
echo "Установка зависимостей backend..."
cd backend || { echo "Папка backend не найдена"; exit 1; }

if [ ! -f "requirements.txt" ]; then
  echo "Создание requirements.txt..."
  cat <<EOF > requirements.txt
fastapi
uvicorn
sqlmodel
httpx
EOF
fi

pip install -r requirements.txt || { echo "Ошибка установки зависимостей"; exit 1; }

# Запуск Ollama
if ! pgrep -x "ollama" > /dev/null; then
  echo "Запуск Ollama..."
  ollama serve > /dev/null 2>&1 &
  sleep 2
else
  echo "Ollama уже запущен."
fi

# Запуск backend
echo "Запуск backend..."
uvicorn app:app --reload --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
cd ..

# Установка и запуск frontend
echo "Настройка frontend..."
cd frontend || { echo "Папка frontend не найдена"; exit 1; }

if ! command -v npm &> /dev/null; then
  echo "npm не найден. Установите Node.js и npm вручную."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Установка зависимостей frontend..."
  npm install || { echo "Ошибка установки npm-зависимостей"; exit 1; }
fi

echo "Запуск frontend..."
npm run dev
