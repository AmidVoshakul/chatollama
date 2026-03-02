// src/components/MessageEditor.jsx
import React, { useEffect, useRef } from 'react'
import { XIcon, SaveIcon, SendIcon } from './icons/MessageIcons'

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
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [editText, textareaRef])

    if (isAssistant) {
        return (
            <>
                <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            submitEdit()
                        }
                    }}
                    onBlur={submitEdit}
                    className="w-full bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-lg border border-theme focus:outline-none resize-none overflow-hidden text-sm"
                    style={{ minHeight: '2.5rem' }}
                    aria-label="Редактирование"
                />
                <div className="flex w-full items-center gap-3 px-3 py-2 border-t border-theme bg-[var(--bg-surface)] sticky bottom-0 z-10 animate-fade-in">
                    <button
                        onClick={onCancel}
                        title="Отменить"
                        className="hover:text-red-400 text-[var(--text-muted)] transition-transform hover:scale-110"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={submitEdit}
                        title="Сохранить"
                        className="hover:text-blue-400 text-[var(--text-muted)] transition-transform hover:scale-110"
                    >
                        <SaveIcon className="w-6 h-6" />
                    </button>
                </div>
            </>
        )
    }

    return (
        <div className="p-3">
            <textarea
                ref={textareaRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        onSubmit()
                    }
                }}
                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-lg border border-theme focus:outline-none resize-none overflow-hidden text-sm"
                style={{ minHeight: '2.5rem' }}
                aria-label="Редактирование"
            />
            <div className="flex justify-between items-center mt-2">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                    <XIcon className="w-4 h-4" />
                    Отмена
                </button>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onSubmit}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
                    >
                        <SaveIcon className="w-4 h-4" />
                        Сохранить
                    </button>
                    <button
                        onClick={onSubmitAndRegenerate}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 transition-all duration-200"
                    >
                        <SendIcon className="w-4 h-4" />
                        Сохранить и отправить
                    </button>
                </div>
            </div>
        </div>
    )
}
