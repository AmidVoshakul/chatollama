// src/constants/modelTagIcons.jsx
import React from 'react'
import {BiConversation, BiCodeAlt, BiSolidLowVision} from 'react-icons/bi'
import {LuBrain} from 'react-icons/lu'
import {VscTools} from 'react-icons/vsc'
import {IoLanguageSharp} from 'react-icons/io5'
import {PiCalculatorLight} from 'react-icons/pi'

export const modelTagIcons = {
    dialogue: <BiConversation className="text-[var(--text-muted)]" title="Диалог" aria-hidden/>,
    multilingual: <IoLanguageSharp className="text-purple-400" title="Мультиязычность" aria-hidden/>,
    code: <BiCodeAlt className="text-green-400" title="Код" aria-hidden/>,
    reasoning: <LuBrain className="text-yellow-400" title="Логика" aria-hidden/>,
    tools: <VscTools className="text-cyan-400" title="Инструменты" aria-hidden/>,
    vision: <BiSolidLowVision className="text-indigo-400" title="Зрение" aria-hidden/>,
    math: <PiCalculatorLight className="text-indigo-400" title="Математика" aria-hidden/>
}
export default modelTagIcons
