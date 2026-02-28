import React, {useState, useMemo} from 'react'
import hljs from 'highlight.js'

export default function CodeBlock({children, codeText, language, isSidebarOpen, flattenChildrenToString}) {
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
        sh: 'Bash',
        shell: 'Bash',
        typescript: 'TS',
        java: 'Java',
        go: 'Go',
        rust: 'Rust',
        c: 'C',
        cpp: 'C++',
        sql: 'SQL',
        yaml: 'YAML',
        xml: 'XML',
        markdown: 'MD',
        dockerfile: 'Docker',
    }

    const displayLang = languageMap[language?.toLowerCase()] || language?.toUpperCase() || 'CODE'

    const text = codeText || (typeof flattenChildrenToString === 'function'
        ? flattenChildrenToString(children)
        : Array.isArray(children)
            ? children.map(c => (typeof c === 'string' ? c : '')).join('')
            : typeof children === 'string'
                ? children
                : '')

    const highlightedCode = useMemo(() => {
        if (!text) return ''
        try {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(text, { language }).value
            }
            return hljs.highlightAuto(text).value
        } catch {
            return text
        }
    }, [text, language])

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text || '')
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // ignore
        }
    }

    const maxWidth = isSidebarOpen ? 'calc(100vw - 23rem)' : 'calc(100vw - 12rem)'

    return (
        <div className="relative my-4 rounded-lg border border-theme bg-[var(--code-bg)] shadow-lg">
            {/* Header */}
            <div
                className="flex justify-between items-center px-4 py-2.5 text-xs text-[var(--text-muted)] bg-gradient-to-r from-[var(--bg-variant)] to-[var(--code-bg)]"
            >
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
                        <span className="w-3 h-3 rounded-full bg-green-500/70"></span>
                    </div>
                    <span className="uppercase font-medium tracking-wide text-[10px] opacity-70">{displayLang}</span>
                    <button
                        onClick={() => setCollapsed(prev => !prev)}
                        className="hover:text-yellow-400 transition-colors duration-200 ml-1"
                        title={collapsed ? 'Развернуть' : 'Свернуть'}
                        aria-pressed={collapsed}
                        aria-label="Свернуть/развернуть код"
                    >
                        {collapsed ? (
                            <svg className="w-4 h-4 transform rotate-180 transition-transform" viewBox="0 0 24 24"
                                 fill="currentColor" aria-hidden>
                                <path d="M7 14l5-5 5 5H7z"/>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 transition-transform" viewBox="0 0 24 24" fill="currentColor"
                                 aria-hidden>
                                <path d="M7 10l5 5 5-5H7z"/>
                            </svg>
                        )}
                    </button>
                </div>

                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all duration-200 ${
                        copied 
                            ? 'bg-green-500/20 text-green-400 scale-105' 
                            : 'hover:bg-white/10 hover:text-blue-400'
                    }`}
                    title="Скопировать"
                    aria-label="Скопировать код"
                >
                    {copied ? (
                        <>
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path d="M20.285 6.709l-11.285 11.285-5.285-5.285 1.415-1.414 3.87 3.87 9.87-9.87z"/>
                            </svg>
                            <span className="text-[10px] font-medium">Скопировано</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zM20 5H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
                            </svg>
                            <span className="text-[10px] font-medium">Копировать</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code content */}
            {!collapsed && (
                <div className="w-full min-w-0 overflow-hidden" style={{maxWidth}}>
                    <div className="overflow-x-auto w-full">
                        <div 
                            className="p-4 text-sm font-mono whitespace-pre max-w-full leading-relaxed"
                            dangerouslySetInnerHTML={{__html: highlightedCode || text}}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
