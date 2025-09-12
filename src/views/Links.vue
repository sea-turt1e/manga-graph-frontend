<template>
  <div class="links">
    <!-- <Header /> -->
    <main class="main-content">
      <div class="container">
        <h1 class="page-title">Manga Graphリンク</h1>
        <p class="page-description">
          Manga Graphに関連するサイトへのリンク集です。
        </p>
        
        <div class="links-grid">
          <!-- アプリ -->
          <div class="link-category">
            <h2 class="category-title">アプリ</h2>
            <div class="link-cards">
              <a 
                href="/" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon">
                  <img :src="graphCover" alt="Manga Graph Visualizer" class="link-img" />
                </div>
                <div class="link-content">
                  <h3>Manga Graph Visualizer</h3>
                  <p>漫画のグラフDBを可視化</p>
                </div>
                <div class="external-icon">↗</div>
              </a>
              
              <a 
                href="https://manga-graph-graphrag-production.up.railway.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon">💬</div>
                <div class="link-content">
                  <h3>GraphRAGデモ</h3>
                  <p>漫画のグラフDBを使用したGraphRAGのStreamlitデモ</p>
                </div>
                <div class="external-icon">↗</div>
              </a>
            </div>
          </div>

          <!-- ブログ、記事 -->
          <div class="link-category">
            <h2 class="category-title">解説</h2>
            <div class="link-cards">
              <a 
                href="https://zenn.dev/sea_turt1e/articles/manga-graph-db" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon">📖</div>
                <div class="link-content">
                  <h3>Zenn解説記事</h3>
                  <p>漫画のグラフDBに関する解説記事</p>
                </div>
                <div class="external-icon">↗</div>
              </a>
              
              <a 
                href="" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon">📄</div>
                <div class="link-content">
                  <h3>スライド</h3>
                  <p>漫画のグラフDBに関するスライド資料</p>
                </div>
                <div class="external-icon">↗</div>
              </a>
              <a 
                href="https://github.com/sea-turt1e/manga-graph" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon github-logo">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div class="link-content">
                  <h3>GitHubリポジトリ（API）</h3>
                  <p>MangaGraphのAPIリポジトリ</p>
                </div>
                <div class="external-icon">↗</div>
              </a>
            </div>
          </div>

          <!-- 作者サイト -->
          <div class="link-category">
            <h2 class="category-title">作者（sea-turt1e）のサイト</h2>
            <div class="link-cards">
              <a 
                href="https://sea-turt1e.github.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon">
                  <img :src="portfolioImage" alt="Portfolio" class="link-img" />
                </div>
                <div class="link-content">
                  <h3>ポートフォリオ</h3>
                </div>
                <div class="external-icon">↗</div>
              </a>
              
              <a 
                href="https://github.com/sea-turt1e"
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon github-logo">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div class="link-content">
                  <h3>GitHub Profile</h3>
                </div>
                <div class="external-icon">↗</div>
              </a>

              <a 
                href="https://x.com/sea_turt1e"
                target="_blank" 
                rel="noopener noreferrer"
                class="link-card"
              >
                <div class="link-icon">𝕏</div>
                <div class="link-content">
                  <h3>X.com(sea_turt1e)</h3>
                </div>
                <div class="external-icon">↗</div>
              </a>
              
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import graphCover from '../assets/graph-white-cover-image.png';
import portfolioImage from '../assets/portfolio-image.png';
import Header from '../components/Header.vue';

export default {
  name: 'Links',
  components: {
    Header
  },
  data() {
    return {
      graphCover,
      portfolioImage
    }
  }
}
</script>

<style scoped>
.links {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d42 100%);
  color: #ffffff;
}

.main-content {
  padding: 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  text-align: center;
  font-size: 1.1rem;
  color: #b0b0b0;
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.links-grid {
  display: grid;
  gap: 3rem;
}

.link-category {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.category-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #4facfe;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.link-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.link-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(79, 172, 254, 0.5);
  box-shadow: 0 10px 30px rgba(79, 172, 254, 0.2);
}

.link-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.link-card:hover::before {
  left: 100%;
}

.link-icon {
  font-size: 2rem;
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(79, 172, 254, 0.2);
  border-radius: 12px;
}

.link-icon.x-logo,
.link-icon.github-logo {
  color: #ffffff;
}

.link-icon.x-logo svg,
.link-icon.github-logo svg {
  width: 28px;
  height: 28px;
}

.link-img {
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 8px;
}

.link-content {
  flex: 1;
}

.link-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #ffffff;
}

.link-content p {
  font-size: 0.9rem;
  color: #b0b0b0;
  margin: 0;
  line-height: 1.4;
}

.external-icon {
  font-size: 1.2rem;
  color: #4facfe;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.link-card:hover .external-icon {
  transform: translate(2px, -2px);
}

.back-link {
  text-align: center;
  margin-top: 3rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(45deg, #4facfe, #00f2fe);
  color: white;
  text-decoration: none;
  border-radius: 30px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
  background: linear-gradient(45deg, #00f2fe, #4facfe);
}

/* レスポンシブデザイン */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .link-cards {
    grid-template-columns: 1fr;
  }
  
  .link-card {
    padding: 1rem;
  }
  
  .link-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .category-title {
    font-size: 1.3rem;
  }
  
  .link-content h3 {
    font-size: 1rem;
  }
  
  .link-content p {
    font-size: 0.85rem;
  }
}
</style>
