// src/components/ThoughtBubble.jsx
import React, {useState, useEffect, useRef} from 'react'

export default function ThoughtBubble({content, isGenerating}) {
    const [expanded, setExpanded] = useState(false)
    const [displayedContent, setDisplayedContent] = useState('')
    const [finalTime, setFinalTime] = useState(null)
    const startTimeRef = useRef(null)

    useEffect(() => {
        if (expanded) {
            setDisplayedContent(content)
        }
    }, [content, expanded])

    useEffect(() => {
        if (isGenerating && !expanded) {
            if (!startTimeRef.current) {
                startTimeRef.current = Date.now()
            }
            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
                setFinalTime(elapsed)
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [isGenerating, expanded])

    const formatTime = (seconds) => {
        if (seconds === null) return ''
        if (seconds < 60) return `${seconds}s`
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    const hasContent = content && content.trim().length > 0
    const showShimmer = isGenerating && !expanded && hasContent

    return (
        <div
            className={`my-3 w-[60%] rounded-lg border border-theme bg-[var(--bg-surface)] shadow-sm transition-all duration-300 ${
                showShimmer ? 'relative overflow-hidden' : ''
            }`}
            role="note"
            aria-live="polite"
        >
            {showShimmer && (
                <div className="absolute inset-0 shimmer-gradient opacity-30 pointer-events-none" />
            )}
            <div 
                className="flex items-center justify-between px-4 py-2 cursor-pointer select-none"
                onClick={() => setExpanded(v => !v)}
            >
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)]">
                    <span className={showShimmer ? 'shimmer-text font-bold' : ''}>Thinking</span>
                    {isGenerating && <span className="animate-pulse">...</span>}
                </div>
                <div className="flex items-center gap-2">
                    {finalTime !== null && (
                        <span className="text-purple-200 font-mono text-xs">
                            {formatTime(finalTime)}
                        </span>
                    )}
                    <span className="text-[var(--text-muted)] text-lg leading-none">
                        {expanded ? '▼' : '▶'}
                    </span>
                </div>
            </div>
            
            {expanded && hasContent && (
                <div className="px-4 pb-3">
                    <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                    <div className="text-[var(--text-main)] text-sm whitespace-pre-line leading-relaxed mt-2">
                        {displayedContent}
                        {isGenerating && (
                            <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse" />
                        )}
                    </div>
                </div>
            )}
            
            <style>{`
                @keyframes shimmerGradient {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .shimmer-gradient {
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(168, 85, 247, 0.15) 25%,
                        rgba(168, 85, 247, 0.3) 50%,
                        rgba(168, 85, 247, 0.15) 75%,
                        transparent 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmerGradient 2s ease-in-out infinite;
                }
                @keyframes shimmerText {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .shimmer-text {
                    background: linear-gradient(
                        90deg,
                        rgba(168, 85, 247, 0.2) 0%,
                        rgba(255, 255, 255, 0.9) 45%,
                        rgba(168, 85, 247, 0.2) 55%,
                        rgba(168, 85, 247, 0.2) 100%
                    );
                    background-size: 200% 100%;
                    -webkit-background-clip: text;
                    background-clip: text;
                    animation: shimmerText 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
