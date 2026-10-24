<template>
  <header class="header">
    <div class="header-content">
      <div class="header-top">
        <h1 class="title">
          <span class="icon">📚</span>
          マンガつながりマップ
        </h1>
        <h2 class="subtitle">〜マンガの作品や作者、雑誌、出版社のつながりを可視化〜</h2>
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
  gap: 1rem;
  flex-wrap: wrap;
}

.title {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  flex-shrink: 0;
  white-space: nowrap;
}

.icon {
  font-size: 2rem;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  font-weight: 300;
  margin: 0;
  flex: 1;
  text-align: center;
  min-width: 200px;
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
  
  .subtitle {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.5rem;
  }
}
</style>