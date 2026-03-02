// src/components/MessageHeader.jsx
import React from 'react'
import MessageMenuButton from './MessageMenuButton'
import MessageActions from './MessageActions'
import { CpuIcon } from './icons/MessageIcons'

export default function MessageHeader({
    role,
    model,
    timestamp,
    formattedDate,
    showActions,
    setShowActions,
    copied,
    isGenerating,
    onCopy,
    onEdit,
    onDelete,
    onRegenerate,
    cancelCloseDelay,
    closeWithDelay,
    position = 'left',
}) {
    return (
        <div className={`flex items-center px-4 py-2.5 text-xs text-[var(--text-muted)] relative`}>
            <div 
                className="relative"
                onMouseEnter={() => {
                    cancelCloseDelay()
                    setShowActions(true)
                }}
                onMouseLeave={() => closeWithDelay()}
            >
                <MessageMenuButton 
                    showActions={showActions}
                    onClick={() => setShowActions(v => !v)}
                />
                <MessageActions
                    show={showActions}
                    onClose={() => setShowActions(false)}
                    position={position}
                    copied={copied}
                    isGenerating={isGenerating}
                    role={role}
                    triggerHover={true}
                    onMouseEnter={cancelCloseDelay}
                    onMouseLeave={closeWithDelay}
                    onCopy={onCopy}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRegenerate={onRegenerate}
                />
            </div>

            {role === 'assistant' && model && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-500/25 text-violet-300 text-[10px] font-semibold mr-3 shadow-sm">
                    <CpuIcon className="w-3 h-3" />
                    {model}
                </span>
            )}
            {formattedDate && <span className="text-[var(--text-muted)]/70 font-medium">{formattedDate}</span>}
        </div>
    )
}
