import { test, expect } from '@playwright/test';

test.describe('レスポンシブデザインテスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('モバイルビューでSearchPanelが適切に表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const searchPanel = page.locator('.search-panel');
    const graphContainer = page.locator('.graph-container');
    
    // SearchPanelが表示されている
    await expect(searchPanel).toBeVisible();
    
    // SearchPanelが全幅を使用
    const searchPanelBox = await searchPanel.boundingBox();
    expect(searchPanelBox.width).toBe(375);
    
    // GraphContainerが下に配置されている
    await expect(graphContainer).toBeVisible();
    
    // 使い方セクションが非表示
    const searchTips = page.locator('.search-tips');
    await expect(searchTips).not.toBeVisible();
  });

  test('モバイルビューで検索機能が動作する', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const searchInput = page.locator('.search-input');
    const searchButton = page.locator('.search-button');
    
    // 検索入力が可能
    await searchInput.fill('ONE PIECE');
    await expect(searchInput).toHaveValue('ONE PIECE');
    
    // 検索ボタンが有効
    await expect(searchButton).not.toBeDisabled();
  });

  test('タブレットビューでレイアウトが適切に表示される', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    const mainContent = page.locator('.main-content');
    const searchPanel = page.locator('.search-panel');
    const graphContainer = page.locator('.graph-container');
    
    // 768pxでは縦並びレイアウト
    await expect(searchPanel).toBeVisible();
    await expect(graphContainer).toBeVisible();
    
    // SearchPanelの幅が全幅
    const searchPanelBox = await searchPanel.boundingBox();
    expect(searchPanelBox.width).toBe(768);
  });

  test('デスクトップビューで横並びレイアウトが維持される', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    const searchPanel = page.locator('.search-panel');
    const graphContainer = page.locator('.graph-container');
    
    // 両方のパネルが表示
    await expect(searchPanel).toBeVisible();
    await expect(graphContainer).toBeVisible();
    
    // SearchPanelが固定幅350px
    const searchPanelBox = await searchPanel.boundingBox();
    expect(searchPanelBox.width).toBe(350);
    
    // 使い方セクションが表示
    const searchTips = page.locator('.search-tips');
    await expect(searchTips).toBeVisible();
  });

  test('モバイルビューでノード情報パネルが適切に配置される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // ダミーデータを設定してグラフを表示
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test-set-graph-data', {
        detail: {
          nodes: [{ id: '1', label: 'Test Node', type: 'work' }],
          edges: []
        }
      }));
    });
    
    // ノード情報パネルの位置確認（モバイルでは下部固定）
    const nodeInfoPanel = page.locator('.node-info-panel');
    if (await nodeInfoPanel.isVisible()) {
      const box = await nodeInfoPanel.boundingBox();
      // 画面下部に配置されている
      expect(box.y + box.height).toBeGreaterThan(500);
    }
  });
});