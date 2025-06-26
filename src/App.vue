<template>
  <div id="app">
    <Header />
    <main class="main-content">
      <SearchPanel 
        @search="handleSearch" 
        @clear="handleClear"
      />
      <GraphVisualization 
        :graph-data="graphData"
        :loading="loading"
      />
    </main>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import Header from './components/Header.vue'
import SearchPanel from './components/SearchPanel.vue'
import GraphVisualization from './components/GraphVisualization.vue'
import { searchManga, searchMediaArtsWithRelated } from './services/api'

export default {
  name: 'App',
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

    const handleSearch = async (searchParams) => {
      loading.value = true
      try {
        // includeRelatedがtrueの場合は新しいAPIを使用
        if (searchParams.includeRelated) {
          const result = await searchMediaArtsWithRelated(
            searchParams.query,
            20, // デフォルトのlimit
            true
          )
          graphData.nodes = result.nodes || []
          graphData.edges = result.edges || []
        } else {
          // 既存のsearchManga APIを使用
          const result = await searchManga({
            query: searchParams.query,
            depth: searchParams.depth
          })
          graphData.nodes = result.nodes || []
          graphData.edges = result.edges || []
        }
      } catch (error) {
        console.error('Search failed:', error)
        // 新しいAPIが利用できない場合は既存のAPIにフォールバック
        if (searchParams.includeRelated && error.message?.includes('not yet available')) {
          try {
            const result = await searchManga({
              query: searchParams.query,
              depth: searchParams.depth
            })
            graphData.nodes = result.nodes || []
            graphData.edges = result.edges || []
          } catch (fallbackError) {
            console.error('Fallback search failed:', fallbackError)
            alert('検索に失敗しました。サーバーが起動しているか確認してください。')
          }
        } else {
          alert('検索に失敗しました。サーバーが起動しているか確認してください。')
        }
      } finally {
        loading.value = false
      }
    }

    const handleClear = () => {
      graphData.nodes = []
      graphData.edges = []
    }

    return {
      graphData,
      loading,
      handleSearch,
      handleClear
    }
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  display: flex;
  flex: 1;
  height: calc(100vh - 80px);
}
</style>