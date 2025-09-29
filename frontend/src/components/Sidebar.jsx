// src/components/Sidebar.jsx
import React, {useMemo, useRef, useEffect, useState, useCallback} from 'react'
import {FiPlus, FiSettings} from 'react-icons/fi'
import {PiSidebar} from 'react-icons/pi'
import {FaTrash} from 'react-icons/fa'

export default function Sidebar({
                                    chats,
                                    activeChat,
                                    setActiveChat,
                                    createNewChat,
                                    deleteChat,
                                    isSidebarOpen,
                                    setIsSidebarOpen,
                                    openSettingsModal,
                                }) {
    const items = Array.isArray(chats) ? chats : []

    const Logo = useMemo(
        () => () => (
            <svg width="32" height="32" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <defs>
                    <linearGradient id="bubbleGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00BCFF"/>
                        <stop offset="100%" stopColor="#6623E7"/>
                    </linearGradient>
                </defs>
                <path
                    d="M64 48h128c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32h-64l-32 32v-32H64c-17.7 0-32-14.3-32-32V80c0-17.7 14.3-32 32-32z"
                    fill="url(#bubbleGradient)"
                />
                <path
                    d="M128 80 C120 60, 100 56, 96 60 C100 68, 100 76, 96 84 C92 92, 96 104, 104 108 C108 110, 112 108, 116 104 C120 108, 124 110, 128 108 C136 104, 140 92, 136 84 C132 76, 132 68, 136 60 C132 56, 112 60, 128 80 Z"
                    fill="none"
                    stroke="#002D75"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path d="M112 104c4 -4 8 -4 12 0" stroke="#002D75" strokeWidth="4" strokeLinecap="round"/>
                <path d="M120 116c4 4 8 4 12 0" stroke="#002D75" strokeWidth="4" strokeLinecap="round"/>
            </svg>
        ),
        []
    )

    // refs для ChatItem-ов (register/unregister)
    const itemsRefs = useRef(new Map())

    const recalcScrollForAll = useCallback(() => {
        itemsRefs.current.forEach(fn => {
            try {
                fn()
            } catch (e) {
                // ignore per-item errors
            }
        })
    }, [])

    useEffect(() => {
        let timer = null
        const onResize = () => {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                recalcScrollForAll()
            }, 150)
        }
        window.addEventListener('resize', onResize)
        return () => {
            window.removeEventListener('resize', onResize)
            if (timer) clearTimeout(timer)
        }
    }, [recalcScrollForAll])

    return (
        <aside
            className={`
        h-screen flex flex-col justify-between
        bg-[var(--bg-surface)] text-[var(--text-main)]
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'w-64' : 'w-16 items-center'}
      `}
            aria-label="Sidebar"
        >
            <div className="flex flex-col w-full flex-1 overflow-hidden transition-all duration-300 ease-in-out">
                <div
                    className={`flex px-4 py-3 transition-all duration-300 ease-in-out ${
                        isSidebarOpen ? 'flex-row items-center justify-between' : 'flex-col items-center justify-center'
                    }`}
                >
                    <Logo/>
                    {isSidebarOpen && (
                        <span
                            className="text-lg font-semibold text-[var(--text-main)] transition-all duration-300 ease-in-out mr-10">
              ChatoLlama
            </span>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(v => !v)}
                        className={`p-2 transition-all duration-300 ease-in-out ${isSidebarOpen ? '' : 'mt-2'}`}
                        title={isSidebarOpen ? 'Свернуть сайдбар' : 'Развернуть сайдбар'}
                        aria-pressed={isSidebarOpen}
                        aria-label="Toggle sidebar"
                    >
                        <PiSidebar
                            className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all duration-300 ease-in-out"/>
                    </button>
                </div>

                <div>
                    <button
                        onClick={createNewChat}
                        className={`flex items-center gap-2 m-2 p-2 rounded transition-all duration-300 ease-in-out ml-[13px] ${
                            isSidebarOpen ? 'justify-start ml-[15px] hover:bg-[rgba(0,0,0,0.06)]' : 'justify-center'
                        }`}
                        title="Новый чат"
                    >
                        <FiPlus className="w-5 h-5 text-[var(--text-main)]" aria-hidden/>
                        {isSidebarOpen && <span className="text-sm text-[var(--text-main)]">Новый чат</span>}
                    </button>
                </div>

                {isSidebarOpen && (
                    <nav
                        className="flex-1 overflow-auto custom-scroll w-full mt-2 transition-all duration-300 ease-in-out"
                        aria-label="Chats"
                    >
                        {items.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[var(--text-muted)]">Нет чатов. Нажмите «Новый чат»
                                чтобы начать.</div>
                        ) : (
                            items.map(chat => (
                                <ChatItem
                                    key={chat.id}
                                    chat={chat}
                                    isActive={activeChat?.id === chat.id}
                                    onSelect={() => setActiveChat(chat)}
                                    onDelete={() => deleteChat(chat.id)}
                                    registerRef={(id, fn) => itemsRefs.current.set(id, fn)}
                                    unregisterRef={id => itemsRefs.current.delete(id)}
                                />
                            ))
                        )}
                    </nav>
                )}
            </div>

            <div className="w-full mb-4 transition-all duration-300 ease-in-out">
                <button
                    onClick={openSettingsModal}
                    className={`flex items-center gap-2 p-2 rounded transition-all duration-300 ease-in-out ${
                        isSidebarOpen ? 'ml-[15px] hover:bg-[rgba(0,0,0,0.06)]' : 'justify-center w-full'
                    }`}
                    title="Настройки"
                >
                    <FiSettings className="w-5 h-5 text-[var(--text-main)]" aria-hidden/>
                    {isSidebarOpen && <span className="text-sm text-[var(--text-main)]">Настройки</span>}
                </button>
            </div>
        </aside>
    )
}

/* ----------------------
   ChatItem — отдельный компонент
   получает registerRef/unregisterRef для управления пересчётом
   ---------------------- */
function ChatItem({chat, isActive, onSelect, onDelete, registerRef, unregisterRef}) {
    const {id, title: rawTitle, created_at} = chat || {}
    const title = typeof rawTitle === 'string' && rawTitle.trim() !== '' ? rawTitle.trim() : 'Без названия'

    const formattedDate = created_at
        ? new Date(created_at).toLocaleString('ru-RU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : '—'

    const scrollRef = useRef(null)
    const [scrollStyle, setScrollStyle] = useState({})

    // function that recalculates overflow and sets style — exposed to parent via registerRef
    const recalc = useCallback(() => {
        if (!scrollRef.current) return
        const containerWidth = scrollRef.current.offsetWidth
        const textWidth = scrollRef.current.scrollWidth
        const overflow = textWidth - containerWidth

        if (overflow > 10) {
            const duration = Math.max(2200, overflow * 18 + 800)
            setScrollStyle({
                animation: `scrollText ${duration}ms linear 1s 1 normal`,
                display: 'inline-block',
                transform: 'translateX(0)',
                '--scroll-distance': `-${overflow}px`,
            })
        } else {
            setScrollStyle({})
        }
    }, [])

    // initial calc and register/unregister for parent-triggered recalcs
    useEffect(() => {
        if (typeof registerRef === 'function') registerRef(id, recalc)
        recalc()
        return () => {
            if (typeof unregisterRef === 'function') unregisterRef(id)
        }
    }, [id, registerRef, unregisterRef, recalc])

    return (
        <div
            role="listitem"
            onClick={onSelect}
            className={`group flex flex-col px-2 py-2 mx-2 mb-2 rounded cursor-pointer transition-all duration-300 ease-in-out
        ${isActive ? 'animate-color-pulse text-[var(--text-main)] shadow-md' : 'hover:bg-[rgba(0,0,0,0.06)]'}`}
        >
            <div className="flex items-center justify-between w-full">
                <div className="relative overflow-hidden w-full pr-2">
                    <div
                        ref={scrollRef}
                        className={`whitespace-nowrap text-sm scroll-animate ${isActive ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}
                        style={scrollStyle}
                        title={title}
                        aria-label={title}
                    >
                        {title}
                    </div>
                </div>

                <button
                    onClick={e => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="p-1 rounded transition-all duration-300 ease-in-out"
                    title="Удалить чат"
                    aria-label="Удалить чат"
                >
                    <FaTrash
                        className="w-3 h-3 text-[var(--text-muted)] hover:text-red-400 transition-transform hover:scale-110"/>
                </button>
            </div>

            <span className="text-xs mt-1 ml-1 text-[var(--text-muted)]">{formattedDate}</span>
        </div>
    )
}
