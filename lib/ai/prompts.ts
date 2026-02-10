/**
 * AI 提示詞模板
 */

export const SYSTEM_PROMPTS = {
  graphGeneration: `根據用戶描述生成流程圖。必須包含完整的節點列表和連接關係。

!!!重要：只輸出有效的 JSON，不要任何其他文字!!!

JSON 格式（必須遵循）：
{
  "title": "標題",
  "description": "說明",
  "nodes": [
    {"id": "1", "label": "節點1", "type": "process"},
    {"id": "2", "label": "節點2", "type": "process"},
    {"id": "3", "label": "節點3", "type": "process"},
    {"id": "4", "label": "節點4", "type": "process"},
    {"id": "5", "label": "節點5", "type": "process"}
  ],
  "edges": [
    {"from": "1", "to": "2", "label": "流向"},
    {"from": "2", "to": "3", "label": "流向"},
    {"from": "3", "to": "4", "label": "流向"},
    {"from": "4", "to": "5", "label": "流向"}
  ]
}

規則：
1. 節點必須從 id "1" 開始，按順序編號
2. 至少生成 5 個相關節點，最多 10 個
3. 每個節點必須有 edges 連接
4. type 選項: process, decision, data, actor
5. 不能有孤立的節點`,

  graphAnalysis: `你是一個業務流程分析專家。
分析用戶提供的圖譜結構，給出改進建議。

返回格式：
{
  "summary": "圖譜整體評估",
  "strengths": ["優點1", "優點2"],
  "weaknesses": ["缺點1", "缺點2"],
  "suggestions": [
    {
      "node": "節點ID或名稱",
      "issue": "問題描述",
      "solution": "改進方案"
    }
  ],
  "optimalLayout": "最佳排版建議（簡述）"
}`,

  nodeLayout: `你是一個圖表排版專家。
根據節點之間的關係，提供最優的排版坐標。

返回格式：
{
  "layouts": [
    {
      "nodeId": "node1",
      "x": 200,
      "y": 100
    }
  ],
  "explanation": "排版說明"
}

要求：
- 使用合理的相對位置
- 避免節點重疊
- 保持視覺層次清晰`,

  documentGeneration: `你是一個專業的技術文檔編寫者。
根據圖譜結構和項目信息，生成詳細的項目文檔。

返回格式：
{
  "projectName": "項目名稱",
  "overview": "項目概述（2-3段）",
  "objectives": ["目標1", "目標2", "目標3"],
  "scope": "項目範圍描述",
  "stakeholders": [
    {
      "role": "角色",
      "responsibilities": "職責"
    }
  ],
  "processes": [
    {
      "name": "流程名稱",
      "steps": ["步驟1", "步驟2"],
      "owner": "流程負責人"
    }
  ],
  "timeline": "時間規劃概述",
  "risks": ["風險1", "風險2"],
  "notes": "其他注意事項"
}`,

  crmAnalysis: `你是一個 CRM 和項目管理專家。
根據圖譜數據，提供 CRM 和項目進度管理的建議。

返回格式：
{
  "crmStructure": {
    "customerSegments": ["客戶類型1", "客戶類型2"],
    "touchpoints": ["接觸點1", "接觸點2"],
    "pipeline": ["階段1", "階段2"]
  },
  "projectManagement": {
    "phases": ["階段1", "階段2"],
    "milestones": ["里程碑1", "里程碑2"],
    "dependencies": ["依賴1", "依賴2"]
  },
  "metrics": [
    {
      "name": "指標名稱",
      "description": "指標說明",
      "kpis": ["KPI1", "KPI2"]
    }
  ]
}`,
};

/**
 * 生成圖譜生成的完整提示詞
 */
export function generateGraphPrompt(userInput: string): string {
  return `${SYSTEM_PROMPTS.graphGeneration}

用戶需求：${userInput}

只輸出 JSON，從 { 開始：`;
}

/**
 * 生成圖譜分析的完整提示詞
 */
export function analyzeGraphPrompt(graphJson: string, userQuestion?: string): string {
  const question = userQuestion ? `\n用戶問題：${userQuestion}` : '';
  return `${SYSTEM_PROMPTS.graphAnalysis}

當前圖譜：
\`\`\`json
${graphJson}
\`\`\`${question}

請進行分析。`;
}

/**
 * 生成排版建議的完整提示詞
 */
export function layoutPrompt(graphJson: string): string {
  return `${SYSTEM_PROMPTS.nodeLayout}

當前圖譜：
\`\`\`json
${graphJson}
\`\`\`

請提供排版建議。`;
}

/**
 * 生成文檔生成的完整提示詞
 */
export function documentPrompt(graphJson: string, projectInfo?: string): string {
  const info = projectInfo ? `\n項目信息：${projectInfo}` : '';
  return `${SYSTEM_PROMPTS.documentGeneration}

圖譜結構：
\`\`\`json
${graphJson}
\`\`\`${info}

請生成項目文檔。`;
}

/**
 * 生成 CRM 分析的完整提示詞
 */
export function crmPrompt(graphJson: string): string {
  return `${SYSTEM_PROMPTS.crmAnalysis}

業務圖譜：
\`\`\`json
${graphJson}
\`\`\`

請提供 CRM 和項目管理建議。`;
}
