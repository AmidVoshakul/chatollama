// src/components/Message.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import './animations/Animations.css'
import CodeBlock from './CodeBlock'
import AnimatedMessage from './AnimatedMessage'
import ThoughtBubble from './ThoughtBubble'
import LoadingDots from './LoadingDots'
import MessageActions from './MessageActions'
import MessageMenuButton from './MessageMenuButton'
import { UserIcon, CpuIcon, XIcon, SaveIcon, SendIcon } from './icons/MessageIcons'


export default function Message({
    role,
    content,
    model,
    timestamp,
    onDelete,
    onEdit,
    onEditAndRegenerate,
    onRegenerate,
    hasError,
    isSidebarOpen = true,
    isStreaming = false,
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

    // sync editText ← content
    useEffect(() => {
        setEditText(content)
    }, [content])

    // Очистка таймаута при размонтировании
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    // Функция для безопасного закрытия с задержкой
    const closeWithDelay = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setShowActions(false)
        }, 300) // 300ms задержка
    }, [])

    // Функция для немедленного открытия (отмена закрытия)
    const cancelCloseDelay = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
    }, [])

    // close dropdown on outside click - теперь обрабатывается в MessageActions

    // auto-resize edit textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [editText, isEditing])

    // copy handler
    const handleCopy = useCallback(text => {
        if (!navigator.clipboard) return
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        })
    }, [])

    // regenerate assistant answer
    const handleRegenerate = useCallback(async () => {
        if (isGenerating) return
        setIsGenerating(true)
        try {
            await onRegenerate?.()
        } finally {
            setIsGenerating(false)
        }
    }, [isGenerating, onRegenerate])

    // timestamp formatting
    const formattedDate = timestamp
        ? new Date(timestamp).toLocaleString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : ''

    // flatten JSX→string for CodeBlock copy
    const flattenChildrenToString = useCallback(function flatten(node) {
        if (node == null) return ''
        if (typeof node === 'string') return node
        if (Array.isArray(node)) return node.map(flatten).join('')
        if (node.props && node.props.children) return flatten(node.props.children)
        return ''
    }, [])

    // submit edit — close editor immediately after onEdit
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

    // Escape → close dropdown/edit
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') {
                setShowActions(false)
                setIsEditing(false)
            }
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    // alignment classes
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

    // show error state
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

    // compute code max width
    const codeMaxWidth = isSidebarOpen
        ? 'calc(100vw - 23rem)'
        : 'calc(100vw - 12rem)'

    return (
        <div className={`my-4 ${containerAlignment}`}>
            {isUser && (
                <div className="flex flex-col items-end mb-1">
                    <div className="flex items-center px-2 py-1.5 text-xs text-[var(--text-muted)] relative">
                        <div 
                            className="relative"
                            onMouseEnter={() => {
                                cancelCloseDelay()
                                setShowActions(true)
                            }}
                            onMouseLeave={() => closeWithDelay()}
                        >
                            <MessageMenuButton 
                                showActions={showActions}
                                onClick={() => setShowActions(v => !v)}
                            />
                            <MessageActions
                                show={showActions}
                                onClose={() => setShowActions(false)}
                                position="right"
                                copied={copied}
                                role="user"
                                triggerHover={true}
                                onMouseEnter={cancelCloseDelay}
                                onMouseLeave={closeWithDelay}
                                onCopy={() => handleCopy(content)}
                                onEdit={() => {
                                    setEditText(content)
                                    setIsEditing(true)
                                    setShowActions(false)
                                    setTimeout(() => textareaRef.current?.focus(), 50)
                                }}
                                onDelete={onDelete}
                            />
                        </div>
                        {formattedDate && <span className="ml-3 text-[var(--text-muted)]/70 font-medium">{formattedDate}</span>}
                    </div>
                </div>
            )}
            <div className={bubbleClasses}>
                {role === 'user' ? (
                    isEditing ? (
                        <div className="p-3">
                            <textarea
                                ref={textareaRef}
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        submitEdit()
                                    }
                                }}
                                className="w-full bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-lg border border-theme focus:outline-none resize-none overflow-hidden text-sm"
                                style={{ minHeight: '2.5rem' }}
                                aria-label="Редактирование"
                            />
                            <div className="flex justify-between items-center mt-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false)
                                        setEditText(content)
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                >
                                    <XIcon className="w-4 h-4" />
                                    Отмена
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            if (editText.trim()) {
                                                setIsEditing(false)
                                                if (onEdit) {
                                                    await onEdit(editText)
                                                }
                                            } else {
                                                setIsEditing(false)
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-200"
                                    >
                                        <SaveIcon className="w-4 h-4" />
                                        Сохранить
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (editText.trim()) {
                                                setIsEditing(false)
                                                if (onEditAndRegenerate) {
                                                    await onEditAndRegenerate(editText)
                                                }
                                            } else {
                                                setIsEditing(false)
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90 transition-all duration-200"
                                    >
                                        <SendIcon className="w-4 h-4" />
                                        Сохранить и отправить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-3 pt-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <UserIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="message-user-content text-[var(--text-main)] text-[15px] leading-relaxed break-words">
                                    {content}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <React.Fragment>
                        <div className="flex items-center px-4 py-2.5 text-xs text-[var(--text-muted)] relative">
                            <div 
                                className="relative"
                                onMouseEnter={() => {
                                    cancelCloseDelay()
                                    setShowActions(true)
                                }}
                                onMouseLeave={() => closeWithDelay()}
                            >
                                <MessageMenuButton 
                                    showActions={showActions}
                                    onClick={() => setShowActions(v => !v)}
                                />
                                <MessageActions
                                    show={showActions}
                                    onClose={() => setShowActions(false)}
                                    position="left"
                                    copied={copied}
                                    isGenerating={isGenerating}
                                    role="assistant"
                                    triggerHover={true}
                                    onMouseEnter={cancelCloseDelay}
                                    onMouseLeave={closeWithDelay}
                                    onCopy={() => handleCopy(content)}
                                    onEdit={() => {
                                        setEditText(content)
                                        setIsEditing(true)
                                        setShowActions(false)
                                        setTimeout(() => textareaRef.current?.focus(), 50)
                                    }}
                                    onDelete={onDelete}
                                    onRegenerate={handleRegenerate}
                                />
                            </div>

                            {role === 'assistant' && model && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-500/25 text-violet-300 text-[10px] font-semibold mr-3 shadow-sm">
                                    <CpuIcon className="w-3 h-3" />
                                    {model}
                                </span>
                            )}
                            {formattedDate && <span className="text-[var(--text-muted)]/70 font-medium">{formattedDate}</span>}
                        </div>

                        <div className="p-4 pt-3" style={{ '--code-max-width': codeMaxWidth }}>
                            {isEditing ? (
                                <textarea
                                    ref={textareaRef}
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            submitEdit()
                                        }
                                    }}
                                    onBlur={submitEdit}
                                    className="w-full bg-[var(--bg-main)] text-[var(--text-main)] p-3 rounded-lg border border-theme focus:outline-none resize-none overflow-hidden text-sm"
                                    style={{ minHeight: '2.5rem' }}
                                    aria-label="Редактирование"
                                />
                            ) : role === 'assistant' ? (
                                <>
                                    {streamingThought && (
                                        <ThoughtBubble
                                            content={streamingThought}
                                            isGenerating={!thoughtsEnded}
                                        />
                                    )}
                                    {!streamingThought && isStreaming && !content && (
                                        <LoadingDots />
                                    )}
                                    <AnimatedMessage
                                        content={content}
                                        isSidebarOpen={isSidebarOpen}
                                        flattenChildrenToString={flattenChildrenToString}
                                        disableAnimation={isStreaming}
                                    />
                                </>
                            ) : (
                                <div className="message-markdown" style={{ maxWidth: '100%' }}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p({children}) {
                                                const getTextContent = (node) => {
                                                    if (!node) return '';
                                                    if (typeof node === 'string') return node;
                                                    if (typeof node === 'number') return String(node);
                                                    if (Array.isArray(node)) return node.map(getTextContent).join('');
                                                    if (node.props?.children) return getTextContent(node.props.children);
                                                    return '';
                                                };
                                                const text = getTextContent(children);
                                                if (text.includes('🔹') || text.includes('•') || text.includes('▸')) {
                                                    const items = text.split(/(?:🔹|•|▸)\s*/).filter(Boolean);
                                                    if (items.length > 1) {
                                                        return (
                                                            <ul className="my-2 ml-2">
                                                                {items.map((item, i) => (
                                                                    <li key={i} className="my-1">{item.trim()}</li>
                                                                ))}
                                                            </ul>
                                                        );
                                                    }
                                                }
                                                return <p className="my-2">{children}</p>;
                                            },
                                            code({ inline, className = '', children, ...props }) {
                                                const language = className.replace('language-', '')
                                                const codeText = String(children).replace(/\n$/, '')
                                                if (inline) {
                                                    return (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    )
                                                }
                                                return (
                                                    <CodeBlock
                                                        className={className}
                                                        language={language}
                                                        codeText={codeText}
                                                        isSidebarOpen={isSidebarOpen}
                                                        flattenChildrenToString={flattenChildrenToString}
                                                    >
                                                        {codeText}
                                                    </CodeBlock>
                                                )
                                            },
                                        }}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {isEditing && (
                            <div className="flex w-full items-center gap-3 px-3 py-2 border-t border-theme bg-[var(--bg-surface)] sticky bottom-0 z-10 animate-fade-in">
                                <button
                                    onClick={() => {
                                        setIsEditing(false)
                                        setEditText(content)
                                    }}
                                    title="Отменить"
                                    className="hover:text-red-400 text-[var(--text-muted)] transition-transform hover:scale-110"
                                >
                                    <XIcon className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={submitEdit}
                                    title="Сохранить"
                                    className="hover:text-blue-400 text-[var(--text-muted)] transition-transform hover:scale-110"
                                >
                                    <SaveIcon className="w-6 h-6" />
                                </button>
                            </div>
                        )}
                    </React.Fragment>
                )}
            </div>
        </div>
    )
}