// src/components/ModelManager.jsx
import React, {useState, useEffect, useCallback} from 'react'
import axios from 'axios'
import {
    FaArrowLeft,
    FaSearch,
    FaCheck,
    FaTrash,
    FaDownload,
    FaTimes,
    FaMicrochip,
    FaDatabase,
    FaShieldAlt,
    FaLanguage,
    FaCopy
} from 'react-icons/fa'
import LoadingScreen from './LoadingScreen'
import { useModelCatalog } from '../hooks/useModelCatalog'
import modelTagIcons from '../constants/modelTagIcons'
import DeleteModal from './DeleteModal'
import Toast from './Toast'
import {formatBytes} from '../utils/formatBytes'

const ICON = 'w-5 h-5'
const ICON_CLICK = 'w-5 h-5 hover:scale-110 transition-transform duration-150'
const VARIANT_ICON = 'w-4 h-4'
const DOWNLOAD_ICON_COLOR = 'text-[var(--text-muted)]'

const popularModelNames = [
    'gpt-oss', 'deepseek-r1', 'deepseek-v3.1', 'deepseek-coder', 'deepseek-coder-v2', 'llama3.1', 'llama3.2',
    'llama3', 'llava', 'gemma3', 'phi4', 'phi4-mini', 'qwen3', 'qwen3-coder', 'qwen2.5', 'codegemma', 'codellama',
    'granite3.1-dense', 'wizardcoder', 'stable-code', 'opencoder', 'aya', 'granite-code'
]

export default function ModelManager() {
    const { models: availableModels, loading: catalogLoading } = useModelCatalog()
    const [installedModels, setInstalledModels] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedModel, setSelectedModel] = useState(null)
    const [hoveredModel, setHoveredModel] = useState(null)
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const [mobileFilter, setMobileFilter] = useState('all')
    const [downloadingModel, setDownloadingModel] = useState(null)
    const [isCancelling, setIsCancelling] = useState(false)
    const [copiedRef, setCopiedRef] = useState(null)
    const [modelInfo, setModelInfo] = useState(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deleteModalModel, setDeleteModalModel] = useState(null)
    const [deleteModalSelected, setDeleteModalSelected] = useState(new Set())
    const [hoveredVariant, setHoveredVariant] = useState(null)
    const [diskInfo, setDiskInfo] = useState(null)
    const [toast, setToast] = useState(null)
    const [downloadProgress, setDownloadProgress] = useState(0)

    // debug render log
    // console.log('ModelManager render:', { selectedModel })

    // Load installed models and disk info
    useEffect(() => {
        let mounted = true
        axios.get('/api/models')
            .then(res => {
                if (!mounted) return;
                setInstalledModels(Array.isArray(res.data) ? res.data : [])
            })
            .catch(err => {
                console.error(err);
                setToast({text: 'Не удалось получить список установленных моделей', type: 'error'})
            })
            .finally(() => {
                if (!mounted) return;
                if (!catalogLoading) setLoading(false)
            })

        axios.get('/api/system/disk')
            .then(res => {
                if (!mounted) return;
                if (res.data && typeof res.data.freeBytes === 'number') setDiskInfo(res.data)
            })
            .catch(() => {
            })

        return () => {
            mounted = false
        }
    }, [catalogLoading])

    // Map installed models to { name: [variants] }
    const installedMap = installedModels.reduce((acc, m) => {
        const [name, variant] = typeof m === 'string' ? m.split(':') : []
        if (!name || !variant) return acc
        if (!acc[name]) acc[name] = []
        acc[name].push(variant)
        return acc
    }, {})

    // Filtered / searched models for display
    const displayedModels = availableModels
        .filter(m => {
            if (filter === 'installed') return Boolean(installedMap[m.name])
            if (filter === 'popular') return popularModelNames.includes(m.name) || popularModelNames.includes(`${m.name}:${m.variants?.[0]}`)
            return true
        })
        .filter(m => {
            if (!searchTerm) return true
            const t = searchTerm.toLowerCase()
            return m.title.toLowerCase().includes(t) || m.name.toLowerCase().includes(t)
        })

    useEffect(() => {
        setMobileFilter(filter)
    }, [filter])

    // Load model info for selectedModel when installed
    useEffect(() => {
        let mounted = true
        setModelInfo(null)
        if (!selectedModel) return
        const variants = installedMap[selectedModel.name]
        if (!variants || variants.length === 0) return
        const variant = variants[0]
        axios.get(`/api/models/info/${encodeURIComponent(selectedModel.name)}?variant=${encodeURIComponent(variant)}`)
            .then(res => {
                if (!mounted) return;
                setModelInfo(res.data || null)
            })
            .catch(err => {
                console.error('Ошибка получения информации о модели:', err);
                if (!mounted) return;
                setModelInfo(null)
            })
        return () => {
            mounted = false
        }
    }, [selectedModel, installedModels])

    const showToast = (text, type = 'info') => {
        setToast({text, type})
        setTimeout(() => setToast(null), 3000)
    }

    const handleDownload = useCallback(async (name, variant) => {
        if (downloadingModel && downloadingModel.name === name && downloadingModel.variant === variant) return
        setDownloadingModel({name, variant})
        setDownloadProgress(0)
        setIsCancelling(false)
        try {
            await axios.post('/api/models/download', {name, variant})
            let finished = false
            while (!finished && !isCancelling) {
                await new Promise(res => setTimeout(res, 800))
                const {data} = await axios.get(`/api/models/progress?name=${encodeURIComponent(name)}&variant=${encodeURIComponent(variant)}&t=${Date.now()}`)
                const percent = typeof data?.percent === 'number' ? data.percent : (typeof data?.progress === 'number' ? data.progress : 0)
                setDownloadProgress(Math.max(0, Math.min(100, Number(percent || 0))))
                if ((percent || 0) >= 100) finished = true
            }
            if (!isCancelling) {
                setInstalledModels(prev => prev.includes(`${name}:${variant}`) ? prev : [...prev, `${name}:${variant}`])
                showToast(`Модель ${name}:${variant} установлена`, 'success')
            }
            setTimeout(() => {
                setDownloadingModel(null);
                setDownloadProgress(0);
                setIsCancelling(false)
            }, 1200)
        } catch (err) {
            showToast(`Ошибка скачивания: ${err?.response?.data?.detail || err.message}`, 'error')
            setTimeout(() => {
                setDownloadingModel(null);
                setDownloadProgress(0);
                setIsCancelling(false)
            }, 800)
        }
    }, [downloadingModel, isCancelling])

    const cancelDownload = useCallback(async (name, variant) => {
        setIsCancelling(true)
        try {
            await axios.post('/api/models/cancel', {name, variant})
            showToast(`Скачивание ${name}:${variant} отменено`, 'success')
        } catch (err) {
            showToast(`Ошибка отмены: ${err?.response?.data?.detail || err.message}`, 'error')
        } finally {
            setDownloadingModel(null)
            setDownloadProgress(0)
            setIsCancelling(false)
        }
    }, [])

    const confirmModalDelete = useCallback(async () => {
        if (!deleteModalModel) return
        const name = deleteModalModel.name
        const toDelete = Array.from(deleteModalSelected)
        if (toDelete.length === 0) {
            setDeleteModalOpen(false);
            return
        }
        try {
            for (const variant of toDelete) {
                await axios.delete(`/api/models/${encodeURIComponent(name)}:${encodeURIComponent(variant)}`)
                setInstalledModels(prev => prev.filter(m => m !== `${name}:${variant}`))
                showToast(`Модель ${name}:${variant} удалена`, 'success')
            }
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || 'Ошибка удаления'
            showToast(`Ошибка при удалении: ${msg}`, 'error')
        } finally {
            setDeleteModalOpen(false)
            setDeleteModalModel(null)
            setDeleteModalSelected(new Set())
            if (selectedModel?.name === name) setModelInfo(null)
        }
    }, [deleteModalModel, deleteModalSelected, selectedModel])

    const deleteVariantDirect = useCallback(async (name, variant) => {
        try {
            await axios.delete(`/api/models/${encodeURIComponent(name)}:${encodeURIComponent(variant)}`)
            setInstalledModels(prev => prev.filter(m => m !== `${name}:${variant}`))
            showToast(`Модель ${name}:${variant} удалена`, 'success')
            if (selectedModel?.name === name) setModelInfo(null)
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || 'Ошибка удаления'
            showToast(`Ошибка удаления: ${msg}`, 'error')
            console.error('Ошибка удаления варианта:', err)
        }
    }, [selectedModel])

    const copyPullCommand = useCallback((name, variant) => {
        const key = `${name}:${variant}`
        const cmd = `ollama pull ${name}:${variant}`
        navigator.clipboard?.writeText(cmd).then(() => {
            setCopiedRef(key)
            showToast('Команда скопирована', 'success')
            setTimeout(() => setCopiedRef(null), 1200)
        }).catch(() => {
            showToast('Не удалось скопировать', 'error')
        })
    }, [])

    const openDeleteModalForModel = useCallback((name) => {
        const variants = (installedMap[name] || []).slice()
        setDeleteModalModel({name, variants})
        setDeleteModalSelected(new Set(variants))
        setDeleteModalOpen(true)
    }, [installedMap])

    const toggleModalVariant = useCallback((v) => {
        setDeleteModalSelected(prev => {
            const copy = new Set(prev)
            if (copy.has(v)) {
                copy.delete(v)
            } else {
                copy.add(v)
            }
            return copy
        })
    }, [])

    if (loading) return <LoadingScreen/>

    const gradientBase = 'bg-gradient-to-r from-[var(--accent-gradient-from)] to-[var(--accent-gradient-to)] bg-[length:200%_200%] bg-[position:0%_50%]'

    return (
        <div className="relative bg-[var(--bg-main)] min-h-screen text-[var(--text-main)]">
            {/* Header */}
            <div className="relative flex items-center gap-3 p-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
                <button onClick={() => window.history.back()}
                        className="p-2 rounded-xl hover:bg-[var(--chatitem-hover-bg)] transition-colors" title="Вернуться">
                    <FaArrowLeft className={`${ICON} text-[var(--text-muted)]`}/>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl">
                    {['all', 'installed', 'popular'].map(k => (
                        <button key={k} onClick={() => {
                            setFilter(k);
                            setMobileFilter(k)
                        }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    filter === k 
                                        ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20' 
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--chatitem-hover-bg)]'
                                }`}>
                            {k === 'all' ? 'Все' : k === 'installed' ? 'Установленные' : 'Популярные'}
                        </button>
                    ))}
                </div>

                <div className="sm:hidden">
                    <select value={mobileFilter} onChange={(e) => {
                        setMobileFilter(e.target.value);
                        setFilter(e.target.value)
                    }}
                            className="bg-[var(--bg-main)] text-sm text-[var(--text-main)] px-4 py-2 rounded-xl border border-[var(--border-color)] focus:outline-none focus:border-cyan-500">
                        <option value="all">Все</option>
                        <option value="installed">Установленные</option>
                        <option value="popular">Популярные</option>
                    </select>
                </div>

                <div
                    className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1/3 min-w-[260px] max-w-[460px]">
                    <div className="relative">
                        <FaSearch
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]"/>
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Поиск..."
                               className="w-full pl-11 pr-4 py-2.5 bg-[var(--bg-main)] text-[var(--text-main)] text-sm rounded-xl border border-[var(--border-color)] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"/>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <button className="lg:hidden p-2 rounded-xl hover:bg-[var(--chatitem-hover-bg)] text-[var(--text-muted)]"
                            onClick={() => setMobileSearchOpen(v => !v)} title="Поиск">
                        <FaSearch className={ICON}/>
                    </button>
                </div>
            </div>

            {/* Mobile search */}
            {mobileSearchOpen && (
                <div className="lg:hidden bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-4 py-3 z-40">
                    <div className="max-w-[920px] mx-auto">
                        <div className="relative">
                            <FaSearch
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]"/>
                            <input autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                   placeholder="Поиск моделей..."
                                   className="w-full pl-11 pr-10 py-2.5 bg-[var(--bg-main)] text-[var(--text-main)] text-sm rounded-xl border border-[var(--border-color)] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"/>
                            <button
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                onClick={() => setMobileSearchOpen(false)} aria-label="Закрыть поиск"><FaTimes
                                className={ICON}/></button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 custom-scroll">
                {displayedModels.map((model) => {
                    const isInstalled = Boolean(installedMap[model.name])
                    const isActive = selectedModel?.name === model.name
                    const isHovered = hoveredModel === model.name
                    const isMultilingual = Array.isArray(model.languages) && model.languages.length > 1

                    return (
                        <div
                            key={model.name}
                            onClick={() => {
                                setSelectedModel(model)
                            }}
                            className={`
                                relative flex flex-col justify-between 
                                rounded-2xl cursor-pointer transition-all duration-300 
                                border overflow-hidden
                                ${isActive 
                                    ? 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
                                    : isHovered 
                                        ? 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 hover:translate-y-[-2px]' 
                                        : 'bg-[var(--bg-surface)] border-[var(--border-color)]'
                                }
                            `}
                            onMouseEnter={() => setHoveredModel(model.name)}
                            onMouseLeave={() => setHoveredModel(null)}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-base font-semibold text-[var(--text-main)] flex items-center gap-2">
                                        {model.title}
                                        {isMultilingual &&
                                            <FaLanguage className="text-violet-400 text-sm" title="Multilingual"/>}
                                    </h3>

                                    {isInstalled && (
                                        <span className="relative group">
                      <span
                          className="cursor-pointer p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModalForModel(model.name)
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

                            <div
                                className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-[var(--border-color)] bg-[var(--bg-main)]/50">
                                {model.tags.slice(0, 4).map((tag) => (
                                    <span key={tag} className="text-lg">{modelTagIcons[tag]}</span>
                                ))}
                                {model.tags.length > 4 && (
                                    <span className="text-xs text-[var(--text-muted)]">+{model.tags.length - 4}</span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Details panel */}
            {selectedModel && (
                <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
                    <div className="flex-1 bg-black/50 backdrop-blur-sm" onMouseDown={() => setSelectedModel(null)}
                         title="Кликните, чтобы закрыть панель"/>
                    <div
                        className="w-full sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[30%] bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-main)] border-l border-[var(--border-color)] shadow-2xl"
                        onMouseDown={(e) => e.stopPropagation()}>
                        <div className="p-6 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                                        {selectedModel.title}
                                    </h2>
                                    <p className="text-sm text-[var(--text-muted)] mt-1 font-mono">{selectedModel.name}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyPullCommand(selectedModel.name, selectedModel.variants?.[0] || '')}
                                        className="p-2 rounded-xl hover:bg-[var(--chatitem-hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                        title="Копировать пример команды"
                                        aria-label="Копировать пример команды"
                                    >
                                        {copiedRef === `${selectedModel.name}:${selectedModel.variants?.[0] || ''}` ? (
                                            <FaCheck className={`${ICON} text-green-400`}/>
                                        ) : (
                                            <FaCopy className={`${ICON}`}/>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setSelectedModel(null)}
                                        className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                                        title="Закрыть панель"
                                        aria-label="Закрыть панель"
                                    >
                                        <FaTimes className={ICON}/>
                                    </button>
                                </div>
                            </div>

                            <div className="custom-scroll overflow-y-auto pr-2 flex-1" style={{maxHeight: '75vh'}}>
                                <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">{selectedModel.description}</p>

                                {/* Tags */}
                                {selectedModel.tags && selectedModel.tags.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedModel.tags.map((tag) => (
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

                                        {(selectedModel.languages || modelInfo?.languages) && (
                                            <div>
                                                <div className="text-sm text-[var(--text-main)] font-semibold mb-2 flex items-center gap-2">
                                                    <FaLanguage className="text-violet-400 w-4 h-4"/>
                                                    Языки
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(modelInfo?.languages || selectedModel.languages).slice(0, 8).map((lng, i) => (
                                                        <div key={i} className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 text-[var(--text-main)]">
                                                            {lng}
                                                        </div>
                                                    ))}
                                                    {(modelInfo?.languages || selectedModel.languages).length > 8 && (
                                                        <div className="text-xs px-3 py-1.5 rounded-lg bg-[var(--bg-main)] text-[var(--text-muted)]">
                                                            +{(modelInfo?.languages || selectedModel.languages).length - 8}
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
                                        <span className="text-xs font-normal text-[var(--text-muted)] ml-2">({selectedModel.variants?.length || 0})</span>
                                    </div>

                                    {Array.isArray(selectedModel.variants) && selectedModel.variants.length > 0 ? (
                                        <ul className="space-y-2">
                                            {selectedModel.variants.map((variant) => {
                                                const isInstalledVariant =
                                                    Array.isArray(installedMap[selectedModel.name]) &&
                                                    installedMap[selectedModel.name].some(v => String(v).toLowerCase() === String(variant).toLowerCase())

                                                const isDownloadingVariant =
                                                    downloadingModel?.name === selectedModel.name &&
                                                    String(downloadingModel?.variant).toLowerCase() === String(variant).toLowerCase()

                                                const modelEntry = availableModels.find(m => m.name === selectedModel.name) || {}
                                                const size = (modelEntry.variantSizes && (modelEntry.variantSizes[variant] || modelEntry.variantSizes[variant.toLowerCase()])) || ''

                                                const sizeBytes = (() => {
                                                    if (!size || size === '-') return null
                                                    const num = parseFloat(size.replace(/GB|MB/i, ''))
                                                    if (size.toLowerCase().includes('gb')) return num * 1024 ** 3
                                                    if (size.toLowerCase().includes('mb')) return num * 1024 ** 2
                                                    return null
                                                })()
                                                const insufficientSpace = diskInfo?.freeBytes != null && sizeBytes != null && diskInfo.freeBytes < sizeBytes

                                                return (
                                                    <li key={variant} className={`p-3 rounded-xl border transition-all duration-200 ${
                                                        isInstalledVariant 
                                                            ? 'bg-green-500/5 border-green-500/20' 
                                                            : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-cyan-500/30'
                                                    }`}
                                                        onMouseEnter={() => setHoveredVariant(variant)}
                                                        onMouseLeave={() => setHoveredVariant(null)}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[var(--text-main)] font-medium text-sm">{variant}</span>
                                                                    {size && <span className={`text-xs mt-0.5 ${insufficientSpace ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>{size}</span>}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5">
                                                                {isInstalledVariant ? (
                                                                    hoveredVariant === variant ? (
                                                                        <button
                                                                            onClick={() => deleteVariantDirect(selectedModel.name, variant)}
                                                                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                                                                            title={`Удалить ${selectedModel.name}:${variant}`}
                                                                            aria-label={`Удалить ${selectedModel.name}:${variant}`}>
                                                                            <FaTrash className="w-4 h-4"/>
                                                                        </button>
                                                                    ) : (
                                                                        <span className="flex items-center gap-1.5 text-green-400 text-xs px-2 py-1 bg-green-500/10 rounded-lg">
                                                                            <FaCheck className="w-3 h-3"/> Установлено
                                                                        </span>
                                                                    )
                                                                    ) : isDownloadingVariant ? (
                                                                        downloadProgress >= 100 ? (
                                                                            <span className="flex items-center gap-1.5 text-green-400 text-xs px-2 py-1 bg-green-500/10 rounded-lg">
                                                                                <FaCheck className="w-3 h-3"/> Готово
                                                                            </span>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => cancelDownload(selectedModel.name, variant)}
                                                                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                                                                                title={`Отменить скачивание ${selectedModel.name}:${variant}`}
                                                                                aria-label={`Отменить скачивание ${selectedModel.name}:${variant}`}>
                                                                                <FaTimes className="w-4 h-4"/>
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleDownload(selectedModel.name, variant)}
                                                                            className={`p-2 rounded-lg transition-all ${insufficientSpace ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-500/10 text-cyan-400 hover:scale-110'}`}
                                                                            title={insufficientSpace ? `Мало места: ${formatBytes(diskInfo?.freeBytes || 0)}` : `Скачать ${selectedModel.name}:${variant}`}
                                                                            disabled={insufficientSpace}
                                                                            aria-label={`Скачать ${selectedModel.name}:${variant}`}>
                                                                            <FaDownload className="w-4 h-4"/>
                                                                        </button>

                                                                        <button
                                                                            onClick={() => copyPullCommand(selectedModel.name, variant)}
                                                                            className="p-2 rounded-lg hover:bg-[var(--chatitem-hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                                                            title="Копировать команду"
                                                                            aria-label="Копировать команду">
                                                                            {copiedRef === `${selectedModel.name}:${variant}` ? (
                                                                                <FaCheck className={`${ICON} text-green-400`}/>
                                                                            ) : (
                                                                                <FaCopy className={`${ICON}`}/>
                                                                            )}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isDownloadingVariant && downloadProgress < 100 && (
                                                            <div className="mt-2 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500 ease-out rounded-full"
                                                                    style={{width: `${downloadProgress}%`}}
                                                                />
                                                            </div>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="text-[var(--text-muted)] p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                                            Варианты недоступны.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete modal */}
            <DeleteModal
                open={deleteModalOpen}
                model={deleteModalModel}
                selectedSet={deleteModalSelected}
                onToggleVariant={toggleModalVariant}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setDeleteModalModel(null);
                    setDeleteModalSelected(new Set())
                }}
                onConfirm={confirmModalDelete}
            />

            {/* Toast */}
            <Toast toast={toast} onClose={() => setToast(null)}/>
        </div>
    )
}
