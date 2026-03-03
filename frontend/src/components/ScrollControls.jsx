// src/components/ScrollControls.jsx
import React from 'react'
import { FiChevronUp, FiChevronDown } from 'react-icons/fi'

export default function ScrollControls({ topRef, bottomRef }) {
  return (
    <div className="flex items-center gap-1 mr-2">
      <button
        onClick={() =>
          topRef?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
        className={`
          w-7 h-7 flex items-center justify-center rounded-md
          border border-[var(--border-color)]
          bg-[var(--bg-surface)]
          hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)]
          hover:border-[rgba(124,58,237,0.15)]
          transition-all duration-200
          group
        `}
        aria-label="Прокрутить вверх"
        title="Прокрутить к началу чата"
      >
        <FiChevronUp className="w-3 h-3 text-[var(--text-muted)] group-hover:text-violet-400 transition-colors" />
      </button>
      <button
        onClick={() =>
          bottomRef?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          })
        }
        className={`
          w-7 h-7 flex items-center justify-center rounded-md
          border border-[var(--border-color)]
          bg-[var(--bg-surface)]
          hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)]
          hover:border-[rgba(124,58,237,0.15)]
          transition-all duration-200
          group
        `}
        aria-label="Прокрутить вниз"
        title="Прокрутить к последнему сообщению"
      >
        <FiChevronDown className="w-3 h-3 text-[var(--text-muted)] group-hover:text-violet-400 transition-colors" />
      </button>
    </div>
  )
}
