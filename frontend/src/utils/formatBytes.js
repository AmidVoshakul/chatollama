// src/utils/formatBytes.js
export function formatBytes(bytes) {
    if (bytes == null || Number.isNaN(Number(bytes))) return ''
    const n = Number(bytes)
    if (n < 1024) return `${n} B`
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
    return `${(n / 1024 ** 3).toFixed(2)} GB`
}

export default formatBytes
