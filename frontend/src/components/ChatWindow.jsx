// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import MessageList from './MessageList'
import ModelSelector from './ModelSelector'
import ScrollControls from './ScrollControls'
import MessageInput from './MessageInput'
import {
  isTempId,
  extractThoughtFromContent,
  getShownThoughtIds,
  addShownThoughtId,
  removeShownThoughtIdForMessage,
} from '../utils/chatUtils'
import {
  fetchMessages,
  sendUserMessageStream,
  sendGenerateStream,
  deleteMessage as apiDeleteMessage,
  editMessage as apiEditMessage,
  regenerateAssistantMessageStream,
  stopGeneration,
} from '../api/chatApi'

export default function ChatWindow({
  chat,
  model,
  models = [],
  onModelChange,
  isGenerating = false,
  setIsGenerating = () => {},
  isSidebarOpen = true,
  widescreenMode = false,
  onChatNotFound,
  onFirstMessage,
  setToast,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [streamingThought, setStreamingThought] = useState('')
  const [thoughtsEnded, setThoughtsEnded] = useState(false)
  
  // Оптимизация: ref для аккумуляции контента без лишних рендеров
  const streamContentRef = useRef('')
  const activeStreamIdRef = useRef(null)
  const pendingUpdateRef = useRef(null)

  const bottomRef = useRef(null)
  const topRef = useRef(null)
  const fetchLockRef = useRef(false)
  const navigate = useNavigate()

  const isEmptyChat = messages.length === 0
  
  // Оптимизированное обновление контента стрима с throttle
  const updateStreamContent = useCallback((streamId, content) => {
    streamContentRef.current = content
    
    // Отменяем предыдущий запланированный апдейт
    if (pendingUpdateRef.current) {
      cancelAnimationFrame(pendingUpdateRef.current)
    }
    
    // Планируем апдейт на следующий кадр
    pendingUpdateRef.current = requestAnimationFrame(() => {
      pendingUpdateRef.current = null
      if (activeStreamIdRef.current !== streamId) return
      
      setMessages(prev => {
        const msg = prev.find(m => m.id === streamId)
        if (!msg || msg.content === content) return prev
        
        return prev.map(m => 
          m.id === streamId ? { ...m, content } : m
        )
      })
    })
  }, [])
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        cancelAnimationFrame(pendingUpdateRef.current)
      }
    }
  }, [])

  async function fetchMessagesForChat(chatId) {
    if (!chatId || fetchLockRef.current) return
    fetchLockRef.current = true
    try {
      const raw = await fetchMessages(chatId)
      const normalized = []
      const shownThoughtIds = getShownThoughtIds()
      for (const m of raw) {
        normalized.push({
          ...m,
          _showThought: m.thinking && !shownThoughtIds.includes(String(m.id)),
        })
      }
      if (fetchLockRef.current) {
        setMessages(normalized)
      }
    } catch {
      setToast?.({ type: 'error', text: 'Ошибка загрузки сообщений' })
    } finally {
      fetchLockRef.current = false
    }
  }

  async function stopGenerationHandler() {
    if (!chat?.id) return
    
    // Немедленно очищаем UI
    setMessages(currentMessages => {
      const lastUserIndex = currentMessages.findLastIndex(m => m.role === 'user')
      if (lastUserIndex >= 0) {
        return currentMessages.slice(0, lastUserIndex + 1)
      }
      return currentMessages
    })
    setStreamingThought('')
    setThoughtsEnded(false)
    setIsGenerating(false)
    activeStreamIdRef.current = null
    streamContentRef.current = ''
    
    if (pendingUpdateRef.current) {
      cancelAnimationFrame(pendingUpdateRef.current)
      pendingUpdateRef.current = null
    }
    
    try {
      await stopGeneration(chat.id)
    } catch {
      // Игнорируем ошибки
    }
  }

  async function deleteMessage(id) {
    if (isTempId(id)) {
      setMessages(prev => prev.filter(m => m.id !== id))
      return
    }
    try {
      await apiDeleteMessage(id)
      await fetchMessagesForChat(chat.id)
    } catch {
      setToast?.({ type: 'error', text: 'Ошибка удаления сообщения' })
    }
  }

  async function editMessage(id, newContent, onSuccess) {
    if (isTempId(id)) {
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, content: newContent } : m))
      )
      onSuccess?.()
      return
    }
    try {
      await apiEditMessage(id, newContent)
      await fetchMessagesForChat(chat.id)
      onSuccess?.()
    } catch {
      setToast?.({ type: 'error', text: 'Ошибка редактирования сообщения' })
    }
  }

  async function editAndRegenerate(id, newContent) {
    if (!chat?.id) return
    
    const msgIndex = messages.findIndex(m => m.id === id)
    if (msgIndex === -1) return
    
    const msg = messages[msgIndex]
    
    if (msg.role === 'user') {
      try {
        const messagesToDelete = messages.slice(msgIndex + 1)
        for (const m of messagesToDelete) {
          if (!isTempId(m.id)) {
            try {
              await apiDeleteMessage(m.id)
            } catch {}
          }
        }
        
        await apiEditMessage(id, newContent)
        
        const now = new Date().toISOString()
        const streamId = `stream-${Date.now()}`
        activeStreamIdRef.current = streamId
        streamContentRef.current = ''
        
        setMessages(prev => [
          ...prev.slice(0, msgIndex + 1),
          { id: streamId, role: 'assistant', content: '', _isStreaming: true, created_at: now, model: model },
        ])
        setIsGenerating(true)
        setStreamingThought('')
        setThoughtsEnded(false)
        
        const prompt = messages
          .slice(0, msgIndex + 1)
          .map(m => `${m.role}: ${m.role === 'user' && m.id === id ? newContent : m.content}`)
          .join('\n')
        
        await sendGenerateStream(
          chat.id,
          model,
          prompt,
          (chunk) => {
            const newContent = streamContentRef.current + chunk
            streamContentRef.current = newContent
            if (newContent.length > 0 && !thoughtsEnded) {
              setThoughtsEnded(true)
            }
            updateStreamContent(streamId, newContent)
          },
          (thought) => {
            setThoughtsEnded(false)
            setStreamingThought(prev => prev + thought)
          },
          (messageId) => {
            activeStreamIdRef.current = null
            streamContentRef.current = ''
            if (pendingUpdateRef.current) {
              cancelAnimationFrame(pendingUpdateRef.current)
              pendingUpdateRef.current = null
            }
            if (streamingThought) {
              addShownThoughtId(`thought-${messageId}`)
            }
            setMessages(prev =>
              prev.map(m =>
                m.id === streamId ? { ...m, _isStreaming: false, id: messageId } : m
              )
            )
            setIsGenerating(false)
            fetchMessagesForChat(chat.id)
          },
          (error) => {
            activeStreamIdRef.current = null
            streamContentRef.current = ''
            if (pendingUpdateRef.current) {
              cancelAnimationFrame(pendingUpdateRef.current)
              pendingUpdateRef.current = null
            }
            if (error && (error.includes('abort') || error.includes('Abort'))) {
              setMessages(currentMessages => {
                const lastUserIndex = currentMessages.findLastIndex(m => m.role === 'user')
                if (lastUserIndex >= 0) {
                  return currentMessages.slice(0, lastUserIndex + 1)
                }
                return currentMessages
              })
              setStreamingThought('')
              setThoughtsEnded(false)
              setIsGenerating(false)
              return
            }
            setMessages(prev =>
              prev.map(m =>
                m.id === streamId ? { ...m, _error: true, _isStreaming: false } : m
              )
            )
            setToast?.({ type: 'error', text: error || 'Ошибка генерации' })
            setIsGenerating(false)
          }
        )
      } catch {
        activeStreamIdRef.current = null
        streamContentRef.current = ''
        setToast?.({ type: 'error', text: 'Ошибка при обновлении сообщения' })
      }
    } else {
      await editMessage(id, newContent)
      await regenerateMessage(id, model)
    }
  }

  async function sendMessage() {
    const text = input.trim()
    if (!text || isGenerating || !chat?.id) return
    
    const isFirstMessage = messages.length === 0
    
    const tempId = `temp-${Date.now()}`
    const streamId = `stream-${Date.now()}`
    const now = new Date().toISOString()
    const selectedModel = model
    
    activeStreamIdRef.current = streamId
    streamContentRef.current = ''
    
    setStreamingThought('')
    setThoughtsEnded(false)
    
    setMessages(prev => [
      ...prev,
      { id: tempId, role: 'user', content: text, _isTemp: true, created_at: now, model: selectedModel },
      { id: streamId, role: 'assistant', content: '', _isStreaming: true, created_at: now, model: selectedModel },
    ])
    setInput('')
    
    if (isFirstMessage && onFirstMessage) {
      onFirstMessage(chat.id, text, chat.title)
    }
    
    setIsGenerating(true)

    try {
      await sendUserMessageStream(
        chat.id,
        text,
        model,
        (chunk) => {
          const newContent = streamContentRef.current + chunk
          streamContentRef.current = newContent
          if (newContent.length > 0 && !thoughtsEnded) {
            setThoughtsEnded(true)
          }
          updateStreamContent(streamId, newContent)
        },
        (messageId) => {
          activeStreamIdRef.current = null
          streamContentRef.current = ''
          if (pendingUpdateRef.current) {
            cancelAnimationFrame(pendingUpdateRef.current)
            pendingUpdateRef.current = null
          }
          if (streamingThought) {
            addShownThoughtId(`thought-${messageId}`)
          }
          setMessages(prev =>
            prev.map(m =>
              m.id === streamId
                ? { ...m, _isStreaming: false, id: messageId }
                : m
            )
          )
          setIsGenerating(false)
        },
        (error) => {
          activeStreamIdRef.current = null
          streamContentRef.current = ''
          if (pendingUpdateRef.current) {
            cancelAnimationFrame(pendingUpdateRef.current)
            pendingUpdateRef.current = null
          }
          if (error && (error.includes('abort') || error.includes('Abort'))) {
            setMessages(currentMessages => {
              const lastUserIndex = currentMessages.findLastIndex(m => m.role === 'user')
              if (lastUserIndex >= 0) {
                return currentMessages.slice(0, lastUserIndex + 1)
              }
              return currentMessages
            })
            setStreamingThought('')
            setThoughtsEnded(false)
            setIsGenerating(false)
            return
          }
          setMessages(prev =>
            prev.map(m =>
              m.id === streamId ? { ...m, _error: true, _isStreaming: false } : m
            )
          )
          setToast?.({ type: 'error', text: error || 'Ошибка генерации' })
          setIsGenerating(false)
        },
        (thought) => {
          setThoughtsEnded(false)
          setStreamingThought(prev => prev + thought)
        },
        () => {
          activeStreamIdRef.current = null
          streamContentRef.current = ''
          if (pendingUpdateRef.current) {
            cancelAnimationFrame(pendingUpdateRef.current)
            pendingUpdateRef.current = null
          }
          setMessages(prev =>
            prev.map(m =>
              m.id === streamId ? { ...m, _isStreaming: false } : m
            )
          )
          setIsGenerating(false)
          fetchMessagesForChat(chat.id)
        }
      )
    } catch {
      activeStreamIdRef.current = null
      streamContentRef.current = ''
      if (pendingUpdateRef.current) {
        cancelAnimationFrame(pendingUpdateRef.current)
        pendingUpdateRef.current = null
      }
      setToast?.({ type: 'error', text: 'Ошибка отправки сообщения' })
    }
  }

  async function regenerateMessage(id, currentModel) {
    if (!id || isTempId(id)) return
    
    let targetId = id
    let targetRole = null
    
    const msg = messages.find(m => m.id === id)
    if (msg) {
      if (msg.role === 'user') {
        targetRole = 'user'
      } else if (msg.role === 'assistant') {
        targetRole = 'assistant'
      }
    }
    
    let assistantId = null
    if (targetRole === 'assistant') {
      assistantId = id
    } else if (targetRole === 'user') {
      const idx = messages.findIndex(m => m.id === id)
      for (let i = idx + 1; i < messages.length; i++) {
        if (messages[i].role === 'assistant') {
          assistantId = messages[i].id
          break
        }
      }
    }
    
    if (!assistantId) {
      assistantId = [...messages].reverse().find(m => m.role === 'assistant')?.id
    }
    
    if (!assistantId) {
      setIsGenerating(false)
      setToast?.({
        type: 'error',
        text: 'Не удалось найти сообщение ассистента для перегенерации',
      })
      return
    }

    const streamId = `regen-${assistantId}-${Date.now()}`
    const now = new Date().toISOString()
    
    activeStreamIdRef.current = streamId
    streamContentRef.current = ''
    
    setMessages(prev =>
      prev.map(m =>
        m.id === assistantId
          ? { ...m, content: '', thinking: '', _isRegenerating: true, _tempStreamId: streamId, created_at: now }
          : m
      )
    )
    setIsGenerating(true)
    setStreamingThought('')
    setThoughtsEnded(false)

    try {
      removeShownThoughtIdForMessage(assistantId)
    } catch {}

    try {
      await regenerateAssistantMessageStream(
        assistantId,
        currentModel,
        (chunk) => {
          const newContent = streamContentRef.current + chunk
          streamContentRef.current = newContent
          updateStreamContent(streamId, newContent)
          setMessages(prev =>
            prev.map(m =>
              m._tempStreamId === streamId
                ? { ...m, content: newContent }
                : m
            )
          )
        },
        (thought) => {
          setThoughtsEnded(false)
          setStreamingThought(prev => prev + thought)
        },
        () => {
          activeStreamIdRef.current = null
          streamContentRef.current = ''
          if (pendingUpdateRef.current) {
            cancelAnimationFrame(pendingUpdateRef.current)
            pendingUpdateRef.current = null
          }
          setMessages(prev =>
            prev.map(m =>
              m._tempStreamId === streamId
                ? { ...m, _isRegenerating: false, _tempStreamId: null, created_at: now }
                : m
            )
          )
          setIsGenerating(false)
          fetchMessagesForChat(chat.id)
        },
        (error) => {
          activeStreamIdRef.current = null
          streamContentRef.current = ''
          if (pendingUpdateRef.current) {
            cancelAnimationFrame(pendingUpdateRef.current)
            pendingUpdateRef.current = null
          }
          if (error && (error.includes('abort') || error.includes('Abort'))) {
            setMessages(currentMessages => {
              const lastUserIndex = currentMessages.findLastIndex(m => m.role === 'user')
              if (lastUserIndex >= 0) {
                return currentMessages.slice(0, lastUserIndex + 1)
              }
              return currentMessages
            })
            setStreamingThought('')
            setThoughtsEnded(false)
            setIsGenerating(false)
            return
          }
          setMessages(prev =>
            prev.map(m =>
              m._tempStreamId === streamId ? { ...m, _isRegenerating: false, _tempStreamId: null, _error: true } : m
            )
          )
          setToast?.({ type: 'error', text: error || 'Ошибка перегенерации' })
          setIsGenerating(false)
        }
      )
    } catch (err) {
      activeStreamIdRef.current = null
      streamContentRef.current = ''
      if (pendingUpdateRef.current) {
        cancelAnimationFrame(pendingUpdateRef.current)
        pendingUpdateRef.current = null
      }
      if (err.response?.status === 404) {
        await fetchMessagesForChat(chat.id)
        setToast?.({
          type: 'error',
          text: 'Сообщение для перегенерации не найдено (404)',
        })
      } else {
        setToast?.({ type: 'error', text: 'Ошибка перегенерации' })
      }
      setIsGenerating(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    if (!chat) {
      setMessages([])
      setInput('')
      setStreamingThought('')
      setThoughtsEnded(false)
      activeStreamIdRef.current = null
      streamContentRef.current = ''
      return
    }
    setInput('')
    setStreamingThought('')
    setThoughtsEnded(false)
    fetchMessagesForChat(chat.id)
  }, [chat?.id])

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
        Выберите или создайте чат
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 p-4 bg-[var(--bg-main)] text-[var(--text-main)]">
      {isEmptyChat ? (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
          <div className={`w-full ${widescreenMode ? 'max-w-[80%]' : 'max-w-[650px]'}`}>
            <ModelSelector
              model={model}
              models={models}
              onModelChange={onModelChange}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
            />
            <MessageInput
              input={input}
              setInput={setInput}
              isGenerating={isGenerating}
              onSend={sendMessage}
              onStop={stopGenerationHandler}
              handleKeyDown={handleKeyDown}
            />
          </div>
        </div>
      ) : (
        <>
          <MessageList
            messages={messages}
            model={model}
            isSidebarOpen={isSidebarOpen}
            widescreenMode={widescreenMode}
            setToast={setToast}
            onDelete={deleteMessage}
            onEdit={editMessage}
            onEditAndRegenerate={editAndRegenerate}
            onRegenerate={regenerateMessage}
            streamingThought={streamingThought}
            thoughtsEnded={thoughtsEnded}
            topRef={topRef}
            bottomRef={bottomRef}
          />
          <div className={`w-full mx-auto mt-auto ${widescreenMode ? 'max-w-[80%]' : 'max-w-[650px]'}`}>
            <div className="flex items-center justify-between px-1">
              <ModelSelector
                model={model}
                models={models}
                onModelChange={onModelChange}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
              />
              <ScrollControls topRef={topRef} bottomRef={bottomRef} />
            </div>
            <div className="mt-0">
              <MessageInput
                input={input}
                setInput={setInput}
                isGenerating={isGenerating}
                onSend={sendMessage}
                onStop={stopGenerationHandler}
                handleKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
