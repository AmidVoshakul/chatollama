// src/components/AssistantMessageContent.jsx
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import AnimatedMessage from './AnimatedMessage'
import ThoughtBubble from './ThoughtBubble'
import LoadingDots from './LoadingDots'

export default function AssistantMessageContent({
    content,
    isEditing,
    isStreaming,
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

    return (
        <div className="p-4 pt-3" style={{ '--code-max-width': codeMaxWidth }}>
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
        </div>
    )
}
