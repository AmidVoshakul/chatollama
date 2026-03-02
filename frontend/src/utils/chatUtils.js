// src/utils/chatUtils.js

// Проверка временного ID
export const isTempId = id => typeof id === 'string' && id.startsWith('temp-')

// Извлечение мысли из текста ассистента
export function extractThoughtFromContent(text) {
    if (typeof text !== 'string') {
        return {contentWithoutThought: text, thought: null}
    }
    const regex = /<think>([\s\S]*?)<\/think>/i
    const match = text.match(regex)
    if (!match) {
        return {contentWithoutThought: text, thought: null}
    }
    return {
        thought: match[1].trim(),
        contentWithoutThought: text.replace(regex, '').trim(),
    }
}

// Получение списка уже показанных мыслей
export function getShownThoughtIds() {
    try {
        return JSON.parse(localStorage.getItem('shownThoughtIds') || '[]')
    } catch {
        return []
    }
}

// Добавление ID мысли в список показанных
export function addShownThoughtId(id) {
    const shown = getShownThoughtIds()
    if (!shown.includes(id)) {
        localStorage.setItem('shownThoughtIds', JSON.stringify([...shown, id]))
    }
}

// Удаление мыслей, связанных с конкретным сообщением
export function removeShownThoughtIdForMessage(messageId) {
    const shown = getShownThoughtIds()
    const prefix = `thought-${messageId}`
    const filtered = shown.filter(s => !s.startsWith(prefix))
    localStorage.setItem('shownThoughtIds', JSON.stringify(filtered))
}
