<template>
  <div class="sources">
    <header class="sources-header">
      <h1>出典</h1>
    </header>
    <p>このアプリケーションは、以下のデータセットを使用しています：</p>

    <ul class="sources-list">
      <li>
        <a href="https://mediaarts-db.artmuseums.go.jp/" target="_blank" rel="noopener noreferrer">
          メディア芸術データベース
        </a>
        <ul>
          <li>
            本プロジェクトは、独立行政法人国立美術館国立アートリサーチセンター「メディア芸術データベース」のデータを利用しています。
          </li>
        </ul>
      </li>
    </ul>
    <Footer />
  </div>
  
</template>

<script>
import Footer from '../components/Footer.vue';

export default {
  name: 'Sources',
  components: {
    Footer
  }
}
</script>

<style scoped>
.sources {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 64px;
  line-height: 1.8;
}

h1 {
  font-size: 1.6rem;
  margin: 0;
}

.sources-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

h1 {
  font-size: 1.6rem;
  margin-bottom: 12px;
}

.sources-list {
  list-style: disc;
  margin-left: 1.25rem;
}

.sources-list > li { margin-bottom: 14px; }
.sources-list ul { list-style: circle; margin-left: 1.25rem; margin-top: 6px; }

a { color: #8ab4ff; text-decoration: underline; }
a:hover { color: #c2dbff; }

/* スクロール時も見やすいように、ページ幅が狭い場合の余白調整 */
@media (max-width: 600px) {
  .sources { padding: 16px 12px 72px; }
}
</style>
