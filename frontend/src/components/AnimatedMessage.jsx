// src/components/AnimatedMessage.jsx
import React, {useMemo, useCallback} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
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
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                                // вместо <pre> ловим <code>
                                code({inline, className, children, ...props}) {
                                    if (inline) {
                                        return (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        )
                                    }
                                    const flattenFn = flattenChildrenToString || fallbackFlatten
                                    return (
                                        <CodeBlock
                                            isSidebarOpen={isSidebarOpen}
                                            flattenChildrenToString={flattenFn}
                                        >
                                            {children}
                                        </CodeBlock>
                                    )
                                },
                                // убираем параграф, чтобы не было div внутри p
                                p({children, ...props}) {
                                    return <div {...props}>{children}</div>
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
