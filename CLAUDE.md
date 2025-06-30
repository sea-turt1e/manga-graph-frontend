# Claude Code Configuration

## Repository 設定
- **リポジトリ名**: manga-graph-frontend

## issue作成時の注意事項
issue作成時の注意事項を@ai-rules/ISSUE_GUIDELINES.mdにまとめています
issue作成時は必ず確認して必ずこの内容に従ってissue作成を行ってください。

## アプリケーションポート設定
以下のポートで各サービスが動作します：

### 開発環境（Docker Compose）
- `http://localhost:3000` (ポート: 3000)

## 開発コマンド
- `npm run dev` - 開発サーバーをポート3000で起動
- `npm run build` - プロダクション用ビルド
- `npm run preview` - プロダクションビルドのプレビュー

## アーキテクチャ
### 主要技術
- **Vue 3** (Composition API使用)
- **Vite** (ビルドツール・開発サーバー)
- **Cytoscape.js** (cose-bilkentレイアウトでグラフ可視化)
- **Axios** (API通信)

### アプリケーション構造
- **App.vue**: 検索状態とグラフデータを管理するメインコンポーネント
- **components/**: UIエレメント用Vueコンポーネント
  - `Header.vue`: アプリケーションヘッダー
  - `SearchPanel.vue`: 検索機能用左サイドバー
  - `GraphVisualization.vue`: Cytoscape統合メイングラフ表示
- **services/api.js**: 検索、作者、作品、雑誌、ヘルスチェック用APIクライアント

### データフロー
1. ユーザーがSearchPanelコンポーネントで検索
2. App.vueが`searchManga()` API呼び出しで検索処理
3. グラフデータ(ノード/エッジ)がGraphVisualizationコンポーネントを更新
4. Cytoscapeが色分けされたノードタイプでインタラクティブグラフをレンダリング:
   - 作品(緑)、作者(青)、雑誌(オレンジ)

### API統合
- ベースURL: `VITE_API_BASE_URL`環境変数で設定可能
- デフォルトバックエンド: `http://localhost:8000`
- APIリクエストタイムアウト: 30秒
- 日本語ユーザーメッセージでエラーハンドリング

### グラフ機能
- プロパティパネル付きインタラクティブノード選択
- 画面フィット・レイアウトリセットコントロール
- 異なるエッジタイプ: created, same_publisher, mentor_of
- モバイル対応レスポンシブデザイン

## 環境変数
- `VITE_API_BASE_URL`: バックエンドAPI URL (デフォルト: localhost:8000)

## 関数・エンドポイント作成時の注意事項
- 命名規則などを@ai-rules/API_FUNCTION_NAMING.mdにまとめています
- 関数やエンドポイントの作成時には必ず確認し、内容に従って実装を行ってください。

## 開発時の注意点
- Tailwind CSSを優先して使用し、重複スタイルは避けること
- .envファイル内のキーはUPPER_SNAKE_CASEで記述し、値にクォートは付けないこと
- @ai-rules/COMMIT_AND_PR_GUIDELINES.mdにガイドラインを記述しています。git commitやPR作成時は必ず確認し、内容に従ってください。

## 動作確認・テスト時の必須確認事項（コミット前に必ず実施されるべきです）
- テスト・動作確認の際はplaywrightのMCPツールを使用して動作確認を行ってください。
- テスト・動作確認は修正を行った際は必ず行ってください。
- E2Eテストとしてユーザ目線での動作が問題ないかしっかりと確認してください。
