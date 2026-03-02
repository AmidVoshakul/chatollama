import React from 'react'
import { FaCheck, FaTrash, FaDownload, FaTimes, FaCopy } from 'react-icons/fa'
import { formatBytes } from '../../utils/formatBytes'

const ICON = 'w-5 h-5'

export default function VariantList({ 
    variants, 
    installedMap, 
    modelName,
    availableModels,
    diskInfo,
    downloadProgress,
    isDownloading,
    onDownload,
    onCancelDownload,
    onDelete,
    onCopy,
    hoveredVariant,
    setHoveredVariant,
    copiedRef,
}) {
    const modelEntry = availableModels.find(m => m.name === modelName) || {}

    const getVariantSize = (variant) => {
        const size = (modelEntry.variantSizes && 
            (modelEntry.variantSizes[variant] || modelEntry.variantSizes[variant.toLowerCase()])) || ''
        
        if (!size || size === '-') return null

        const num = parseFloat(size.replace(/GB|MB/i, ''))
        if (size.toLowerCase().includes('gb')) return { display: size, bytes: num * 1024 ** 3 }
        if (size.toLowerCase().includes('mb')) return { display: size, bytes: num * 1024 ** 2 }
        return { display: size, bytes: null }
    }

    const checkInsufficientSpace = (sizeInfo) => {
        return diskInfo?.freeBytes != null && sizeInfo?.bytes != null && diskInfo.freeBytes < sizeInfo.bytes
    }

    if (!Array.isArray(variants) || variants.length === 0) {
        return (
            <div className="text-[var(--text-muted)] p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                Варианты недоступны.
            </div>
        )
    }

    return (
        <ul className="space-y-2">
            {variants.map((variant) => {
                const isInstalledVariant =
                    Array.isArray(installedMap[modelName]) &&
                    installedMap[modelName].some(v => String(v).toLowerCase() === String(variant).toLowerCase())

                const isDownloadingVariant = isDownloading(modelName, variant)
                const sizeInfo = getVariantSize(variant)
                const insufficientSpace = sizeInfo ? checkInsufficientSpace(sizeInfo) : false

                return (
                    <li 
                        key={variant} 
                        className={`p-3 rounded-xl border transition-all duration-200 ${
                            isInstalledVariant 
                                ? 'bg-green-500/5 border-green-500/20' 
                                : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-cyan-500/30'
                        }`}
                        onMouseEnter={() => setHoveredVariant(variant)}
                        onMouseLeave={() => setHoveredVariant(null)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[var(--text-main)] font-medium text-sm">{variant}</span>
                                    
                                    {isDownloadingVariant && downloadProgress ? (
                                        <span className="text-xs mt-0.5 text-[var(--text-muted)]">
                                            {downloadProgress.downloaded || '0 MB'}/{downloadProgress.total || sizeInfo?.display || '?'} | {downloadProgress.percent || 0}%{downloadProgress.speed ? `   ${downloadProgress.speed}` : ''}
                                        </span>
                                    ) : sizeInfo?.display && (
                                        <span className={`text-xs mt-0.5 ${insufficientSpace ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                                            {sizeInfo.display}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                {isInstalledVariant ? (
                                    hoveredVariant === variant ? (
                                        <button
                                            onClick={() => onDelete(modelName, variant)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                                            title={`Удалить ${modelName}:${variant}`}
                                            aria-label={`Удалить ${modelName}:${variant}`}>
                                            <FaTrash className="w-4 h-4"/>
                                        </button>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-green-400 text-xs px-2 py-1 bg-green-500/10 rounded-lg">
                                            <FaCheck className="w-3 h-3"/> Установлено
                                        </span>
                                    )
                                ) : isDownloadingVariant ? (
                                    downloadProgress && downloadProgress.percent >= 100 ? (
                                        <span className="flex items-center gap-1.5 text-green-400 text-xs px-2 py-1 bg-green-500/10 rounded-lg">
                                            <FaCheck className="w-3 h-3"/> Готово
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => onCancelDownload(modelName, variant)}
                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                                            title={`Отменить скачивание ${modelName}:${variant}`}
                                            aria-label={`Отменить скачивание ${modelName}:${variant}`}>
                                            <FaTimes className="w-4 h-4"/>
                                        </button>
                                    )
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onDownload(modelName, variant)}
                                            className={`p-2 rounded-lg transition-all ${insufficientSpace ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-500/10 text-cyan-400 hover:scale-110'}`}
                                            title={insufficientSpace ? `Мало места: ${formatBytes(diskInfo?.freeBytes || 0)}` : `Скачать ${modelName}:${variant}`}
                                            disabled={insufficientSpace}
                                            aria-label={`Скачать ${modelName}:${variant}`}>
                                            <FaDownload className="w-4 h-4"/>
                                        </button>

                                        <button
                                            onClick={() => onCopy(modelName, variant)}
                                            className="p-2 rounded-lg hover:bg-[var(--chatitem-hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                            title="Копировать команду"
                                            aria-label="Копировать команду">
                                            {copiedRef === `${modelName}:${variant}` ? (
                                                <FaCheck className={`${ICON} text-green-400`}/>
                                            ) : (
                                                <FaCopy className={`${ICON}`}/>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {isDownloadingVariant && downloadProgress && downloadProgress.percent < 100 && (
                            <div className="mt-2 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500 ease-out rounded-full"
                                    style={{width: `${downloadProgress.percent}%`}}
                                />
                            </div>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
