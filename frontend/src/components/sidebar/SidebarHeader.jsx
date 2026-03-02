// src/components/sidebar/SidebarHeader.jsx
import React from 'react'
import { PiSidebar } from 'react-icons/pi'
import Logo from './Logo'

export default function SidebarHeader({ isOpen, onToggle }) {
  return (
    <div
      className={`flex px-4 py-4 transition-all duration-300 ease-in-out border-b border-[var(--sidebar-border)] ${
        isOpen 
          ? 'flex-row items-center justify-between' 
          : 'flex-col items-center justify-center py-4'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Logo />
        </div>
        {isOpen && (
          <span className="text-lg font-bold bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent bg-[length:200%_auto]">
            ChatoLlama
          </span>
        )}
      </div>
      <button
        onClick={onToggle}
        className={`p-2.5 rounded-xl transition-all duration-300 hover:bg-[var(--chatitem-hover-bg)] ${
          isOpen 
            ? '' 
            : 'mt-3'
        }`}
        title={isOpen ? 'Свернуть сайдбар' : 'Развернуть сайдбар'}
        aria-pressed={isOpen}
        aria-label="Toggle sidebar"
      >
        <PiSidebar className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all duration-300" />
      </button>
    </div>
  )
}
