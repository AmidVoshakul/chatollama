// src/components/sidebar/ChatList.jsx
import React from 'react'
import { FiMessageSquare } from 'react-icons/fi'
import ChatItem from './ChatItem'

export default function ChatList({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  registerRef,
  unregisterRef,
  isOpen
}) {
  if (!isOpen) {
    // Свернутое состояние - ничего не показываем, только кнопка нового чата в футере
    return null
  }

  return (
    <nav
      className="flex-1 overflow-auto custom-scroll w-full mt-1"
      aria-label="Chats"
    >
      {chats.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-main)] mb-2 border border-[var(--border-color)]">
            <FiMessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Нет чатов
          </p>
          <p className="text-[10px] text-[var(--text-muted)] opacity-60 mt-0.5">
            Нажмите «Новый чат» чтобы начать
          </p>
        </div>
      ) : (
        <div className="space-y-0 px-2">
          {chats.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isActive={activeChatId === chat.id}
              onSelect={() => onSelectChat(chat)}
              onDelete={() => onDeleteChat(chat.id)}
              onRename={() => onRenameChat(chat.id, chat.title)}
              registerRef={registerRef}
              unregisterRef={unregisterRef}
            />
          ))}
        </div>
      )}
    </nav>
  )
}
