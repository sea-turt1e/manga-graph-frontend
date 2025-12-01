import axios from 'axios'

// API設定
const API_VERSION = '1'

// 環境変数からベースURL/パスを取得
// - 開発(dev): 原則プロキシ('/.netlify/functions/proxy')を使う。
//               直叩きを許可する場合のみ VITE_ALLOW_DIRECT_BACKEND='true' かつ VITE_API_BASE_URL が設定されているときにそれを利用。
// - 本番(prod): 原則プロキシ強制。直叩きを許可する場合は VITE_ALLOW_DIRECT_BACKEND='true' を設定し VITE_API_BASE_URL を使用
const isProd = import.meta.env.PROD
const allowDirectBackend = (import.meta.env.VITE_ALLOW_DIRECT_BACKEND || '').toString().toLowerCase() === 'true'

let resolvedBasePrefix
if (isProd) {
  if (allowDirectBackend && import.meta.env.VITE_API_BASE_URL) {
    resolvedBasePrefix = import.meta.env.VITE_API_BASE_URL
  } else {
    resolvedBasePrefix = import.meta.env.VITE_API_BASE_PREFIX || '/.netlify/functions/proxy'
  }
} else {
  // dev: prefer proxy unless explicitly allowed to hit backend directly
  if (allowDirectBackend && import.meta.env.VITE_API_BASE_URL) {
    resolvedBasePrefix = import.meta.env.VITE_API_BASE_URL
  } else {
    resolvedBasePrefix = import.meta.env.VITE_API_BASE_PREFIX || '/.netlify/functions/proxy'
  }
}

const API_BASE_PREFIX = (resolvedBasePrefix.toString()).replace(/\/+$/, '')
let API_PATH_PREFIX = (import.meta.env.VITE_API_PATH_PREFIX ?? '/api').toString()
// 末尾スラッシュは削除、先頭スラッシュは必ず付与
API_PATH_PREFIX = `/${API_PATH_PREFIX.replace(/^\/+/, '').replace(/\/+$/, '')}`

// レガシーAPI（/search など）向けクライアント: ベースはプレフィックスのみにして、末尾のパスは各呼び出しに委ねる
const api = axios.create({
  baseURL: API_BASE_PREFIX,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// v1 API用のクライアント（例: <prefix>/api/v1/...）
const apiV1 = axios.create({
  baseURL: `${API_BASE_PREFIX}${API_PATH_PREFIX}/v${API_VERSION}`,
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
      // 旧APIは /api/search を想定
      const response = await api.post(`${API_PATH_PREFIX}/search`, searchRequest)
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
export const searchMediaArts = async (query, limit = 30) => {
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

// 関連データ込みの検索機能（新統合API使用 - Step 1-6 統合）
export const searchMediaArtsWithRelated = async (query, limit = 50, includeHentai = false) => {
  const sanitizedLimit = Math.min(100, Math.max(1, Number(limit) || 50))
  try {
    // 新統合API: カスケード検索（6回のAPIコールを1回に統合）
    const result = await searchGraphCascade(query, sanitizedLimit, 'japanese,english', includeHentai)
    return {
      ...result,
      nodes: result.nodes || [],
      edges: result.edges || [],
      meta: {
        ...(result.meta || {}),
        appliedApi: 'cascade'
      }
    }
  } catch (error) {
    console.error('Manga graph cascade search API error:', error)
    throw error
  }
}

// ============================================
// 新統合API: グラフ検索のカスケード（Step 1-6 統合）
// ============================================
export const searchGraphCascade = async (query, limit = 3, languages = 'japanese,english', includeHentai = false) => {
  const sanitizedLimit = Math.min(100, Math.max(1, Number(limit) || 3))
  try {
    const response = await apiV1.get('/manga-anime-neo4j/graph/cascade', {
      params: {
        q: query,
        limit: sanitizedLimit,
        languages,
        include_hentai: includeHentai
      }
    })
    return {
      ...response.data,
      meta: {
        ...(response.data?.meta || {}),
        appliedApi: 'cascade'
      }
    }
  } catch (error) {
    console.error('Graph cascade search API error:', error)
    throw error
  }
}

// ============================================
// 新統合API: 類似検索の統合（Step 7-8 統合）
// ============================================
export const searchVectorSimilarityMulti = async (
  query,
  embeddingTypes = ['title_en', 'title_ja'],
  limit = 10,
  threshold = 0.3,
  includeHentai = false,
  embeddingDims = 256
) => {
  try {
    const response = await apiV1.post('/manga-anime-neo4j/vector/similarity/multi', {
      query,
      embedding_types: embeddingTypes,
      embedding_dims: embeddingDims,
      limit,
      threshold,
      include_hentai: includeHentai
    })
    return response.data
  } catch (error) {
    console.error('Vector similarity multi API error:', error)
    throw error
  }
}

// ============================================
// 新統合API: 関連グラフの一括取得（Step 11-13 統合）
// ============================================
export const getRelatedGraphsBatch = async ({
  authorNodeId = null,
  magazineNodeId = null,
  publisherNodeId = null,
  authorLimit = 5,
  magazineLimit = 5,
  publisherLimit = 3,
  referenceWorkId = null,
  excludeMagazineId = null,
  includeHentai = false
} = {}) => {
  try {
    const response = await apiV1.post('/manga-anime-neo4j/related-graphs/batch', {
      author_node_id: authorNodeId,
      magazine_node_id: magazineNodeId,
      publisher_node_id: publisherNodeId,
      author_limit: authorLimit,
      magazine_limit: magazineLimit,
      publisher_limit: publisherLimit,
      reference_work_id: referenceWorkId,
      exclude_magazine_id: excludeMagazineId,
      include_hentai: includeHentai
    })
    return response.data
  } catch (error) {
    console.error('Related graphs batch API error:', error)
    throw error
  }
}

// 曖昧検索（タイトル類似検索）
export const searchMangaFuzzy = async (
  query,
  limit = 5,
  similarityThreshold = 0.8,
  embeddingMethod = 'huggingface'
) => {
  // 互換維持: 旧関数名で呼ばれても新エンドポイントにフォワード
  return searchTitleSimilarity(query, limit, similarityThreshold, embeddingMethod)
}

// 新: タイトルベクトル類似検索API（/api/v1/neo4j/vector/title-similarity）
export const searchTitleSimilarity = async (
  query,
  limit = 5,
  similarityThreshold = 0.8,
  embeddingMethod = 'huggingface'
) => {
  try {
    const response = await apiV1.get('/neo4j/vector/title-similarity', {
      params: {
        q: query,
        limit,
        similarity_threshold: similarityThreshold,
        embedding_method: embeddingMethod
      }
    })
    return response.data
  } catch (error) {
    console.error('Title similarity API error:', error)
    throw error
  }
}

// ベクトル類似度検索（タイトル曖昧検索）
export const searchVectorSimilarity = async (
  query,
  embeddingType = 'title_en',
  limit = 5,
  threshold = 0.5,
  includeHentai = false
) => {
  try {
    const response = await apiV1.post('/manga-anime-neo4j/vector/similarity', {
      query,
      embedding_type: embeddingType,
      embedding_dims: 256,
      limit,
      threshold,
      include_hentai: includeHentai
    })
    return response.data
  } catch (error) {
    console.error(`Vector similarity API error (${embeddingType}):`, error)
    throw error
  }
}

// タイトル曖昧検索（新統合API使用 - Step 7-8 統合）
export const searchTitleCandidates = async (
  query,
  limit = 10,
  threshold = 0.3,
  includeHentai = false
) => {
  try {
    // 新統合API: 英語タイトルと日本語タイトルの両方を一回のAPIコールで検索
    const result = await searchVectorSimilarityMulti(
      query,
      ['title_en', 'title_ja'],
      limit,
      threshold,
      includeHentai
    )

    // APIが既にマージ・重複排除・ソート済みの結果を返す
    const candidates = (result?.results || []).map(item => ({
      ...item,
      similarity: item.similarity_score || 0
    }))

    return {
      candidates,
      totalCount: candidates.length
    }
  } catch (error) {
    console.error('Title candidates search error:', error)
    throw error
  }
}

// グラフ検索（mode=simple, lang=english固定）
export const searchGraphSimple = async (query, limit = 50) => {
  const sanitizedLimit = Math.min(100, Math.max(1, Number(limit) || 50))
  try {
    const response = await apiV1.get('/manga-anime-neo4j/graph', {
      params: {
        q: query,
        limit: sanitizedLimit,
        lang: 'english',
        mode: 'simple'
      }
    })
    return {
      ...response.data,
      meta: {
        ...(response.data?.meta || {}),
        appliedLang: 'english',
        appliedMode: 'simple'
      }
    }
  } catch (error) {
    console.error('Graph simple search API error:', error)
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

export const fulltextSearch = async (query, searchType = 'simple_query_string', limit = 50) => {
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

const encodeId = (value) => encodeURIComponent(value)

const buildLimitParams = (limit) => {
  if (limit === undefined || limit === null) return {}
  if (typeof limit === 'number' && Number.isFinite(limit)) {
    return { limit: String(limit) }
  }
  if (typeof limit === 'string' && limit.trim().length > 0) {
    return { limit: limit.trim() }
  }
  return {}
}

export const getAuthorRelatedWorks = async (authorNodeId, limit = 5) => {
  if (!authorNodeId) return { nodes: [], edges: [] }
  try {
    const response = await apiV1.get(`/manga-anime-neo4j/author/${encodeId(authorNodeId)}/works`, {
      params: buildLimitParams(limit)
    })
    return response.data
  } catch (error) {
    console.error(`Author works API error (${authorNodeId}):`, error)
    throw error
  }
}

export const getMagazineRelatedWorks = async (magazineNodeId, limit = 5) => {
  if (!magazineNodeId) return { nodes: [], edges: [] }
  try {
    const response = await apiV1.get(`/manga-anime-neo4j/magazine/${encodeId(magazineNodeId)}/works`, {
      params: buildLimitParams(limit)
    })
    return response.data
  } catch (error) {
    console.error(`Magazine works API error (${magazineNodeId}):`, error)
    throw error
  }
}

export const getPublisherMagazines = async (publisherNodeId, limit = 5) => {
  if (!publisherNodeId) return { nodes: [], edges: [] }
  try {
    const response = await apiV1.get(`/manga-anime-neo4j/publisher/${encodeId(publisherNodeId)}/magazines`, {
      params: buildLimitParams(limit)
    })
    return response.data
  } catch (error) {
    console.error(`Publisher magazines API error (${publisherNodeId}):`, error)
    throw error
  }
}

export const getMagazineWorkGraph = async (magazineElementIds, workLimit = 3, referenceWorkId = null, includeHentai = false) => {
  if (!Array.isArray(magazineElementIds) || magazineElementIds.length === 0) {
    return { nodes: [], edges: [] }
  }

  const sanitizedLimit = Math.min(500, Math.max(1, Number(workLimit) || 3))
  const payload = {
    magazine_element_ids: magazineElementIds,
    work_limit: sanitizedLimit,
    include_hentai: includeHentai
  }
  
  // reference_work_idが指定されている場合のみ追加（element_id形式: "4:xxx:123"）
  if (referenceWorkId) {
    payload.reference_work_id = String(referenceWorkId)
  }

  try {
    const response = await apiV1.post('/manga-anime-neo4j/magazines/work-graph', payload)
    return response.data
  } catch (error) {
    console.error('Magazine work graph API error:', error)
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
      const response = await axios.get(`${API_BASE_PREFIX}/health`)
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