// src/components/sidebar/SidebarNewChatButton.jsx
import React from 'react'
import { FiPlus } from 'react-icons/fi'

export default function SidebarNewChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-9 h-9 rounded-lg bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] text-violet-400 border border-[rgba(124,58,237,0.15)] hover:border-[rgba(124,58,237,0.3)] hover:shadow-md transition-all duration-200 shrink-0"
      title="Новый чат"
    >
      <FiPlus className="w-4 h-4" />
    </button>
  )
}
