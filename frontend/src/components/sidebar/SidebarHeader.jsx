// src/components/sidebar/SidebarHeader.jsx
import React from 'react'
import { FiSidebar } from 'react-icons/fi'
import Logo from './Logo'

export default function SidebarHeader({ isOpen, onToggle }) {
  if (!isOpen) {
    return (
      <div className="flex items-center justify-center py-3 border-b border-[var(--border-color)]">
        <button
          onClick={onToggle}
          className="group p-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--bg-main)] relative"
          title="Развернуть сайдбар"
          aria-label="Toggle sidebar"
        >
          <Logo className="w-5 h-5 transition-opacity duration-200 group-hover:opacity-0" />
          <FiSidebar className="w-5 h-5 text-[var(--text-muted)] absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border-color)]">
      <div className="flex items-center gap-2.5">
        <Logo className="w-6 h-6" />
        <span className="text-sm font-semibold text-[var(--text-main)]">
          ChatoLlama
        </span>
      </div>
      <button
        onClick={onToggle}
        className="p-1.5 rounded-lg transition-all duration-200 hover:bg-[var(--bg-main)]"
        title="Свернуть сайдбар"
        aria-label="Toggle sidebar"
      >
        <FiSidebar className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
      </button>
    </div>
  )
}
