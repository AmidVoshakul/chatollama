// src/components/MessageActions.jsx
import React, { useRef, useEffect } from 'react'
import {
  CopyIcon,
  CheckIcon,
  EditIcon,
  DeleteIcon,
  RefreshIcon,
} from './icons/MessageIcons'

export default function MessageActions({
  show,
  onClose,
  position = 'right', // 'right' или 'left'
  copied = false,
  isGenerating = false,
  role = 'user', // 'user' или 'assistant'
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  triggerHover = false, // флаг для управления через наведение
  onMouseEnter,
  onMouseLeave,
}) {
  const tooltipRef = useRef(null)

  // Закрытие при клике вне компонента
  useEffect(() => {
    function onClickOutside(e) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  if (!show) return null

  // Позиционирование меню с отступом
  const positionClasses = position === 'right' 
    ? 'absolute top-10 right-0'  // отступ для пользователя
    : 'absolute top-10 left-0'  // сдвинуто ближе к кнопке для ассистента

  // Базовые стили для кнопок
  const buttonBaseClasses = "p-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
  
  // Стили для разных состояний кнопок
  const getButtonClasses = (type, disabled = false) => {
    const baseClasses = buttonBaseClasses
    if (disabled) {
      return `${baseClasses} text-gray-500 opacity-50 cursor-not-allowed`
    }
    
    switch (type) {
      case 'copy':
        return copied 
          ? `${baseClasses} text-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/20` 
          : `${baseClasses} text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20`
      case 'edit':
        return `${baseClasses} text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20`
      case 'delete':
        return `${baseClasses} text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:shadow-lg hover:shadow-rose-500/20`
      case 'regenerate':
        return `${baseClasses} text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20`
      default:
        return baseClasses
    }
  }

  // Кнопки для пользователя
  const userButtons = [
    {
      key: 'copy',
      icon: copied ? <CheckIcon /> : <CopyIcon />,
      title: copied ? "Скопировано!" : "Копировать",
      onClick: onCopy,
      className: getButtonClasses('copy'),
    },
    {
      key: 'edit',
      icon: <EditIcon />,
      title: "Редактировать",
      onClick: onEdit,
      className: getButtonClasses('edit'),
    },
    {
      key: 'delete',
      icon: <DeleteIcon />,
      title: "Удалить",
      onClick: onDelete,
      className: getButtonClasses('delete'),
    },
  ]

  // Кнопки для ассистента
  const assistantButtons = [
    {
      key: 'delete',
      icon: <DeleteIcon />,
      title: "Удалить",
      onClick: onDelete,
      className: getButtonClasses('delete'),
    },
    {
      key: 'copy',
      icon: copied ? <CheckIcon /> : <CopyIcon />,
      title: copied ? "Скопировано!" : "Копировать",
      onClick: onCopy,
      className: getButtonClasses('copy'),
    },
    {
      key: 'edit',
      icon: <EditIcon />,
      title: "Редактировать",
      onClick: onEdit,
      className: getButtonClasses('edit'),
    },
    ...(role === 'assistant' ? [{
      key: 'regenerate',
      icon: <RefreshIcon className={isGenerating ? 'animate-spin' : ''} />,
      title: "Перегенерировать",
      onClick: onRegenerate,
      className: getButtonClasses('regenerate', isGenerating),
      disabled: isGenerating,
    }] : []),
  ]

  const buttons = role === 'user' ? userButtons : assistantButtons

  return (
    <div
      ref={tooltipRef}
      className={`${positionClasses} z-50 animate-fade-in`}
      onMouseEnter={() => {
        // Предотвращаем закрытие при наведении на меню
        if (triggerHover) {
          onMouseEnter?.()
        }
      }}
      onMouseLeave={(e) => {
        // Закрываем только если уходим за пределы всего контейнера
        if (triggerHover) {
          // Проверяем, что уходим не на дочерний элемент
          if (!e.currentTarget.contains(e.relatedTarget)) {
            onMouseLeave?.()
          }
        }
      }}
    >
      <div className="relative">
        {/* Фон с размытием */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl" />
        
        {/* Контент меню */}
        <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-1.5 min-w-[40px]">
          <div className="flex gap-1">
            {buttons.map((button) => (
              <button
                key={button.key}
                onClick={button.onClick}
                title={button.title}
                disabled={button.disabled}
                className={button.className}
                aria-label={button.title}
              >
                {button.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
