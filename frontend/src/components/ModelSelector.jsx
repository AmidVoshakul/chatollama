// src/components/ModelSelector.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCpu, FiChevronDown } from 'react-icons/fi'

export default function ModelSelector({
  model,
  models,
  onModelChange,
  dropdownOpen,
  setDropdownOpen,
}) {
  const navigate = useNavigate()

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setDropdownOpen(v => !v)}
        className={`
          flex items-center justify-between gap-2
          px-4 py-2.5 rounded-xl text-sm w-64
          bg-[var(--bg-surface)] border border-[var(--border-color)]
          hover:border-[var(--accent-gradient-from)] hover:border-opacity-50
          transition-all duration-200
          shadow-sm
        `}
        aria-haspopup="listbox"
        aria-expanded={dropdownOpen}
        title="Выбрать модель"
      >
        <span className="truncate text-[var(--text-main)] font-medium">{model}</span>
        <FiChevronDown 
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {dropdownOpen && (
        <ul
          role="listbox"
          className={`
            absolute bottom-full left-0 w-64 max-h-80 overflow-y-auto
            bg-[var(--bg-surface)] border border-[var(--border-color)]
            rounded-xl shadow-xl z-50 -translate-y-2
            custom-scroll animate-fade-in
          `}
        >
          {models.map((m, index) => (
            <li
              key={m}
              onClick={() => {
                onModelChange(m)
                setDropdownOpen(false)
              }}
              className={`
                px-4 py-3 cursor-pointer 
                border-b border-[var(--border-color)] last:border-b-0
                hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-violet-500/10
                transition-all duration-150
                ${m === model ? 'bg-gradient-to-r from-cyan-500/10 to-violet-500/10' : ''}
              `}
              role="option"
              aria-selected={m === model}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                    m === model 
                      ? 'bg-green-400 animate-pulse' 
                      : 'bg-red-400/60'
                  }`}
                />
                <span
                  title={m}
                  className={`truncate text-sm ${
                    m === model 
                      ? 'text-cyan-400 font-medium' 
                      : 'text-[var(--text-main)]'
                  }`}
                >
                  {m}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <button
        onClick={() => navigate('/models')}
        className={`
          w-10 h-10 flex items-center justify-center 
          rounded-xl border border-[var(--border-color)]
          bg-[var(--bg-surface)]
          hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-violet-500/10
          transition-all duration-200
        `}
        aria-label="Перейти к моделям"
        title="Открыть менеджер моделей"
      >
        <FiCpu className="w-4 h-4 text-[var(--text-muted)]" aria-hidden />
      </button>
    </div>
  )
}
