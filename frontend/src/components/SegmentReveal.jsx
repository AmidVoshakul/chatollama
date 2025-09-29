import React, {useEffect, useState} from 'react'

export default function SegmentReveal({text, delay = 300, chunkSize = 4}) {
    const lines = text.split('\n')
    const [visibleCount, setVisibleCount] = useState(0)

    useEffect(() => {
        setVisibleCount(0)
        const interval = setInterval(() => {
            setVisibleCount(prev => {
                if (prev >= lines.length) {
                    clearInterval(interval)
                    return prev
                }
                return prev + chunkSize
            })
        }, delay)
        return () => clearInterval(interval)
    }, [text, delay, chunkSize])

    return (
        <div className="whitespace-pre-line leading-relaxed text-[var(--text-main)] text-sm animate-fade-in">
            {lines.slice(0, visibleCount).join('\n')}
        </div>
    )
}
