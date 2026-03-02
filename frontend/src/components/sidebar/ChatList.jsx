// src/components/sidebar/ChatList.jsx
import React from 'react'
import ChatItem from './ChatItem'

export default function ChatList({ 
  chats, 
  activeChatId, 
  onSelectChat, 
  onDeleteChat,
  registerRef,
  unregisterRef,
  isOpen 
}) {
  if (!isOpen) return null

  return (
    <nav
      className="flex-1 overflow-auto custom-scroll w-full mt-2"
      aria-label="Chats"
    >
      {chats.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--chatitem-icon-bg)] mb-4 border border-[var(--sidebar-border)]">
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            Нет чатов
          </p>
          <p className="text-xs text-[var(--text-muted)] opacity-60 mt-1.5">
            Нажмите «Новый чат» чтобы начать
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onSelect={() => onSelectChat(chat)}
              onDelete={() => onDeleteChat(chat.id)}
              registerRef={registerRef}
              unregisterRef={unregisterRef}
            />
          ))}
        </div>
      )}
    </nav>
  )
}
