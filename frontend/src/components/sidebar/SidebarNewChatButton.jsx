// src/components/sidebar/SidebarNewChatButton.jsx
import React from 'react'
import { FiPlus } from 'react-icons/fi'

export default function SidebarNewChatButton({ isOpen, onClick }) {
  if (!isOpen) {
    return (
      <div className="flex justify-center py-2">
        <button
          onClick={onClick}
          className="p-2 rounded-xl transition-all duration-200 hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] text-[var(--text-muted)] hover:text-violet-400 border border-transparent hover:border-[rgba(124,58,237,0.15)]"
          title="Новый чат"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 py-3">
      <button
        onClick={onClick}
        className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[rgba(124,58,237,0.15)] hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] transition-all duration-200 text-[var(--text-main)] shadow-sm hover:shadow-md"
        title="Новый чат"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] text-violet-400 border border-[rgba(124,58,237,0.15)] group-hover:border-[rgba(124,58,237,0.3)] transition-all duration-200">
          <FiPlus className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Новый чат</span>
      </button>
    </div>
  )
}
