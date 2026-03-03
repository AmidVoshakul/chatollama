// src/components/sidebar/ChatItem.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { FiMoreVertical, FiMessageSquare, FiEdit2, FiTrash2 } from 'react-icons/fi'

export default function ChatItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  onRename,
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
  const menuRef = useRef(null)
  const closeTimerRef = useRef(null)
  const [scrollStyle, setScrollStyle] = useState({})
  const [menuOpen, setMenuOpen] = useState(false)

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

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setMenuOpen(true)
  }

  const closeMenu = () => {
    closeTimerRef.current = setTimeout(() => {
      setMenuOpen(false)
    }, 150)
  }

  const handleRename = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    onRename()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    onDelete()
  }

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

      {/* Кнопка меню с тремя точками */}
      <div
        className="relative"
        ref={menuRef}
        onMouseEnter={openMenu}
        onMouseLeave={closeMenu}
      >
        <button
          className={`
            p-1.5 rounded-md transition-all duration-200
            ${menuOpen
              ? 'opacity-100 bg-[var(--bg-main)] text-[var(--text-main)]'
              : 'opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]'
            }
          `}
          title="Действия"
          aria-label="Действия"
        >
          <FiMoreVertical className="w-3.5 h-3.5" />
        </button>

        {/* Выпадающее меню */}
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-lg shadow-black/20 z-50 py-1"
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
          >
            <button
              onClick={handleRename}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-main)] transition-colors"
            >
              <FiEdit2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              Переименовать
            </button>
            <div className="mx-2 my-1 border-t border-[var(--border-color)]" />
            <button
              onClick={handleDelete}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              Удалить чат
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
