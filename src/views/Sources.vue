<template>
  <div class="sources">
    <header class="sources-header">
      <h1>出典</h1>
      <nav class="sources-nav" aria-label="出典ページ内ナビゲーション">
        <router-link class="nav-btn" to="/">トップへ戻る</router-link>
        <router-link class="nav-btn" to="/links">関連リンク</router-link>
      </nav>
    </header>
    <p>このアプリケーションは、以下のデータセットを使用しています：</p>

    <ul class="sources-list">
      <li>
        <a href="https://www.kaggle.com/datasets/hamzaashfaque1999/myanimelist-scraped-data" target="_blank" rel="noopener noreferrer">
          MyAnimeList Anime & Manga Dataset (July 2025)
        </a>
        <ul>
          <li>
            本プロジェクトは MyAnimeList Anime & Manga Dataset (July 2025)のデータを利用しています。データベースは
            MITライセンスの下で提供されており、適切な帰属表示を行っています。
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
