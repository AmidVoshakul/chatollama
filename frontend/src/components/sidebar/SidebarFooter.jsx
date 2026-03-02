// src/components/sidebar/SidebarFooter.jsx
import React from 'react'
import { FiSettings } from 'react-icons/fi'

export default function SidebarFooter({ isOpen, onOpenSettings }) {
  if (!isOpen) {
    return (
      <div className="w-full px-2 py-3 flex justify-center border-t border-[var(--sidebar-border)]">
        <button
          onClick={onOpenSettings}
          className={`
            p-3 rounded-xl
            transition-all duration-300 ease-in-out
            hover:bg-[var(--chatitem-hover-bg)]
            text-[var(--text-muted)] hover:text-[var(--text-main)]
          `}
          title="Настройки"
        >
          <FiSettings className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full px-2 py-3 border-t border-[var(--sidebar-border)]">
      <button
        onClick={onOpenSettings}
        className={`
          flex items-center gap-3 w-full px-4 py-3 rounded-xl
          transition-all duration-200 ease-out
          justify-start
          hover:bg-[var(--chatitem-hover-bg)] active:bg-[var(--chatitem-active-border)]
          text-[var(--text-muted)] hover:text-[var(--text-main)]
        `}
        title="Настройки"
      >
        <div className="w-9 h-9 rounded-xl bg-[var(--chatitem-icon-bg)] flex items-center justify-center">
          <FiSettings className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">Настройки</span>
      </button>
    </div>
  )
}
