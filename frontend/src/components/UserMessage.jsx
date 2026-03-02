// src/components/UserMessage.jsx
import React from 'react'
import { UserIcon } from './icons/MessageIcons'

export default function UserMessage({ content, isEditing }) {
    if (isEditing) {
        return null
    }

    return (
        <div className="flex items-start gap-3 p-3 pt-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="message-user-content text-[var(--text-main)] text-[15px] leading-relaxed break-words">
                    {content}
                </div>
            </div>
        </div>
    )
}
