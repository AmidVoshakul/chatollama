// src/components/icons/MessageIcons.jsx
import React from 'react'

// Базовый компонент для иконок
export const Icon = ({ children, className = '', ...props }) => (
  <svg 
    className={`w-4 h-4 ${className}`} 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    {...props}
  >
    {children}
  </svg>
)

// Иконка трех точек (меню)
export const MoreVerticalIcon = (props) => (
  <Icon {...props}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </Icon>
)

// Иконка копирования
export const CopyIcon = (props) => (
  <Icon {...props}>
    <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zM20 5H8a2 2 0 0 0-2 2v16h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
  </Icon>
)

// Иконка успешного копирования
export const CheckIcon = (props) => (
  <Icon {...props}>
    <path d="M20.285 6.709l-11.285 11.285-5.285-5.285 1.415-1.414 3.87 3.87 9.87-9.87z" />
  </Icon>
)

// Иконка редактирования
export const EditIcon = (props) => (
  <Icon {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.42l-2.34-2.34a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
  </Icon>
)

// Иконка удаления (как в сайдбаре)
export const DeleteIcon = (props) => (
  <Icon {...props}>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </Icon>
)

// Иконка перегенерации
export const RefreshIcon = ({ className = '', ...props }) => (
  <Icon 
    className={className} 
    {...props}
  >
    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 .34-.03.67-.08.99l1.53 1.53C19.82 13.18 20 12.61 20 12c0-4.42-3.58-8-8-8zM12 20v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-.34.03-.67.08-.99l-1.53-1.53C4.18 10.82 4 11.39 4 12c0 4.42 3.58 8 8 8z" />
  </Icon>
)

// Иконка отмены
export const XIcon = (props) => (
  <Icon {...props} fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </Icon>
)

// Иконка сохранения
export const SaveIcon = (props) => (
  <Icon {...props} fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </Icon>
)

// Иконка отправки
export const SendIcon = (props) => (
  <Icon {...props} fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </Icon>
)

// Иконка пользователя
export const UserIcon = (props) => (
  <Icon {...props}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </Icon>
)

// Иконка модели/мозга
export const CpuIcon = (props) => (
  <Icon {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </Icon>
)
