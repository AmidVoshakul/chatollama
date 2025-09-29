// backend/index.js
import express from 'express'
import {exec} from 'child_process'
import util from 'util'

const app = express()
const port = 8000
const execA = util.promisify(exec)

app.use(express.json())

// Эндпоинт возвращает массив имён моделей, как из `ollama list`
app.get('/api/models', async (req, res) => {
    try {
        // --json выводит [{"name":"phi4-mini:3.8b",…},…]
        const {stdout} = await execA('ollama list --json')
        const arr = JSON.parse(stdout)
        const names = Array.isArray(arr)
            ? arr.map(m => m.name)
            : []
        res.json(names)
    } catch (e) {
        console.error('Error listing models:', e)
        res.status(500).json({error: e.message})
    }
})

app.get('/api/chats', /* ваш существующий контроллер */)
app.post('/api/chats', /* ваш контроллер создания */)
app.delete('/api/chats/:id', /* ваш контроллер удаления */)
app.post('/api/chats/:id/messages', /* ваш контроллер отправки */)
app.get('/api/chats/:id/messages', /* ваш контроллер чтения */)

app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`)
})
