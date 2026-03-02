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
        'fixed bottom-6 right-6 z-50 max-w-sm w-full px-6 py-4 rounded-2xl shadow-2xl text-sm font-medium text-white backdrop-blur-xl transition-all duration-300 pointer-events-auto border border-white/10'
    const bg =
        toast.type === 'success'
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/30 shadow-lg shadow-green-500/25'
            : toast.type === 'error'
                ? 'bg-gradient-to-br from-red-500/20 to-rose-600/30 shadow-lg shadow-red-500/25'
                : 'bg-gradient-to-br from-slate-500/20 to-slate-600/30 shadow-lg shadow-slate-500/25'

    const icon =
        toast.type === 'success'
            ? '✓'
            : toast.type === 'error'
                ? '⚠'
                : '•'

    return (
        <div
            className={`${base} ${bg} ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                <span className="text-lg drop-shadow-sm">{icon}</span>
                <span className="flex-1 leading-snug break-words drop-shadow-sm">{toast.text}</span>
            </div>
        </div>
    )
}
