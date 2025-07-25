import axios from 'axios'

// API設定
const API_VERSION = '1'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// 現在のバックエンドが v1 対応しているかチェックして適切なbaseURLを使用
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// v1 API用の設定
const apiV1 = axios.create({
  baseURL: `${API_BASE_URL}/api/v${API_VERSION}`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 基本的な検索・データ取得機能
export const searchManga = async (searchRequest) => {
  try {
    // まず v1 APIを試し、失敗したら旧APIにフォールバック
    try {
      const response = await apiV1.post('/search', searchRequest)
      return response.data
    } catch (v1Error) {
      console.log('v1 API not available, falling back to legacy API')
      const response = await api.post('/search', searchRequest)
      return response.data
    }
  } catch (error) {
    console.error('Search API error:', error)
    throw error
  }
}

export const getAuthors = async () => {
  try {
    // v1 APIを試し、失敗したらスタブデータを返す
    try {
      const response = await apiV1.get('/authors')
      return response.data
    } catch (v1Error) {
      console.log('v1 authors API not available, returning empty array')
      return []
    }
  } catch (error) {
    console.error('Authors API error:', error)
    return []
  }
}

export const getWorks = async () => {
  try {
    // v1 APIを試し、失敗したらスタブデータを返す
    try {
      const response = await apiV1.get('/works')
      return response.data
    } catch (v1Error) {
      console.log('v1 works API not available, returning empty array')
      return []
    }
  } catch (error) {
    console.error('Works API error:', error)
    return []
  }
}

export const getMagazines = async () => {
  try {
    // v1 APIを試し、失敗したらスタブデータを返す
    try {
      const response = await apiV1.get('/magazines')
      return response.data
    } catch (v1Error) {
      console.log('v1 magazines API not available, returning empty array')
      return []
    }
  } catch (error) {
    console.error('Magazines API error:', error)
    return []
  }
}

// 文化庁メディア芸術データベース機能
export const searchMediaArts = async (query, limit = 20) => {
  try {
    const response = await apiV1.get('/media-arts/search', {
      params: { q: query, limit }
    })
    return response.data
  } catch (error) {
    console.error('Media Arts search API error:', error)
    console.log('Media Arts API not yet available')
    throw error
  }
}

// 関連データ込みの検索機能
export const searchMediaArtsWithRelated = async (query, limit = 20, includeRelated = true) => {
  try {
    const response = await apiV1.get('/neo4j/search', {
      params: { q: query, limit, include_related: includeRelated }
    })
    return response.data
  } catch (error) {
    console.error('Media Arts search with related API error:', error)
    console.log('Media Arts search with related API not yet available')
    throw error
  }
}

export const getCreatorWorks = async (creatorName, limit = 50) => {
  try {
    const response = await apiV1.get(`/media-arts/creator/${encodeURIComponent(creatorName)}`, {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error('Creator works API error:', error)
    console.log('Creator works API not yet available')
    throw error
  }
}

export const getMangaMagazines = async (limit = 100) => {
  try {
    const response = await apiV1.get('/media-arts/magazines', {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error('Manga magazines API error:', error)
    console.log('Manga magazines API not yet available')
    throw error
  }
}

export const fulltextSearch = async (query, searchType = 'simple_query_string', limit = 20) => {
  try {
    const response = await apiV1.get('/media-arts/fulltext-search', {
      params: { q: query, search_type: searchType, limit }
    })
    return response.data
  } catch (error) {
    console.error('Fulltext search API error:', error)
    console.log('Fulltext search API not yet available')
    throw error
  }
}

// 書影取得機能
export const getWorkCover = async (workId) => {
  try {
    const response = await apiV1.get(`/covers/work/${encodeURIComponent(workId)}`)
    return response.data
  } catch (error) {
    console.error('Work cover API error:', error)
    return null
  }
}

// 複数の書影を一括取得
export const getBulkWorkCovers = async (workIds) => {
  try {
    const requestBody = {
      work_ids: workIds
    }
    
    console.log('Sending bulk cover request:', requestBody)
    const response = await apiV1.post('/covers/bulk', requestBody)
    return response.data
  } catch (error) {
    console.error('Bulk cover API error:', error)
    console.error('Error details:', error.response?.data)
    throw error
  }
}

// 複数の画像を一括取得
export const fetchBulkImages = async (imageRequests) => {
  try {
    // 正しいAPIスキーマに合わせてリクエストを構築
    const requestBody = {
      requests: imageRequests
    }
    
    console.log('Sending bulk fetch request:', requestBody)
    const response = await apiV1.post('/images/fetch-bulk', requestBody)
    return response.data
  } catch (error) {
    console.error('Bulk image fetch API error:', error)
    console.error('Error details:', error.response?.data)
    throw error
  }
}

// ヘルスチェック（非バージョン管理）
export const healthCheck = async () => {
  try {
    // まず /health を試し、失敗したら / を試す
    try {
      const response = await axios.get(`${API_BASE_URL}/health`)
      return response.data
    } catch (healthError) {
      const response = await api.get('/')
      return response.data
    }
  } catch (error) {
    console.error('Health check error:', error)
    throw error
  }
}