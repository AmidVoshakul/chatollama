// src/components/Settings.jsx
import React, {useEffect, useState} from 'react'
import {FiMoon, FiSun, FiMaximize, FiX} from 'react-icons/fi'

const STORAGE_KEY = 'app_settings_v1'

function Toggle({checked, onChange, icon: Icon, label, description}) {
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-main)] flex items-center justify-center border border-[var(--border-color)]">
                    <Icon className="w-4 h-4 text-[var(--text-muted)]"/>
                </div>
                <div>
                    <div className="text-sm font-medium text-[var(--text-main)]">{label}</div>
                    <div className="text-xs text-[var(--text-muted)]">{description}</div>
                </div>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none
                    ${checked 
                        ? 'bg-[linear-gradient(135deg,rgba(124,58,237,0.8)_0%,rgba(79,70,229,0.8)_100%)]' 
                        : 'bg-[var(--muted-weak)]'}
                `}
            >
                <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
                        ${checked ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    )
}

export default function Settings({open, onClose, onChange}) {
    const [theme, setTheme] = useState('dark')
    const [widescreenMode, setWidescreenMode] = useState(false)

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) return
            const parsed = JSON.parse(raw)
            if (parsed.theme === 'light' || parsed.theme === 'dark') {
                setTheme(parsed.theme)
            }
            if (typeof parsed.widescreenMode === 'boolean') {
                setWidescreenMode(parsed.widescreenMode)
            }
        } catch (e) {
            console.warn('Ошибка загрузки настроек:', e)
        }
    }, [])

    useEffect(() => {
        const payload = {theme, widescreenMode}
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
        } catch (e) {
            console.warn('Ошибка сохранения настроек:', e)
        }
        if (typeof onChange === 'function') {
            onChange(payload)
        }
    }, [theme, widescreenMode, onChange])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
            <div
                className="relative z-10 w-full max-w-sm rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-2xl transition-all animate-fade-in"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                    <h2 className="text-sm font-semibold text-[var(--text-main)]">Настройки</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] transition-all duration-200"
                    >
                        <FiX className="w-4 h-4"/>
                    </button>
                </div>

                {/* Content */}
                <div className="px-4 py-3">
                    {/* Theme Selector */}
                    <div className="mb-4">
                        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-2 block">
                            Тема оформления
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setTheme('dark')}
                                className={`
                                    flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200
                                    ${theme === 'dark'
                                    ? 'border-violet-500/50 bg-[linear-gradient(135deg,rgba(124,58,237,0.15)_0%,rgba(79,70,229,0.08)_100%)] text-[var(--text-main)]'
                                    : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                }
                                `}
                            >
                                <FiMoon className="w-4 h-4"/>
                                <span className="text-sm">Тёмная</span>
                            </button>
                            <button
                                onClick={() => setTheme('light')}
                                className={`
                                    flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200
                                    ${theme === 'light'
                                    ? 'border-violet-500/50 bg-[linear-gradient(135deg,rgba(124,58,237,0.15)_0%,rgba(79,70,229,0.08)_100%)] text-[var(--text-main)]'
                                    : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                                }
                                `}
                            >
                                <FiSun className="w-4 h-4"/>
                                <span className="text-sm">Светлая</span>
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-[var(--border-color)] my-3"/>

                    {/* Toggles */}
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
                            Параметры отображения
                        </label>
                        <div className="space-y-0">
                            <Toggle
                                icon={FiMaximize}
                                label="Широкоэкранный режим"
                                description="Увеличивает ширину контента до 80% окна"
                                checked={widescreenMode}
                                onChange={setWidescreenMode}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[var(--border-color)]">
                    <button
                        onClick={onClose}
                        className="w-full py-2 rounded-lg text-sm font-medium text-white bg-[linear-gradient(135deg,rgba(124,58,237,0.9)_0%,rgba(79,70,229,0.9)_100%)] hover:bg-[linear-gradient(135deg,rgba(124,58,237,1)_0%,rgba(79,70,229,1)_100%)] border border-transparent hover:border-[rgba(124,58,237,0.3)] transition-all duration-200"
                    >
                        Готово
                    </button>
                </div>
            </div>
        </div>
    )
}
