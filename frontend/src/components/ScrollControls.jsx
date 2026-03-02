// src/components/ScrollControls.jsx
import React from 'react'
import { FiChevronUp, FiChevronDown } from 'react-icons/fi'

export default function ScrollControls({ topRef, bottomRef }) {
  return (
    <div className="flex items-center gap-1.5 mr-4">
      <button
        onClick={() =>
          topRef?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
        className={`
          w-9 h-9 flex items-center justify-center rounded-xl
          border border-[var(--border-color)]
          bg-[var(--bg-surface)]
          hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-violet-500/10
          transition-all duration-200
          group
        `}
        aria-label="Прокрутить вверх"
        title="Прокрутить к началу чата"
      >
        <FiChevronUp className="w-4 h-4 text-[var(--text-muted)] group-hover:text-cyan-400 transition-colors" />
      </button>
      <button
        onClick={() =>
          bottomRef?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          })
        }
        className={`
          w-9 h-9 flex items-center justify-center rounded-xl
          border border-[var(--border-color)]
          bg-[var(--bg-surface)]
          hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-violet-500/10
          transition-all duration-200
          group
        `}
        aria-label="Прокрутить вниз"
        title="Прокрутить к последнему сообщению"
      >
        <FiChevronDown className="w-4 h-4 text-[var(--text-muted)] group-hover:text-cyan-400 transition-colors" />
      </button>
    </div>
  )
}
