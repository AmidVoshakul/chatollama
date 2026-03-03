// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown } from 'react-icons/fi'
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
  transparentMode = false,
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

  const bottomRef = useRef(null)
  const topRef = useRef(null)
  const fetchLockRef = useRef(false)
  const navigate = useNavigate()

  const isEmptyChat = messages.length === 0

  async function fetchMessagesForChat(chatId) {
    if (!chatId || fetchLockRef.current) return
    fetchLockRef.current = true
    try {
      const raw = await fetchMessages(chatId)
      const normalized = []
      const shownThoughtIds = getShownThoughtIds()
      for (const m of raw) {
        if (
          m.role === 'assistant' &&
          typeof m.content === 'string' &&
          (m.thinking || m.content.includes('<think>'))
        ) {
          let thought = m.thinking || null
          let contentWithoutThought = m.content
          
          if (!thought && m.content.includes('<think>')) {
            const { contentWithoutThought: extracted, thought: extractedThought } =
              extractThoughtFromContent(m.content)
            contentWithoutThought = extracted
            thought = extractedThought
          }
          
          if (thought) {
            const thoughtId = `thought-${m.id}`
            normalized.push({
              ...m,
              id: m.id,
              content: contentWithoutThought,
              thinking: thought,
              type: 'text',
            })
            continue
          }
        }
        normalized.push({
          ...m,
          id: m.id,
          type: m.type || 'text',
        })
      }
      setMessages(normalized)
    } catch (err) {
      if (err.response?.status === 404) {
        setMessages([])
        onChatNotFound?.()
      } else {
        setToast?.({ type: 'error', text: 'Ошибка загрузки сообщений' })
      }
    } finally {
      fetchLockRef.current = false
    }
  }

  async function stopGenerationHandler() {
    if (!chat?.id) return
    
    // Немедленно очищаем UI - оставляем только последнее сообщение пользователя
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
    
    // Отправляем запрос на остановку бэкенду
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
        // Сначала удаляем сообщения после редактируемого
        const messagesToDelete = messages.slice(msgIndex + 1)
        for (const m of messagesToDelete) {
          if (!isTempId(m.id)) {
            try {
              await apiDeleteMessage(m.id)
            } catch {}
          }
        }
        
        // Редактируем сообщение пользователя
        await apiEditMessage(id, newContent)
        
        // Обновляем UI и запускаем генерацию ответа
        const now = new Date().toISOString()
        const streamId = `stream-${Date.now()}`
        
        // Добавляем временное сообщение ассистента
        setMessages(prev => [
          ...prev.slice(0, msgIndex + 1),
          { id: streamId, role: 'assistant', content: '', _isStreaming: true, created_at: now, model: model },
        ])
        setIsGenerating(true)
        setStreamingThought('')
        setThoughtsEnded(false)
        
        // Формируем prompt
        const prompt = messages
          .slice(0, msgIndex + 1)
          .map(m => `${m.role}: ${m.role === 'user' && m.id === id ? newContent : m.content}`)
          .join('\n')
        
        let accumulatedContent = ''
        
        // Используем стриминг генерацию
        await sendGenerateStream(
          chat.id,
          model,
          prompt,
          (chunk) => {
            accumulatedContent += chunk
            if (accumulatedContent.length > 0) {
              setThoughtsEnded(true)
            }
            setMessages(prev =>
              prev.map(m =>
                m.id === streamId ? { ...m, content: accumulatedContent } : m
              )
            )
          },
          (thought) => {
            setThoughtsEnded(false)
            setStreamingThought(prev => prev + thought)
          },
          (messageId) => {
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
            if (error && (error.includes('abort') || error.includes('Abort'))) {
              // При отмене очищаем все сообщения после последнего сообщения пользователя
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
    
    // Проверяем, является ли это первым сообщением в чате
    const isFirstMessage = messages.length === 0
    
    const tempId = `temp-${Date.now()}`
    const streamId = `stream-${Date.now()}`
    const now = new Date().toISOString()
    const selectedModel = model
    setStreamingThought(null)
    setStreamingThought('')
    setThoughtsEnded(false)
    setMessages(prev => [
      ...prev,
      { id: tempId, role: 'user', content: text, _isTemp: true, created_at: now, model: selectedModel },
      { id: streamId, role: 'assistant', content: '', _isStreaming: true, created_at: now, model: selectedModel },
    ])
    setInput('')
    
    // Если это первое сообщение, вызываем колбэк для авто-переименования сразу после отправки
    if (isFirstMessage && onFirstMessage) {
      onFirstMessage(chat.id, text, chat.title)
    }
    
    setIsGenerating(true)

    let accumulatedContent = ''
    try {
      await sendUserMessageStream(
        chat.id,
        text,
        model,
        (chunk) => {
          accumulatedContent += chunk
          if (accumulatedContent.length > 0) {
            setThoughtsEnded(true)
          }
          setMessages(prev =>
            prev.map(m =>
              m.id === streamId
                ? { ...m, content: accumulatedContent }
                : m
            )
          )
        },
        (messageId) => {
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
          if (error && (error.includes('abort') || error.includes('Abort'))) {
            // При отмене очищаем все сообщения после последнего сообщения пользователя
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
      setToast?.({ type: 'error', text: 'Ошибка редактирования сообщения' })
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
          setMessages(prev =>
            prev.map(m =>
              m._tempStreamId === streamId
                ? { ...m, content: m.content + chunk }
                : m
            )
          )
        },
        (thought) => {
          setThoughtsEnded(false)
          setStreamingThought(prev => prev + thought)
        },
        () => {
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
          if (error && (error.includes('abort') || error.includes('Abort'))) {
            // При отмене очищаем все сообщения после последнего сообщения пользователя
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
        // Пустой чат - всё по центру
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in-up">
          <div className={`w-full ${widescreenMode ? 'max-w-[80%]' : 'max-w-[650px]'}`}>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-semibold text-[var(--text-main)]">Чем могу помочь?</h1>
              <p className="text-sm text-[var(--text-muted)]">Выберите модель и начните диалог</p>
            </div>
            <div className="flex items-center justify-between px-1">
              <ModelSelector
                model={model}
                models={models}
                onModelChange={onModelChange}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
              />
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
        </div>
      ) : (
        // Чат с сообщениями - обычный layout
        <>
          <MessageList
            messages={messages}
            model={model}
            isSidebarOpen={isSidebarOpen}
            transparentMode={transparentMode}
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
