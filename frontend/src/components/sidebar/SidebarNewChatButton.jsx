// src/components/sidebar/SidebarNewChatButton.jsx
import React from 'react'
import { FiPlus } from 'react-icons/fi'

export default function SidebarNewChatButton({ isOpen, onClick }) {
  if (!isOpen) {
    return (
      <div className="px-2 py-2 flex justify-center">
        <button
          onClick={onClick}
          className={`
            flex items-center justify-center w-full p-3 rounded-xl
            transition-all duration-300 ease-in-out
            bg-gradient-to-r from-cyan-800  to-cyan-600
            hover:from-cyan-500  hover:to-cyan-500
            text-white
            shadow-lg shadow-cyan-900/20 hover:shadow-violet-900/30
            transform hover:scale-110 active:scale-95
          `}
          title="Новый чат"
        >
          <FiPlus className="w-5 h-5" aria-hidden />
        </button>
      </div>
    )
  }
  
  return (
    <div className="px-3 py-3">
      <button
        onClick={onClick}
        className={`
          flex items-center gap-3 w-full px-4 py-3 rounded-xl
          transition-all duration-300 ease-out
          justify-start
          bg-gradient-to-r from-cyan-800 via-violet-700 to-cyan-700
          bg-[length:200%_auto] hover:bg-[length:100%_auto]
          text-white font-medium
          shadow-lg shadow-cyan-900/20 hover:shadow-violet-900/25
          transform hover:translate-x-0.5 active:scale-[0.99]
        `}
        title="Новый чат"
      >
        <FiPlus className="w-5 h-5" aria-hidden />
        <span className="text-sm font-medium">Новый чат</span>
      </button>
    </div>
  )
}
