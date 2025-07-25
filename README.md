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

- **検索機能**: 作品名による検索と関連データ表示
- **グラフ可視化**: Cytoscape.jsによるインタラクティブなノード・エッジ表示
- **関係表示**: 作品（緑）、作者（青）、雑誌（オレンジ）の色分け表示
- **検索オプション**: 検索深度調整と関連データ込み検索
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

```env
VITE_API_BASE_URL=http://localhost:8000
```

## プロジェクト構成

```
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
- `GET /v1/neo4j/search` - 関連データ込み検索
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

## データセット
このアプリケーションは、以下のデータセットを使用しています：
- 出典：独立行政法人国立美術館国立アートリサーチセンター「メディア芸術データベース」 （https://mediaarts-db.artmuseums.go.jp/）
  - またこのリポジトリ内のスクリプトによってデータをグラフ化し、Neo4jに投入しています。
- OpenBDのデータ
  - データの詳細は、[OpenBD](https://openbd.jp/)をご覧ください。