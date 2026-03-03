// src/components/Sidebar.jsx
import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react'
import { FiSearch } from 'react-icons/fi'
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
  const [searchQuery, setSearchQuery] = useState('')
  const items = Array.isArray(chats) ? chats : []

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return items
    const query = searchQuery.toLowerCase()
    return items.filter(chat =>
      chat.title?.toLowerCase().includes(query)
    )
  }, [items, searchQuery])

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
        bg-[var(--bg-surface)] text-[var(--text-main)]
        border-r border-[var(--border-color)]
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-72' : 'w-[44px]'}
      `}
      aria-label="Sidebar"
    >
      <div className="flex flex-col w-full flex-1 overflow-hidden">
        <SidebarHeader
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(v => !v)}
        />

        {isSidebarOpen && (
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <SidebarNewChatButton onClick={createNewChat} />
          </div>
        )}

        {!isSidebarOpen && (
          <div className="flex justify-center py-2">
            <SidebarNewChatButton onClick={createNewChat} />
          </div>
        )}

        <ChatList
          chats={filteredChats}
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
