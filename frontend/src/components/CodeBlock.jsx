import React, {useState} from 'react'

export default function CodeBlock({children, language, isSidebarOpen, flattenChildrenToString}) {
    const [collapsed, setCollapsed] = useState(false)
    const [copied, setCopied] = useState(false)

    const languageMap = {
        javascript: 'JS',
        jsx: 'JSX',
        python: 'Python',
        css: 'CSS',
        html: 'HTML',
        tsx: 'TSX',
        json: 'JSON',
        bash: 'Bash',
    }

    const displayLang = languageMap[language?.toLowerCase()] || language?.toUpperCase() || 'CODE'

    const codeText = typeof flattenChildrenToString === 'function'
        ? flattenChildrenToString(children)
        : Array.isArray(children)
            ? children.map(c => (typeof c === 'string' ? c : '')).join('')
            : typeof children === 'string'
                ? children
                : ''

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeText || '')
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // ignore
        }
    }

    const maxWidth = isSidebarOpen ? 'calc(100vw - 23rem)' : 'calc(100vw - 12rem)'

    return (
        <div className="relative my-4 rounded-lg border border-theme bg-[var(--code-bg)]">
            {/* Header */}
            <div
                className="flex justify-between items-center px-4 py-2 text-xs text-[var(--text-muted)] bg-[var(--code-bg)] border-b border-theme">
                <div className="flex items-center gap-2">
                    <span className="uppercase">{displayLang}</span>
                    <button
                        onClick={() => setCollapsed(prev => !prev)}
                        className="hover:text-yellow-400 transition-transform duration-200"
                        title={collapsed ? 'Развернуть' : 'Свернуть'}
                        aria-pressed={collapsed}
                        aria-label="Свернуть/развернуть код"
                    >
                        {collapsed ? (
                            <svg className="w-5 h-5 transform rotate-180 transition-transform" viewBox="0 0 24 24"
                                 fill="currentColor" aria-hidden>
                                <path d="M7 14l5-5 5 5H7z"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="currentColor"
                                 aria-hidden>
                                <path d="M7 10l5 5 5-5H7z"/>
                            </svg>
                        )}
                    </button>
                </div>

                <button
                    onClick={handleCopy}
                    className={`transition-transform duration-200 ${copied ? 'scale-110 text-green-400' : 'hover:text-blue-400'}`}
                    title="Скопировать"
                    aria-label="Скопировать код"
                >
                    {copied ? (
                        <svg className="w-4 h-4 align-middle" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path d="M20.285 6.709l-11.285 11.285-5.285-5.285 1.415-1.414 3.87 3.87 9.87-9.87z"/>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4 align-middle" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path
                                d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zM20 5H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
                        </svg>
                    )}
                </button>
            </div>

            {/* Code content */}
            {!collapsed && (
                <div className="w-full min-w-0 overflow-hidden" style={{maxWidth}}>
                    <div className="overflow-x-auto w-full">
                        <div className="p-4 text-sm text-[var(--text-main)] font-mono whitespace-pre max-w-full">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
