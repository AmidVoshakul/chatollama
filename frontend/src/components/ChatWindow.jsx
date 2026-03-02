// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from 'react'
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
  onChatNotFound,
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
    try {
      await stopGeneration(chat.id)
      setIsGenerating(false)
    } catch {
      setToast?.({ type: 'error', text: 'Не удалось остановить генерацию' })
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
        await apiEditMessage(id, newContent)
        
        const messagesToDelete = messages.slice(msgIndex + 1)
        for (const m of messagesToDelete) {
          if (!isTempId(m.id)) {
            try {
              await apiDeleteMessage(m.id)
            } catch {}
          }
        }
        
        const raw = await fetchMessages(chat.id)
        
        const lastUserMsg = raw.find(m => m.id === id)
        if (!lastUserMsg) return
        
        const newMessages = [...raw]
        const userMsgIdx = newMessages.findIndex(m => m.id === id)
        
        const prompt = newMessages
          .slice(0, userMsgIdx + 1)
          .map(m => `${m.role}: ${m.content}`)
          .join('\n')
        
        const tempId = `temp-${Date.now()}`
        const streamId = `stream-${Date.now()}`
        const now = new Date().toISOString()
        
        setMessages(prev => [
          ...prev.filter(m => m.id !== id || m.role !== 'user'),
          { id: id, role: 'user', content: newContent, created_at: now },
          { id: streamId, role: 'assistant', content: '', _isStreaming: true, created_at: now, model: model },
        ])
        setIsGenerating(true)
        setStreamingThought('')
        setThoughtsEnded(false)
        
        let accumulatedContent = ''
        
        await sendUserMessageStream(
          chat.id,
          newContent,
          model,
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
          },
          (error) => {
            if (error && (error.includes('abort') || error.includes('Abort'))) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === streamId ? { ...m, _isStreaming: false } : m
                )
              )
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
            setMessages(prev =>
              prev.map(m =>
                m.id === streamId ? { ...m, _isStreaming: false } : m
              )
            )
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

    const streamId = `regen-${assistantId}-${Date.now()}`
    const now = new Date().toISOString()
    setMessages(prev =>
      prev.map(m =>
        m.id === assistantId
          ? { ...m, content: '', _isRegenerating: true, _tempStreamId: streamId, created_at: now }
          : m
      )
    )
    setIsGenerating(true)

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
        () => {
          setMessages(prev =>
            prev.map(m =>
              m._tempStreamId === streamId
                ? { ...m, _isRegenerating: false, _tempStreamId: null }
                : m
            )
          )
          setIsGenerating(false)
        },
        (error) => {
          setMessages(prev =>
            prev.map(m =>
              m._tempStreamId === streamId
                ? { ...m, _isRegenerating: false, _tempStreamId: null, _error: true }
                : m
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
    } finally {
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
      <MessageList
        messages={messages}
        model={model}
        isSidebarOpen={isSidebarOpen}
        transparentMode={transparentMode}
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

      <div className="relative">
        <div className="flex items-center justify-between px-1 mt-2">
          <ModelSelector
            model={model}
            models={models}
            onModelChange={onModelChange}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
          />
          <ScrollControls topRef={topRef} bottomRef={bottomRef} />
        </div>

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
  )
}
