// src/components/Settings.jsx
import React, {useEffect, useState} from 'react'

const STORAGE_KEY = 'app_settings_v1'

export default function Settings({open, onClose, onChange}) {
    const [theme, setTheme] = useState('dark') // 'dark' | 'light'
    const [transparentMode, setTransparentMode] = useState(false)

    // Загрузка настроек из localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw)
            if (parsed.theme === 'light' || parsed.theme === 'dark') {
                setTheme(parsed.theme)
            }
            if (typeof parsed.transparentMode === 'boolean') {
                setTransparentMode(parsed.transparentMode)
            }
        } catch (e) {
            console.warn('Ошибка загрузки настроек:', e)
        }
    }, [])

    // Сохранение настроек и уведомление родителя
    useEffect(() => {
        const payload = {theme, transparentMode}
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        } catch (e) {
            console.warn('Ошибка сохранения настроек:', e)
        }
        if (typeof onChange === 'function') {
            onChange(payload)
        }
    }, [theme, transparentMode])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div
                className="relative z-10 w-full max-w-md rounded-lg bg-[var(--bg-main)] border border-theme p-6 shadow-lg transition-all animate-fade-in">
                <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4">Настройки</h2>

                <div className="space-y-6">
                    {/* Прозрачность */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-[var(--text-main)]">Режим прозрачности</div>
                            <div className="text-xs text-[var(--text-muted)]">Снижает непрозрачность ответов модели
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={transparentMode}
                                onChange={() => setTransparentMode(prev => !prev)}
                                className="sr-only peer"
                            />
                            <div
                                className="w-11 h-6 bg-[var(--muted-weak)] rounded-full peer-checked:bg-indigo-600 transition"/>
                            <span className="ml-3 text-sm text-[var(--text-main)]">
                {transparentMode ? 'Вкл' : 'Выкл'}
              </span>
                        </label>
                    </div>

                    {/* Тема */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-[var(--text-main)]">Тема интерфейса</div>
                            <div className="text-xs text-[var(--text-muted)]">Выберите светлую или тёмную тему</div>
                        </div>
                        <select
                            value={theme}
                            onChange={e => setTheme(e.target.value)}
                            className="bg-[var(--bg-surface)] text-[var(--text-main)] text-sm rounded px-2 py-1 border border-theme"
                        >
                            <option value="dark">Тёмная</option>
                            <option value="light">Светлая</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 rounded bg-[var(--bg-surface)] text-sm text-[var(--text-main)] hover:opacity-80 transition"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    )
}
