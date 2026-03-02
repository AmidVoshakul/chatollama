// src/components/AnimatedMessage.jsx
import React, {useMemo, useCallback} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'

export default function AnimatedMessage({
                                            content,
                                            isSidebarOpen = true,
                                            flattenChildrenToString,
                                            disableAnimation = false,
                                        }) {
    // сегментируем на логические блоки (не дробим fenced-код)
    const segments = useMemo(() => {
        const lines = content.split('\n')
        const blocks = []
        let buffer = []
        let inFence = false

        for (let line of lines) {
            buffer.push(line)
            if (line.trim().startsWith('```')) {
                inFence = !inFence
                if (!inFence) {
                    blocks.push(buffer.join('\n'))
                    buffer = []
                }
            } else if (!inFence && line.trim() === '') {
                blocks.push(buffer.join('\n'))
                buffer = []
            }
        }
        if (buffer.length) blocks.push(buffer.join('\n'))
        return blocks.filter(b => b.trim() !== '')
    }, [content])

    const fallbackFlatten = useCallback(function flatten(node) {
        if (node == null) return ''
        if (typeof node === 'string') return node
        if (Array.isArray(node)) return node.map(flatten).join('')
        if (node.props?.children) return flatten(node.props.children)
        return ''
    }, [])

    return (
        <div className="space-y-2 message-markdown">
            {segments.map((seg, idx) => {
                // если анимации отключены — сразу вывести весь сегмент
                const className = disableAnimation
                    ? 'opacity-100'
                    : 'opacity-0 animate-fade-in-up'
                const style = disableAnimation
                    ? {}
                    : {
                        animationDelay: `${idx * 120}ms`,
                        animationFillMode: 'forwards',
                    }

                return (
                    <div key={idx} className={className} style={style}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                // вместо <pre> ловим <code>
                                code({inline, className, children, ...props}) {
                                    const language = className ? className.replace('language-', '') : ''
                                    const codeText = String(children).replace(/\n$/, '')
                                    // Дополнительная проверка: если код короткий и без переносов строк - считаем inline
                                    const isShortCode = !codeText.includes('\n') && codeText.length < 100
                                    if (inline || isShortCode) {
                                        return (
                                            <code 
                                                className={`inline-code ${className}`} 
                                                {...props}
                                                style={{
                                                    backgroundColor: 'rgba(40,40,40,0.8)',
                                                    color: '#ff6b9d',
                                                    padding: '0.1em 0.3em',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.9em',
                                                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                                                    display: 'inline-block',
                                                    lineHeight: '1.2',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onClick={() => {
                                                    if (navigator.clipboard) {
                                                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
                                                    }
                                                }}
                                                title="Нажмите для копирования"
                                            >
                                                {children}
                                            </code>
                                        )
                                    }
                                    const flattenFn = flattenChildrenToString || fallbackFlatten
                                    return (
                                        <CodeBlock
                                            language={language}
                                            codeText={codeText}
                                            isSidebarOpen={isSidebarOpen}
                                            flattenChildrenToString={flattenFn}
                                        >
                                            {codeText}
                                        </CodeBlock>
                                    )
                                },
                                pre({children}) {
                                    return <>{children}</>
                                },
                                // убираем параграф, чтобы не было div внутри p
                                p({children, ...props}) {
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
                                    return <div {...props}>{children}</div>;
                                },
                            }}
                        >
                            {seg}
                        </ReactMarkdown>
                    </div>
                )
            })}
        </div>
    )
}
