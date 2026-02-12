# FlowCanvas - Infinite Canvas for Strategy Flows

一個功能豐富的互動式白板應用，具備 AI 驅動的產業圖譜生成、分析和優化能力。支持網頁版和 Windows 桌面應用。

![Next.js](https://img.shields.io/badge/Next.js-13-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Electron](https://img.shields.io/badge/Electron-Latest-9feaf9?logo=electron)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 功能特性

- **互動式白板** — 拖拽創建和連接節點，自由編輯產業圖譜
- **AI 助手** — 集成 OpenAI、Claude、Google Gemini，快速生成圖譜結構
- **多頁面支持** — 在一個項目中創建多個頁面
- **自動保存** — 實時保存到本地存儲，無需手動操作
- **圖片插入與編輯** — 支持上傳圖片、裁剪、編輯
- **導出功能** — 匯出為圖片、PDF、ZIP 等格式
- **桌面應用** — Windows 原生應用，離線可用
- **響應式設計** — 適配各種屏幕尺寸

## 🚀 快速開始

### 環境要求

- Node.js 16+ （推薦 18+）
- npm 或 yarn

### 安裝依賴

```bash
npm install
```

### 開發模式（Web）

```bash
npm run dev
```

或在 Windows 上使用便捷腳本：

```bash
rundev.bat
```

打開 [http://localhost:3000](http://localhost:3000) 查看應用。

### 編譯和導出（Web）

```bash
npm run build:web
```

生成靜態 HTML 文件到 `out/` 目錄。

### 打包桌面應用（Windows）

```bash
npm run dist
```

生成 Windows 安裝程序到 `dist/` 目錄。

### 代碼檢查和類型驗證

```bash
npm run lint          # ESLint 檢查
npm run typecheck     # TypeScript 類型檢查
```

### 端到端測試（E2E）

```bash
npm run test:e2e      # 使用 Playwright
```

## 📁 項目結構

```
├── app/                  # Next.js 13 App Router
│   ├── layout.tsx       # 全局佈局和主題
│   ├── page.tsx         # 主頁面
│   └── api/             # API 路由
├── components/
│   ├── ui/              # UI 組件基礎庫（Radix + Tailwind）
│   ├── whiteboard/      # 白板核心組件
│   │   └── canvas/      # 畫布和節點組件
│   ├── pageParts/       # 頁面結構組件
│   ├── menus/           # 菜單組件（文件、編輯、插入等）
│   └── ai/              # AI 相關組件
├── lib/
│   ├── whiteboard/      # 白板邏輯和狀態管理
│   │   ├── boardReducer.ts    # Redux 式的 reducer
│   │   ├── types.ts           # 類型定義
│   │   ├── storage.ts         # 本地存儲邏輯
│   │   └── hooks/             # 自定義 hooks
│   └── ai/              # AI 集成（OpenAI、Claude、Gemini）
├── electron/            # Electron 桌面應用入口
├── types/               # 全局類型定義
└── styles/              # 全局樣式
```

## ⚙️ 配置

### 環境變數

創建 `.env.local` 文件（不會被 git 追蹤）：

```env
# AI 服務 API 密鑰（可選）
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Supabase（如果使用）
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Ollama 本地 LLM（可選）
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
```

### Tailwind 配置

在 `tailwind.config.ts` 中自定義主題顏色、間距等。

### TypeScript 配置

在 `tsconfig.json` 中調整編譯選項。

## 🎨 技術棧

- **框架** — Next.js 13（App Router）
- **UI** — React 18 + Radix UI + Tailwind CSS
- **狀態管理** — React useReducer + Context API
- **圖表** — React Flow（節點和邊的可視化）
- **圖片處理** — html2canvas
- **桌面** — Electron + electron-builder
- **測試** — Playwright（E2E）
- **類型** — TypeScript
- **代碼質量** — ESLint、Prettier

## 🤖 AI 功能

應用支持多個 AI 提供商：

1. **OpenAI** — GPT-4、GPT-3.5
2. **Anthropic Claude** — Claude 2、Claude Instant
3. **Google Gemini** — 高性能多模态模型
4. **Ollama** — 本地運行開源 LLM

在 AI 助手面板切換提供商並設置 API 密鑰。

## 💾 數據持久化

- **自動保存** — 編輯 400ms 後自動保存到 `localStorage`
- **項目格式** — `ProjectFileV2` JSON 序列化格式
- **遷移** — 如修改存儲格式，請在 `lib/whiteboard/storage.ts` 中添加遷移邏輯

## 🔧 開發指南

### 添加新功能

1. 在 `lib/whiteboard/boardReducer.ts` 中添加新的 action
2. 在相應組件中使用 reducer dispatch
3. 更新 `lib/whiteboard/types.ts` 中的類型定義
4. 確保使用 `useAutoSaveProjectToStorage` hook 進行持久化

### 編碼約定

- **客戶端組件** — 在文件頂部標記 `"use client"`
- **狀態流** — 所有狀態變更通過 whiteboard reducer
- **持久化** — 對象必須是可序列化的（無類實例、無函數）
- **UI 組件** — 優先使用 `components/ui/` 中的現有組件

### 調試

- 使用 VS Code 的 TypeScript 支持檢查類型錯誤
- 在 Electron 中打開開發者工具：`Ctrl+Shift+I`
- 檢查 `localStorage` 在瀏覽器開發者工具的 Application 標籤

## 🐛 故障排除

**白板不顯示**
- 檢查 localStorage 是否被禁用
- 清除瀏覽器緩存和 `.next/` 目錄，重新構建

**AI 助手報錯**
- 驗證 API 密鑰是否正確設置在 `.env.local`
- 檢查網絡連接
- 查看瀏覽器控制台的詳細錯誤信息

**桌面應用構建失敗**
- 確保已運行 `npm run build:web`
- 檢查 `out/` 目錄是否存在
- 在 Windows 上確保有足夠的磁盤空間

## 📝 許可證

本項目採用 MIT 許可證。詳見 [LICENSE](LICENSE) 文件。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

1. Fork 此倉庫
2. 創建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📧 聯繫方式

有任何問題或建議，歡迎提交 Issue！

---

**關鍵快捷鍵**

| 快捷鍵 | 功能 |
|---------|------|
| `Ctrl+S` | 保存項目 |
| `Ctrl+Z` | 撤銷 |
| `Ctrl+Y` | 重做 |
| `Del` | 刪除選中節點 |
| `Ctrl+A` | 全選 |
| `Esc` | 取消選中 |

---

Made with ❤️ by the team
