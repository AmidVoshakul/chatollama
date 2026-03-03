export default function ErrorScreen({onRetry}) {
    return (
        <div
            className="flex flex-col items-center justify-center h-screen bg-[rgba(21,21,21,1)] text-white animate-fade-in">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold mb-2">Нет доступных чатов или моделей</h1>
            <p className="text-gray-400 mb-6 text-center max-w-md">
                Проверь, что сервер запущен и API возвращает данные. Попробуй перезагрузить страницу
                чат.
            </p>
            <button
                onClick={onRetry}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-md hover:opacity-90 transition"
            >
                🔄 Перезагрузить
            </button>
        </div>
    )
}
