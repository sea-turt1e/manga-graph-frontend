<template>
  <div class="home">
    <Header />
    <main class="main-content">
      <SearchPanel 
        @search="handleSearch" 
        @clear="handleClear"
      />
      <div class="graph-area">
        <GraphVisualization 
          :graph-data="graphData"
          :loading="loading"
        />
        
        <!-- 曖昧検索の候補選択ポップアップ（一時的に無効化）
        <transition name="popup-fade">
          <div v-if="showCandidatesPopup" class="candidates-popup-overlay" @click.self="closeCandidatesPopup">
            <div class="candidates-popup">
              <div class="candidates-popup-header">
                <h3>「{{ candidatesQuery }}」の検索結果が見つかりませんでした</h3>
                <p>以下の候補から選択してください：</p>
              </div>
              
              <div v-if="loadingCandidates" class="candidates-loading">
                <div class="loading-spinner"></div>
                <span>候補を検索中...</span>
              </div>
              
              <div v-else-if="candidates.length === 0" class="candidates-empty">
                候補が見つかりませんでした。別のキーワードをお試しください。
              </div>
              
              <ul v-else class="candidates-list">
                <li 
                  v-for="(candidate, index) in candidates" 
                  :key="candidate.mal_id || index"
                  class="candidate-item"
                  @click="selectCandidate(candidate)"
                >
                  <span class="candidate-title">{{ candidate.title_ja || candidate.title_en || '-' }}</span>
                  <span class="candidate-similarity">{{ formatSimilarity(candidate.similarity) }}</span>
                </li>
              </ul>
              
              <button @click="closeCandidatesPopup" class="candidates-close-button">
                キャンセル
              </button>
            </div>
          </div>
        </transition>
        -->
      </div>
    </main>
    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="toast.visible" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import GraphVisualization from '../components/GraphVisualization.vue'
import Header from '../components/Header.vue'
import SearchPanel from '../components/SearchPanel.vue'
import {
  getMagazineWorkGraph,
  getRelatedGraphsBatch,
  searchMediaArtsWithRelated
} from '../services/api'

const DEFAULT_EXPANSION_OPTIONS = {
  includeAuthorWorks: true,
  includeMagazineWorks: true,
  includePublisherMagazines: true,
  includePublisherMagazineWorks: true
}

const DEFAULT_MAGAZINE_WORK_LIMIT = 3

export default {
  name: 'Home',
  components: {
    Header,
    SearchPanel,
    GraphVisualization
  },
  setup() {
    const graphData = reactive({
      nodes: [],
      edges: []
    })
    const loading = ref(false)
    const lastSearchMeta = ref({ lang: null, mode: null })
    const toast = reactive({ visible: false, message: '', type: 'info', timer: null })
    
    /* 曖昧検索の候補選択ポップアップ用の状態（一時的に無効化）
    const showCandidatesPopup = ref(false)
    const loadingCandidates = ref(false)
    const candidates = ref([])
    const candidatesQuery = ref('')
    const lastSearchParams = ref(null)
    */

    const showToast = (message, type = 'info', duration = 3000) => {
      toast.message = message
      toast.type = type
      toast.visible = true
      if (toast.timer) clearTimeout(toast.timer)
      toast.timer = setTimeout(() => { toast.visible = false }, duration)
    }
    
    // similarity値をフォーマット（NaN対応）
    const formatSimilarity = (value) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return '-'
      }
      return `${(value * 100).toFixed(1)}%`
    }

    const resolveElementId = (node = {}) => {
      if (!node || typeof node !== 'object') return null
      return (
        node.element_id ??
        node.elementId ??
        node?.properties?.element_id ??
        node?.properties?.elementId ??
        node.id ??
        null
      )
    }

    const getNodeKey = (node = {}) => {
      if (!node || typeof node !== 'object') return null
      return (
        node.id ??
        node.neo4j_id ??
        node.neo4jId ??
        node?.properties?.neo4j_id ??
        node?.properties?.id ??
        node?.properties?.work_id ??
        node?.properties?.magazine_id ??
        node?.properties?.publisher_id ??
        node?.properties?.node_id ??
        (node.type && node.title ? `${node.type}:${node.title}` : null)
      )
    }

    const getEdgeKey = (edge = {}) => {
      if (!edge || typeof edge !== 'object') return null
      const source = edge.source || edge.from
      const target = edge.target || edge.to
      if (!source || !target) return edge.id || edge.neo4j_id || edge.neo4jId || null
      return edge.id || edge.neo4j_id || edge.neo4jId || `${source}->${target}:${edge.type || edge.label || 'related'}`
    }

    const mergeGraphSegments = (baseNodes = [], baseEdges = [], segments = []) => {
      const nodeMap = new Map()
      const edgeMap = new Map()

      const normalizeNode = (node, key) => {
        if (!node || typeof node !== 'object') return null
        const properties = {
          ...(node.properties || {})
        }
        const fallbackLabel = node.label || node.title || properties.title || properties.name || ''
        return {
          ...node,
          id: node.id ?? key,
          type: node.type,  // typeを明示的に保持
          title: node.title || fallbackLabel,
          label: fallbackLabel,
          properties
        }
      }

      const upsertNode = (node) => {
        const key = getNodeKey(node)
        if (!key) return
        const normalized = normalizeNode(node, key)
        if (!normalized) return
        if (nodeMap.has(key)) {
          const existing = nodeMap.get(key)
          // 既存のノードを優先し、新しいノードで補完する（上書きしない）
          nodeMap.set(key, {
            ...normalized,  // 新しいデータをベースに
            ...existing,    // 既存のデータで上書き（既存を優先）
            id: existing?.id || normalized.id || key,
            type: existing?.type || normalized?.type,  // typeを明示的に保持
            title: existing?.title || normalized?.title,
            label: existing?.label || normalized?.label || existing?.title || normalized?.title,
            properties: {
              ...(normalized?.properties || {}),
              ...(existing?.properties || {})
            },
            isSearchResult: existing?.isSearchResult || normalized?.isSearchResult || false,
            isSearched: existing?.isSearched || normalized?.isSearched || false,
            color: existing?.color || normalized?.color
          })
        } else {
          nodeMap.set(key, normalized)
        }
      }

      const addEdge = (edge) => {
        const key = getEdgeKey(edge)
        if (!key) return
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            ...edge,
            id: edge.id || key,
            source: edge.source || edge.from,
            target: edge.target || edge.to
          })
        }
      }

      baseNodes.forEach(upsertNode)
      baseEdges.forEach(addEdge)

      segments.forEach((segment) => {
        ;(segment?.nodes || []).forEach(upsertNode)
        ;(segment?.edges || []).forEach(addEdge)
      })

      return {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values())
      }
    }

    // 検索でヒットしたworkノードのelement_idを取得（reference_work_id用）
    const getSearchedWorkElementId = (nodes = []) => {
      const searchedWork = nodes.find(
        (node) => node.type === 'work' && (node.isSearchResult || node.isSearched)
      )
      if (!searchedWork) return null
      // element_id形式（"4:xxx:123"）を返す
      return resolveElementId(searchedWork)
    }

    const collectMagazineElementIds = (baseNodes = [], segments = [], publisherCache = new Map()) => {
      const ids = new Set()
      const addNodes = (list = []) => {
        list.forEach((node) => {
          if (node?.type !== 'magazine') return
          const elementId = resolveElementId(node)
          if (elementId) {
            ids.add(elementId)
          }
        })
      }

      addNodes(baseNodes)
      segments.forEach((segment) => addNodes(segment?.nodes))
      publisherCache.forEach((payload) => addNodes(payload?.nodes))

      return Array.from(ids)
    }

    const handleSearch = async (searchParams) => {
      loading.value = true
      const originalQuery = searchParams.query
      const limit = Math.min(100, Math.max(1, Number(searchParams?.limit) || 50))
      const expansionOptions = {
        ...DEFAULT_EXPANSION_OPTIONS,
        ...(searchParams?.expansions || {})
      }

      lastSearchMeta.value = { lang: null, mode: null }
      try {
        const result = await searchMediaArtsWithRelated(originalQuery, limit)

        lastSearchMeta.value = {
          lang: result?.meta?.appliedLang ?? null,
          mode: result?.meta?.appliedMode ?? null
        }

        const hasData = (result?.nodes?.length || 0) > 0 || (result?.edges?.length || 0) > 0

        // 検索結果が空の場合
        if (!hasData) {
          showToast('検索結果が見つかりませんでした。別のキーワードをお試しください。', 'warn', 5000)
          graphData.nodes = []
          graphData.edges = []
          loading.value = false
          return
        }

        const searchQuery = (searchParams.query || originalQuery).toLowerCase()
        const nodes = (result.nodes || []).map(node => {
          const resolvedTitle = node.type === 'work'
            ? (node.properties?.japanese_name || node.title || node.properties?.title || '')
            : (node.title || node.properties?.title || '')
          const titleLower = resolvedTitle.toLowerCase()
          const isSearchHit = node.type === 'work' && titleLower.includes(searchQuery)
          return {
            ...node,
            title: resolvedTitle,
            isSearchResult: isSearchHit,
            isSearched: isSearchHit,
            color: isSearchHit ? '#ff6b6b' : (node.color || '#4fc3f7')
          }
        })

        graphData.nodes = nodes
        graphData.edges = result.edges || []

        const expansionSegments = []
        const failedMessages = []

        // ============================================
        // 新統合API: 関連グラフを一括取得（Step 11-13 統合）
        // ============================================
        const needsRelatedGraphs = expansionOptions.includeAuthorWorks || 
                                   expansionOptions.includeMagazineWorks || 
                                   expansionOptions.includePublisherMagazines

        if (needsRelatedGraphs) {
          // グラフからノードIDを抽出
          const authorNode = nodes.find(n => n.type === 'author')
          const magazineNode = nodes.find(n => n.type === 'magazine')
          const publisherNode = nodes.find(n => n.type === 'publisher')
          
          const authorNodeId = expansionOptions.includeAuthorWorks ? resolveElementId(authorNode) : null
          const magazineNodeId = expansionOptions.includeMagazineWorks ? resolveElementId(magazineNode) : null
          const publisherNodeId = expansionOptions.includePublisherMagazines ? resolveElementId(publisherNode) : null

          if (authorNodeId || magazineNodeId || publisherNodeId) {
            try {
              const relatedGraphs = await getRelatedGraphsBatch({
                authorNodeId,
                magazineNodeId,
                publisherNodeId,
                authorLimit: 5,
                magazineLimit: 5,
                publisherLimit: 3,
                includeHentai: false
              })

              // 各グラフをexpansionSegmentsに追加
              if (relatedGraphs.author_graph) {
                expansionSegments.push({
                  nodes: relatedGraphs.author_graph.nodes || [],
                  edges: relatedGraphs.author_graph.edges || []
                })
              }
              if (relatedGraphs.magazine_graph) {
                expansionSegments.push({
                  nodes: relatedGraphs.magazine_graph.nodes || [],
                  edges: relatedGraphs.magazine_graph.edges || []
                })
              }
              if (relatedGraphs.publisher_graph) {
                expansionSegments.push({
                  nodes: relatedGraphs.publisher_graph.nodes || [],
                  edges: relatedGraphs.publisher_graph.edges || []
                })
              }
            } catch (error) {
              console.error('関連グラフの一括取得に失敗しました:', error)
              failedMessages.push('関連グラフ')
            }
          }
        }

        // 出版社の他雑誌掲載作品: 収集済みの雑誌から作品グラフを取得
        if (expansionOptions.includePublisherMagazineWorks) {
          const magazineElementIds = collectMagazineElementIds(nodes, expansionSegments, new Map())
          const referenceWorkId = getSearchedWorkElementId(nodes)
          console.log('Magazine element IDs collected:', magazineElementIds, 'Reference work ID:', referenceWorkId)
          if (magazineElementIds.length) {
            try {
              const workGraph = await getMagazineWorkGraph(
                magazineElementIds,
                DEFAULT_MAGAZINE_WORK_LIMIT,
                referenceWorkId
              )
              console.log('Work graph response:', {
                nodes: workGraph.nodes?.length || 0,
                edges: workGraph.edges?.length || 0,
                sampleNode: workGraph.nodes?.[0],
                sampleEdge: workGraph.edges?.[0]
              })
              expansionSegments.push({
                nodes: workGraph.nodes || [],
                edges: workGraph.edges || []
              })
            } catch (error) {
              console.error('出版社の他雑誌掲載作品取得に失敗しました:', error)
              failedMessages.push('出版社雑誌作品')
            }
          }
        }

        if (expansionSegments.length) {
          console.log('Merging expansion segments:', expansionSegments.length)
          const mergedGraph = mergeGraphSegments(nodes, result.edges || [], expansionSegments)
          console.log('Merged graph:', {
            nodes: mergedGraph.nodes.length,
            edges: mergedGraph.edges.length,
            sampleNodes: mergedGraph.nodes.slice(0, 3),
            sampleEdges: mergedGraph.edges.slice(0, 3)
          })
          graphData.nodes = mergedGraph.nodes
          graphData.edges = mergedGraph.edges
        }

        if (failedMessages.length) {
          showToast(`一部の関連データ取得に失敗しました: ${failedMessages.join(', ')}`, 'warn')
        }

        console.log('検索結果:', {
          originalQuery,
          finalQuery: searchParams.query,
          nodesCount: graphData.nodes.length,
          edgesCount: graphData.edges.length,
          searchResults: graphData.nodes.filter(n => n.isSearchResult).length,
          nodeTypes: graphData.nodes.reduce((acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1
            return acc
          }, {}),
          edgeTypes: graphData.edges.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1
            return acc
          }, {}),
          sampleEdges: graphData.edges.slice(0, 5).map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.type
          }))
        })
      } catch (error) {
        console.error('検索エラー:', error)
        graphData.nodes = []
        graphData.edges = []
        showToast('検索中にエラーが発生しました。', 'error')
      } finally {
        loading.value = false
      }
    }

    /* 曖昧検索関連の関数（一時的に無効化）
    // 曖昧検索で候補を取得して表示
    const fetchAndShowCandidates = async (query, searchParams) => {
      candidatesQuery.value = query
      lastSearchParams.value = searchParams
      showCandidatesPopup.value = true
      loadingCandidates.value = true
      candidates.value = []
      
      try {
        const result = await searchTitleCandidates(query, 10, 0.3, false)
        candidates.value = result?.candidates || []
        loadingCandidates.value = false
        
        if (candidates.value.length === 0) {
          showToast('候補が見つかりませんでした。別のキーワードをお試しください。', 'warn')
        }
      } catch (error) {
        console.error('候補検索エラー:', error)
        candidates.value = []
        loadingCandidates.value = false
        showToast('候補の検索中にエラーが発生しました。', 'error')
      }
    }
    
    // 候補選択ポップアップを閉じる
    const closeCandidatesPopup = () => {
      // 一時的に無効化
    }

    // 候補を選択して再検索（一時的に無効化）
    const selectCandidate = async (candidate) => {
      // 一時的に無効化
    }
    曖昧検索の候補選択関連の処理（一時的に無効化）
    const selectCandidateOriginal = async (candidate) => {
      // closeCandidatesPopupを呼ぶ前にsearchParamsを保存
      const searchParams = lastSearchParams.value || {}
      const limit = Math.min(100, Math.max(1, Number(searchParams?.limit) || 50))
      console.log('selectCandidate: searchParams.limit =', searchParams?.limit, 'sanitized limit =', limit)
      
      closeCandidatesPopup()
      loading.value = true
      
      const expansionOptions = {
        ...DEFAULT_EXPANSION_OPTIONS,
        ...(searchParams?.expansions || {})
      }
      
      // 英語タイトルを優先して検索クエリとして使用
      const query = candidate.title_en || candidate.title_ja || ''
      // マッチング用に英語・日本語両方のタイトルを保持
      const candidateTitleEn = (candidate.title_en || '').toLowerCase()
      const candidateTitleJa = (candidate.title_ja || '').toLowerCase()

      lastSearchMeta.value = { lang: null, mode: null }
      
      try {
        // 選択した候補のタイトルでカスケード検索（統合API）
        const result = await searchGraphCascade(query, limit)

        lastSearchMeta.value = {
          lang: result?.meta?.appliedLang ?? null,
          mode: result?.meta?.appliedMode ?? null,
          appliedApi: 'cascade'
        }

        const hasData = (result?.nodes?.length || 0) > 0 || (result?.edges?.length || 0) > 0

        if (!hasData) {
          showToast('選択した候補の検索結果が見つかりませんでした。', 'warn')
          graphData.nodes = []
          graphData.edges = []
          loading.value = false
          return
        }

        const nodes = (result.nodes || []).map(node => {
          const japaneseName = (node.properties?.japanese_name || '').toLowerCase()
          const englishName = (node.properties?.english_name || node.properties?.name || '').toLowerCase()
          const nodeTitle = (node.title || node.properties?.title || '').toLowerCase()
          
          // 候補の英語・日本語タイトルのいずれかとマッチするか確認
          const isSearchHit = node.type === 'work' && (
            (candidateTitleEn && (japaneseName.includes(candidateTitleEn) || englishName.includes(candidateTitleEn) || nodeTitle.includes(candidateTitleEn) || candidateTitleEn.includes(englishName) || candidateTitleEn.includes(nodeTitle))) ||
            (candidateTitleJa && (japaneseName.includes(candidateTitleJa) || englishName.includes(candidateTitleJa) || nodeTitle.includes(candidateTitleJa) || candidateTitleJa.includes(japaneseName) || candidateTitleJa.includes(nodeTitle)))
          )
          
          const resolvedTitle = node.type === 'work'
            ? (node.properties?.japanese_name || node.title || node.properties?.title || '')
            : (node.title || node.properties?.title || '')
            
          return {
            ...node,
            title: resolvedTitle,
            isSearchResult: isSearchHit,
            isSearched: isSearchHit,
            color: isSearchHit ? '#ff6b6b' : (node.color || '#4fc3f7')
          }
        })

        graphData.nodes = nodes
        graphData.edges = result.edges || []

        // ============================================
        // 新統合API: 関連グラフを一括取得（handleSearchと同様）
        // ============================================
        const expansionSegments = []
        const failedMessages = []

        const needsRelatedGraphs = expansionOptions.includeAuthorWorks || 
                                   expansionOptions.includeMagazineWorks || 
                                   expansionOptions.includePublisherMagazines

        if (needsRelatedGraphs) {
          // グラフからノードIDを抽出
          const authorNode = nodes.find(n => n.type === 'author')
          const magazineNode = nodes.find(n => n.type === 'magazine')
          const publisherNode = nodes.find(n => n.type === 'publisher')
          
          const authorNodeId = expansionOptions.includeAuthorWorks ? resolveElementId(authorNode) : null
          const magazineNodeId = expansionOptions.includeMagazineWorks ? resolveElementId(magazineNode) : null
          const publisherNodeId = expansionOptions.includePublisherMagazines ? resolveElementId(publisherNode) : null

          if (authorNodeId || magazineNodeId || publisherNodeId) {
            try {
              const relatedGraphs = await getRelatedGraphsBatch({
                authorNodeId,
                magazineNodeId,
                publisherNodeId,
                authorLimit: 5,
                magazineLimit: 5,
                publisherLimit: 3,
                includeHentai: false
              })

              // 各グラフをexpansionSegmentsに追加
              if (relatedGraphs.author_graph) {
                expansionSegments.push({
                  nodes: relatedGraphs.author_graph.nodes || [],
                  edges: relatedGraphs.author_graph.edges || []
                })
              }
              if (relatedGraphs.magazine_graph) {
                expansionSegments.push({
                  nodes: relatedGraphs.magazine_graph.nodes || [],
                  edges: relatedGraphs.magazine_graph.edges || []
                })
              }
              if (relatedGraphs.publisher_graph) {
                expansionSegments.push({
                  nodes: relatedGraphs.publisher_graph.nodes || [],
                  edges: relatedGraphs.publisher_graph.edges || []
                })
              }
            } catch (error) {
              console.error('関連グラフの一括取得に失敗しました:', error)
              failedMessages.push('関連グラフ')
            }
          }
        }

        // 出版社の他雑誌掲載作品
        if (expansionOptions.includePublisherMagazineWorks) {
          const magazineElementIds = collectMagazineElementIds(nodes, expansionSegments, new Map())
          const referenceWorkId = getSearchedWorkElementId(nodes)
          console.log('Magazine element IDs collected:', magazineElementIds, 'Reference work ID:', referenceWorkId)
          if (magazineElementIds.length) {
            try {
              const workGraph = await getMagazineWorkGraph(
                magazineElementIds,
                DEFAULT_MAGAZINE_WORK_LIMIT,
                referenceWorkId
              )
              expansionSegments.push({
                nodes: workGraph.nodes || [],
                edges: workGraph.edges || []
              })
            } catch (error) {
              console.error('出版社の他雑誌掲載作品取得に失敗しました:', error)
              failedMessages.push('出版社雑誌作品')
            }
          }
        }

        if (expansionSegments.length) {
          const mergedGraph = mergeGraphSegments(nodes, result.edges || [], expansionSegments)
          graphData.nodes = mergedGraph.nodes
          graphData.edges = mergedGraph.edges
        }

        if (failedMessages.length) {
          showToast(`一部の関連データ取得に失敗しました: ${failedMessages.join(', ')}`, 'warn')
        }

        console.log('候補選択結果:', {
          selectedCandidate: candidate,
          query,
          nodesCount: graphData.nodes.length,
          edgesCount: graphData.edges.length
        })
      } catch (error) {
        console.error('候補検索エラー:', error)
        graphData.nodes = []
        graphData.edges = []
        showToast('検索中にエラーが発生しました。', 'error')
      } finally {
        loading.value = false
      }
    }
    */

    const handleClear = () => {
      graphData.nodes = []
      graphData.edges = []
      lastSearchMeta.value = { lang: null, mode: null }
    }

    return {
      graphData,
      loading,
      lastSearchMeta,
      toast,
      handleSearch,
      handleClear,
      showToast
    }
  }
}
</script>

<style scoped>
.home {
  height: 100vh;
  overflow: hidden;
}

.main-content {
  display: flex;
  height: calc(100vh - 80px); /* ヘッダーの高さを差し引く */
}

.graph-area {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 候補選択ポップアップ */
.candidates-popup-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.candidates-popup {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.candidates-popup-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.candidates-popup-header h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #333;
}

.candidates-popup-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.candidates-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.candidates-empty {
  padding: 40px;
  text-align: center;
  color: #999;
}

.candidates-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 400px;
}

.candidate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.candidate-item:hover {
  background: #f0f4ff;
}

.candidate-item:last-child {
  border-bottom: none;
}

.candidate-title {
  font-size: 0.95rem;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 12px;
}

.candidate-similarity {
  font-size: 0.85rem;
  font-weight: 600;
  color: #667eea;
  background: #f0f4ff;
  padding: 4px 10px;
  border-radius: 4px;
  flex-shrink: 0;
}

.candidates-close-button {
  margin: 16px 24px;
  padding: 12px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.candidates-close-button:hover {
  background: #e0e0e0;
}

/* ポップアップのアニメーション */
.popup-fade-enter-active, .popup-fade-leave-active {
  transition: opacity 0.2s ease;
}

.popup-fade-enter-active .candidates-popup, .popup-fade-leave-active .candidates-popup {
  transition: transform 0.2s ease;
}

.popup-fade-enter-from, .popup-fade-leave-to {
  opacity: 0;
}

.popup-fade-enter-from .candidates-popup, .popup-fade-leave-to .candidates-popup {
  transform: scale(0.95);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: #fff;
  padding: 12px 18px;
  border-radius: 6px;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  z-index: 999;
  max-width: 280px;
  line-height: 1.4;
}
.toast.info { background: #3b82f6; }
.toast.warn { background: #f59e0b; }
.toast.error { background: #ef4444; }

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .3s, transform .3s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(10px); }

/* モバイルレイアウト: 検索欄の下にグラフが来るように縦並びにする */
@media (max-width: 768px) {
  .home {
    height: auto;
    min-height: 100vh;
    overflow: auto; /* スクロール可能に */
  }

  .main-content {
    flex-direction: column; /* 横並び -> 縦並び */
    height: auto; /* 固定高を解除 */
  }

  .graph-area {
    min-height: 60vh; /* グラフ領域に十分な高さを確保 */
  }
  
  .candidates-popup {
    width: 95%;
    max-height: 70%;
  }
}
</style>
