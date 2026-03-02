// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// highlight.js темы
import 'highlight.js/styles/github.css'         // светлая
import 'highlight.js/styles/github-dark.css'    // тёмная

const SETTINGS_KEY = 'app_settings_v1'

// Применение темы к <html>
function applyThemeFromStorage() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        const theme = parsed?.theme === 'light' ? 'light' : 'dark'

        document.documentElement.classList.remove('theme-light', 'theme-dark')
        document.documentElement.classList.add(`theme-${theme}`)
    } catch (e) {
        console.warn('Ошибка применения темы:', e)
    }
}

applyThemeFromStorage()

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)


