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
    <div className="relative flex items-center gap-1.5">
      <button
        onClick={() => setDropdownOpen(v => !v)}
        className={`
          flex items-center justify-between gap-2
          px-2.5 py-1 rounded-md text-xs w-48
          bg-[var(--bg-surface)] border border-[var(--border-color)]
          hover:border-[rgba(124,58,237,0.15)] hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)]
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
            absolute bottom-full left-0 w-48 max-h-64 overflow-y-auto
            bg-[var(--bg-surface)] border border-[var(--border-color)]
            rounded-md shadow-xl z-50 -translate-y-1
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
                px-2.5 py-1.5 cursor-pointer text-xs
                border-b border-[var(--border-color)] last:border-b-0
                hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)]
                transition-all duration-150
                ${m === model ? 'bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)]' : ''}
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
                      ? 'text-violet-400 font-medium' 
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
          w-7 h-7 flex items-center justify-center 
          rounded-md border border-[var(--border-color)]
          bg-[var(--bg-surface)]
          hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)]
          hover:border-[rgba(124,58,237,0.15)]
          transition-all duration-200
        `}
        aria-label="Перейти к моделям"
        title="Открыть менеджер моделей"
      >
        <FiCpu className="w-3 h-3 text-[var(--text-muted)] hover:text-violet-400 transition-colors" aria-hidden />
      </button>
    </div>
  )
}
