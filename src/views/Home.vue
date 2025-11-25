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
import { searchMediaArtsWithRelated } from '../services/api'

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

    const handleSearch = async (searchParams) => {
      loading.value = true
      const originalQuery = searchParams.query
      const limit = Math.min(100, Math.max(1, Number(searchParams?.limit) || 50))
      lastSearchMeta.value = { lang: null, mode: null }
      try {
        // 1. まず通常検索
        let result = await searchMediaArtsWithRelated(
          originalQuery,
          limit
        )

        lastSearchMeta.value = {
          lang: result?.meta?.appliedLang ?? null,
          mode: result?.meta?.appliedMode ?? null
        }

        const hasData = (result?.nodes?.length || 0) > 0 || (result?.edges?.length || 0) > 0

        if (!hasData) {
          showToast('指定条件では結果が見つかりませんでした。別のキーワードをお試しください。', 'warn')
        }

        // 検索結果のノードを特定してマークする
        const searchQuery = (searchParams.query || originalQuery).toLowerCase()
        const nodes = (result.nodes || []).map(node => {
          // title が存在しない場合 properties.title を昇格させる
          const resolvedTitle = node.title || node.properties?.title || ''
          const titleLower = resolvedTitle.toLowerCase()
          // 検索語を含む作品ノードを強調対象にする
          const isSearchHit = node.type === 'work' && titleLower.includes(searchQuery)
          return {
            ...node,
            title: resolvedTitle, // 可視化用に正規化
            isSearchResult: isSearchHit,
            isSearched: isSearchHit,
            color: isSearchHit ? '#ff6b6b' : (node.color || '#4fc3f7')
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
