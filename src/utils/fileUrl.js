function normalizeBaseUrl (value) {
  return (value || '').trim().replace(/\/+$/, '')
}

export const useCdnForFile = (process.env.VUE_APP_USE_CDN || '').trim().toLowerCase() === 'yes'
export const apiFileBaseUrl = normalizeBaseUrl(process.env.VUE_APP_API_BASE_URL)
export const cdnFileBaseUrl = normalizeBaseUrl(process.env.VUE_APP_CDN_BASE_URL)
const selectedFileBaseUrl = useCdnForFile ? cdnFileBaseUrl : apiFileBaseUrl
export const fileBaseUrl = selectedFileBaseUrl ? `${selectedFileBaseUrl}/` : ''

export function resolveFileUrl (filePath) {
  if (!filePath) return ''

  const value = String(filePath).trim()
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return value

  const normalized = value.replace(/^\/+/, '')
  return fileBaseUrl + normalized
}
