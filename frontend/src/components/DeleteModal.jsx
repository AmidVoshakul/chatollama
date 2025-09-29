// src/components/DeleteModal.jsx
import React from 'react'
import {FaTimes} from 'react-icons/fa'

export default function DeleteModal({
                                        open,
                                        model,
                                        selectedSet = new Set(),
                                        onToggleVariant = () => {
                                        },
                                        onCancel = () => {
                                        },
                                        onConfirm = () => {
                                        },
                                    }) {
    if (!open || !model) return null

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true"
             aria-labelledby="deleteModalTitle">
            <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-theme rounded-xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 id="deleteModalTitle" className="text-xl font-semibold text-[var(--text-main)]">Удалить
                        установленные варианты</h3>
                    <button onClick={onCancel} className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
                            aria-label="Закрыть">
                        <FaTimes className="w-5 h-5"/>
                    </button>
                </div>

                <p className="text-sm text-[var(--text-muted)] mb-4">
                    Выберите варианты <span className="font-medium text-[var(--text-main)]">{model.name}</span>, которые
                    нужно удалить:
                </p>

                <div className="space-y-2 max-h-48 overflow-auto mb-4">
                    {(!model.variants || model.variants.length === 0) && (
                        <div className="text-[var(--text-muted)]">Установленные варианты не найдены.</div>
                    )}

                    {model.variants?.map(v => {
                        const checked = selectedSet.has(v)
                        return (
                            <label
                                key={v}
                                className={`flex items-center justify-between p-3 rounded ${checked ? 'bg-[rgba(0,0,0,0.03)]' : 'bg-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onToggleVariant(v)}
                                        className="w-4 h-4 accent-purple-500"
                                        aria-checked={checked}
                                        aria-label={`Выбрать вариант ${v}`}
                                    />
                                    <span className="text-[var(--text-main)]">{v}</span>
                                </div>
                                <div className="text-[var(--text-muted)] text-sm opacity-80">ollama
                                    rm {model.name}:{v}</div>
                            </label>
                        )
                    })}
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded text-sm bg-[var(--bg-surface)] border border-theme hover:opacity-90 text-[var(--text-muted)]"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded text-sm bg-gradient-to-r from-red-600 to-red-500 text-white hover:opacity-95"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    )
}
