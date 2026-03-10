// src/components/MessageList.jsx
import React, { useRef, useEffect, useMemo, memo } from 'react'
import Message from './Message'
import AssistantMessage from './AssistantMessage'

// Мемоизированное сообщение для предотвращения лишних рендеров
const MemoizedMessage = memo(Message, (prev, next) => {
  return (
    prev.content === next.content &&
    prev.role === next.role &&
    prev.isStreaming === next.isStreaming &&
    prev.isRegenerating === next.isRegenerating &&
    prev.hasError === next.hasError &&
    prev.isLatestAssistant === next.isLatestAssistant &&
    prev.isSidebarOpen === next.isSidebarOpen
  )
})

const MemoizedAssistantMessage = memo(AssistantMessage, (prev, next) => {
  return (
    prev.content === next.content &&
    prev.isStreaming === next.isStreaming &&
    prev.isRegenerating === next.isRegenerating &&
    prev.hasError === next.hasError &&
    prev.isLatestAssistant === next.isLatestAssistant &&
    prev.isSidebarOpen === next.isSidebarOpen &&
    prev.streamingThought === next.streamingThought &&
    prev.thoughtsEnded === next.thoughtsEnded
  )
})

export default function MessageList({
  messages,
  model,
  isSidebarOpen,
  widescreenMode = false,
  setToast,
  onDelete,
  onEdit,
  onEditAndRegenerate,
  onRegenerate,
  streamingThought,
  thoughtsEnded,
  topRef,
  bottomRef,
}) {
  const localTopRef = useRef(null)
  const localBottomRef = useRef(null)
  const effectiveTopRef = topRef || localTopRef
  const effectiveBottomRef = bottomRef || localBottomRef
  const lastLengthRef = useRef(messages.length)

  // Оптимизированный скролл - только при добавлении нового сообщения
  useEffect(() => {
    const hasNewMessage = messages.length > lastLengthRef.current
    lastLengthRef.current = messages.length
    
    if (hasNewMessage && effectiveBottomRef.current) {
      requestAnimationFrame(() => {
        effectiveBottomRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        })
      })
    }
  }, [messages.length])

  const hasThoughtPresent = useMemo(
    () => messages.some(m => m.type === 'thought'),
    [messages]
  )

  return (
    <div className="flex-1 overflow-auto pb-28 custom-scroll">
      <div className={`mx-auto w-full space-y-4 ${widescreenMode ? 'max-w-[80%]' : 'max-w-[650px]'}`}>
        <div ref={effectiveTopRef} />
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1
          const isLatestAssistant =
            isLast && msg.role === 'assistant' && (msg._isStreaming || msg._isRegenerating || streamingThought)

          if (
            msg.role === 'assistant' &&
            msg.hiddenWhileThought &&
            hasThoughtPresent
          ) {
            return null
          }

          if (msg.type === 'thought') {
            return null
          }

          if (msg.role === 'assistant' && isLatestAssistant) {
            return (
              <MemoizedAssistantMessage
                key={msg.id}
                content={msg.content}
                thinking={msg.thinking}
                model={msg.model}
                timestamp={msg.created_at}
                isTemp={msg._isTemp}
                hasError={msg._error}
                isStreaming={msg._isStreaming}
                isRegenerating={msg._isRegenerating}
                isLatestAssistant={isLatestAssistant}
                isSidebarOpen={isSidebarOpen}
                setToast={setToast}
                onDelete={() => onDelete(msg.id)}
                onEdit={(newContent) => onEdit(msg.id, newContent)}
                onEditAndRegenerate={(newContent) => onEditAndRegenerate(msg.id, newContent)}
                onRegenerate={() => onRegenerate(msg.id, model)}
                streamingThought={streamingThought}
                thoughtsEnded={thoughtsEnded}
              />
            )
          }

          return (
            <MemoizedMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              thinking={msg.thinking}
              model={msg.model}
              timestamp={msg.created_at}
              isTemp={msg._isTemp}
              hasError={msg._error}
              isStreaming={msg._isStreaming}
              onDelete={() => onDelete(msg.id)}
              onEdit={(newContent) => onEdit(msg.id, newContent)}
              onEditAndRegenerate={(newContent) => onEditAndRegenerate(msg.id, newContent)}
              onRegenerate={() => onRegenerate(msg.id, model)}
              isLatestAssistant={isLatestAssistant}
              isSidebarOpen={isSidebarOpen}
              setToast={setToast}
            />
          )
        })}
        <div ref={effectiveBottomRef} />
      </div>
    </div>
  )
}
