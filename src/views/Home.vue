<template>
  <div class="home">
    <Header />
    <main class="main-content">
      <SearchPanel 
        @search="handleSearch" 
        @clear="handleClear"
      />
      <div class="graph-area">
        <!-- 曖昧候補ポップアップ（グラフ上オーバーレイ） -->
        <div
          v-if="showFuzzyPopup && fuzzyCandidates && fuzzyCandidates.length"
          class="fuzzy-overlay"
          @click.self="closeFuzzyPopup"
        >
          <div class="fuzzy-modal">
            <div class="fuzzy-modal__header">
              <div class="fuzzy-modal__title">検索したい作品名を選んでください。</div>
              <button class="fuzzy-modal__close" @click="closeFuzzyPopup">×</button>
            </div>
            <div class="fuzzy-modal__body">
              <div class="fuzzy-modal__list">
                <button
                  v-for="c in fuzzyCandidates"
                  :key="c.title"
                  class="fuzzy-item"
                  @click="handleSelectFuzzy({ title: c.title })"
                >
                  <span class="fuzzy-item__title">{{ c.title }}</span>
                  <span v-if="c.score != null" class="fuzzy-item__score">{{ formatScore(c.score) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
  const showFuzzyPopup = ref(false)
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
          searchParams.includeRelated,
          {
            sortTotalVolumes: searchParams.sortTotalVolumes || 'desc',
            minTotalVolumes: (typeof searchParams.minTotalVolumes === 'number' ? searchParams.minTotalVolumes : 5)
          }
        )

        const hasData = (result?.nodes?.length || 0) > 0 || (result?.edges?.length || 0) > 0

        // 2. データが無い場合、曖昧検索候補を取得してユーザーに提示
  if (!hasData) {
          console.log('[Fallback] No direct results. Trying fuzzy search for canonical title...')
          showToast('直接ヒットが無かったため曖昧検索候補を表示します', 'warn')
          const fuzzy = await searchMangaFuzzy(
            originalQuery,
            5,
            searchParams.similarityThreshold || 0.8,
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
            showFuzzyPopup.value = false
          } else {
            // 候補がある場合はポップアップを開く
            showFuzzyPopup.value = true
          }
        } else {
          // 通常結果が出た場合は前回の候補をクリア
          fuzzyCandidates.value = []
          showFuzzyPopup.value = false
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
        fuzzyCandidates.value = []
      } finally {
        loading.value = false
      }
    }

    const handleClear = () => {
      graphData.nodes = []
      graphData.edges = []
  fuzzyCandidates.value = []
  showFuzzyPopup.value = false
    }

    const handleSelectFuzzy = async ({ title }) => {
      if (!title) return
      showToast(`候補「${title}」で再検索します`, 'info')
      await handleSearch({
        query: title,
        limit: 20,
  includeRelated: true,
  sortTotalVolumes: 'desc',
  minTotalVolumes: 5
      })
      // 候補から選択したらポップアップは閉じる
      showFuzzyPopup.value = false
    }

    const formatScore = (score) => {
      if (score == null) return ''
      return `(${Number(score).toFixed(3)})`
    }

    const closeFuzzyPopup = () => {
      showFuzzyPopup.value = false
    }

    return {
      graphData,
      loading,
      fuzzyCandidates,
      toast,
      handleSearch,
      handleClear,
  handleSelectFuzzy,
  formatScore,
  showFuzzyPopup,
  closeFuzzyPopup
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

.fuzzy-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 40px;
  z-index: 10;
}

.fuzzy-modal {
  width: min(800px, 92vw);
  max-height: 70vh;
  background: #ffffff;
  color: #111827;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  overflow: hidden;
}

.fuzzy-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.fuzzy-modal__title {
  font-size: 1rem;
  font-weight: 600;
}

.fuzzy-modal__close {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #374151;
}

.fuzzy-modal__body {
  padding: 12px 14px;
}

.fuzzy-modal__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fuzzy-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.fuzzy-item:hover {
  background: #f0f4ff;
  border-color: #667eea;
}

.fuzzy-item__title { font-weight: 600; }
.fuzzy-item__score { color: #555; font-family: monospace; }

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
