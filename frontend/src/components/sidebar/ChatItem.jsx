// src/components/sidebar/ChatItem.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { FiTrash2, FiMessageSquare } from 'react-icons/fi'

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
        group flex items-center gap-2 px-2 py-2 rounded-lg
        cursor-pointer transition-all duration-200 ease-out border
        ${isActive
          ? 'bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] border-[rgba(124,58,237,0.15)] shadow-sm'
          : 'hover:bg-[var(--bg-main)] border-transparent hover:border-[var(--border-color)]'
        }
      `}
    >
      <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 border ${
        isActive
          ? 'bg-[linear-gradient(135deg,rgba(124,58,237,0.25)_0%,rgba(79,70,229,0.15)_100%)] text-violet-300 border-[rgba(124,58,237,0.3)]'
          : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] group-hover:border-[rgba(124,58,237,0.15)]'
      }`}>
        <FiMessageSquare className="w-3 h-3" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="relative overflow-hidden">
          <div
            ref={scrollRef}
            className={`whitespace-nowrap text-sm scroll-animate truncate ${
              isActive
                ? 'text-[var(--text-main)] font-medium'
                : 'text-[var(--text-main)]'
            }`}
            style={scrollStyle}
            title={title}
            aria-label={title}
          >
            {title}
          </div>
        </div>
        <span className={`text-[10px] -mt-2.5 block ${
          isActive ? 'text-violet-400' : 'text-[var(--text-muted)]'
        }`}>
          {formattedDate}
        </span>
      </div>

      <button
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
        className="
          p-1 rounded-md transition-all duration-200
          opacity-0 group-hover:opacity-100
          hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400
        "
        title="Удалить чат"
        aria-label="Удалить чат"
      >
        <FiTrash2 className="w-3 h-3" />
      </button>
    </div>
  )
}
