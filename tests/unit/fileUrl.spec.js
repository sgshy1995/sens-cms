const originalEnv = {
  VUE_APP_USE_CDN: process.env.VUE_APP_USE_CDN,
  VUE_APP_API_BASE_URL: process.env.VUE_APP_API_BASE_URL,
  VUE_APP_CDN_BASE_URL: process.env.VUE_APP_CDN_BASE_URL
}

function loadFileUrlModule ({ useCdn, apiBase, cdnBase }) {
  jest.resetModules()
  process.env.VUE_APP_USE_CDN = useCdn
  process.env.VUE_APP_API_BASE_URL = apiBase
  process.env.VUE_APP_CDN_BASE_URL = cdnBase
  return require('@/utils/fileUrl')
}

function restoreEnv (name, value) {
  if (value === undefined) {
    delete process.env[name]
    return
  }
  process.env[name] = value
}

afterEach(() => {
  Object.keys(originalEnv).forEach(key => restoreEnv(key, originalEnv[key]))
  jest.resetModules()
})

describe('fileUrl', () => {
  it('uses the CDN base when VUE_APP_USE_CDN is yes', () => {
    const { resolveFileUrl, fileBaseUrl } = loadFileUrlModule({
      useCdn: 'YES',
      apiBase: 'https://api.example.com/',
      cdnBase: 'https://cdn.example.com/'
    })

    expect(fileBaseUrl).toBe('https://cdn.example.com/')
    expect(resolveFileUrl('20261030/images/a.png'))
      .toBe('https://cdn.example.com/20261030/images/a.png')
    expect(resolveFileUrl('/uploads/20261030/images/a.png'))
      .toBe('https://cdn.example.com/uploads/20261030/images/a.png')
  })

  it('uses the API base when the CDN switch is not yes', () => {
    const { resolveFileUrl } = loadFileUrlModule({
      useCdn: 'no',
      apiBase: 'https://api.example.com',
      cdnBase: 'https://cdn.example.com'
    })

    expect(resolveFileUrl('uploads/20261030/images/a.png'))
      .toBe('https://api.example.com/uploads/20261030/images/a.png')
  })

  it('keeps absolute resource URLs unchanged', () => {
    const { resolveFileUrl } = loadFileUrlModule({
      useCdn: 'yes',
      apiBase: 'https://api.example.com',
      cdnBase: 'https://cdn.example.com'
    })

    expect(resolveFileUrl('https://images.example.com/a.png'))
      .toBe('https://images.example.com/a.png')
    expect(resolveFileUrl('data:image/png;base64,abc'))
      .toBe('data:image/png;base64,abc')
    expect(resolveFileUrl('blob:https://cms.example.com/id'))
      .toBe('blob:https://cms.example.com/id')
    expect(resolveFileUrl('//images.example.com/a.png'))
      .toBe('//images.example.com/a.png')
  })
})
