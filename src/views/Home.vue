<template>
  <div class="home">
    <Header />
    <main class="main-content">
      <SearchPanel 
        :fuzzy-candidates="fuzzyCandidates"
        @search="handleSearch" 
        @clear="handleClear"
        @select-fuzzy="handleSelectFuzzy"
      />
      <GraphVisualization 
        :graph-data="graphData"
        :loading="loading"
      />
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
import { searchMangaFuzzy, searchMediaArtsWithRelated } from '../services/api'

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
    const fuzzyCandidates = ref([])
    const toast = reactive({ visible: false, message: '', type: 'info', timer: null })

    const showToast = (message, type = 'info', duration = 3000) => {
      toast.message = message
      toast.type = type
      toast.visible = true
      if (toast.timer) clearTimeout(toast.timer)
      toast.timer = setTimeout(() => { toast.visible = false }, duration)
    }

    const handleSearch = async (searchParams) => {
      loading.value = true
      const originalQuery = searchParams.query
      try {
        // 1. まず通常検索
        let result = await searchMediaArtsWithRelated(
          originalQuery,
          searchParams.limit || 20,
          searchParams.includeRelated
        )

        const hasData = (result?.nodes?.length || 0) > 0 || (result?.edges?.length || 0) > 0

        // 2. データが無い場合、曖昧検索候補を取得してユーザーに提示
        if (!hasData) {
          console.log('[Fallback] No direct results. Trying fuzzy search for canonical title...')
          showToast('直接ヒットが無かったため曖昧検索候補を表示します', 'warn')
          const fuzzy = await searchMangaFuzzy(
            originalQuery,
            5,
            searchParams.similarityThreshold || 0.5,
            searchParams.embeddingMethod || 'huggingface'
          )
          const fuzzyNodes = fuzzy?.nodes || []
          // 候補リスト（title & similarity_score）整形
          fuzzyCandidates.value = fuzzyNodes
            .map(n => ({
              title: n.title || n.properties?.title || '',
              score: n.properties?.similarity_score || n.similarity_score
            }))
            .filter(c => c.title)
            .sort((a, b) => (b.score || 0) - (a.score || 0))
          if (fuzzyCandidates.value.length === 0) {
            showToast('曖昧検索でも候補が見つかりませんでした', 'error')
          }
        } else {
          // 通常結果が出た場合は前回の候補をクリア
          fuzzyCandidates.value = []
        }

        // 検索結果のノードを特定してマークする
        const searchQuery = (searchParams.query || originalQuery).toLowerCase()
        const nodes = (result.nodes || []).map(node => {
          // title が存在しない場合 properties.title を昇格させる
          const resolvedTitle = node.title || node.properties?.title || ''
          const titleLower = resolvedTitle.toLowerCase()
          const isSearchResult = titleLower.includes(searchQuery)
          return {
            ...node,
            title: resolvedTitle, // 可視化用に正規化
            isSearchResult,
            color: isSearchResult ? '#ff6b6b' : (node.color || '#4fc3f7')
          }
        })

  graphData.nodes = nodes
  graphData.edges = result.edges || []

        console.log('検索結果:', {
          originalQuery,
            finalQuery: searchParams.query,
          nodesCount: nodes.length,
          edgesCount: graphData.edges.length,
          searchResults: nodes.filter(n => n.isSearchResult).length
        })
      } catch (error) {
        console.error('検索エラー:', error)
        graphData.nodes = []
        graphData.edges = []
        fuzzyCandidates.value = []
      } finally {
        loading.value = false
      }
    }

    const handleClear = () => {
      graphData.nodes = []
      graphData.edges = []
      fuzzyCandidates.value = []
    }

    const handleSelectFuzzy = async ({ title }) => {
      if (!title) return
      showToast(`候補「${title}」で再検索します`, 'info')
      await handleSearch({
        query: title,
        limit: 20,
        includeRelated: true
      })
    }

    return {
      graphData,
      loading,
      fuzzyCandidates,
      toast,
      handleSearch,
      handleClear,
      handleSelectFuzzy
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
</style>
