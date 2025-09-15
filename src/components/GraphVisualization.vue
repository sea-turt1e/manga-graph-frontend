<template>
  <div class="graph-container">
    <div class="graph-header">
      <div class="graph-stats" v-if="graphData.nodes.length > 0">
        <span class="stat-item">
          <span class="stat-icon">📊</span>
          ノード: {{ graphData.nodes.length }}
        </span>
        <span class="stat-item">
          <span class="stat-icon">🔗</span>
          エッジ: {{ graphData.edges.length }}
        </span>
      </div>
      <div class="graph-controls">
        <button @click="fitToScreen" class="control-button" title="画面にフィット">
          <span class="control-icon">🎯</span>
        </button>
        <button @click="resetLayout" class="control-button" title="レイアウトをリセット">
          <span class="control-icon">🔄</span>
        </button>
      </div>
    </div>
    
    <div 
      ref="graphContainer"
      class="graph-viewport"
      :class="{ 'loading': loading }"
    >
      <div v-if="loading" class="loading-overlay">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-progress">
            <div class="loading-dots">
              <span class="dot dot-1"></span>
              <span class="dot dot-2"></span>
              <span class="dot dot-3"></span>
            </div>
            <p class="loading-text">グラフを生成中...</p>
            <p class="loading-subtext">データを処理しています</p>
          </div>
        </div>
      </div>
      
      <div v-if="!loading && graphData.nodes.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>検索してください</h3>
        <p>左側の検索パネルから作品名を入力して検索してください</p>
      </div>
    </div>
    
    <div v-if="selectedNode" class="node-info-panel">
      <div class="node-info-header">
        <h3>{{ selectedNode.label }}</h3>
        <button @click="selectedNode = null" class="close-button">×</button>
      </div>
      <div class="node-info-content">
        <div v-if="selectedNode.properties && selectedNode.properties.db_url" class="property-item">
          <strong>リンク: </strong>
          <a
            :href="selectedNode.properties.db_url"
            target="_blank"
            rel="noopener noreferrer"
            class="db-url-link"
          >
            {{ selectedNode.properties.db_url }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'
import { nextTick, onMounted, ref, watch } from 'vue'

cytoscape.use(coseBilkent)

export default {
  name: 'GraphVisualization',
  props: {
    graphData: {
      type: Object,
      default: () => ({ nodes: [], edges: [] })
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const graphContainer = ref(null)
    const selectedNode = ref(null)
    let cy = null

    // 柔らかいモダンパレット
    const nodeTypeColors = {
      work: '#4CAF50',
      author: '#2196F3', 
      magazine: '#FF9800',
      publisher: '#9C27B0',
      unknown: '#9E9E9E'
    }

    const edgeColors = {
      created: '#16a34a',          // green-600
      authored: '#16a34a',
      published: '#f59e0b',        // amber-500
      published_by: '#a855f7',     // purple-500
      same_publisher: '#a855f7',
      belongs_to: '#f59e0b',
      mentor_of: '#7c3aed',        // violet-600
      influenced_by: '#7c3aed',
      collaborated_with: '#2563eb', // blue-600
      worked_with: '#2563eb',
      default: '#64748b'           // slate-500
    }

    const searchedWorkColor = null

    const getNodeTypeLabel = (type) => {
      const labels = {
        work: '作品',
        author: '作者',
        magazine: '雑誌',
        publisher: '出版社',
        unknown: '不明'
      }
      return labels[type] || type
    }

    const formatPropertyKey = (key) => {
      const keyLabels = {
        title: 'タイトル',
        name: '名前',
        publisher: '出版社',
        publication_date: '出版日',
        birth_date: '生年月日',
        nationality: '国籍',
        genre: 'ジャンル',
  db_url: 'リンク'
      }
      return keyLabels[key] || key
    }

    const isTouchDevice = () => {
      if (typeof window === 'undefined') return false
      return (
        'ontouchstart' in window ||
        (navigator && (navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0))
      )
    }

    const clearHighlights = () => {
      if (!cy) return
      cy.elements().removeClass('hovered highlighted dim')
    }

    const highlightNeighborhood = (n) => {
      if (!cy || !n) return
      const neighborhood = n.neighborhood().add(n)
      cy.batch(() => {
        cy.elements().removeClass('hovered highlighted dim')
        n.addClass('hovered')
        n.connectedEdges().addClass('hovered')
        neighborhood.addClass('highlighted')
        cy.elements().difference(neighborhood).addClass('dim')
      })
    }

    const initializeCytoscape = () => {
      if (!graphContainer.value) return

      cy = cytoscape({
        container: graphContainer.value,
        
        style: [
          {
            selector: 'node',
            style: {
              'background-color': (ele) => nodeTypeColors[ele.data('type')] || nodeTypeColors.unknown,
              'label': 'data(label)',
              'width': 64,
              'height': 64,
              'text-valign': 'bottom',
              'text-margin-y': 10,
              'color': '#1f2937',
              'font-size': '12px',
              'font-weight': '600',
              'text-wrap': 'wrap',
              'text-max-width': '120px',
              'border-width': 2,
              'border-color': (ele) => ele.data('isSearched') ? '#ef4444' : '#e5e7eb',
              'border-style': 'solid',
              'shadow-blur': 12,
              'shadow-color': '#94a3b8',
              'shadow-opacity': 0.25,
              'shadow-offset-x': 0,
              'shadow-offset-y': 3,
              'overlay-opacity': 0
            }
          },
          // 検索ヒットノードの強調（太枠・グロー）
          {
            selector: 'node[isSearched]',
            style: {
              'border-width': 5,
              'shadow-blur': 24,
              'shadow-color': '#f87171',
              'shadow-opacity': 0.65,
              'shadow-offset-x': 0,
              'shadow-offset-y': 0
            }
          },
          // ホバー・近傍強調・非近傍ディミング
          {
            selector: 'node.hovered',
            style: {
              'border-color': '#22c55e',
              'border-width': 4,
              'shadow-blur': 28,
              'shadow-color': '#22c55e',
              'shadow-opacity': 0.55
            }
          },
          {
            selector: 'node.highlighted',
            style: {
              'border-color': '#60a5fa',
              'border-width': 3
            }
          },
          {
            selector: 'node.dim',
            style: {
              'opacity': 0.25
            }
          },
          {
            selector: 'node[coverUrl]',
            style: {
              'background-image': 'data(coverUrl)',
              'background-fit': 'cover',
              'background-clip': 'node',
              'background-position-x': '50%',
              'background-position-y': '50%',
              'background-color': '#f5f5f5',
              'background-opacity': 1,
              'background-image-opacity': 1,
              'background-image-crossorigin': 'anonymous',
              'width': 80,
              'height': 120,
              'shape': 'rectangle',
              'label': '',
              'border-width': 2,
              'border-color': (ele) => ele.data('isSearched') ? '#ef4444' : '#e5e7eb',
              'border-style': 'solid',
              'overlay-opacity': 0
            }
          },
          {
            selector: 'node[type="work"]:not([coverUrl])',
            style: {
              'width': 80,
              'height': 120,
              'shape': 'rectangle',
              'background-color': '#ffffff',
              'border-width': 2,
              'border-color': (ele) => ele.data('isSearched') ? '#ef4444' : '#e5e7eb',
              'border-style': 'solid',
              'label': 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#333',
              'font-size': '9px',
              'font-weight': '700',
              'text-wrap': 'wrap',
              'text-max-width': '75px',
              'overlay-opacity': 0
            }
          },
          {
            selector: 'node[type="author"]',
            style: {
              'background-color': (ele) => nodeTypeColors[ele.data('type')] || nodeTypeColors.unknown,
              'label': (ele) => '👤\n' + ele.data('label'),
              'width': 80,
              'height': 80,
              'shape': 'ellipse',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#ffffff',
              'font-size': '10px',
              'font-weight': '700',
              'text-wrap': 'wrap',
              'text-max-width': '75px',
              'border-width': 2,
              'border-color': (ele) => ele.data('isSearched') ? '#ef4444' : '#ffffff',
              'overlay-opacity': 0
            }
          },
          {
            selector: 'node[type="publisher"]',
            style: {
              'background-color': (ele) => nodeTypeColors[ele.data('type')] || nodeTypeColors.unknown,
              'label': (ele) => '🏢\n' + ele.data('label'),
              'width': 80,
              'height': 80,
              'shape': 'ellipse',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#ffffff',
              'font-size': '10px',
              'font-weight': '700',
              'text-wrap': 'wrap',
              'text-max-width': '75px',
              'border-width': 2,
              'border-color': (ele) => ele.data('isSearched') ? '#ef4444' : '#ffffff',
              'overlay-opacity': 0
            }
          },
          {
            selector: 'node[type="magazine"]',
            style: {
              'background-color': (ele) => nodeTypeColors[ele.data('type')] || nodeTypeColors.unknown,
              'label': (ele) => '📖\n' + ele.data('label'),
              'width': 80,
              'height': 80,
              'shape': 'ellipse',
              'text-valign': 'center',
              'text-halign': 'center',
              'color': '#ffffff',
              'font-size': '10px',
              'font-weight': '700',
              'text-wrap': 'wrap',
              'text-max-width': '75px',
              'border-width': 2,
              'border-color': (ele) => ele.data('isSearched') ? '#ef4444' : '#ffffff',
              'overlay-opacity': 0
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-color': '#FFD700',
              'border-width': 4,
              'overlay-opacity': 0
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 3.5,
              'line-color': (ele) => edgeColors[ele.data('type')] || edgeColors.default,
              'target-arrow-color': (ele) => edgeColors[ele.data('type')] || edgeColors.default,
              'target-arrow-shape': 'triangle',
              'arrow-scale': 1.2,
              'curve-style': 'unbundled-bezier',
              'control-point-distances': [40, -40],
              'line-cap': 'round',
              'opacity': 0.9,
              'label': 'data(label)',
              'font-size': 9,
              'color': '#334155',
              'text-rotation': 'autorotate',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.85,
              'text-background-padding': 2,
              'text-background-shape': 'round-rectangle',
              'min-zoomed-font-size': 8
            }
          },
          {
            selector: 'edge[type="created"], edge[type="authored"]',
            style: {
              'line-style': 'solid',
              'width': 3.5
            }
          },
          {
            selector: 'edge[type="published"], edge[type="published_by"], edge[type="belongs_to"]',
            style: {
              'line-style': 'solid',
              'width': 3.5
            }
          },
          {
            selector: 'edge[type="same_publisher"]',
            style: {
              'line-style': 'dashed',
              'line-dash-pattern': [6, 6],
              'target-arrow-shape': 'none',
              'width': 3
            }
          },
          {
            selector: 'edge[type="mentor_of"], edge[type="influenced_by"]',
            style: {
              'line-style': 'solid',
              'width': 4
            }
          },
          {
            selector: 'edge[type="collaborated_with"], edge[type="worked_with"]',
            style: {
              'line-style': 'dashed',
              'line-dash-pattern': [8, 6],
              'target-arrow-shape': 'none',
              'width': 3.5
            }
          },
          {
            selector: 'edge.hovered',
            style: {
              'width': 4.5,
              'opacity': 1
            }
          },
          {
            selector: 'edge.dim',
            style: {
              'opacity': 0.15
            }
          }
        ],

        layout: {
          name: 'cose-bilkent',
          quality: 'default',
          nodeDimensionsIncludeLabels: true,
          refresh: 30,
          fit: true,
          padding: 60,
          randomize: false,
          nodeRepulsion: 20000,
          idealEdgeLength: 150,
          edgeElasticity: 0.4,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 3000,
          tile: true,
          animate: 'during',
          animationDuration: 1000
        }
      })

      cy.on('tap', 'node', (evt) => {
        const node = evt.target
        selectedNode.value = {
          id: node.data('id'),
          // 見出しにはオリジナルのラベルを使用（改行挿入によるスペース崩れを防ぐ）
          label: node.data('originalLabel') || node.data('label'),
          type: node.data('type'),
          properties: node.data('properties')
        }
        // タッチデバイスではタップ時にホバー同等の強調を適用
        if (isTouchDevice()) {
          highlightNeighborhood(node)
        } else {
          // それ以外（デスクトップのクリックなど）はディミング解除のみ
          clearHighlights()
        }
      })

      cy.on('tap', (evt) => {
        if (evt.target === cy) {
          selectedNode.value = null
          clearHighlights()
        }
      })

      // ホバー時の近傍強調と非近傍ディミング
      cy.on('mouseover', 'node', (evt) => {
        const n = evt.target
        highlightNeighborhood(n)
      })

      cy.on('mouseout', 'node', () => {
        clearHighlights()
      })
    }

    // 簡易的な衝突回避（バウンディングボックスが重なるノードを軽く押し分ける）
    const resolveCollisions = (maxIter = 6, gap = 8) => {
      if (!cy) return
      const nodes = cy.nodes()
      if (!nodes || nodes.length < 2) return

      for (let iter = 0; iter < maxIter; iter++) {
        let movedAny = false
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i]
            const b = nodes[j]
            if (!a || !b) continue
            const bbA = a.boundingBox()
            const bbB = b.boundingBox()

            const overlapX = Math.min(bbA.x2, bbB.x2) - Math.max(bbA.x1, bbB.x1)
            const overlapY = Math.min(bbA.y2, bbB.y2) - Math.max(bbA.y1, bbB.y1)

            if (overlapX > 0 && overlapY > 0) {
              // 最小押し出し距離（余白をプラス）
              const pushX = overlapX + gap
              const pushY = overlapY + gap

              // 2軸のうち、押し出し距離が小さい方で分離（より自然）
              const moveAlongX = pushX <= pushY

              const posA = a.position()
              const posB = b.position()

              if (moveAlongX) {
                const dir = posA.x <= posB.x ? -1 : 1
                a.position({ x: posA.x + (dir * pushX) / 2, y: posA.y })
                b.position({ x: posB.x - (dir * pushX) / 2, y: posB.y })
              } else {
                const dir = posA.y <= posB.y ? -1 : 1
                a.position({ x: posA.x, y: posA.y + (dir * pushY) / 2 })
                b.position({ x: posB.x, y: posB.y - (dir * pushY) / 2 })
              }
              movedAny = true
            }
          }
        }
        if (!movedAny) break
      }
    }

    const updateGraph = async () => {
      if (!cy || !props.graphData) return

      // Note: Cover image functionality is commented out for now
      
      // Prepare initial node data
      const initialNodes = props.graphData.nodes.map(node => {
        // Extract DB URL from id and add to properties
        const nodeProperties = { ...node.properties }
        if (node.id && node.id.startsWith('http')) {
          nodeProperties.db_url = node.id
        }
        
        // Process label based on node type
        let displayLabel = node.label
        
        // For author nodes, show only the first person name
        if (node.type === 'author' && node.label) {
          const authors = node.label.split(/[,、]/)
          displayLabel = authors[0].trim()
        }
        
        // For work nodes, add line breaks for better text wrapping
        if (node.type === 'work' && node.label) {
          // Split long titles into multiple lines (approximately every 8-10 characters)
          const maxCharsPerLine = 8
          const words = node.label.split('')
          let lines = []
          let currentLine = ''
          
          for (let i = 0; i < words.length; i++) {
            currentLine += words[i]
            if (currentLine.length >= maxCharsPerLine && i < words.length - 1) {
              lines.push(currentLine)
              currentLine = ''
            }
          }
          if (currentLine) {
            lines.push(currentLine)
          }
          
          displayLabel = lines.join('\n')
        }
        
        return {
          data: {
            id: node.id,
            label: displayLabel,
            originalLabel: node.label, // 情報パネル用に元のラベルを保持
            type: node.type,
            properties: nodeProperties,
            isSearched: node.isSearched || false
          }
        }
      })

      // Because of the complexity of fetching cover images with law, we will handle it separately
      
      // If there are work nodes, fetch their cover URLs using bulk API
      // if (workNodes.length > 0) {
      //   try {
      //     console.log('Fetching cover URLs for', workNodes.length, 'works using bulk API')
      //     const workIds = workNodes.map(node => node.id)
          
      //     // Bulk fetch cover URLs
      //     const bulkCoverResponse = await getBulkWorkCovers(workIds)
      //     console.log('Bulk cover response:', bulkCoverResponse)
          
      //     if (bulkCoverResponse && bulkCoverResponse.results) {
      //       // Extract URLs for bulk image fetch and prepare requests
      //       const imageRequests = []
      //       const coverUrls = []
            
      //       bulkCoverResponse.results.forEach((coverData) => {
      //         if (coverData && coverData.cover_url && !coverData.error) {
      //           imageRequests.push({
      //             work_id: coverData.work_id,
      //             cover_url: coverData.cover_url
      //           })
      //           coverUrls.push({
      //             workId: coverData.work_id,
      //             url: coverData.cover_url
      //           })
      //         }
      //       })
            
      //       console.log('Found', imageRequests.length, 'cover URLs to fetch images for')
            
      //       // Bulk fetch images
      //       if (imageRequests.length > 0) {
      //         try {
      //           const bulkImageResponse = await fetchBulkImages(imageRequests)
      //           console.log('Bulk image fetch response:', bulkImageResponse)
                
      //           // Apply successful image URLs to nodes
      //           if (bulkImageResponse && bulkImageResponse.results) {
      //             const successResults = bulkImageResponse.results.filter(result => result.success)
      //             console.log('Successfully fetched', successResults.length, 'images')
                  
      //             // Update node data with cover URLs (use base64 data URLs)
      //             successResults.forEach(result => {
      //               const nodeIndex = initialNodes.findIndex(node => node.data.id === result.work_id)
      //               if (nodeIndex >= 0) {
      //                 // Create data URL from base64 image data
      //                 const dataUrl = `data:${result.content_type};base64,${result.image_data}`
      //                 initialNodes[nodeIndex].data.coverUrl = dataUrl
      //                 console.log('Applied cover image for work:', result.work_id)
      //               }
      //             })
      //           }
      //         } catch (bulkImageError) {
      //           console.error('Bulk image fetch failed:', bulkImageError)
      //           // Fall back to individual image fetching if bulk fails
      //           console.log('Falling back to individual image loading')
                
      //           const imagePromises = coverUrls.map(async (item) => {
      //             try {
      //               const img = new Image()
      //               img.crossOrigin = 'anonymous'
                    
      //               return new Promise((resolve) => {
      //                 img.onload = () => {
      //                   console.log('Individual image loaded for:', item.workId)
      //                   const nodeIndex = initialNodes.findIndex(node => node.data.id === item.workId)
      //                   if (nodeIndex >= 0) {
      //                     initialNodes[nodeIndex].data.coverUrl = item.url
      //                   }
      //                   resolve()
      //                 }
      //                 img.onerror = () => {
      //                   console.warn('Failed to load individual image for:', item.workId, item.url)
      //                   resolve()
      //                 }
      //                 img.src = item.url
      //               })
      //             } catch (error) {
      //               console.error('Error loading individual image:', error)
      //             }
      //           })
                
      //           await Promise.all(imagePromises)
      //         }
      //       }
      //     }
      //   } catch (error) {
      //     console.error('Failed to fetch bulk cover data:', error)
      //   }
      // }

      // ノードID -> タイプの逆引きマップを作成
      const nodeTypeById = initialNodes.reduce((acc, n) => {
        acc[n.data.id] = n.data.type
        return acc
      }, {})

      // エッジの向きを補正する（要件）
      // - 作品(work) ↔ 雑誌(magazine) は 作品 → 雑誌
      // - 出版社(publisher) ↔ 掲載雑誌(magazine) は 出版社 → 掲載雑誌
      const normalizeEdgeDirection = (edge) => {
        const srcType = nodeTypeById[edge.source]
        const tgtType = nodeTypeById[edge.target]
        // どちらかタイプが不明な場合はそのまま
        if (!srcType || !tgtType) return { source: edge.source, target: edge.target }

        const isWorkMagazine = (a, b) => (a === 'work' && b === 'magazine') || (a === 'magazine' && b === 'work')
        const isPublisherMagazine = (a, b) => (a === 'publisher' && b === 'magazine') || (a === 'magazine' && b === 'publisher')

        // 作品→雑誌
        if (isWorkMagazine(srcType, tgtType)) {
          const source = srcType === 'work' ? edge.source : edge.target
          const target = tgtType === 'magazine' ? edge.target : edge.source
          return { source, target }
        }

        // 出版社→雑誌
        if (isPublisherMagazine(srcType, tgtType)) {
          const source = srcType === 'publisher' ? edge.source : edge.target
          const target = tgtType === 'magazine' ? edge.target : edge.source
          return { source, target }
        }

        // それ以外は変更しない
        return { source: edge.source, target: edge.target }
      }

      const getEdgeLabel = (type) => {
        const labels = {
          created: '制作',
          authored: '著',
          published: '掲載',
          published_by: '出版',
          same_publisher: '同出版社',
          belongs_to: '掲載',
          mentor_of: '師弟',
          influenced_by: '影響',
          collaborated_with: '共作',
          worked_with: '共作'
        }
        return labels[type] || ''
      }

      const elements = [
        ...initialNodes,
        ...props.graphData.edges.map(edge => {
          const dir = normalizeEdgeDirection(edge)
          return ({
            data: {
              id: edge.id,
              source: dir.source,
              target: dir.target,
              type: edge.type,
              label: getEdgeLabel(edge.type)
            }
          })
        })
      ]

      cy.elements().remove()
      cy.add(elements)
      
  if (elements.length > 0) {
        // レイアウト後に検索ヒットノードへフォーカス＆ハイライト
    cy.one('layoutstop', () => {
          try {
    // まず衝突回避を実行して重なりを緩和
    resolveCollisions(8, 10)
            const searched = cy.nodes().filter(n => !!n.data('isSearched'))
            if (searched && searched.length > 0) {
      // 検索ヒット＋その近傍ノードも含めてフォーカス
      const neighborNodes = searched.neighborhood().nodes()
      const focusElements = searched.union(neighborNodes)
      // 近傍も数個見えるようパディングを広めに確保
      cy.fit(focusElements, 100)
              // 軽いアニメーションで注意を引く
              searched.forEach(n => {
                const type = n.data('type')
                const isWork = type === 'work'
                const backBorder = isWork ? 2 : 3
                const backSize = isWork ? { w: 80, h: 120 } : { w: 80, h: 80 }
                const boostSize = isWork ? { w: 100, h: 150 } : { w: 95, h: 95 }
                n.animate({ style: { 'border-width': 6, 'width': boostSize.w, 'height': boostSize.h } }, { duration: 280 })
                 .animate({ style: { 'border-width': backBorder, 'width': backSize.w, 'height': backSize.h } }, { duration: 280 })
              })
            }
          } catch (e) {
            console.warn('Highlight animation failed:', e)
          }
        })

        cy.layout({
          name: 'cose-bilkent',
          quality: 'default',
          nodeDimensionsIncludeLabels: true,
          refresh: 30,
          fit: true,
          padding: 60,
          randomize: false,
          nodeRepulsion: 20000,
          idealEdgeLength: 150,
          edgeElasticity: 0.4,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 3000,
          tile: true,
          animate: 'during',
          animationDuration: 1000
        }).run()
      }
    }

    const fitToScreen = () => {
      if (cy) {
        cy.fit(null, 50)
      }
    }

    const resetLayout = () => {
      if (cy) {
        cy.layout({
          name: 'cose-bilkent',
          quality: 'default',
          nodeDimensionsIncludeLabels: true,
          refresh: 30,
          fit: true,
          padding: 60,
          randomize: false,
          nodeRepulsion: 20000,
          idealEdgeLength: 150,
          edgeElasticity: 0.4,
          nestingFactor: 0.1,
          gravity: 0.25,
          numIter: 3000,
          tile: true,
          animate: 'during',
          animationDuration: 1000
        }).run()
        // レイアウト完了後にも衝突回避をかける
        cy.one('layoutstop', () => resolveCollisions(8, 10))
      }
    }

    onMounted(() => {
      nextTick(() => {
        initializeCytoscape()
      })
    })

    watch(() => props.graphData, () => {
      nextTick(() => {
        updateGraph()
      })
    }, { deep: true })

    return {
      graphContainer,
      selectedNode,
      getNodeTypeLabel,
      formatPropertyKey,
      fitToScreen,
      resetLayout
    }
  }
}
</script>

<style scoped>
.graph-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.graph-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-weight: 500;
}

.stat-icon {
  font-size: 1.1rem;
}

.graph-controls {
  display: flex;
  gap: 10px;
}

.control-button {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-button:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-icon {
  font-size: 1.1rem;
}

.graph-viewport {
  flex: 1;
  position: relative;
  min-height: 400px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 6px solid #f3f3f3;
  border-top: 6px solid #667eea;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
  margin-bottom: 24px;
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
}

.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.dot-1 {
  animation-delay: 0s;
}

.dot-2 {
  animation-delay: 0.3s;
}

.dot-3 {
  animation-delay: 0.6s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-text {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.loading-subtext {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.8;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.empty-state p {
  font-size: 1rem;
  line-height: 1.5;
}

.node-info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 20;
}

.node-info-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-info-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #333;
}

.node-info-content {
  padding: 16px 20px;
}

.property-item {
  margin-bottom: 8px;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.property-item strong {
  color: #333;
}

.db-url-link {
  color: #007bff;
  text-decoration: none;
  word-break: break-all;
}

.db-url-link:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .graph-container {
    flex: 1;
    min-height: 60vh;
  }

  .graph-header {
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }

  .graph-stats {
    font-size: 0.85rem;
  }

  .graph-controls {
    gap: 8px;
  }

  .control-button {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .graph-viewport {
    height: calc(100% - 60px);
  }

  .empty-state {
    padding: 20px;
    text-align: center;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-state h3 {
    font-size: 1.2rem;
  }

  .empty-state p {
    font-size: 0.9rem;
  }
  
  .node-info-panel {
    position: fixed;
    width: calc(100% - 20px);
    margin: 10px;
    top: auto;
    bottom: 10px;
    right: auto;
    left: 10px;
    max-height: 40vh;
    overflow-y: auto;
    z-index: 1000;
  }

  .loading-text {
    font-size: 1rem;
  }

  .loading-subtext {
    font-size: 0.85rem;
  }
}
</style>