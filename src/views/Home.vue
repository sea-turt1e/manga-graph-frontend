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
  getAuthorRelatedWorks,
  getMagazineRelatedWorks,
  getMagazineWorkGraph,
  getPublisherMagazines,
  searchMediaArtsWithRelated
} from '../services/api'

const DEFAULT_EXPANSION_OPTIONS = {
  includeAuthorWorks: true,
  includeMagazineWorks: true,
  includePublisherMagazines: true,
  includePublisherMagazineWorks: true
}

const SUBGRAPH_BATCH_SIZE = 4
const PUBLISHER_MAGAZINE_LIMIT = 3
const DEFAULT_MAGAZINE_WORK_LIMIT = 3
const MAX_MAGAZINE_WORK_LIMIT = 500

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

    const showToast = (message, type = 'info', duration = 3000) => {
      toast.message = message
      toast.type = type
      toast.visible = true
      if (toast.timer) clearTimeout(toast.timer)
      toast.timer = setTimeout(() => { toast.visible = false }, duration)
    }

    const resolveNodeId = (node = {}) => {
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
        null
      )
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

    const collectIdsByType = (nodes = [], type) => {
      return Array.from(new Set(
        nodes
          .filter((node) => node.type === type)
          .map((node) => resolveNodeId(node))
          .filter(Boolean)
      ))
    }

    const fetchSegmentsInBatches = async (ids, fetcher, batchSize = SUBGRAPH_BATCH_SIZE, onSuccess) => {
      const segments = []
      const failedIds = []

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize)
        const settled = await Promise.allSettled(batch.map((id) => fetcher(id)))
        settled.forEach((result, index) => {
          const currentId = batch[index]
          if (result.status === 'fulfilled' && result.value) {
            const payload = result.value
            segments.push({
              nodes: payload.nodes || [],
              edges: payload.edges || []
            })
            if (typeof onSuccess === 'function') {
              onSuccess(currentId, payload)
            }
          } else {
            failedIds.push(currentId)
            console.warn('追加データ取得に失敗しました:', currentId, result.reason)
          }
        })
      }

      return { segments, failedIds }
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

        if (!hasData) {
          showToast('指定条件では結果が見つかりませんでした。別のキーワードをお試しください。', 'warn')
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
        const publisherMagazinesCache = new Map()

        if (expansionOptions.includeAuthorWorks) {
          const authorIds = collectIdsByType(nodes, 'author')
          if (authorIds.length) {
            const { segments, failedIds } = await fetchSegmentsInBatches(authorIds, (id) => getAuthorRelatedWorks(id, 5))
            expansionSegments.push(...segments)
            if (failedIds.length) failedMessages.push(`作者(${failedIds.length})`)
          }
        }

        if (expansionOptions.includeMagazineWorks) {
          const magazineIds = collectIdsByType(nodes, 'magazine')
          if (magazineIds.length) {
            const { segments, failedIds } = await fetchSegmentsInBatches(magazineIds, (id) => getMagazineRelatedWorks(id))
            expansionSegments.push(...segments)
            if (failedIds.length) failedMessages.push(`雑誌(${failedIds.length})`)
          }
        }

        if (expansionOptions.includePublisherMagazines) {
          const publisherIds = collectIdsByType(nodes, 'publisher')
          if (publisherIds.length) {
            const { segments, failedIds } = await fetchSegmentsInBatches(
              publisherIds,
              (id) => getPublisherMagazines(id, PUBLISHER_MAGAZINE_LIMIT),
              SUBGRAPH_BATCH_SIZE,
              (id, payload) => publisherMagazinesCache.set(id, payload)
            )
            expansionSegments.push(...segments)
            if (failedIds.length) {
              failedMessages.push(`出版社雑誌(${failedIds.length})`)
            }
          }
        }

        // 出版社の他雑誌掲載作品: 出版社ノードの有無に関わらず、収集済みの雑誌から作品グラフを取得
        if (expansionOptions.includePublisherMagazineWorks) {
          const magazineElementIds = collectMagazineElementIds(nodes, expansionSegments, publisherMagazinesCache)
          console.log('Magazine element IDs collected:', magazineElementIds)
          if (magazineElementIds.length) {
            try {
              const workGraph = await getMagazineWorkGraph(
                magazineElementIds,
                DEFAULT_MAGAZINE_WORK_LIMIT
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
}
</style>
