// src/components/ModelManager.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
    FaArrowLeft,
    FaSearch,
    FaTimes,
} from 'react-icons/fa'
import LoadingScreen from './LoadingScreen'
import { useModelCatalog } from '../hooks/useModelCatalog'
import { useModels } from '../hooks/useModels'
import { useModelDownload } from '../hooks/useModelDownload'
import { modelsApi } from '../api/modelsApi'
import DeleteModal from './DeleteModal'
import Toast from './Toast'
import ModelCard from './ModelManager/ModelCard'
import ModelDetailsPanel from './ModelManager/ModelDetailsPanel'

const ICON = 'w-5 h-5'

const popularModelNames = [
    'gpt-oss', 'deepseek-r1', 'deepseek-v3.1', 'deepseek-coder', 'deepseek-coder-v2', 'llama3.1', 'llama3.2',
    'llama3', 'llava', 'gemma3', 'phi4', 'phi4-mini', 'qwen3', 'qwen3-coder', 'qwen2.5', 'codegemma', 'codellama',
    'granite3.1-dense', 'wizardcoder', 'stable-code', 'opencoder', 'aya', 'granite-code'
]

export default function ModelManager() {
    const { models: availableModels, loading: catalogLoading } = useModelCatalog()
    const { installedMap, diskInfo, loading: modelsLoading, deleteModel, addInstalledModel } = useModels(availableModels)
    
    const [selectedModel, setSelectedModel] = useState(null)
    const [hoveredModel, setHoveredModel] = useState(null)
    const [filter, setFilter] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const [mobileFilter, setMobileFilter] = useState('all')
    const [copiedRef, setCopiedRef] = useState(null)
    const [modelInfo, setModelInfo] = useState(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deleteModalModel, setDeleteModalModel] = useState(null)
    const [deleteModalSelected, setDeleteModalSelected] = useState(new Set())
    const [hoveredVariant, setHoveredVariant] = useState(null)
    const [toast, setToast] = useState(null)

    const showToast = useCallback((text, type = 'info') => {
        setToast({ text, type })
        setTimeout(() => setToast(null), 3000)
    }, [])

    const { 
        downloadingModel, 
        downloadProgress, 
        startDownload, 
        cancelDownload, 
        isDownloading,
        reset: resetDownload 
    } = useModelDownload(
        useCallback((modelRef) => {
            addInstalledModel(modelRef)
            showToast(`Модель ${modelRef} установлена`, 'success')
        }, [addInstalledModel, showToast]),
        useCallback((error) => {
            showToast(error, 'error')
        }, [showToast])
    )

    const loading = modelsLoading || catalogLoading

    useEffect(() => {
        setMobileFilter(filter)
    }, [filter])

    useEffect(() => {
        if (!selectedModel) return
        
        const variants = installedMap[selectedModel.name]
        if (!variants || variants.length === 0) {
            setModelInfo(null)
            return
        }
        
        let mounted = true
        let retryTimeout = null
        const variant = variants[0]

        const fetchModelInfo = (attempt = 0) => {
            if (!mounted) return
            
            modelsApi.getInfo(selectedModel.name, variant)
                .then(res => {
                    if (!mounted) return;
                    setModelInfo(res || null)
                })
                .catch(err => {
                    if (!mounted) return;
                    if (attempt < 3 && err.response?.status === 502 && err.response?.data?.detail?.includes('not found')) {
                        retryTimeout = setTimeout(() => fetchModelInfo(attempt + 1), 1500)
                    } else {
                        console.error('Ошибка получения информации о модели:', err);
                        setModelInfo(null)
                    }
                })
        }

        setModelInfo(null)
        fetchModelInfo()
        
        return () => {
            mounted = false
            if (retryTimeout) clearTimeout(retryTimeout)
        }
    }, [selectedModel])

    const displayedModels = useMemo(() => {
        return availableModels
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
    }, [availableModels, filter, searchTerm, installedMap])

    const handleDeleteVariant = useCallback(async (name, variant) => {
        try {
            await deleteModel(name, variant)
            showToast(`Модель ${name}:${variant} удалена`, 'success')
            if (selectedModel?.name === name) setModelInfo(null)
        } catch (err) {
            const msg = err?.response?.data?.detail || err.message || 'Ошибка удаления'
            showToast(`Ошибка удаления: ${msg}`, 'error')
        }
    }, [deleteModel, selectedModel, showToast])

    const handleCopyPullCommand = useCallback((name, variant) => {
        const key = `${name}:${variant}`
        const cmd = `ollama pull ${name}:${variant}`
        navigator.clipboard?.writeText(cmd).then(() => {
            setCopiedRef(key)
            showToast('Команда скопирована', 'success')
            setTimeout(() => setCopiedRef(null), 1200)
        }).catch(() => {
            showToast('Не удалось скопировать', 'error')
        })
    }, [showToast])

    const openDeleteModalForModel = useCallback((name) => {
        const variants = (installedMap[name] || []).slice()
        setDeleteModalModel({ name, variants })
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
                await deleteModel(name, variant)
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
    }, [deleteModalModel, deleteModalSelected, selectedModel, deleteModel, showToast])

    if (loading) return <LoadingScreen/>

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

                <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1/3 min-w-[260px] max-w-[460px]">
                    <div className="relative">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]"/>
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
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)]"/>
                            <input autoFocus value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                   placeholder="Поиск моделей..."
                                   className="w-full pl-11 pr-10 py-2.5 bg-[var(--bg-main)] text-[var(--text-main)] text-sm rounded-xl border border-[var(--border-color)] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"/>
                            <button
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                onClick={() => setMobileSearchOpen(false)} aria-label="Закрыть поиск">
                                <FaTimes className={ICON}/>
                            </button>
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

                    return (
                        <ModelCard
                            key={model.name}
                            model={model}
                            isInstalled={isInstalled}
                            isActive={isActive}
                            isHovered={isHovered}
                            onClick={() => setSelectedModel(model)}
                            onDeleteClick={openDeleteModalForModel}
                        />
                    )
                })}
            </div>

            {/* Details panel */}
            {selectedModel && (
                <ModelDetailsPanel
                    model={selectedModel}
                    modelInfo={modelInfo}
                    installedMap={installedMap}
                    availableModels={availableModels}
                    diskInfo={diskInfo}
                    downloadProgress={downloadProgress}
                    isDownloading={isDownloading}
                    onDownload={startDownload}
                    onCancelDownload={cancelDownload}
                    onDelete={handleDeleteVariant}
                    onCopy={handleCopyPullCommand}
                    onClose={() => setSelectedModel(null)}
                    onCopyRef={handleCopyPullCommand}
                    copiedRef={copiedRef}
                    hoveredVariant={hoveredVariant}
                    setHoveredVariant={setHoveredVariant}
                />
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
