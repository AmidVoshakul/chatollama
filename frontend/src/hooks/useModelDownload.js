import { useState, useCallback, useRef } from 'react'
import { modelsApi } from '../api/modelsApi'

export function useModelDownload(onSuccess, onError) {
    const [downloadingModel, setDownloadingModel] = useState(null)
    const [downloadProgress, setDownloadProgress] = useState(null)
    const [isCancelling, setIsCancelling] = useState(false)
    const abortRef = useRef(false)

    const startDownload = useCallback(async (name, variant) => {
        if (downloadingModel && downloadingModel.name === name && downloadingModel.variant === variant) {
            return
        }

        abortRef.current = false
        setDownloadingModel({ name, variant })
        setDownloadProgress({ percent: 0, downloaded: '', total: '', speed: '' })
        setIsCancelling(false)

        try {
            await modelsApi.download(name, variant)

            while (!abortRef.current) {
                await new Promise(res => setTimeout(res, 800))

                const data = await modelsApi.getProgress(name, variant)
                const percent = typeof data?.percent === 'number' 
                    ? data.percent 
                    : (typeof data?.progress === 'number' ? data.progress : 0)

                setDownloadProgress({
                    percent: Math.max(0, Math.min(100, Number(percent || 0))),
                    downloaded: data?.downloaded || '',
                    total: data?.total || '',
                    speed: data?.speed || ''
                })

                if ((percent || 0) >= 100) {
                    break
                }
            }

            if (!abortRef.current && !isCancelling) {
                onSuccess?.(`${name}:${variant}`)
            }

            setTimeout(() => {
                setDownloadingModel(null)
                setDownloadProgress(null)
                setIsCancelling(false)
            }, 1200)

        } catch (err) {
            onError?.(`Ошибка скачивания: ${err?.response?.data?.detail || err.message}`)
            setTimeout(() => {
                setDownloadingModel(null)
                setDownloadProgress(null)
                setIsCancelling(false)
            }, 800)
        }
    }, [downloadingModel, isCancelling, onSuccess, onError])

    const cancelDownload = useCallback(async (name, variant) => {
        setIsCancelling(true)
        abortRef.current = true

        try {
            await modelsApi.cancelDownload(name, variant)
        } catch (err) {
            console.error('Cancel error:', err)
        } finally {
            setDownloadingModel(null)
            setDownloadProgress(null)
            setIsCancelling(false)
        }
    }, [])

    const isDownloading = useCallback((name, variant) => {
        return downloadingModel?.name === name && 
               String(downloadingModel?.variant).toLowerCase() === String(variant).toLowerCase()
    }, [downloadingModel])

    const reset = useCallback(() => {
        setDownloadingModel(null)
        setDownloadProgress(null)
        setIsCancelling(false)
    }, [])

    return {
        downloadingModel,
        downloadProgress,
        isCancelling,
        startDownload,
        cancelDownload,
        isDownloading,
        reset,
    }
}
