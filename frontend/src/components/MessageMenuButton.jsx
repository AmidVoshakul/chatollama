// src/components/MessageMenuButton.jsx
import React, { useState } from 'react'
import { MoreVerticalIcon } from './icons/MessageIcons'

export default function MessageMenuButton({ 
  showActions, 
  onClick, 
  onHover,
  className = '',
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true)
        onHover?.()
      }}
      onMouseLeave={() => {
        setIsHovered(false)
      }}
      className={`hover:bg-slate-700/50 p-2 rounded-xl transition-all duration-200 transform hover:scale-110 active:scale-95 ${isHovered ? 'bg-slate-700/30 scale-105' : ''} ${className}`}
      aria-label="Открыть действия"
      aria-expanded={showActions}
      {...props}
    >
      <MoreVerticalIcon className={`w-4 h-4 transition-colors duration-200 ${isHovered ? 'text-slate-200' : 'text-slate-400'}`} />
    </button>
  )
}
