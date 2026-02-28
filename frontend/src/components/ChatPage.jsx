// src/components/ChatPage.jsx
import React, {useCallback, useEffect, useRef, useState} from 'react'
import axios from 'axios'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import Modal from './Modal'
import TopLoaderDots from './TopLoaderDots'
import LoadingScreen from './LoadingScreen'
import ErrorScreen from './ErrorScreen'

/**
 * ChatPage
 *
 * Props:
 * - openSettingsModal: function — opens global Settings modal (managed in App.jsx)
 * - theme: string (optional) — current theme, read-only here
 * - transparentMode: boolean (optional) — read-only here
 */
export default function ChatPage({openSettingsModal, theme, transparentMode}) {
    const [models, setModels] = useState([])
    const [selectedModel, setSelectedModel] = useState('')
    const [chats, setChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)

    const [showCreateModal, setShowCreateModal] = useState(false) // modal для создания чата
    const [loading, setLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const pendingCreateRef = useRef(null)
    const mountedRef = useRef(false)
    const initialChatCreatedRef = useRef(false)

    // Загрузка моделей и чатов при монтировании
    useEffect(() => {
        mountedRef.current = true

        const fetchData = async () => {
            try {
                const {data: mdls} = await axios.get('/api/models')
                if (!mountedRef.current) return
                setModels(Array.isArray(mdls) ? mdls : [])
                setSelectedModel((Array.isArray(mdls) && mdls[0]) || '')
            } catch (e) {
                console.error('❌ Ошибка загрузки моделей:', e)
            }

            try {
                const {data: cs} = await axios.get('/api/chats')
                if (!mountedRef.current) return

                if (!Array.isArray(cs) || cs.length === 0) {
                    if (initialChatCreatedRef.current) return
                    initialChatCreatedRef.current = true
                    const {data: created} = await axios.post('/api/chats', {title: 'Новый чат'})
                    const {data: updatedChats} = await axios.get('/api/chats')
                    const normalized = Array.isArray(updatedChats) ? updatedChats : (created ? [created] : [])
                    setChats(normalized)
                    setActiveChat(created || normalized[0] || null)
                } else {
                    setChats(cs)
                    setActiveChat(cs[0])
                }
            } catch (e) {
                console.error('❌ Ошибка загрузки чатов:', e)
            } finally {
                if (mountedRef.current) setLoading(false)
            }
        }

        fetchData()

        return () => {
            mountedRef.current = false
        }
    }, [])

    // Поддержание актуальности activeChat при удалении/обновлении списка
    useEffect(() => {
        if (!activeChat && chats.length > 0) setActiveChat(chats[0])
        else if (activeChat && !chats.some(c => c.id === activeChat.id)) {
            setActiveChat(chats[0] || null)
        }
    }, [chats, activeChat])

    // createNewChat — устойчивый колбек
    const createNewChat = useCallback(async function createNewChat(title) {
        // Если заголовок пуст — открыть модальное окно и вернуть Promise, который разрешится после ввода
        if (typeof title !== 'string' || title.trim() === '') {
            setShowCreateModal(true)
            return new Promise((resolve, reject) => {
                pendingCreateRef.current = {resolve, reject}
            })
        }

        try {
            const {data: created} = await axios.post('/api/chats', {title: title.trim()})
            const {data: updatedChats} = await axios.get('/api/chats')
            const normalized = Array.isArray(updatedChats) ? updatedChats : (created ? [created] : [])
            setChats(normalized)
            const newActive = created || normalized[0] || null
            setActiveChat(newActive)

            if (pendingCreateRef.current?.resolve) {
                try {
                    pendingCreateRef.current.resolve(newActive)
                } catch {
                }
                pendingCreateRef.current = null
            }

            return newActive
        } catch (e) {
            console.error('❌ Ошибка создания чата:', e)
            if (pendingCreateRef.current?.reject) {
                try {
                    pendingCreateRef.current.reject(e)
                } catch {
                }
                pendingCreateRef.current = null
            } else if (pendingCreateRef.current?.resolve) {
                try {
                    pendingCreateRef.current.resolve(null)
                } catch {
                }
                pendingCreateRef.current = null
            }
            return null
        }
    }, [])

    // deleteChat — устойчивый колбек
    const deleteChat = useCallback(async function deleteChat(id) {
        try {
            await axios.delete(`/api/chats/${id}`)
            const {data: cs} = await axios.get('/api/chats')
            const normalized = Array.isArray(cs) ? cs : []
            setChats(normalized)
            if (activeChat?.id === id) setActiveChat(normalized[0] || null)
        } catch (e) {
            console.error('❌ Ошибка удаления чата:', e)
        }
    }, [activeChat])

    // Обработчики модалки создания чата
    function handleCreateModalClose() {
        setShowCreateModal(false)
        if (pendingCreateRef.current?.resolve) {
            try {
                pendingCreateRef.current.resolve(null)
            } catch {
            }
            pendingCreateRef.current = null
        }
    }

    async function handleCreateModalSubmit(title) {
        setShowCreateModal(false)
        if (typeof title === 'string' && title.trim() !== '') {
            await createNewChat(title)
        } else {
            if (pendingCreateRef.current?.resolve) {
                try {
                    pendingCreateRef.current.resolve(null)
                } catch {
                }
                pendingCreateRef.current = null
            }
        }
    }

    // Если данные ещё грузятся — показываем загрузочный экран
    if (loading) return <LoadingScreen/>

    // Если что-то критически отсутствует — показываем экран ошибки
    if (!activeChat || !activeChat.id || !selectedModel || !models.length) {
        return <ErrorScreen onRetry={() => window.location.reload()}/>
    }

    return (
        <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] relative">
            <TopLoaderDots active={isGenerating}/>

            <Sidebar
                chats={chats}
                activeChat={activeChat}
                setActiveChat={setActiveChat}
                createNewChat={createNewChat}
                deleteChat={deleteChat}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                openSettingsModal={openSettingsModal}
            />

            <ChatWindow
                chat={activeChat}
                model={selectedModel}
                models={models}
                onModelChange={setSelectedModel}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
                isSidebarOpen={isSidebarOpen}
                transparentMode={transparentMode}
                onChatNotFound={() => {
                    setActiveChat(prev => (prev && chats.some(c => c.id === prev.id) ? prev : (chats[0] || null)))
                }}
            />

            {/* Модалка создания чата — отдельная, её поведение не пересекается с Settings */}
            <Modal
                visible={showCreateModal}
                onClose={handleCreateModalClose}
                onSubmit={handleCreateModalSubmit}
            />
        </div>
    )
}
