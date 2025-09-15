<template>
  <div class="search-panel">
    <div class="search-container">
      <h2 class="search-title">漫画名を入力してください</h2>
      
      <div class="search-form">
        <div class="search-input-group">
          <input 
            v-model="searchQuery"
            @keydown.enter="handleKeyDown"
            @keyup.enter="handleKeyUp"
            @compositionstart="isComposing = true"
            @compositionend="handleCompositionEnd"
            type="text"
            placeholder="例：ONE PIECE"
            class="search-input"
          />
          <button 
            @click="handleSearch"
            :disabled="!searchQuery.trim()"
            class="search-button"
          >
            <span class="search-icon">🔍</span>
            検索
          </button>
        </div>
        
        <div class="search-options">
          <!-- <label class="option-label">
            <input 
              v-model="searchDepth" 
              type="range" 
              min="1" 
              max="3" 
              class="depth-slider"
            />
            検索深度: {{ searchDepth }}
          </label> -->
          
          <label class="option-checkbox">
            <input 
              v-model="includeRelated" 
              type="checkbox"
              class="related-checkbox"
            />
            関連作品・作者も表示
          </label>

          <!-- 同出版社・他誌情報の表示制御 -->
          <label class="option-checkbox">
            <input 
              v-model="includeSamePublisherOtherMagazines" 
              type="checkbox"
              class="related-checkbox"
            />
            同出版社の他誌情報も表示
          </label>

          <label class="option-label">
            同出版社・他誌の上限:
            <input 
              v-model.number="samePublisherOtherMagazinesLimit" 
              type="number" 
              min="0" 
              max="10" 
              class="limit-input"
            />
            （最大10件）
          </label>
          
          <label class="option-label">
            取得件数上限:
            <input 
              v-model.number="searchLimit" 
              type="number" 
              min="1" 
              max="100" 
              class="limit-input"
            />
            （最大100件）
          </label>

          <label class="option-label">
            類似度閾値:
            <input
              v-model.number="similarityThreshold"
              type="number"
              min="0"
              max="1"
              step="0.05"
              class="limit-input"
            />
            （0〜1）
          </label>

          <!-- <label class="option-label">
            埋め込み方式:
            <select v-model="embeddingMethod" class="embedding-select">
              <option value="huggingface">huggingface</option>
              <option value="hash">hash</option>
              <option value="openai">openai</option>
            </select>
          </label> -->

          <!-- 新規: 巻数でのフィルタ＆ソート -->
          <label class="option-label">
            最小巻数:
            <input
              v-model.number="minTotalVolumes"
              type="number"
              min="0"
              class="limit-input"
            />
          </label>

          <label class="option-label">
            巻数ソート順:
            <select v-model="sortTotalVolumes" class="embedding-select">
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </label>
        </div>
        
        <button 
          @click="handleClear"
          class="clear-button"
        >
          クリア
        </button>

        
      </div>

      <div class="search-tips">
        <h3>使い方</h3>
        <ul>
          <li>作品名で検索すると、関連する作者や作品を表示します</li>
          <li>ノードをドラッグして位置を調整できます</li>
          <!-- <li>検索深度を調整して、関係の範囲を変更できます</li> -->
          <!-- <li>取得上限数を設定できます（※こちらは未完成です）</li> -->
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SearchPanel',
  emits: ['search', 'clear'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    const searchDepth = ref(2)
    const includeRelated = ref(true)
    const searchLimit = ref(30)
    const isComposing = ref(false)
    const similarityThreshold = ref(0.8)
    const embeddingMethod = ref('huggingface')
  const minTotalVolumes = ref(5)
  const sortTotalVolumes = ref('desc')
  const includeSamePublisherOtherMagazines = ref(true)
  const samePublisherOtherMagazinesLimit = ref(5)

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        emit('search', {
          query: searchQuery.value.trim(),
          depth: searchDepth.value,
          includeRelated: includeRelated.value,
          limit: Math.min(Math.max(1, searchLimit.value), 100),
          similarityThreshold: similarityThreshold.value,
          embeddingMethod: embeddingMethod.value,
          minTotalVolumes: Math.max(0, Number(minTotalVolumes.value) || 0),
          sortTotalVolumes: sortTotalVolumes.value,
          includeSamePublisherOtherMagazines: !!includeSamePublisherOtherMagazines.value,
          samePublisherOtherMagazinesLimit: Math.min(10, Math.max(0, Number(samePublisherOtherMagazinesLimit.value) || 0))
        })
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && isComposing.value) {
        event.preventDefault()
      }
    }

    const handleKeyUp = (event) => {
      if (event.key === 'Enter' && !isComposing.value) {
        handleSearch()
      }
    }

    const handleCompositionEnd = () => {
      isComposing.value = false
    }

    const handleClear = () => {
      searchQuery.value = ''
      emit('clear')
    }

    return {
      searchQuery,
      searchDepth,
      includeRelated,
      searchLimit,
      isComposing,
      similarityThreshold,
      embeddingMethod,
  minTotalVolumes,
  sortTotalVolumes,
  includeSamePublisherOtherMagazines,
  samePublisherOtherMagazinesLimit,
      handleSearch,
      handleKeyDown,
      handleKeyUp,
      handleCompositionEnd,
  handleClear
    }
  }
}
</script>

<style scoped>
.search-panel {
  width: 350px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  overflow-y: auto;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
}

.search-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.search-form {
  margin-bottom: 30px;
}

.search-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-button {
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.search-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-icon {
  font-size: 1.1rem;
}

.search-options {
  margin-bottom: 20px;
}

.option-label {
  display: block;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.depth-slider {
  width: 100%;
  margin-top: 8px;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.9rem;
  margin-top: 12px;
  cursor: pointer;
}

.related-checkbox {
  cursor: pointer;
}

.limit-input {
  width: 80px;
  padding: 6px 8px;
  margin-left: 8px;
  margin-right: 4px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
}

.embedding-select {
  margin-left: 8px;
  padding: 6px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  background: #fff;
}

.limit-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.clear-button {
  width: 100%;
  padding: 10px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-button:hover {
  background: #e0e0e0;
}

/* 候補タイトル表示は親ビュー側で表示するため、このコンポーネントからは削除 */

.search-tips {
  flex: 1;
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.search-tips h3 {
  color: #333;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.search-tips ul {
  list-style: none;
  padding: 0;
}

.search-tips li {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 8px;
  padding-left: 16px;
  position: relative;
}

.search-tips li:before {
  content: '•';
  color: #667eea;
  position: absolute;
  left: 0;
}

@media (max-width: 768px) {
  .search-panel {
    width: 100%;
    height: auto;
    max-height: 40vh;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  }

  .search-container {
    height: auto;
  }

  .search-tips {
    display: none;
  }

  .search-title {
    font-size: 1.2rem;
    margin-bottom: 15px;
  }

  .search-form {
    margin-bottom: 15px;
  }

  .search-input-group {
    gap: 8px;
    margin-bottom: 15px;
  }

  .search-input {
    padding: 10px 14px;
    font-size: 0.9rem;
  }

  .search-button {
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .option-label {
    font-size: 0.85rem;
  }

  .option-checkbox {
    font-size: 0.85rem;
  }
}
</style>