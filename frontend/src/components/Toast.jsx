// src/components/Toast.jsx
import React, {useEffect, useState} from 'react'

export default function Toast({toast, onClose}) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!toast) return
        setVisible(true)
        const timeout = setTimeout(() => {
            setVisible(false)
            setTimeout(() => onClose?.(), 300) // дождаться fade-out
        }, 3000)
        return () => clearTimeout(timeout)
    }, [toast, onClose])

    if (!toast) return null

    const base =
        'fixed bottom-6 right-6 z-50 max-w-sm w-full px-4 py-3 rounded-lg shadow-xl text-sm font-medium text-white backdrop-blur-md transition-opacity duration-300 pointer-events-auto'
    const bg =
        toast.type === 'success'
            ? 'bg-green-500/90'
            : toast.type === 'error'
                ? 'bg-red-500/90'
                : 'bg-neutral-700/90'

    const icon =
        toast.type === 'success'
            ? '✓'
            : toast.type === 'error'
                ? '⚠'
                : '•'

    return (
        <div
            className={`${base} ${bg} ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="flex-1 leading-snug break-words">{toast.text}</span>
            </div>
        </div>
    )
}
