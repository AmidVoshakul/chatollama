// src/components/ThoughtBubble.jsx
import React, {useEffect, useRef, useState} from 'react'

export default function ThoughtBubble({content, isGenerating, onFadeOut}) {
    const lines = typeof content === 'string' ? content.split('\n') : [content]
    const [visibleLines, setVisibleLines] = useState([])
    const [visible, setVisible] = useState(true)
    const finishedRevealRef = useRef(false)
    const fadeTimeoutRef = useRef(null)
    const revealedRef = useRef(false)
    const onFadeCalledRef = useRef(false)

    useEffect(() => {
        let index = 0
        const step = 8
        const delay = 400 // скорость раскрытия

        revealedRef.current = false
        finishedRevealRef.current = false
        onFadeCalledRef.current = false
        setVisible(true)
        setVisibleLines([])

        const revealInterval = setInterval(() => {
            index += step
            setVisibleLines(lines.slice(0, index))

            if (index >= lines.length) {
                clearInterval(revealInterval)
                revealedRef.current = true
                finishedRevealRef.current = true

                // Если генерация уже завершена, запустить таймер исчезновения.
                // Если генерация ещё идёт, другой эффект (ниже) запустит таймер при завершении.
                if (!isGenerating) {
                    const fadeDelay = 600
                    fadeTimeoutRef.current = setTimeout(() => {
                        if (!onFadeCalledRef.current) {
                            onFadeCalledRef.current = true
                            setVisible(false)
                            onFadeOut?.()
                        }
                    }, fadeDelay)
                }
            }
        }, delay)

        return () => {
            clearInterval(revealInterval)
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content])

    // Следим за isGenerating: когда генерация закончилась и reveal уже завершён, запускаем fade
    useEffect(() => {
        if (!isGenerating && finishedRevealRef.current && !onFadeCalledRef.current) {
            // небольшая задержка чтобы дать шанс UI обновиться
            fadeTimeoutRef.current = setTimeout(() => {
                if (!onFadeCalledRef.current) {
                    onFadeCalledRef.current = true
                    setVisible(false)
                    onFadeOut?.()
                }
            }, 600)
        }

        return () => {
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
        }
    }, [isGenerating, onFadeOut])

    return (
        <div
            className={`my-3 px-4 py-3 rounded-lg border border-theme bg-[var(--bg-surface)] shadow-sm shimmer pulse-slow transition-opacity duration-700 ${
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            role="note"
            aria-live="polite"
        >
            <div className="text-[var(--text-main)] text-sm whitespace-pre-line leading-relaxed">
                {visibleLines.join('\n')}
            </div>
        </div>
    )
}
