// src/components/Sidebar.jsx
import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import SidebarHeader from './sidebar/SidebarHeader'
import SidebarNewChatButton from './sidebar/SidebarNewChatButton'
import ChatList from './sidebar/ChatList'
import SidebarFooter from './sidebar/SidebarFooter'

export default function Sidebar({
  chats,
  activeChat,
  setActiveChat,
  createNewChat,
  deleteChat,
  isSidebarOpen,
  setIsSidebarOpen,
  openSettingsModal,
}) {
  const items = Array.isArray(chats) ? chats : []

  const itemsRefs = useRef(new Map())

  const recalcScrollForAll = useCallback(() => {
    itemsRefs.current.forEach(fn => {
      try {
        fn()
      } catch (e) {
        // ignore per-item errors
      }
    })
  }, [])

  useEffect(() => {
    let timer = null
    const onResize = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        recalcScrollForAll()
      }, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (timer) clearTimeout(timer)
    }
  }, [recalcScrollForAll])

  const handleRegisterRef = useCallback((id, fn) => {
    itemsRefs.current.set(id, fn)
  }, [])

  const handleUnregisterRef = useCallback((id) => {
    itemsRefs.current.delete(id)
  }, [])

  return (
    <aside
      className={`
        h-screen flex flex-col justify-between
        bg-gradient-to-b from-[var(--sidebar-bg-top)] to-[var(--sidebar-bg-bottom)] text-[var(--text-main)]
        border-r border-[var(--sidebar-border)]
        shadow-2xl shadow-black/20
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-72' : 'w-16'}
      `}
      aria-label="Sidebar"
    >
      <div className="flex flex-col w-full flex-1 overflow-hidden">
        <SidebarHeader 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(v => !v)} 
        />

        <SidebarNewChatButton 
          isOpen={isSidebarOpen} 
          onClick={createNewChat} 
        />

        <ChatList
          chats={items}
          activeChatId={activeChat?.id}
          onSelectChat={setActiveChat}
          onDeleteChat={deleteChat}
          registerRef={handleRegisterRef}
          unregisterRef={handleUnregisterRef}
          isOpen={isSidebarOpen}
        />
      </div>

      <SidebarFooter 
        isOpen={isSidebarOpen} 
        onOpenSettings={openSettingsModal} 
      />
    </aside>
  )
}
