// src/components/MessageInput.jsx
import React, { useRef } from 'react'
import { FiSend, FiSquare } from 'react-icons/fi'

export default function MessageInput({
  input,
  setInput,
  isGenerating,
  onSend,
  onStop,
  handleKeyDown,
}) {
  const textareaRef = useRef(null)

  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(
      e.target.scrollHeight,
      window.innerHeight * 0.5
    )}px`
  }

  return (
    <div className="relative mt-3">
      <textarea
        ref={textareaRef}
        rows={2}
        value={input}
        onChange={e => setInput(e.target.value)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Введите сообщение..."
        className={`
          w-full 
          bg-[var(--bg-surface)] 
          border border-[var(--border-color)]
          rounded-2xl 
          p-4 pr-14 
          resize-none 
          focus:outline-none 
          focus:border-[var(--accent-gradient-from)]
          focus:border-opacity-50
          custom-scroll
          text-[var(--text-main)]
          placeholder:text-[var(--text-muted)]
          transition-all duration-200
        `}
      />

      <button
        onClick={isGenerating ? onStop : onSend}
        disabled={!input.trim() && !isGenerating}
        className={`
          absolute right-3 bottom-3 
          w-10 h-10 
          rounded-xl 
          flex items-center justify-center 
          transition-all duration-200 ${
            isGenerating
              ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 animate-pulse'
              : input.trim()
                ? 'bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 bg-[length:200%_auto] hover:bg-[length:100%_auto] hover:shadow-lg hover:shadow-cyan-500/20'
                : 'bg-[var(--bg-variant)] opacity-50 cursor-not-allowed'
          }
        `}
        aria-label={isGenerating ? 'Остановить генерацию' : 'Отправить сообщение'}
      >
        {isGenerating ? (
          <FiSquare className="w-4 h-4 text-white" />
        ) : (
          <FiSend className="w-4 h-4 text-white" />
        )}
      </button>
    </div>
  )
}
