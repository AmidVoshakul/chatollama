import React from 'react'
import { FaCheck, FaTrash, FaLanguage } from 'react-icons/fa'
import modelTagIcons from '../../constants/modelTagIcons'

export default function ModelCard({ 
    model, 
    isInstalled, 
    isActive, 
    isHovered, 
    onClick, 
    onDeleteClick 
}) {
    const isMultilingual = Array.isArray(model.languages) && model.languages.length > 1

    return (
        <div
            onClick={onClick}
            className={`
                relative flex flex-col justify-between
                rounded-2xl cursor-pointer transition-all duration-300
                border overflow-hidden group
                ${isActive
                    ? 'bg-[linear-gradient(135deg,rgba(124,58,237,0.15)_0%,rgba(79,70,229,0.1)_100%)] border-[rgba(124,58,237,0.25)] shadow-lg shadow-violet-500/10'
                    : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.12)_0%,rgba(79,70,229,0.08)_100%)] hover:border-[rgba(124,58,237,0.15)] hover:shadow-lg hover:shadow-violet-500/10 hover:translate-y-[-2px]'
                }
            `}
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-semibold text-[var(--text-main)] flex items-center gap-2">
                        {model.title}
                        {isMultilingual && (
                            <FaLanguage className="text-violet-400 text-sm" title="Multilingual"/>
                        )}
                    </h3>

                    {isInstalled && (
                        <span className="relative group">
                            <span
                                className="cursor-pointer p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteClick(model.name)
                                }}
                                title="Управление установленными вариантами"
                            >
                                {isHovered ? (
                                    <FaTrash className="w-4 h-4 text-red-400"/>
                                ) : (
                                    <FaCheck className="w-4 h-4 text-green-400"/>
                                )}
                            </span>
                        </span>
                    )}
                </div>

                <p className="text-sm text-[var(--text-muted)] line-clamp-2">{model.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-[var(--bg-main)] bg-[var(--bg-main)]/50">
                {model.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-lg">{modelTagIcons[tag]}</span>
                ))}
                {model.tags.length > 4 && (
                    <span className="text-xs text-[var(--text-muted)]">+{model.tags.length - 4}</span>
                )}
            </div>
        </div>
    )
}
