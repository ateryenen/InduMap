/**
 * 雲端 AI 服務客戶端
 * 支援 OpenAI、Claude、Gemini 等
 */

export type CloudAIProvider = 'openai' | 'claude' | 'gemini';

interface CloudAIConfig {
  provider: CloudAIProvider;
  apiKey: string;
  model?: string;
}

/**
 * OpenAI API 調用
 */
async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string = 'gpt-4o-mini',
  options?: { signal?: AbortSignal; temperature?: number }
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Claude API 調用
 */
async function callClaude(
  prompt: string,
  apiKey: string,
  model: string = 'claude-3-5-sonnet-20241022',
  options?: { signal?: AbortSignal; temperature?: number }
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error (${response.status}): ${error.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

/**
 * Gemini API 調用
 */
async function callGemini(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp',
  options?: { signal?: AbortSignal; temperature?: number }
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: 4096,
        },
      }),
      signal: options?.signal,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

/**
 * 統一的雲端 AI 調用接口
 */
export async function generateCloudAIText(
  prompt: string,
  config: CloudAIConfig,
  options?: {
    temperature?: number;
    signal?: AbortSignal;
  }
): Promise<string> {
  console.log('[Cloud AI] Generating with provider:', config.provider);

  switch (config.provider) {
    case 'openai':
      return callOpenAI(prompt, config.apiKey, config.model, options);
    case 'claude':
      return callClaude(prompt, config.apiKey, config.model, options);
    case 'gemini':
      return callGemini(prompt, config.apiKey, config.model, options);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
