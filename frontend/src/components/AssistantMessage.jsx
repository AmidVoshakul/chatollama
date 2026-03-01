// src/components/AssistantMessage.jsx
import React from 'react'
import Message from './Message'

export default function AssistantMessage({
  content,
  model,
  timestamp,
  isTemp,
  hasError,
  isStreaming,
  isLatestAssistant,
  isSidebarOpen,
  transparentMode,
  setToast,
  onDelete,
  onEdit,
  onEditAndRegenerate,
  onRegenerate,
  streamingThought,
  thoughtsEnded,
}) {
  return (
    <div>
      <Message
        role="assistant"
        content={content}
        model={model}
        timestamp={timestamp}
        isTemp={isTemp}
        hasError={hasError}
        isStreaming={isStreaming}
        thoughtsEnded={thoughtsEnded}
        streamingThought={streamingThought}
        onDelete={onDelete}
        onEdit={onEdit}
        onEditAndRegenerate={onEditAndRegenerate}
        onRegenerate={onRegenerate}
        isLatestAssistant={isLatestAssistant}
        isSidebarOpen={isSidebarOpen}
        transparentMode={transparentMode}
        setToast={setToast}
      />
    </div>
  )
}
