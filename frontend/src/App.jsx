import React, {useEffect, useState} from 'react'
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import ChatPage from './components/ChatPage'
import ModelManager from './components/ModelManager'
import Settings from './components/Settings'
import Toast from './components/Toast'

const SETTINGS_KEY = 'app_settings_v1'
const HLJS_LIGHT_CSS = '/styles/hljs-github.css'
const HLJS_DARK_CSS = '/styles/hljs-github-dark.css'

export default function App() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [transparentMode, setTransparentMode] = useState(false)
    const [widescreenMode, setWidescreenMode] = useState(false)
    const [theme, setTheme] = useState(() => {
        const raw = localStorage.getItem(SETTINGS_KEY)
        try {
            const parsed = raw ? JSON.parse(raw) : null
            if (parsed?.theme === 'light' || parsed?.theme === 'dark') {
                return parsed.theme
            }
        } catch (e) {
            console.warn('Ошибка парсинга темы:', e)
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })

    const [toast, setToast] = useState(null)

    useEffect(() => {
        document.documentElement.classList.remove('theme-dark', 'theme-light')
        document.documentElement.classList.add(`theme-${theme}`)
    }, [theme])

    useEffect(() => {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY)
            const parsed = raw ? JSON.parse(raw) : null
            if (typeof parsed?.transparentMode === 'boolean') {
                setTransparentMode(parsed.transparentMode)
            }
            if (typeof parsed?.widescreenMode === 'boolean') {
                setWidescreenMode(parsed.widescreenMode)
            }
        } catch (e) {
            console.warn('Ошибка загрузки настроек:', e)
        }
    }, [])

    useEffect(() => {
        const id = 'hljs-theme-link'
        const prev = document.getElementById(id)
        if (prev) prev.remove()

        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.href = theme === 'light' ? HLJS_LIGHT_CSS : HLJS_DARK_CSS
        document.head.appendChild(link)

        return () => {
            const el = document.getElementById(id)
            if (el) el.remove()
        }
    }, [theme])

    const handleSettingsChange = ({theme: newTheme, transparentMode: newTransparent, widescreenMode: newWidescreen}) => {
        if (newTheme === 'light' || newTheme === 'dark') {
            setTheme(newTheme)
        }
        if (typeof newTransparent === 'boolean') {
            setTransparentMode(newTransparent)
        }
        if (typeof newWidescreen === 'boolean') {
            setWidescreenMode(newWidescreen)
        }

        try {
            const payload = {
                theme: newTheme || theme,
                transparentMode: typeof newTransparent === 'boolean' ? newTransparent : transparentMode,
                widescreenMode: typeof newWidescreen === 'boolean' ? newWidescreen : widescreenMode,
            }
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload))
        } catch (e) {
            console.warn('Ошибка сохранения настроек:', e)
        }
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ChatPage
                            theme={theme}
                            transparentMode={transparentMode}
                            widescreenMode={widescreenMode}
                            openSettingsModal={() => setIsSettingsOpen(true)}
                            setToast={setToast}
                        />
                    }
                />
                <Route
                    path="/"
                    element={
                        <ChatPage
                            theme={theme}
                            transparentMode={transparentMode}
                            widescreenMode={widescreenMode}
                            openSettingsModal={() => setIsSettingsOpen(true)}
                            setToast={setToast}
                        />
                    }
                />
                    }
                />
            </Routes>

            <Settings
                open={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onChange={handleSettingsChange}
            />

            <Toast toast={toast} onClose={() => setToast(null)}/>
        </Router>
    )
}
