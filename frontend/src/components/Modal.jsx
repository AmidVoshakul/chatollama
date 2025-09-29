import React, {useEffect, useRef, useState} from 'react'

export default function Modal({visible, onClose, onSubmit}) {
    const [title, setTitle] = useState('')
    const inputRef = useRef(null)

    useEffect(() => {
        if (visible && inputRef.current) {
            inputRef.current.focus()
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                onSubmit(title)
                setTitle('')
            } else if (e.key === 'Escape') {
                onClose()
                setTitle('')
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [visible, title, onClose, onSubmit])

    if (!visible) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-main)] p-6 rounded-lg w-96 shadow-lg">
                <h2 className="text-xl mb-4 text-[var(--text-main)]">Введите название чата</h2>
                <input
                    type="text"
                    ref={inputRef}
                    className="w-full p-2 rounded bg-[var(--bg-surface)] text-[var(--text-main)] mb-4 border border-theme focus:outline-none focus:ring-2 focus:ring-[var(--accent-gradient-from)]"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                    <button
                        className="px-4 py-2 rounded bg-[var(--bg-surface)] text-[var(--text-main)] hover:opacity-80 transition"
                        onClick={() => {
                            onClose()
                            setTitle('')
                        }}
                    >
                        Отмена
                    </button>
                    <button
                        className="px-4 py-2 rounded bg-[var(--accent-gradient-from)] text-white hover:opacity-90 transition"
                        onClick={() => {
                            onSubmit(title)
                            setTitle('')
                        }}
                    >
                        Создать
                    </button>
                </div>
            </div>
        </div>
    )
}
