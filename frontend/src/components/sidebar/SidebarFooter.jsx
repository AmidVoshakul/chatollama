// src/components/sidebar/SidebarFooter.jsx
import React from 'react'
import { FiSettings } from 'react-icons/fi'

export default function SidebarFooter({ isOpen, onOpenSettings }) {
  if (!isOpen) {
    return (
      <div className="flex justify-center py-2 border-t border-[var(--border-color)]">
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] text-[var(--text-muted)] hover:text-violet-400 border border-transparent hover:border-[rgba(124,58,237,0.15)]"
          title="Настройки"
        >
          <FiSettings className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-2 py-2 border-t border-[var(--border-color)]">
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl transition-all duration-200 hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent hover:border-[rgba(124,58,237,0.15)]"
        title="Настройки"
      >
        <FiSettings className="w-4 h-4" />
        <span className="text-sm">Настройки</span>
      </button>
    </div>
  )
}
