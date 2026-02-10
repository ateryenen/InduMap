/**
 * Ollama API 客戶端工具
 * 與本地 Ollama 服務通信
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma3:12b';

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
  prompt_eval_count?: number;
}

/**
 * 調用 Ollama 生成文本
 */
export async function generateText(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
  } = {}
): Promise<string> {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;

  try {
    console.log('[Ollama] Generating text with model:', model);
    console.log('[Ollama] URL:', `${OLLAMA_BASE_URL}/api/generate`);
    console.log('[Ollama] Prompt length:', prompt.length);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: options?.maxTokens || 4000,
        },
      }),
      signal: options?.signal,
    });

    console.log('[Ollama] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ollama] Error response:', errorText);
      throw new Error(`Ollama API error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    const data: OllamaGenerateResponse = await response.json();
    console.log('[Ollama] Response length:', data.response?.length || 0);
    return data.response;
  } catch (error) {
    console.error('[Ollama] Generate error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('無法連接到 Ollama 服務。請確保 Ollama 正在運行 (http://localhost:11434)');
    }
    throw error;
  }
}

/**
 * 流式調用 Ollama（用於實時展示回應）
 */
export async function generateTextStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  options: {
    model?: string;
    temperature?: number;
  } = {}
): Promise<void> {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.7;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // 保留最後一行（可能不完整）
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data: OllamaGenerateResponse = JSON.parse(line);
            if (data.response) {
              onChunk(data.response);
            }
          } catch (e) {
            // 忽略解析錯誤
          }
        }
      }
    }

    // 處理剩余的 buffer
    if (buffer.trim()) {
      try {
        const data: OllamaGenerateResponse = JSON.parse(buffer);
        if (data.response) {
          onChunk(data.response);
        }
      } catch (e) {
        // 忽略解析錯誤
      }
    }
  } catch (error) {
    console.error('Ollama stream error:', error);
    throw error;
  }
}

/**
 * 檢查 Ollama 服務是否可用
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Ollama health check failed:', error);
    return false;
  }
}

/**
 * 獲取可用的模型列表
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    const data: any = await response.json();
    return data.models?.map((m: any) => m.model) || [];
  } catch (error) {
    console.error('Failed to get models:', error);
    return [];
  }
}
