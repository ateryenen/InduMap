# AI 功能集成說明

## 已實現功能

### 1. **圖譜生成** 
- 根據自然語言描述生成流程圖和產業圖譜
- API: `POST /api/ai/generate`
- 自動創建節點和連接

### 2. **圖譜分析**
- 分析現有圖譜結構
- 提供改進建議和優化方向
- API: `POST /api/ai/analyze`

### 3. **智能排版**
- 根據節點關係自動計算最優位置
- 避免重疊、保持視覺層次
- API: `POST /api/ai/layout`

### 4. **項目文檔生成**
- 將圖譜轉換為詳細的項目文檔
- 包含概述、目標、流程等
- API: `POST /api/ai/document`

### 5. **CRM 與項目管理建議**
- 分析業務流程
- 提供 CRM 結構和項目管理建議
- API: `POST /api/ai/crm`

## 使用方式

### 啟動 Ollama
確保 Ollama 服務正在運行：
```bash
# 檢查 Ollama 狀態
curl http://localhost:11434/api/tags

# 如果未運行，啟動 Ollama（根據您的安裝方式）
ollama serve
```

### 啟動應用
```bash
npm run dev
```

### 使用 AI 助手
1. 點擊右下角的 **✨ AI 助手** 浮動窗口
2. 選擇功能標籤：
   - **對話**：與 AI 自由對話
   - **生成**：輸入描述生成新圖譜
   - **分析**：分析當前圖譜並獲得建議

### 示例用法

**生成圖譜：**
```
請生成一個電商平台的訂單處理流程圖
```

**分析圖譜：**
```
這個流程有哪些可以優化的地方？
```

**智能排版：**
點擊 "優化排版" 按鈕，AI 會自動調整節點位置

## 配置

### 環境變量（可選）
在 `.env.local` 中設置：
```bash
OLLAMA_BASE_URL=http://localhost:11434
```

### 更換模型
在 API 調用時指定不同的模型：
```javascript
fetch('/api/ai/generate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: '...',
    model: 'mistral',  // 或其他已安裝的模型
  })
})
```

## 文件結構

```
lib/ai/
  ├── ollama.ts          # Ollama API 客戶端
  └── prompts.ts         # AI 提示詞模板

app/api/ai/
  ├── generate/route.ts  # 圖譜生成
  ├── analyze/route.ts   # 圖譜分析
  ├── layout/route.ts    # 智能排版
  ├── document/route.ts  # 文檔生成
  └── crm/route.ts       # CRM 分析

components/ai/
  └── AIAssistant.tsx    # AI 助手 UI 組件
```

## API 參數

### POST /api/ai/generate
```json
{
  "prompt": "生成一個供應鏈管理流程圖",
  "model": "gemma3:12b"  // 可選
}
```

### POST /api/ai/analyze
```json
{
  "graph": { "nodes": [...], "edges": [...] },
  "question": "這個流程有什麼問題？",  // 可選
  "model": "gemma3:12b"  // 可選
}
```

### POST /api/ai/layout
```json
{
  "graph": { "nodes": [...], "edges": [...] },
  "model": "gemma3:12b"  // 可選
}
```

## 故障排除

### Ollama 連接失敗
```bash
# 檢查 Ollama 是否運行
curl http://localhost:11434/api/tags

# 檢查模型是否已下載
ollama list

# 下載推薦模型
ollama pull gemma3:12b
```

### AI 回應格式錯誤
AI 可能返回的不是有效的 JSON。這種情況下：
1. 檢查 `rawResponse` 欄位查看原始回應
2. 調整提示詞（在 `lib/ai/prompts.ts` 中）
3. 嘗試降低 `temperature` 參數以獲得更穩定的輸出

## 性能建議

- **gemma3:12b** - 平衡速度和質量（推薦）
- **mistral:7b** - 更快但質量稍低
- **llama2:13b** - 質量更高但速度較慢

根據您的硬體配置選擇合適的模型。

## 未來擴展

可以添加的功能：
- 流式回應（實時顯示生成過程）
- 向量數據庫集成（語義搜索）
- 多語言支持
- 自定義提示詞模板
- 圖譜版本比較
