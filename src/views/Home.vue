<template>
  <div class="home">
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

    const handleSearch = async (searchParams) => {
      loading.value = true
      try {
        // 常にsearchMediaArtsWithRelatedを使用
        const result = await searchMediaArtsWithRelated(
          searchParams.query,
          searchParams.limit || 20, // limitパラメータを使用、デフォルトは20
          searchParams.includeRelated
        )
        
        // 検索結果のノードを特定してマークする
        const searchQuery = searchParams.query.toLowerCase()
        const nodes = (result.nodes || []).map(node => {
          // 検索クエリに一致する作品をマーク
          const isSearchResult = node.title && 
            node.title.toLowerCase().includes(searchQuery)
          
          return {
            ...node,
            isSearchResult,
            // 検索結果の作品は色を変更
            color: isSearchResult ? '#ff6b6b' : (node.color || '#4fc3f7')
          }
        })
        
        graphData.nodes = nodes
        graphData.edges = result.edges || []
        
        console.log('検索結果:', {
          query: searchParams.query,
          nodesCount: nodes.length,
          edgesCount: graphData.edges.length,
          searchResults: nodes.filter(n => n.isSearchResult).length
        })
      } catch (error) {
        console.error('検索エラー:', error)
        // エラー時は空のデータを設定
        graphData.nodes = []
        graphData.edges = []
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

<style scoped>
.home {
  height: 100vh;
  overflow: hidden;
}

.main-content {
  display: flex;
  height: calc(100vh - 80px); /* ヘッダーの高さを差し引く */
}
</style>
