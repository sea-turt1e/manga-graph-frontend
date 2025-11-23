# Manga Graph Frontend

漫画の関係グラフを可視化するVue.js 3フロントエンドアプリケーション

## 概要

このアプリケーションは、漫画作品、作者、雑誌間の関係をインタラクティブなグラフとして可視化します。Cytoscape.jsを使用してノードとエッジを表示し、バックエンドAPIと連携して検索・表示機能を提供します。

## バックエンド
バックエンドのリポジトリは[こちら（Manga Graph）](https://github.com/sea-turt1e/manga-graph)にあります。

## デモ
このAPIを利用したデモは[Manga Graph Visualizer](https://mangagraph.netlify.app/)として公開されており、インタラクティブなグラフ操作が可能です。  
（ただし一部のノードはサーバー負荷削減のため省いています。）

[![Manga_Graph_Visualizer_demo](/images/manga_graph_visualizer.gif)](https://mangagraph.netlify.app/)

## 主な機能

- **検索機能**: 作品名による検索と関連データ表示（取得上限のみ調整可能）
- **グラフ可視化**: Cytoscape.jsによるインタラクティブなノード・エッジ表示
- **関係表示**: 作品（緑）、作者（青）、雑誌（オレンジ）の色分け表示
- **検索オプション**: 取得上限（limit）を指定可能
- **レスポンシブ対応**: モバイルデバイスに対応したUI

## 技術スタック

- **Vue.js 3**: Composition APIを使用したフロントエンド
- **Vite**: 高速な開発サーバーとビルドツール
- **Cytoscape.js**: グラフ可視化ライブラリ（cose-bilkentレイアウト使用）
- **Axios**: HTTP APIクライアント

## 開発環境のセットアップ

### 必要要件

- Node.js 16以上
- npm

### インストール

```bash
# 依存関係のインストール
npm install
```

### 開発サーバーの起動

```bash
# 開発サーバーを起動（ポート3000）
npm run dev
```

### ビルド

```bash
# プロダクション用ビルド
npm run build

# ビルドプレビュー
npm run preview
```

## 環境変数

プロジェクトルートに`.env`ファイルを作成し、以下の変数を設定してください：

```bash
VITE_API_BASE_URL="http://localhost:8000"
MY_API_KEY="your_api_key_for_authentication_of_api_requests"
```

## プロジェクト構成

```bash
src/
├── App.vue                 # メインアプリケーションコンポーネント
├── main.js                 # エントリーポイント
├── components/
│   ├── Header.vue          # アプリケーションヘッダー
│   ├── SearchPanel.vue     # 検索機能サイドバー
│   └── GraphVisualization.vue # Cytoscapeグラフ表示
└── services/
    └── api.js              # APIクライアント
```

## API連携

アプリケーションは以下のエンドポイントを使用します：

- `POST /v1/search` - 基本検索機能
- `GET /v1/manga-anime-neo4j/graph` - Neo4jグラフ（漫画・アニメ）検索
- `GET /v1/neo4j/vector/title-similarity` - タイトル類似度検索（曖昧検索）
- `GET /v1/media-arts/*` - 文化庁メディア芸術データベース連携
- `GET /health` - ヘルスチェック

## 使用方法

1. 検索パネルに作品名を入力
2. 関連作品・作者表示のオン/オフ設定
3. 検索ボタンをクリック
4. グラフ上でノードをクリックして詳細表示
5. ノードをドラッグして位置調整

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# ビルドプレビュー
npm run preview
```

## ライセンス
Apache License 2.0

## 出典
このアプリケーションは、以下のデータセットを使用しています：
- [メディア芸術データベース](https://mediaarts-db.artmuseums.go.jp/)
  - 出典：独立行政法人国立美術館国立アートリサーチセンター「メディア芸術データベース」 （https://mediaarts-db.artmuseums.go.jp/）
  - 独立行政法人国立美術館国立アートリサーチセンター「メディア芸術データベース」（https://mediaarts-db.artmuseums.go.jp/）を加工してデータを作成
- [OpenBD](https://openbd.jp/)
  - 「OpenBD」 （https://openbd.jp/） を利用しています。
- [MyAnimeList Dataset](https://www.kaggle.com/datasets/azathoth42/myanimelist)
  - 本プロジェクトはMyAnimeList Dataset（MyAnimeList.net） のデータを利用しています。データベースは Open Database License (ODbL) v1.0、個々のコンテンツは Database Contents License (DbCL) v1.0 に基づきます。ライセンス条件に従い帰属表示と通知保持を行っています。」
