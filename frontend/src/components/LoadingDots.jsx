import React from 'react'

export default function LoadingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" style={{
                animation: 'bounce 1s infinite',
                animationDelay: '0ms'
            }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" style={{
                animation: 'bounce 1s infinite',
                animationDelay: '150ms'
            }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" style={{
                animation: 'bounce 1s infinite',
                animationDelay: '300ms'
            }} />
            <style>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
                    30% { transform: translateY(-6px); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
