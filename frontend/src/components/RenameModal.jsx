import React, {useEffect, useRef, useState} from 'react'
import { FiX } from 'react-icons/fi'

export default function RenameModal({isOpen, currentTitle, onClose, onSubmit}) {
    const [title, setTitle] = useState(currentTitle)
    const inputRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            setTitle(currentTitle)
            if (inputRef.current) {
                inputRef.current.focus()
                inputRef.current.select()
            }
        }
    }, [isOpen, currentTitle])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return
            if (e.key === 'Enter') {
                onSubmit(title)
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, title, onClose, onSubmit])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-96 shadow-2xl shadow-black/20 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                    <span className="text-sm font-medium text-[var(--text-main)]">Переименовать чат</span>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    <input
                        type="text"
                        ref={inputRef}
                        placeholder="Введите название чата..."
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] text-[var(--text-main)] text-sm border border-[var(--border-color)] focus:outline-none focus:border-[rgba(124,58,237,0.3)] focus:ring-1 focus:ring-[rgba(124,58,237,0.2)] transition-all duration-200 placeholder:text-[var(--text-muted)]/50"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-5 pb-5">
                    <button
                        className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-all duration-200"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[linear-gradient(135deg,rgba(124,58,237,0.9)_0%,rgba(79,70,229,0.9)_100%)] text-white hover:opacity-90 hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
                        onClick={() => onSubmit(title)}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    )
}
