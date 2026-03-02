import { useState, useEffect, useCallback } from 'react'
import { modelsApi, diskApi } from '../api/modelsApi'

export function useModels(catalogModels) {
    const [installedModels, setInstalledModels] = useState([])
    const [diskInfo, setDiskInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refreshInstalledModels = useCallback(async () => {
        try {
            const data = await modelsApi.listInstalled()
            setInstalledModels(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Error loading installed models:', err)
            setError('Не удалось получить список установленных моделей')
        }
    }, [])

    const refreshDiskInfo = useCallback(async () => {
        try {
            const data = await diskApi.getInfo()
            if (data && typeof data.freeBytes === 'number') {
                setDiskInfo(data)
            }
        } catch (err) {
            console.error('Error loading disk info:', err)
        }
    }, [])

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            setError(null)
            await Promise.all([
                refreshInstalledModels(),
                refreshDiskInfo(),
            ])
            setLoading(false)
        }
        loadData()
    }, [refreshInstalledModels, refreshDiskInfo])

    const deleteModel = useCallback(async (name, variant) => {
        await modelsApi.delete(name, variant)
        setInstalledModels(prev => prev.filter(m => m !== `${name}:${variant}`))
    }, [])

    const addInstalledModel = useCallback((modelRef) => {
        setInstalledModels(prev => 
            prev.includes(modelRef) ? prev : [...prev, modelRef]
        )
    }, [])

    const installedMap = installedModels.reduce((acc, m) => {
        const [name, variant] = typeof m === 'string' ? m.split(':') : []
        if (!name || !variant) return acc
        if (!acc[name]) acc[name] = []
        acc[name].push(variant)
        return acc
    }, {})

    return {
        installedModels,
        installedMap,
        diskInfo,
        loading,
        error,
        refreshInstalledModels,
        refreshDiskInfo,
        deleteModel,
        addInstalledModel,
    }
}
