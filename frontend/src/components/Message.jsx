// src/components/Message.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import 'highlight.js/styles/github-dark.css'
import './animations/Animations.css'
import MessageHeader from './MessageHeader'
import UserMessage from './UserMessage'
import MessageEditor from './MessageEditor'
import AssistantMessageContent from './AssistantMessageContent'
import ThoughtBubble from './ThoughtBubble'

export default function Message({
    role,
    content,
    thinking,
    model,
    timestamp,
    onDelete,
    onEdit,
    onEditAndRegenerate,
    onRegenerate,
    hasError,
    isSidebarOpen = true,
    isStreaming = false,
    isRegenerating = false,
    streamingThought,
    thoughtsEnded = false,
}) {
    const [showActions, setShowActions] = useState(false)
    const [copied, setCopied] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(content)
    const [isGenerating, setIsGenerating] = useState(false)

    const textareaRef = useRef(null)
    const hoverTimeoutRef = useRef(null)

    useEffect(() => {
        setEditText(content)
    }, [content])

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    const closeWithDelay = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setShowActions(false)
        }, 300)
    }, [])

    const cancelCloseDelay = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
    }, [])

    const handleCopy = useCallback(text => {
        if (!navigator.clipboard) return
        
        let timeoutId
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            timeoutId = setTimeout(() => setCopied(false), 1500)
        })
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [])

    const handleRegenerate = useCallback(async () => {
        if (isGenerating) return
        setIsGenerating(true)
        try {
            await onRegenerate?.()
        } finally {
            setIsGenerating(false)
        }
    }, [isGenerating, onRegenerate])

    const formattedDate = timestamp
        ? new Date(timestamp).toLocaleString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : ''

    const flattenChildrenToString = useCallback(function flatten(node) {
        if (node == null) return ''
        if (typeof node === 'string') return node
        if (Array.isArray(node)) return node.map(flatten).join('')
        if (node.props && node.props.children) return flatten(node.props.children)
        return ''
    }, [])

    const submitEdit = useCallback(async () => {
        if (editText.trim() && editText !== content) {
            try {
                await onEdit(editText, () => setIsEditing(false))
                if (role === 'user') {
                    await onRegenerate?.()
                }
            } catch {}
        } else {
            setIsEditing(false)
        }
    }, [editText, content, onEdit, onRegenerate, role])

    useEffect(() => {
        let isCancelled = false
        
        function onKey(e) {
            if (e.key === 'Escape' && !isCancelled) {
                setShowActions(false)
                setIsEditing(false)
            }
        }
        
        document.addEventListener('keydown', onKey)
        return () => {
            isCancelled = true
            document.removeEventListener('keydown', onKey)
        }
    }, [])

    const containerAlignment = isEditing
        ? 'text-left px-0'
        : role === 'user'
        ? 'text-right pr-4'
        : 'text-left pl-4'

    const bubbleClasses = [
        'rounded-2xl overflow-hidden relative shadow-md',
        isEditing
            ? 'w-full'
            : role === 'user'
            ? 'max-w-[75%] ml-auto user-message-bubble'
            : 'w-full inline-block',
        role === 'assistant' ? 'bg-transparent' : '',
    ].join(' ')

    const isUser = role === 'user'

    if (hasError) {
        return (
            <div className={`my-4 ${containerAlignment}`}>
                <div
                    className={`${bubbleClasses} border border-red-300 bg-red-50 text-red-800 animate-fade-in p-3`}
                >
                    Произошла ошибка. Попробуйте ещё раз.
                </div>
            </div>
        )
    }

    const handleEditStart = () => {
        setEditText(content)
        setIsEditing(true)
        setShowActions(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditText(content)
    }

    return (
        <div className={`my-4 ${containerAlignment}`}>
            {isUser && (
                <div className="flex flex-col items-end">
                    <div className="flex items-center px-2 -py-1.5 text-xs text-[var(--text-muted)] relative">
                        <MessageHeader
                            role="user"
                            formattedDate={formattedDate}
                            showActions={showActions}
                            setShowActions={setShowActions}
                            copied={copied}
                            onCopy={() => handleCopy(content)}
                            onEdit={handleEditStart}
                            onDelete={onDelete}
                            cancelCloseDelay={cancelCloseDelay}
                            closeWithDelay={closeWithDelay}
                            position="right"
                        />
                    </div>
                </div>
            )}
            <div className={bubbleClasses}>
                {role === 'user' ? (
                    isEditing ? (
                        <MessageEditor
                            editText={editText}
                            setEditText={setEditText}
                            onSubmit={async () => {
                                if (editText.trim()) {
                                    setIsEditing(false)
                                    if (onEdit) {
                                        await onEdit(editText)
                                    }
                                } else {
                                    setIsEditing(false)
                                }
                            }}
                            onCancel={handleCancelEdit}
                            onSubmitAndRegenerate={async () => {
                                if (editText.trim()) {
                                    setIsEditing(false)
                                    if (onEditAndRegenerate) {
                                        await onEditAndRegenerate(editText)
                                    }
                                } else {
                                    setIsEditing(false)
                                }
                            }}
                            submitEdit={submitEdit}
                            textareaRef={textareaRef}
                        />
                    ) : (
                        <UserMessage content={content} isEditing={isEditing} />
                    )
                ) : (
                    <>
                        <MessageHeader
                            role="assistant"
                            model={model}
                            formattedDate={formattedDate}
                            showActions={showActions}
                            setShowActions={setShowActions}
                            copied={copied}
                            isGenerating={isGenerating}
                            onCopy={() => handleCopy(content)}
                            onEdit={handleEditStart}
                            onDelete={onDelete}
                            onRegenerate={handleRegenerate}
                            cancelCloseDelay={cancelCloseDelay}
                            closeWithDelay={closeWithDelay}
                            position="left"
                        />

                        {isEditing ? (
                            <MessageEditor
                                editText={editText}
                                setEditText={setEditText}
                                onSubmit={submitEdit}
                                onCancel={handleCancelEdit}
                                onSubmitAndRegenerate={handleCancelEdit}
                                submitEdit={submitEdit}
                                isAssistant={true}
                                textareaRef={textareaRef}
                            />
                        ) : (
                            <>
                                {thinking && (
                                    <ThoughtBubble
                                        content={thinking}
                                        isGenerating={false}
                                    />
                                )}
                                <AssistantMessageContent
                                    content={content}
                                    isEditing={isEditing}
                                    isStreaming={isStreaming}
                                    isRegenerating={isRegenerating}
                                    streamingThought={streamingThought}
                                    thoughtsEnded={thoughtsEnded}
                                    isSidebarOpen={isSidebarOpen}
                                    flattenChildrenToString={flattenChildrenToString}
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
