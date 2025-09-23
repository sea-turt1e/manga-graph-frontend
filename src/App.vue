<template>
  <div id="app">
    <router-view />
    <footer class="app-footer" role="contentinfo">
      <div class="footer-inner">
        <router-link class="footer-link" to="/sources" aria-label="出典ページへ">
          出典
        </router-link>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* グローバルスタイル */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #1e1e2e;
  color: #ffffff;
}

#app {
  width: 100%;
  height: 100vh;
}

.app-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 36px;
  background: rgba(0, 0, 0, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 1000;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 14px;
}

.footer-link {
  color: #e5e7eb;
  text-decoration: none;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  transition: background 0.2s ease, color 0.2s ease;
}

.footer-link:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}
</style>
