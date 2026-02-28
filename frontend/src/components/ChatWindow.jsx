// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCpu, FiCheck } from 'react-icons/fi'
import Message from './Message'
import ThoughtBubble from './ThoughtBubble'
import {
  isTempId,
  extractThoughtFromContent,
  getShownThoughtIds,
  addShownThoughtId,
  removeShownThoughtIdForMessage,
} from '../utils/chatUtils'
import {
  fetchMessages,
  sendUserMessage,
  sendUserMessageStream,
  deleteMessage as apiDeleteMessage,
  editMessage as apiEditMessage,
  regenerateAssistantMessage,
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
  onChatNotFound,
  setToast,
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const bottomRef = useRef(null)
  const topRef = useRef(null)
  const textareaRef = useRef(null)
  const fetchLockRef = useRef(false)
  const navigate = useNavigate()

  // Fetch and normalize messages
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
          m.content.includes('<think>')
        ) {
          const { contentWithoutThought, thought } =
            extractThoughtFromContent(m.content)
          if (thought) {
            const thoughtId = `thought-${m.id}`
            if (shownThoughtIds.includes(thoughtId)) {
              normalized.push({
                ...m,
                id: m.id,
                content: contentWithoutThought,
                type: 'text',
              })
            } else {
              normalized.push({
                id: thoughtId,
                role: 'assistant',
                type: 'thought',
                content: thought,
                created_at: m.created_at,
              })
              normalized.push({
                ...m,
                id: m.id,
                content: contentWithoutThought,
                type: 'text',
                hiddenWhileThought: thoughtId,
              })
            }
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
      setTimeout(
        () =>
          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          }),
        80
      )
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

  // Send a new user message with streaming
  async function sendMessage() {
    const text = input.trim()
    if (!text || isGenerating || !chat?.id) return
    const tempId = `temp-${Date.now()}`
    const streamId = `stream-${Date.now()}`
    setMessages(prev => [
      ...prev,
      { id: tempId, role: 'user', content: text, _isTemp: true },
      { id: streamId, role: 'assistant', content: '', _isStreaming: true },
    ])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setIsGenerating(true)
    setTimeout(
      () =>
        bottomRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
        }),
      80
    )
    try {
      await sendUserMessageStream(
        chat.id,
        text,
        model,
        (chunk) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === streamId
                ? { ...m, content: m.content + chunk }
                : m
            )
          )
          setTimeout(
            () =>
              bottomRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
              }),
            50
          )
        },
        (messageId) => {
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
          setMessages(prev =>
            prev.map(m =>
              m.id === streamId ? { ...m, _error: true, _isStreaming: false } : m
            )
          )
          setToast?.({ type: 'error', text: error || 'Ошибка генерации' })
          setIsGenerating(false)
        }
      )
    } catch (err) {
      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, _error: true } : m))
      )
      if (err.response?.status === 404) {
        onChatNotFound?.()
      } else {
        setToast?.({ type: 'error', text: 'Ошибка отправки сообщения' })
      }
      setIsGenerating(false)
    }
  }

  // Stop generation
  async function stopGenerationHandler() {
    if (!chat?.id) return
    try {
      await stopGeneration(chat.id)
      setIsGenerating(false)
    } catch {
      setToast?.({ type: 'error', text: 'Не удалось остановить генерацию' })
    }
  }

  // Delete message
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

  // Edit message
  async function editMessage(id, newContent) {
    if (isTempId(id)) {
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, content: newContent } : m))
      )
      return
    }
    try {
      await apiEditMessage(id, newContent)
      await fetchMessagesForChat(chat.id)
    } catch {
      setToast?.({ type: 'error', text: 'Ошибка редактирования сообщения' })
    }
  }

  // Regenerate assistant message
  async function regenerateMessage(id, currentModel) {
    if (!id || isTempId(id)) return
    setIsGenerating(true)
    const resolveAssistantId = passedId => {
      const byId = messages.find(m => m.id === passedId)
      if (byId && byId.role === 'assistant') return passedId
      if (byId && byId.role === 'user') {
        const idx = messages.findIndex(m => m.id === passedId)
        for (let i = idx + 1; i < messages.length; i++) {
          if (messages[i].role === 'assistant') return messages[i].id
        }
      }
      const lastAssistant = [...messages]
        .reverse()
        .find(m => m.role === 'assistant')
      return lastAssistant?.id || null
    }
    const assistantId = resolveAssistantId(id)
    if (!assistantId) {
      setIsGenerating(false)
      setToast?.({
        type: 'error',
        text: 'Не удалось найти сообщение ассистента для перегенерации',
      })
      return
    }
    try {
      removeShownThoughtIdForMessage(assistantId)
    } catch {}
    try {
      await regenerateAssistantMessage(assistantId, currentModel)
      await fetchMessagesForChat(chat.id)
      const thoughtId = `thought-${assistantId}`
      setMessages(prev =>
        prev.map(m =>
          m.hiddenWhileThought === thoughtId
            ? { ...m, hiddenWhileThought: null }
            : m
        )
      )
      try {
        removeShownThoughtIdForMessage(assistantId)
      } catch {}
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
    } finally {
      setIsGenerating(false)
    }
  }

  // Enter = send, Shift+Enter = newline
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Fetch messages when chat changes
  useEffect(() => {
    if (!chat) {
      setMessages([])
      setInput('')
      return
    }
    setInput('')
    fetchMessagesForChat(chat.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id])

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
        Выберите или создайте чат
      </div>
    )
  }

  const hasThoughtPresent = useMemo(
    () => messages.some(m => m.type === 'thought'),
    [messages]
  )

  return (
    <div className="flex flex-col flex-1 p-4 bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-4 pb-28 custom-scroll">
        <div ref={topRef} />
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1
          const isLatestAssistant =
            isLast && msg.role === 'assistant' && msg.type === 'text'

          if (msg.type === 'thought') {
            return (
              <ThoughtBubble
                key={msg.id}
                content={msg.content}
                isGenerating={isGenerating}
                onFadeOut={() => {
                  addShownThoughtId(msg.id)
                  setMessages(prev =>
                    prev
                      .filter(m => m.type !== 'thought')
                      .map(m =>
                        m.hiddenWhileThought === msg.id
                          ? { ...m, hiddenWhileThought: null }
                          : m
                      )
                  )
                  setTimeout(
                    () =>
                      bottomRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end',
                      }),
                    80
                  )
                }}
              />
            )
          }

          if (
            msg.role === 'assistant' &&
            msg.hiddenWhileThought &&
            hasThoughtPresent
          ) {
            return null
          }

          return (
            <Message
              key={msg.id}
              role={msg.role}
              content={msg.content}
              model={msg.model}
              timestamp={msg.created_at}
              isTemp={msg._isTemp}
              hasError={msg._error}
              isStreaming={msg._isStreaming}
              onDelete={() => deleteMessage(msg.id)}
              onEdit={async (newContent, onFinish) => {
                await editMessage(msg.id, newContent)
                onFinish?.()
              }}
              onRegenerate={() => regenerateMessage(msg.id, model)}
              isLatestAssistant={isLatestAssistant}
              isSidebarOpen={isSidebarOpen}
              transparentMode={transparentMode}
              setToast={setToast}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Model selector & controls */}
      <div className="relative">
        <div className="flex items-center justify-between px-1 mt-2">
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center bg-[var(--bg-surface)] px-3 py-2 rounded-lg text-sm w-64 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              title="Выбрать модель"
            >
              <span className="truncate">{model}</span>
              <span
                className={`ml-2 transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              >
                ⌄
              </span>
            </button>
            {dropdownOpen && (
              <ul
                role="listbox"
                className="absolute bottom-full left-0 w-64 max-h-[calc(100vh-200px)] overflow-y-auto bg-[var(--bg-surface)] rounded-lg shadow-lg z-10 custom-scroll -translate-y-3"
              >
                {models.map(m => (
                  <li
                    key={m}
                    onClick={() => {
                      onModelChange(m)
                      setDropdownOpen(false)
                    }}
                    className="px-3 py-2 cursor-pointer border-b last:border-b-0 border-gray-700 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600"
                    role="option"
                    aria-selected={m === model}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 mr-2 rounded-full ${
                          m === model ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                        }`}
                      />
                      <span
                        title={m}
                        className={`truncate ${
                          m === model ? 'text-green-300 font-medium' : 'text-white'
                        }`}
                      >
                        {m}
                      </span>
                    </div>
                  </li>


                ))}
              </ul>
            )}
            <button
              onClick={() => navigate('/models')}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600"
              aria-label="Перейти к моделям"
              title="Открыть менеджер моделей"
            >
              <FiCpu className="w-5 h-5" aria-hidden />
            </button>
          </div>

          <div className="flex items-center gap-2 mr-6">
            <button
              onClick={() =>
                topRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600"
              aria-label="Прокрутить вверх"
              title="Прокрутить к началу чата"
            >
              <span className="translate-y-[6px]">⌃</span>
            </button>
            <button
              onClick={() =>
                bottomRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                })
              }
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600"
              aria-label="Прокрутить вниз"
              title="Прокрутить к последнему сообщению"
            >
              <span className="-translate-y-[2px]">⌄</span>
            </button>
          </div>
        </div>

        {/* Input area */}
        <textarea
          ref={textareaRef}
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onInput={e => {
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(
              e.target.scrollHeight,
              window.innerHeight * 0.5
            )}px`
          }}
          onKeyDown={handleKeyDown}
          placeholder="Введите сообщение..."
          className="w-full mt-2 bg-[var(--bg-surface)] p-3 rounded-xl resize-none focus:outline-none custom-scroll"
        />

        {isGenerating && (
          <div
            className="absolute bottom-6 right-20 text-sm text-[var(--text-muted)]"
            role="status"
            aria-live="polite"
          >
            <span className="flex items-center gap-1 animate-think-pulse">
              Модель думает
              <span
                className="inline-block w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-think-pulse"
                style={{ animationDelay: '0s' }}
              />
              <span
                className="inline-block w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-think-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="inline-block w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-think-pulse"
                style={{ animationDelay: '0.4s' }}
              />
            </span>
          </div>
        )}

        <button
          onClick={isGenerating ? stopGenerationHandler : sendMessage}
          disabled={!input.trim() && !isGenerating}
          className={`absolute bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition ${
            isGenerating
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse'
              : 'bg-[var(--accent-gradient-from)] hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600'
          } ${
            !input.trim() && !isGenerating
              ? 'opacity-60 pointer-events-none'
              : ''
          }`}
          aria-label={
            isGenerating ? 'Остановить генерацию' : 'Отправить сообщение'
          }
        >
          {isGenerating ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M6 6h12v12H6z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2v7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
