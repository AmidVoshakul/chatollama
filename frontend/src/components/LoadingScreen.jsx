// export default function LoadingScreen() {
//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-[rgba(31,31,31,1)] text-white animate-fade-in">
//       <div className="loader mb-6" />
//       <p className="text-lg font-medium tracking-wide text-gray-300">Загружаем магию чата...</p>
//     </div>
//   )
// }

export default function LoadingScreen() {
    return (
        <div
            className="flex flex-col items-center justify-center h-screen bg-[rgba(31,31,31,1)] text-white animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{animationDelay: '0s'}}/>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{animationDelay: '0.2s'}}/>
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{animationDelay: '0.4s'}}/>
            </div>
            <p className="text-lg font-medium tracking-wide text-gray-300">Загружаем магию чата...</p>
        </div>
    )
}
