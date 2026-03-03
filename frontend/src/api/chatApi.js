// src/api/chatApi.js
import axios from 'axios'

// Получение сообщений для чата
export async function fetchMessages(chatId) {
    const {data} = await axios.get(`/api/chats/${chatId}/messages`)
    return Array.isArray(data) ? data : []
}

// Отправка нового сообщения
export async function sendUserMessage(chatId, text, model) {
    await axios.post(`/api/chats/${chatId}/messages`, {
        chat_id: chatId,
        role: 'user',
        content: text,
        model,
    })
}

// Streaming отправка сообщения - использует fetch с ReadableStream
let currentAbortController = null

export async function sendUserMessageStream(chatId, text, model, onChunk, onDone, onError, onThought, onAbort) {
    if (currentAbortController) {
        currentAbortController.abort()
    }
    currentAbortController = new AbortController()
    
    try {
        const response = await fetch(`/api/chats/${chatId}/messages/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                role: 'user',
                content: text,
                model,
            }),
            signal: currentAbortController.signal,
        })

        if (!response.ok) {
            const errorText = await response.text()
            if (response.status === 0 || response.type === 'error') {
                onAbort?.('abort')
                return
            }
            onError?.(errorText)
            currentAbortController = null
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const {done, value} = await reader.read()
            if (done) break

            const text = decoder.decode(value, {stream: true})
            const lines = text.split('\n')

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const data = line.slice(5).trim()
                    if (data.startsWith('error:')) {
                        onError?.(data.slice(6))
                        return
                    }
                    if (data.startsWith('thought:')) {
                        onThought?.(data.slice(8))
                        continue
                    }
                    if (data.startsWith('chunk:')) {
                        onChunk?.(data.slice(6))
                        continue
                    }
                    if (data.startsWith('done:')) {
                        const messageId = parseInt(data.slice(5), 10)
                        onDone?.(messageId)
                        currentAbortController = null
                        return
                    }
                }
            }
        }
    } catch (e) {
        if (e.name === 'AbortError' || e.type === 'abort') {
            onAbort?.('abort')
            return
        }
        console.error('Stream error:', e)
    } finally {
        currentAbortController = null
    }
}

// Остановка генерации
export async function stopGeneration(chatId) {
    if (currentAbortController) {
        currentAbortController.abort()
        currentAbortController = null
    }
    try {
        await axios.post(`/api/chats/${chatId}/stop`)
    } catch (e) {
        console.log('Stop generation:', e.message)
    }
}

// Streaming генерация ответа без создания сообщения пользователя
export async function sendGenerateStream(chatId, model, prompt, onChunk, onThought, onDone, onError) {
    if (currentAbortController) {
        currentAbortController.abort()
    }
    currentAbortController = new AbortController()
    
    try {
        const response = await fetch(`/api/chats/${chatId}/generate/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ model, prompt }),
            signal: currentAbortController.signal,
        })

        if (!response.ok) {
            const errorText = await response.text()
            if (response.status === 0 || response.type === 'error') {
                onError?.('abort')
                return
            }
            onError?.(errorText)
            currentAbortController = null
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const {done, value} = await reader.read()
            if (done) break

            const text = decoder.decode(value, {stream: true})
            const lines = text.split('\n')

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const data = line.slice(5).trim()
                    if (data.startsWith('error:')) {
                        onError?.(data.slice(6))
                        return
                    }
                    if (data.startsWith('thought:')) {
                        onThought?.(data.slice(8))
                        continue
                    }
                    if (data.startsWith('chunk:')) {
                        onChunk?.(data.slice(6))
                        continue
                    }
                    if (data.startsWith('done:')) {
                        const messageId = parseInt(data.slice(5), 10)
                        onDone?.(messageId)
                        currentAbortController = null
                        return
                    }
                }
            }
        }
    } catch (e) {
        if (e.name === 'AbortError' || e.type === 'abort') {
            onError?.('abort')
            return
        }
        console.error('Generate stream error:', e)
    } finally {
        currentAbortController = null
    }
}

// Генерация ответа без создания сообщения пользователя
export async function generateResponse(chatId, model, prompt) {
    const {data} = await axios.post(`/api/chats/${chatId}/generate`, {
        model,
        prompt,
    })
    return data
}

// Удаление сообщения
export async function deleteMessage(messageId) {
    await axios.delete(`/api/messages/${messageId}`)
}

// Редактирование сообщения
export async function editMessage(messageId, newContent) {
    await axios.put(`/api/messages/${messageId}`, {content: newContent})
}

// Перегенерация ответа ассистента
export async function regenerateAssistantMessage(messageId, model) {
    const {data} = await axios.post(`/api/messages/${messageId}/regenerate`, {model})
    return data
}

// Streaming перегенерация ответа ассистента
export async function regenerateAssistantMessageStream(messageId, model, onChunk, onThought, onDone, onError, onAbort) {
    if (currentAbortController) {
        currentAbortController.abort()
    }
    currentAbortController = new AbortController()
    
    try {
        const response = await fetch(`/api/messages/${messageId}/regenerate/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({model}),
            signal: currentAbortController.signal,
        })

        if (!response.ok) {
            const errorText = await response.text()
            if (response.status === 0 || response.type === 'error') {
                onAbort?.('abort')
                return
            }
            onError?.(errorText)
            currentAbortController = null
            return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const {done, value} = await reader.read()
            if (done) break

            const text = decoder.decode(value, {stream: true})
            const lines = text.split('\n')

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const data = line.slice(5).trim()
                    if (data.startsWith('error:')) {
                        onError?.(data.slice(6))
                        return
                    }
                    if (data.startsWith('thought:')) {
                        onThought?.(data.slice(8))
                        continue
                    }
                    if (data.startsWith('chunk:')) {
                        onChunk?.(data.slice(6))
                        continue
                    }
                    if (data.startsWith('done:')) {
                        const msgId = parseInt(data.slice(5), 10)
                        onDone?.(msgId)
                        currentAbortController = null
                        return
                    }
                }
            }
        }
    } catch (e) {
        if (e.name === 'AbortError' || e.type === 'abort') {
            onAbort?.('abort')
            return
        }
        console.error('Regenerate stream error:', e)
    } finally {
        currentAbortController = null
    }
}
