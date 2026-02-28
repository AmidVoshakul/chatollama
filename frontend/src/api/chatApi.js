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
export async function sendUserMessageStream(chatId, text, model, onChunk, onDone, onError) {
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
    })

    if (!response.ok) {
        const errorText = await response.text()
        onError?.(errorText)
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
                if (data.startsWith('chunk:')) {
                    onChunk?.(data.slice(6))
                    continue
                }
                if (data.startsWith('done:')) {
                    const messageId = parseInt(data.slice(5), 10)
                    onDone?.(messageId)
                    return
                }
            }
        }
    }
}

// Остановка генерации
export async function stopGeneration(chatId) {
    await axios.post(`/api/chats/${chatId}/stop`)
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
export async function regenerateAssistantMessageStream(messageId, model, onChunk, onDone, onError) {
    const response = await fetch(`/api/messages/${messageId}/regenerate/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({model}),
    })

    if (!response.ok) {
        const errorText = await response.text()
        onError?.(errorText)
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
                if (data.startsWith('chunk:')) {
                    onChunk?.(data.slice(6))
                    continue
                }
                if (data.startsWith('done:')) {
                    const msgId = parseInt(data.slice(5), 10)
                    onDone?.(msgId)
                    return
                }
            }
        }
    }
}
