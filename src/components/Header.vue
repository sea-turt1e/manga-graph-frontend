<template>
  <header class="header">
    <div class="header-content">
      <div class="header-top">
        <h1 class="title">
          <span class="icon">📚</span>
          Manga Graph Visualizer
        </h1>
        <nav class="navigation">
          <router-link to="/" class="nav-link">ホーム</router-link>
          <router-link to="/links" class="nav-link">関連リンク</router-link>
          <router-link to="/sources" class="nav-link" aria-label="出典ページへ">出典</router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'Header'
}
</script>

<style scoped>
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 0;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.icon {
  font-size: 2rem;
}

.navigation {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.nav-link:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.nav-link.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  font-weight: 300;
}

@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  
  .title {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
  }
  
  .navigation {
    gap: 1rem;
  }
  
  .nav-link {
    font-size: 1rem;
    padding: 0.4rem 0.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .navigation {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
}
</style>