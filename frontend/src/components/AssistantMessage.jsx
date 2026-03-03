// src/components/AssistantMessage.jsx
import React from 'react'
import Message from './Message'

export default function AssistantMessage({
  content,
  thinking,
  model,
  timestamp,
  isTemp,
  hasError,
  isStreaming,
  isRegenerating,
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
        thinking={thinking}
        model={model}
        timestamp={timestamp}
        isTemp={isTemp}
        hasError={hasError}
        isStreaming={isStreaming}
        isRegenerating={isRegenerating}
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
