// src/components/AnimatedMessage.jsx
import React, {useMemo, useCallback, memo} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'

// Кеш для сегментов
const segmentCache = new Map()
const MAX_CACHE_SIZE = 100

function getCacheKey(content) {
  return content.slice(0, 200) + content.length
}

function parseSegments(content) {
  const cacheKey = getCacheKey(content)
  if (segmentCache.has(cacheKey)) {
    return segmentCache.get(cacheKey)
  }
  
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
  const result = blocks.filter(b => b.trim() !== '')
  
  // Ограничиваем размер кеша
  if (segmentCache.size >= MAX_CACHE_SIZE) {
    const firstKey = segmentCache.keys().next().value
    segmentCache.delete(firstKey)
  }
  segmentCache.set(cacheKey, result)
  
  return result
}

const MemoizedCodeBlock = memo(CodeBlock)

export default function AnimatedMessage({
  content,
  isSidebarOpen = true,
  flattenChildrenToString,
  disableAnimation = false,
}) {
  // Парсим сегменты с кешированием
  const segments = useMemo(() => {
    return parseSegments(content)
  }, [content])

  const fallbackFlatten = useCallback(function flatten(node) {
    if (node == null) return ''
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map(flatten).join('')
    if (node.props?.children) return flatten(node.props.children)
    return ''
  }, [])

  // Рендерим сегменты
  return (
    <div className="space-y-2 message-markdown">
      {segments.map((seg, idx) => {
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
          <div key={`${idx}-${seg.slice(0, 20)}`} className={className} style={style}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({inline, className, children, ...props}) {
                  const language = className ? className.replace('language-', '') : ''
                  const codeText = String(children).replace(/\n$/, '')
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
                    <MemoizedCodeBlock
                      language={language}
                      codeText={codeText}
                      isSidebarOpen={isSidebarOpen}
                      flattenChildrenToString={flattenFn}
                    />
                  )
                },
                pre({children}) {
                  return <>{children}</>
                },
                p({children, ...props}) {
                  const getTextContent = (node) => {
                    if (!node) return ''
                    if (typeof node === 'string') return node
                    if (typeof node === 'number') return String(node)
                    if (Array.isArray(node)) return node.map(getTextContent).join('')
                    if (node.props?.children) return getTextContent(node.props.children)
                    return ''
                  }
                  const text = getTextContent(children)
                  if (text.includes('🔹') || text.includes('•') || text.includes('▸')) {
                    const items = text.split(/(?:🔹|•|▸)\s*/).filter(Boolean)
                    if (items.length > 1) {
                      return (
                        <ul className="my-2 ml-2">
                          {items.map((item, i) => (
                            <li key={i} className="my-1">{item.trim()}</li>
                          ))}
                        </ul>
                      )
                    }
                  }
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
