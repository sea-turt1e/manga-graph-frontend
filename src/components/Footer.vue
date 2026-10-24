<template>
  <footer class="footer">
    <nav class="footer-nav">
      <router-link to="/" class="footer-link">ホーム</router-link>
      <span class="footer-divider">|</span>
      <router-link to="/links" class="footer-link">リンク</router-link>
      <span class="footer-divider">|</span>
      <router-link to="/sources" class="footer-link">出典</router-link>
    </nav>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
}
</script>

<style scoped>
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(30, 30, 46, 0.9);
  backdrop-filter: blur(5px);
  padding: 8px 0;
  z-index: 100;
}

.footer-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.footer-link {
  color: #888;
  text-decoration: none;
  font-size: 0.75rem;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: #aaa;
}

.footer-link.router-link-exact-active {
  color: #667eea;
}

.footer-divider {
  color: #555;
  font-size: 0.7rem;
}
</style>
