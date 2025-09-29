import React, {useEffect, useMemo, useState} from 'react'

/**
 * Props:
 * - message: { id, content, role, ... }
 * - transparentMode: boolean
 * - thinkDelayMs: number (optional) delay before showing answer, default 2000
 */
export default function ResponseBlock({
                                          message,
                                          transparentMode = false,
                                          thinkDelayMs = 2000,
                                      }) {
    const {id, content} = message || {}

    // extract <think>...</think> and answer
    const {thoughts, answer} = useMemo(() => {
        if (!content) return {thoughts: null, answer: ''}
        const match = content.match(/<think>([\s\S]*?)<\/think>/i)
        const thoughts = match ? match[1].trim() : null
        const answer = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
        return {thoughts, answer}
    }, [content])

    // persist "already animated" state so we animate only once per message id
    const storageKey = 'shownResponses_v1'
    const hasShownBefore = useMemo(() => {
        if (!id) return false
        try {
            const raw = localStorage.getItem(storageKey)
            if (!raw) return false
            const set = new Set(JSON.parse(raw))
            return set.has(String(id))
        } catch {
            return false
        }
    }, [id])

    const markShown = () => {
        if (!id) return
        try {
            const raw = localStorage.getItem(storageKey)
            const arr = raw ? JSON.parse(raw) : []
            if (!arr.includes(String(id))) {
                arr.push(String(id))
                localStorage.setItem(storageKey, JSON.stringify(arr))
            }
        } catch {
        }
    }

    const [showAnswer, setShowAnswer] = useState(hasShownBefore || !thoughts)
    const [revealNow, setRevealNow] = useState(hasShownBefore) // if true, skip think animation and animate answer lines if not already shown

    useEffect(() => {
        let t
        if (thoughts && !hasShownBefore) {
            // show "thinking" first, then reveal answer after delay
            setShowAnswer(false)
            setRevealNow(false)
            t = setTimeout(() => {
                setShowAnswer(true)
                setRevealNow(true)
                markShown()
            }, thinkDelayMs)
        } else {
            // no thoughts or already shown before -> show answer immediately
            setShowAnswer(true)
            if (!hasShownBefore) markShown()
            setRevealNow(true)
        }
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, content])

    // split answer into lines for staggered appear
    const lines = useMemo(() => (answer ? answer.split('\n').filter(Boolean) : []), [answer])

    return (
        <div
            className={`response-block transition-opacity duration-300 ${
                transparentMode ? 'opacity-75' : 'opacity-100'
            }`}
            aria-live="polite"
        >
            {thoughts && !showAnswer && (
                <div className="think-row text-sm italic text-gray-400 mb-2 select-none">
                    <span className="think-dot animate-think-pulse"/> Модель размышляет…
                </div>
            )}

            {showAnswer && (
                <div className="answer-block">
                    {lines.length === 0 ? (
                        <p className="text-sm text-gray-100">{answer}</p>
                    ) : (
                        lines.map((line, i) => {
                            // if response was shown before, don't re-run stagger animation: simply render visible text
                            const style = hasShownBefore
                                ? {}
                                : {animationDelay: `${i * 80}ms`}
                            return (
                                <p
                                    key={i}
                                    className={`answer-line text-sm text-gray-100 opacity-0`}
                                    style={style}
                                >
                                    {line}
                                </p>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
