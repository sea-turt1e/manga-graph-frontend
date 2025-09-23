<template>
  <div class="sources">
    <header class="sources-header">
      <h1>出典</h1>
      <nav class="sources-nav" aria-label="出典ページ内ナビゲーション">
        <router-link class="nav-btn" to="/">トップへ戻る</router-link>
        <router-link class="nav-btn" to="/links">Linksへ</router-link>
      </nav>
    </header>
    <p>このアプリケーションは、以下のデータセットを使用しています：</p>

    <ul class="sources-list">
      <li>
        <a href="https://mediaarts-db.artmuseums.go.jp/" target="_blank" rel="noopener noreferrer">
          メディア芸術データベース
        </a>
        <ul>
          <li>
            出典：独立行政法人国立美術館国立アートリサーチセンター「メディア芸術データベース」
            （
            <a href="https://mediaarts-db.artmuseums.go.jp/" target="_blank" rel="noopener noreferrer">
              https://mediaarts-db.artmuseums.go.jp/
            </a>
            ）
          </li>
          <li>
            独立行政法人国立美術館国立アートリサーチセンター「メディア芸術データベース」（
            <a href="https://mediaarts-db.artmuseums.go.jp/" target="_blank" rel="noopener noreferrer">
              https://mediaarts-db.artmuseums.go.jp/
            </a>
            ）を加工してデータを作成
          </li>
        </ul>
      </li>
      <li>
        <a href="https://openbd.jp/" target="_blank" rel="noopener noreferrer">OpenBD</a>
        <ul>
          <li>
            「OpenBD」（
            <a href="https://openbd.jp/" target="_blank" rel="noopener noreferrer">https://openbd.jp/</a>
            ）を利用しています。
          </li>
        </ul>
      </li>
      <li>
        <a href="https://www.kaggle.com/datasets/azathoth42/myanimelist" target="_blank" rel="noopener noreferrer">
          MyAnimeList Dataset
        </a>
        <ul>
          <li>
            本プロジェクトは MyAnimeList Dataset（MyAnimeList.net）のデータを利用しています。データベースは
            Open Database License (ODbL) v1.0、個々のコンテンツは Database Contents License (DbCL) v1.0 に基づきます。
            ライセンス条件に従い帰属表示と通知保持を行っています。
          </li>
        </ul>
      </li>
    </ul>
  </div>
  
</template>

<script>
export default {
  name: 'Sources'
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
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.sources-nav {
  display: flex;
  gap: 8px;
}

.nav-btn {
  display: inline-block;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  color: #111827;
  background: #e5e7eb;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.1s ease;
}

.nav-btn:hover { background: #d1d5db; }
.nav-btn:active { transform: translateY(1px); }

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
