// src/hooks/useModelCatalog.js
import { useState, useEffect } from 'react'

let cache = null

export function useModelCatalog() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadCatalog() {
      if (cache) {
        setModels(cache)
        setLoading(false)
        return
      }

      try {
        const module = await import('../modelCatalog')
        cache = module.default
        setModels(cache)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  return { models, loading, error }
}
