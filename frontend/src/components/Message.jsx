// src/components/Message.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import CodeBlock from './CodeBlock'
import AnimatedMessage from './AnimatedMessage'
import ThoughtBubble from './ThoughtBubble'
import LoadingDots from './LoadingDots'


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

    const tooltipRef = useRef(null)
    const textareaRef = useRef(null)

    // sync editText ← content
    useEffect(() => {
        setEditText(content)
    }, [content])

    // close dropdown on outside click
    useEffect(() => {
        function onClickOutside(e) {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
                setShowActions(false)
            }
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

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
                    <div className="flex items-center px-1 py-1 text-xs text-[var(--text-muted)] relative">
                        {formattedDate && <span className="mr-2 text-[var(--text-muted)]/70">{formattedDate}</span>}
                        <button
                            onClick={() => setShowActions(v => !v)}
                            className="hover:bg-[rgba(0,0,0,0.06)] p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                            aria-label="Открыть действия"
                            aria-expanded={showActions}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="5" cy="12" r="2" />
                                <circle cx="12" cy="12" r="2" />
                                <circle cx="19" cy="12" r="2" />
                            </svg>
                        </button>
                        {showActions && (
                            <div
                                ref={tooltipRef}
                                className="absolute top-8 right-0 bg-[var(--bg-surface)] border border-theme rounded-xl shadow-xl p-2 z-20 backdrop-blur-sm bg-opacity-95"
                            >
                                <div className="flex gap-2 text-[var(--text-main)] text-sm bg-[var(--bg-variant)] rounded-lg p-1">
                                    <button
                                        onClick={() => handleCopy(content)}
                                        title="Копировать"
                                        className={`p-2 rounded-lg transition-all duration-200 ${
                                            copied ? 'text-green-400 bg-green-500/10 scale-110' : 'text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10'
                                        }`}
                                    >
                                        {copied ? (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.285 6.709l-11.285 11.285-5.285-5.285 1.415-1.414 3.87 3.87 9.87-9.87z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zM20 5H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                                            </svg>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditText(content)
                                            setIsEditing(true)
                                            setShowActions(false)
                                            setTimeout(() => textareaRef.current?.focus(), 50)
                                        }}
                                        title="Редактировать"
                                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-yellow-400 hover:bg-yellow-500/10 transition-all duration-200"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.34a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        title="Удалить"
                                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 7h12v2H6zM9 9h6v10H9z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
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
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
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
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                        </svg>
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
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Сохранить и отправить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-3 pt-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
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
                            <button
                                onClick={() => setShowActions(v => !v)}
                                className="hover:bg-[rgba(0,0,0,0.06)] p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
                                aria-label="Открыть действия"
                                aria-expanded={showActions}
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="5" cy="12" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="19" cy="12" r="2" />
                                </svg>
                            </button>

                            {role === 'assistant' && model && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/25 text-purple-300 text-[10px] font-semibold mr-3 shadow-sm">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                    {model}
                                </span>
                            )}
                            {formattedDate && <span className="text-[var(--text-muted)]/70">{formattedDate}</span>}

                            {showActions && (
                                <div
                                    ref={tooltipRef}
                                    className="absolute top-10 left-3 bg-[var(--bg-surface)] border border-theme rounded-xl shadow-xl p-2 z-20 backdrop-blur-sm bg-opacity-95"
                                >
                                    <div className="flex gap-2 text-[var(--text-main)] text-sm bg-[var(--bg-variant)] rounded-lg p-1">
                                        <button
                                            onClick={onDelete}
                                            title="Удалить"
                                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 7h12v2H6zM9 9h6v10H9z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleCopy(content)}
                                            title="Копировать"
                                            className={`p-2 rounded-lg transition-all duration-200 ${
                                                copied ? 'text-green-400 bg-green-500/10 scale-110' : 'text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10'
                                            }`}
                                        >
                                            {copied ? (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20.285 6.709l-11.285 11.285-5.285-5.285 1.415-1.414 3.87 3.87 9.87-9.87z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zM20 5H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditText(content)
                                                setIsEditing(true)
                                                setShowActions(false)
                                                setTimeout(() => textareaRef.current?.focus(), 50)
                                            }}
                                            title="Редактировать"
                                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-yellow-400 hover:bg-yellow-500/10 transition-all duration-200"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.34a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                                            </svg>
                                        </button>
                                        {role === 'assistant' && (
                                            <button
                                                onClick={handleRegenerate}
                                                disabled={isGenerating}
                                                title="Перегенерировать"
                                                className={`p-2 rounded-lg transition-all duration-200 ${
                                                    isGenerating ? 'text-purple-400 opacity-70 cursor-not-allowed' : 'text-[var(--text-muted)] hover:text-purple-400 hover:bg-purple-500/10'
                                                }`}
                                            >
                                                <svg className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 .34-.03.67-.08.99l1.53 1.53C19.82 13.18 20 12.61 20 12c0-4.42-3.58-8-8-8zM12 20v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-.34.03-.67.08-.99l-1.53-1.53C4.18 10.82 4 11.39 4 12c0 4.42 3.58 8 8 8z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
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
                                    {!streamingThought && isStreaming && (
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
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                                <button
                                    onClick={submitEdit}
                                    title="Сохранить"
                                    className="hover:text-blue-400 text-[var(--text-muted)] transition-transform hover:scale-110"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </React.Fragment>
                )}
            </div>
        </div>
    )
}