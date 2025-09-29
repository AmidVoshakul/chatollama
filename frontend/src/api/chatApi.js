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
