// src/components/sidebar/ChatItem.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { FaTrash } from 'react-icons/fa'
import { HiOutlineChatAlt2 } from 'react-icons/hi'

export default function ChatItem({ 
  chat, 
  isActive, 
  onSelect, 
  onDelete, 
  registerRef, 
  unregisterRef 
}) {
  const { id, title: rawTitle, created_at } = chat || {}
  const title = typeof rawTitle === 'string' && rawTitle.trim() !== '' 
    ? rawTitle.trim() 
    : 'Без названия'

  const formattedDate = created_at
    ? new Date(created_at).toLocaleString('ru-RU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  const scrollRef = useRef(null)
  const [scrollStyle, setScrollStyle] = useState({})

  const recalc = useCallback(() => {
    if (!scrollRef.current) return
    const containerWidth = scrollRef.current.offsetWidth
    const textWidth = scrollRef.current.scrollWidth
    const overflow = textWidth - containerWidth

    if (overflow > 10) {
      const duration = Math.max(2200, overflow * 18 + 800)
      setScrollStyle({
        animation: `scrollText ${duration}ms linear 1s 1 normal`,
        display: 'inline-block',
        transform: 'translateX(0)',
        '--scroll-distance': `-${overflow}px`,
      })
    } else {
      setScrollStyle({})
    }
  }, [])

  useEffect(() => {
    if (typeof registerRef === 'function') registerRef(id, recalc)
    recalc()
    return () => {
      if (typeof unregisterRef === 'function') unregisterRef(id)
    }
  }, [id, registerRef, unregisterRef, recalc])

  return (
    <div
      role="listitem"
      onClick={onSelect}
      className={`
        group flex items-center gap-3 px-3 py-3 mx-2 mb-1.5 rounded-xl
        cursor-pointer transition-all duration-200 ease-out
        ${isActive 
          ? 'bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-cyan-500/10 border border-[var(--chatitem-active-border)] shadow-lg shadow-black/10' 
          : 'hover:bg-[var(--chatitem-hover-bg)] hover:translate-x-0.5 border border-transparent'
        }
      `}
    >
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20' 
          : 'bg-[var(--chatitem-icon-bg)] group-hover:bg-[var(--chatitem-icon-hover-bg)]'
      }`}>
        <HiOutlineChatAlt2 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--chatitem-icon-color)]'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="relative overflow-hidden">
          <div
            ref={scrollRef}
            className={`whitespace-nowrap text-sm scroll-animate truncate ${
              isActive 
                ? 'text-[var(--chatitem-active-text)] font-medium' 
                : 'text-[var(--chatitem-text)] group-hover:text-[var(--chatitem-text-hover)]'
            }`}
            style={scrollStyle}
            title={title}
            aria-label={title}
          >
            {title}
          </div>
        </div>
        <span className={`text-xs mt-0.5 block ${
          isActive ? 'text-[var(--chatitem-active-date)]' : 'text-[var(--chatitem-date)]'
        }`}>
          {formattedDate}
        </span>
      </div>

      <button
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
        className={`
          p-2 rounded-lg transition-all duration-200
          opacity-0 group-hover:opacity-100
          hover:bg-red-500/20
        `}
        title="Удалить чат"
        aria-label="Удалить чат"
      >
        <FaTrash className="w-3.5 h-3.5 text-red-400/60 hover:text-red-400 transition-colors" />
      </button>
    </div>
  )
}
