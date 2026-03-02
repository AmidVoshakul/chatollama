// src/components/Toast.jsx
import React, { useEffect, useState } from 'react'
import { FaCheck, FaExclamationTriangle, FaInfo } from 'react-icons/fa'

export default function Toast({ toast, onClose }) {
    const [visible, setVisible] = useState(false)
    const [leave, setLeave] = useState(false)

    useEffect(() => {
        if (!toast) return
        setVisible(true)
        setLeave(false)
        
        const displayTime = 3000
        const timeout = setTimeout(() => {
            setLeave(true)
            setTimeout(() => {
                onClose?.()
                setVisible(false)
            }, 300)
        }, displayTime)
        
        return () => clearTimeout(timeout)
    }, [toast, onClose])

    if (!toast) return null

    const typeConfig = {
        success: {
            icon: FaCheck,
            iconClass: 'text-green-400',
            bgClass: 'bg-green-500/10 border-green-500/20',
            glowClass: 'shadow-lg shadow-green-500/20',
            title: 'Успех',
        },
        error: {
            icon: FaExclamationTriangle,
            iconClass: 'text-red-400',
            bgClass: 'bg-red-500/10 border-red-500/20',
            glowClass: 'shadow-lg shadow-red-500/20',
            title: 'Ошибка',
        },
        info: {
            icon: FaInfo,
            iconClass: 'text-cyan-400',
            bgClass: 'bg-cyan-500/10 border-cyan-500/20',
            glowClass: 'shadow-lg shadow-cyan-500/20',
            title: 'Инфо',
        },
    }

    const config = typeConfig[toast.type] || typeConfig.info
    const IconComponent = config.icon

    return (
        <div
            className={`
                fixed bottom-6 right-6 z-50 max-w-sm w-full
                px-5 py-4 rounded-2xl
                backdrop-blur-xl
                border ${config.bgClass} ${config.glowClass}
                text-[var(--text-main)]
                transition-all duration-300 ease-out
                pointer-events-auto
                ${visible && !leave 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                }
            `}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <div className={`
                    flex-shrink-0 w-8 h-8 rounded-xl 
                    flex items-center justify-center
                    ${config.bgClass}
                `}>
                    <IconComponent className={`w-4 h-4 ${config.iconClass}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug break-words">
                        {toast.text}
                    </p>
                </div>
            </div>
            
            <div 
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl overflow-hidden"
            >
                <div 
                    className={`
                        h-full ${config.bgClass}
                        animate-[shrink_3s_ease-out_forwards]
                    `}
                    style={{ 
                        animation: 'shrink 3s ease-out forwards',
                    }}
                />
            </div>
        </div>
    )
}
