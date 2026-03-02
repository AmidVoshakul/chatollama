// src/components/sidebar/Logo.jsx
import React from 'react'

export default function Logo({ className = '' }) {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 256 256" 
      xmlns="http://www.w3.org/2000/svg" 
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="bubbleGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00BCFF"/>
          <stop offset="100%" stopColor="#6623E7"/>
        </linearGradient>
      </defs>
      <path
        d="M64 48h128c17.7 0 32 14.3 32 32v96c0 17.7-14.3 32-32 32h-64l-32 32v-32H64c-17.7 0-32-14.3-32-32V80c0-17.7 14.3-32 32-32z"
        fill="url(#bubbleGradient)"
      />
      <path
        d="M128 80 C120 60, 100 56, 96 60 C100 68, 100 76, 96 84 C92 92, 96 104, 104 108 C108 110, 112 108, 116 104 C120 108, 124 110, 128 108 C136 104, 140 92, 136 84 C132 76, 132 68, 136 60 C132 56, 112 60, 128 80 Z"
        fill="none"
        stroke="#002D75"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M112 104c4 -4 8 -4 12 0" stroke="#002D75" strokeWidth="4" strokeLinecap="round"/>
      <path d="M120 116c4 4 8 4 12 0" stroke="#002D75" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}
