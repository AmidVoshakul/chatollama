// src/components/MessageList.jsx
import React, { useRef, useEffect, useMemo } from 'react'
import Message from './Message'
import AssistantMessage from './AssistantMessage'

export default function MessageList({
  messages,
  model,
  isSidebarOpen,
  transparentMode,
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

  useEffect(() => {
    if (effectiveBottomRef.current) {
      setTimeout(
        () =>
          effectiveBottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          }),
        80
      )
    }
  }, [messages.length])

  const hasThoughtPresent = useMemo(
    () => messages.some(m => m.type === 'thought'),
    [messages]
  )

  return (
    <div className="flex-1 overflow-auto space-y-4 pb-28 custom-scroll">
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
            <AssistantMessage
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
              transparentMode={transparentMode}
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
          <Message
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
            transparentMode={transparentMode}
            setToast={setToast}
          />
        )
      })}
      <div ref={effectiveBottomRef} />
    </div>
  )
}
