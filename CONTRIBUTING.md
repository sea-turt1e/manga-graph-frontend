# コントリビュートガイド

このプロジェクトへのコントリビュートをお考えいただき、ありがとうございます！

## 開発フロー

### 1. リポジトリのフォーク

1. GitHubでこのリポジトリをフォークしてください
2. フォークしたリポジトリをローカルにクローンしてください

```bash
git clone https://github.com/yourusername/manga-graph-frontend.git
cd manga-graph-frontend
```

### 2. 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 3. ブランチの作成

**重要: 全ての変更はdevelopブランチから新しいブランチを作成してください**

```bash
# developブランチに切り替え
git checkout develop

# 最新の変更を取得
git pull origin develop

# 新しいブランチを作成
git checkout -b feat/your-feature-name
# または
git checkout -b fix/bug-description
```

#### ブランチ命名規則

- 機能追加: `feat/機能名`
- バグ修正: `fix/バグの説明`
- ドキュメント: `docs/変更内容`
- リファクタリング: `refactor/変更内容`

### 4. 開発

1. コードを変更してください
2. 適切なコミットメッセージで変更をコミットしてください

```bash
git add .
git commit -m "feat: 新機能の説明"
```

#### コミットメッセージの規則

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメントの変更
- `style:` コードスタイルの変更
- `refactor:` リファクタリング
- `test:` テストの追加・修正

### 5. プルリクエストの作成

1. 変更をリモートリポジトリにプッシュ

```bash
git push origin feature/your-feature-name
```

2. GitHubでプルリクエストを作成
   - **Base branch: `develop`** を選択してください
   - Compare branch: あなたの作成したブランチ

3. プルリクエストのタイトルと説明を記入
   - 変更内容の要約
   - 関連するIssue番号（ある場合）
   - テスト方法

### 6. レビューと修正

1. コードレビューを待ちます
2. 修正依頼があれば対応してください
3. 承認されたらマージされます

## コーディング規約

- ESLintとPrettierの設定に従ってください
- 型安全性を保つため、TypeScriptを適切に使用してください
- コンポーネントは適切に分割してください

<!-- ## テスト

変更前にテストが通ることを確認してください：

```bash
npm run test
npm run lint
npm run build
``` -->

## 質問やサポート

質問がある場合は、Issueを作成するか、既存のIssueにコメントしてください。

---

コントリビュートしていただき、ありがとうございます！