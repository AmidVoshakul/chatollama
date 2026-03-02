// src/components/MessageEditor.jsx
import React, { useEffect, useRef, useState } from 'react'
import { 
    XIcon, 
    SaveIcon, 
    SendIcon,
    RefreshIcon
} from './icons/MessageIcons'

export default function MessageEditor({
    editText,
    setEditText,
    onSubmit,
    onCancel,
    onSubmitAndRegenerate,
    submitEdit,
    isAssistant = false,
    textareaRef,
}) {
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [editText, textareaRef])

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            action()
        }
    }

    if (isAssistant) {
        return (
            <div className="relative group">
                <div className={`
                    absolute -top-3 left-4 px-2 py-0.5 text-xs font-medium rounded-full
                    bg-gradient-to-r from-violet-500 to-purple-500 text-white
                    shadow-lg shadow-purple-500/25 z-10
                    animate-scale-in
                `}>
                    Редактирование
                </div>
                <div className={`
                    mt-2 rounded-2xl overflow-hidden
                    bg-[var(--bg-surface)] 
                    border-2 transition-all duration-300
                    ${isFocused 
                        ? 'border-violet-500/50 shadow-lg shadow-violet-500/10' 
                        : 'border-[var(--border-color)]'
                    }
                `}>
                    <textarea
                        ref={textareaRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, submitEdit)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full bg-transparent text-[var(--text-main)] p-4 pb-3 focus:outline-none resize-none overflow-hidden text-sm leading-relaxed"
                        style={{ minHeight: '4rem' }}
                        placeholder="Введите исправленный текст..."
                        autoFocus
                    />
                    <div className={`
                        flex items-center justify-between px-4 py-3 
                        bg-gradient-to-r from-violet-500/5 to-purple-500/5
                        border-t border-[var(--border-color)]
                        transition-all duration-300
                    `}>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-main)] text-[10px] border border-[var(--border-color)]">Enter</kbd>
                            <span>сохранить</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onCancel}
                                title="Отменить"
                                className="
                                    p-2 rounded-xl 
                                    text-[var(--text-muted)] hover:text-red-400 
                                    hover:bg-red-500/10 
                                    transition-all duration-200
                                    hover:scale-110 active:scale-95
                                "
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={submitEdit}
                                title="Сохранить"
                                className="
                                    p-2 rounded-xl 
                                    bg-gradient-to-r from-violet-500 to-purple-500
                                    text-white hover:opacity-90
                                    transition-all duration-200
                                    hover:scale-110 active:scale-95
                                    shadow-lg shadow-purple-500/25
                                "
                            >
                                <SaveIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative group">
            <div className={`
                absolute -top-3 left-4 px-2 py-0.5 text-xs font-medium rounded-full
                bg-gradient-to-r from-cyan-500 to-blue-500 text-white
                shadow-lg shadow-cyan-500/25 z-10
                animate-scale-in
            `}>
                Редактирование
            </div>
            <div className={`
                mt-2 rounded-2xl overflow-hidden
                bg-[var(--bg-surface)] 
                border-2 transition-all duration-300
                ${isFocused 
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                    : 'border-[var(--border-color)]'
                }
            `}>
                <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, onSubmit)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-transparent text-[var(--text-main)] p-4 pb-3 focus:outline-none resize-none overflow-hidden text-sm leading-relaxed"
                    style={{ minHeight: '4rem' }}
                    placeholder="Введите исправленный текст..."
                    autoFocus
                />
                <div className={`
                    flex items-center justify-between px-4 py-3 
                    bg-gradient-to-r from-cyan-500/5 to-blue-500/5
                    border-t border-[var(--border-color)]
                    transition-all duration-300
                `}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onCancel}
                            className="
                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg 
                                text-sm text-[var(--text-muted)] 
                                hover:text-red-400 hover:bg-red-500/10 
                                transition-all duration-200
                            "
                        >
                            <XIcon className="w-4 h-4" />
                            Отмена
                        </button>
                        <div className="h-4 w-px bg-[var(--border-color)]" />
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-main)] text-[10px] border border-[var(--border-color)]">Enter</kbd>
                            <span>сохранить</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onSubmit}
                            className="
                                flex items-center gap-2 px-4 py-2 rounded-xl 
                                text-sm font-medium
                                bg-[var(--bg-main)] text-[var(--text-muted)]
                                hover:text-blue-400 hover:bg-blue-500/10
                                border border-[var(--border-color)]
                                transition-all duration-200
                                hover:scale-105 active:scale-95
                            "
                        >
                            <SaveIcon className="w-4 h-4" />
                            Сохранить
                        </button>
                        <button
                            onClick={onSubmitAndRegenerate}
                            className="
                                flex items-center gap-2 px-4 py-2 rounded-xl 
                                text-sm font-medium
                                bg-gradient-to-r from-violet-500 to-purple-500 text-white
                                hover:opacity-90
                                transition-all duration-200
                                hover:scale-105 active:scale-95
                                shadow-lg shadow-purple-500/25
                            "
                        >
                            <RefreshIcon className="w-4 h-4" />
                            Сохранить и отправить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
