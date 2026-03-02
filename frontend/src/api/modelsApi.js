import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

export const modelsApi = {
    listInstalled: () => api.get('/models').then(res => res.data),

    listAvailable: () => api.get('/models/available').then(res => res.data),

    download: (name, variant) => api.post('/models/download', { name, variant }),

    cancelDownload: (name, variant) => api.post('/models/cancel', { name, variant }),

    getProgress: (name, variant) => 
        api.get(`/models/progress?name=${encodeURIComponent(name)}&variant=${encodeURIComponent(variant)}`)
            .then(res => res.data),

    delete: (name, variant) => 
        api.delete(`/models/${encodeURIComponent(name)}:${encodeURIComponent(variant)}`),

    getInfo: (name, variant) => 
        api.get(`/models/info/${encodeURIComponent(name)}?variant=${encodeURIComponent(variant)}`)
            .then(res => res.data)
            .catch(err => {
                if (err.response?.status === 502) {
                    return Promise.reject(err)
                }
                throw err
            }),
}

export const diskApi = {
    getInfo: () => api.get('/system/disk').then(res => res.data),
}

export default api
