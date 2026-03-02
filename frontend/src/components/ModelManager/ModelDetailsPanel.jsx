import React from 'react'
import { FaTimes, FaCopy, FaCheck, FaMicrochip, FaDatabase, FaShieldAlt, FaLanguage } from 'react-icons/fa'
import modelTagIcons from '../../constants/modelTagIcons'
import VariantList from './VariantList'

const ICON = 'w-5 h-5'

export default function ModelDetailsPanel({ 
    model, 
    modelInfo,
    installedMap,
    availableModels,
    diskInfo,
    downloadProgress,
    isDownloading,
    onDownload,
    onCancelDownload,
    onDelete,
    onCopy,
    onClose,
    onCopyRef,
    copiedRef,
    hoveredVariant,
    setHoveredVariant,
}) {
    return (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
            <div 
                className="flex-1 bg-black/50 backdrop-blur-sm" 
                onClick={onClose}
                title="Кликните, чтобы закрыть панель"
            />
            <div className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[30%] bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-main)] border-l border-[var(--border-color)] shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                {model.title}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1 font-mono">{model.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onCopyRef(model.name, model.variants?.[0] || '')}
                                className="p-2 rounded-xl hover:bg-[var(--chatitem-hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                title="Копировать пример команды"
                                aria-label="Копировать пример команды"
                            >
                                {copiedRef === `${model.name}:${model.variants?.[0] || ''}` ? (
                                    <FaCheck className={`${ICON} text-green-400`}/>
                                ) : (
                                    <FaCopy className={`${ICON}`}/>
                                )}
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                                title="Закрыть панель"
                                aria-label="Закрыть панель"
                            >
                                <FaTimes className={ICON}/>
                            </button>
                        </div>
                    </div>

                    <div className="custom-scroll overflow-y-auto pr-2 flex-1" style={{maxHeight: '75vh'}}>
                        <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">{model.description}</p>

                        {model.tags && model.tags.length > 0 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {model.tags.map((tag) => (
                                        <span key={tag} className="text-xl">{modelTagIcons[tag]}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {modelInfo ? (
                            <div className="mb-6 space-y-4">
                                <div className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
                                    <span className="w-1 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"></span>
                                    Информация о модели
                                </div>

                                <div className="bg-[var(--bg-main)] rounded-xl p-4 space-y-3 border border-[var(--border-color)]">
                                    {modelInfo.architecture && (
                                        <div className="flex items-center gap-3">
                                            <FaMicrochip className="text-cyan-400 w-4 h-4"/>
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Архитектура</div>
                                                <div className="text-sm text-[var(--text-main)] font-medium">{modelInfo.architecture}</div>
                                            </div>
                                        </div>
                                    )}
                                    {modelInfo.parameters && (
                                        <div className="flex items-center gap-3">
                                            <FaDatabase className="text-violet-400 w-4 h-4"/>
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Параметры</div>
                                                <div className="text-sm text-[var(--text-main)] font-medium">{modelInfo.parameters}</div>
                                            </div>
                                        </div>
                                    )}
                                    {modelInfo.context_length && (
                                        <div className="flex items-center gap-3">
                                            <FaDatabase className="text-cyan-400 w-4 h-4"/>
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Контекст</div>
                                                <div className="text-sm text-[var(--text-main)] font-medium">{modelInfo.context_length}</div>
                                            </div>
                                        </div>
                                    )}
                                    {modelInfo.quantization && (
                                        <div className="flex items-center gap-3">
                                            <FaShieldAlt className="text-green-400 w-4 h-4"/>
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Квантование</div>
                                                <div className="text-sm text-[var(--text-main)] font-medium">{modelInfo.quantization}</div>
                                            </div>
                                        </div>
                                    )}
                                    {modelInfo.license && (
                                        <div className="flex items-center gap-3">
                                            <FaShieldAlt className="text-orange-400 w-4 h-4"/>
                                            <div>
                                                <div className="text-xs text-[var(--text-muted)]">Лицензия</div>
                                                <div className="text-sm text-[var(--text-main)] font-medium">{modelInfo.license}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(model.languages || modelInfo?.languages) && (
                                    <div>
                                        <div className="text-sm text-[var(--text-main)] font-semibold mb-2 flex items-center gap-2">
                                            <FaLanguage className="text-violet-400 w-4 h-4"/>
                                            Языки
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(modelInfo?.languages || model.languages).slice(0, 8).map((lng, i) => (
                                                <div key={i} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 text-[var(--text-main)]">
                                                    {lng}
                                                </div>
                                            ))}
                                            {(modelInfo?.languages || model.languages).length > 8 && (
                                                <div className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-main)] text-[var(--text-muted)]">
                                                    +{(modelInfo?.languages || model.languages).length - 8}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-[var(--text-muted)] mb-6 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                Информация по установленной версии будет показана здесь, если модель установлена.
                            </div>
                        )}

                        {modelInfo?.long_description && (
                            <div className="mt-3 text-sm text-[var(--text-muted)] mb-6 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                {modelInfo.long_description}
                            </div>
                        )}

                        <div className="mt-6 mb-4">
                            <div className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2 mb-4">
                                <span className="w-1 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"></span>
                                Доступные варианты
                                <span className="text-xs font-normal text-[var(--text-muted)] ml-2">({model.variants?.length || 0})</span>
                            </div>

                            <VariantList 
                                variants={model.variants}
                                installedMap={installedMap}
                                modelName={model.name}
                                availableModels={availableModels}
                                diskInfo={diskInfo}
                                downloadProgress={downloadProgress}
                                isDownloading={isDownloading}
                                onDownload={onDownload}
                                onCancelDownload={onCancelDownload}
                                onDelete={onDelete}
                                onCopy={onCopy}
                                hoveredVariant={hoveredVariant}
                                setHoveredVariant={setHoveredVariant}
                                copiedRef={copiedRef}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
