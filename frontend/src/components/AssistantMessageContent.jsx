// src/components/AssistantMessageContent.jsx
import React from 'react'
import AnimatedMessage from './AnimatedMessage'
import ThoughtBubble from './ThoughtBubble'
import LoadingDots from './LoadingDots'

export default function AssistantMessageContent({
    content,
    isEditing,
    isStreaming,
    isRegenerating,
    streamingThought,
    thoughtsEnded,
    isSidebarOpen,
    flattenChildrenToString,
}) {
    const codeMaxWidth = isSidebarOpen
        ? 'calc(100vw - 23rem)'
        : 'calc(100vw - 12rem)'

    if (isEditing) {
        return null
    }

    const isLoading = isStreaming || isRegenerating

    return (
        <div className="p-4 pt-3" style={{ '--code-max-width': codeMaxWidth }}>
            {streamingThought && (
                <ThoughtBubble
                    content={streamingThought}
                    isGenerating={!thoughtsEnded}
                />
            )}
            {!streamingThought && isLoading && !content && (
                <LoadingDots />
            )}
            <AnimatedMessage
                content={content}
                isSidebarOpen={isSidebarOpen}
                flattenChildrenToString={flattenChildrenToString}
                disableAnimation={isLoading}
            />
        </div>
    )
}
