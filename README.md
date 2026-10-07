# 化学ペア

物質名と構造式を組み合わせる、スマホ・PC対応の化学学習ゲームです。乳酸までの45物質を収録しています。

[公開アプリで遊ぶ](https://chemistry-pairs.enadorry-2009.chatgpt.site)

## 遊び方

- ひとりで練習：物質名と構造式をそろえる神経衰弱。
- みんなで対戦：スマホ1台で2〜8人が交代してプレイ。
- 対応表：物質名と構造式の2表から選択。間違いは終了後に復習。
- 世界ランキング：名前を登録してタイム・スコアを競う。出題範囲・ペア数ごとに集計。

6・8・12・24ペア、または範囲内の全ペアから選べます。カード拡大、お助け、演出の強さ・音・動きの設定にも対応。終了画面で8bit風のShizuku・Soraがお祝いします。

## 構成

- `web/`：画面、ゲーム、構造式、キャラクター画像。
- `worker/`：Cloudflare Workers向けAPI。アクセス数・ランキングをD1に保存。
- `drizzle/`：データベースのマイグレーション。
- `scripts/`：UIを埋め込んだWorkerのビルドと検証。

## ローカルで画面を確認

```sh
python3 -m http.server 8000 --directory web
```

`http://localhost:8000`で開きます。ローカルの静的サーバーでは練習・対戦・対応表を使えます。オンライン記録とアクセスカウンターにはWorkerとD1が必要です。

## ビルド

Node.js 22以上を使用します。

```sh
node scripts/build-counter.mjs
node scripts/validate-artifact.mjs
```

出力は `dist/server/index.js`。`.openai/hosting.json` は公開中のSitesプロジェクトの設定です。別のプロジェクトで運用する場合は、そのプロジェクトの設定・D1の `DB` バインディングを用意し、`drizzle/` のSQLを適用してください。GitHubへのアップロードだけではオンラインAPIやデータベースは作成されません。
