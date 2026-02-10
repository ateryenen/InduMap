'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Send, Loader, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { generateText } from '@/lib/ai/ollama';
import { generateCloudAIText, type CloudAIProvider } from '@/lib/ai/cloudAI';
import { 
  generateGraphPrompt, 
  analyzeGraphPrompt, 
  layoutPrompt, 
  documentPrompt 
} from '@/lib/ai/prompts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  onGraphGenerated?: (graph: any) => void;
  currentGraph?: any;
  onApplyLayout?: (layouts: any[]) => void;
}

export default function AIAssistant({
  onGraphGenerated,
  currentGraph,
  onApplyLayout,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 AI 助手。我可以幫助您：\n• 生成流程圖和產業圖譜\n• 分析現有圖譜\n• 優化節點排版\n• 生成項目文檔\n• 提供 CRM 和進度管理建議\n\n請告訴我您需要什麼幫助吧！',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'generate' | 'analyze'>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // AI 設定
  const [aiMode, setAiMode] = useState<'local' | 'cloud'>('local');
  const [localModel, setLocalModel] = useState('gemma3:12b');
  const [cloudProvider, setCloudProvider] = useState<CloudAIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [cloudModel, setCloudModel] = useState('gpt-4o-mini');

  // 從 localStorage 載入設定
  useEffect(() => {
    const savedMode = localStorage.getItem('ai-mode');
    const savedLocalModel = localStorage.getItem('ai-local-model');
    const savedProvider = localStorage.getItem('ai-provider');
    const savedApiKey = localStorage.getItem('ai-apikey');
    const savedModel = localStorage.getItem('ai-model');

    if (savedMode) setAiMode(savedMode as 'local' | 'cloud');
    if (savedLocalModel) setLocalModel(savedLocalModel);
    if (savedProvider) setCloudProvider(savedProvider as CloudAIProvider);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedModel) setCloudModel(savedModel);
  }, []);

  // 儲存設定到 localStorage
  const saveSettings = () => {
    localStorage.setItem('ai-mode', aiMode);
    localStorage.setItem('ai-local-model', localModel);
    localStorage.setItem('ai-provider', cloudProvider);
    localStorage.setItem('ai-apikey', apiKey);
    localStorage.setItem('ai-model', cloudModel);
    alert('✅ 設定已儲存到本地');
    setShowSettings(false);
  };

  /**
   * 統一的 AI 調用接口
   */
  const callAI = async (prompt: string, options?: { signal?: AbortSignal; temperature?: number }) => {
    if (aiMode === 'local') {
      return generateText(prompt, {
        model: localModel,
        ...options,
      });
    } else {
      if (!apiKey) {
        throw new Error('請先在設定中輸入 API Key');
      }
      return generateCloudAIText(prompt, {
        provider: cloudProvider,
        apiKey,
        model: cloudModel,
      }, options);
    }
  };

  // 自動滾動到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 生成圖譜
   */
  const handleGenerateGraph = async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('[AI Assistant] Generating graph from description...');
      abortControllerRef.current = new AbortController();
      const prompt = generateGraphPrompt(userInput);
      const response = await callAI(prompt, { 
        temperature: 0.1,  // 非常低的溫度確保結構化輸出
        signal: abortControllerRef.current.signal
      });
      
      console.log('[AI Assistant] Full response:', response);
      console.log('[AI Assistant] Response length:', response.length);
      
      // 嘗試解析 JSON - 更寬鬆的匹配
      let data: any = null;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('[AI Assistant] Found JSON match:', jsonMatch[0].substring(0, 200));
        try {
          data = JSON.parse(jsonMatch[0]);
          console.log('[AI Assistant] JSON parsed successfully:', data);
        } catch (e) {
          console.error('[AI Assistant] JSON parse failed:', e);
          console.error('[AI Assistant] Attempted to parse:', jsonMatch[0]);
        }
      } else {
        console.error('[AI Assistant] No JSON pattern found in response');
      }
      
      // 如果沒有 JSON，嘗試手動建構基本結構
      if (!data || !data.nodes) {
        console.log('[AI Assistant] No valid JSON, creating basic structure');
        data = {
          title: userInput.substring(0, 30),
          description: '基於描述生成',
          nodes: [
            { id: '1', label: '開始', type: 'process' },
            { id: '2', label: userInput.substring(0, 20), type: 'process' },
            { id: '3', label: '結束', type: 'process' }
          ],
          edges: [
            { from: '1', to: '2', label: '執行' },
            { from: '2', to: '3', label: '完成' }
          ]
        };
        console.log('[AI Assistant] Using fallback structure');
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ 已生成圖譜！\n\n標題：${data.title || '未命名'}\n描述：${data.description || '無'}\n節點數：${data.nodes?.length || 0}\n連接數：${data.edges?.length || 0}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // 回調通知父組件
      if (onGraphGenerated && data) {
        onGraphGenerated(data);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const cancelMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⏹️ 已停止生成',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, cancelMessage]);
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `生成圖譜時發生錯誤：${error instanceof Error ? error.message : '未知錯誤'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        console.error('Generate graph error:', error);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 分析圖譜
   */
  const handleAnalyzeGraph = async (userInput: string) => {
    if (!currentGraph) {
      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ 請先創建或加載一個圖譜，然後再進行分析。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, message]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput || '請分析當前圖譜',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('[AI Assistant] Analyzing graph...');
      abortControllerRef.current = new AbortController();
      const prompt = analyzeGraphPrompt(JSON.stringify(currentGraph, null, 2), userInput);
      const response = await callAI(prompt, {
        signal: abortControllerRef.current.signal
      });
      
      // 嘗試解析 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let data: any = {};
      
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // 如果解析失敗，直接顯示原文
          data = { summary: response };
        }
      } else {
        data = { summary: response };
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📊 分析結果\n\n${data.summary || '已完成分析'}\n\n強項：\n${(data.strengths || []).map((s: string) => `• ${s}`).join('\n') || '無'}\n\n改進空間：\n${(data.weaknesses || []).map((w: string) => `• ${w}`).join('\n') || '無'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const cancelMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⏹️ 已停止分析',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, cancelMessage]);
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ 分析失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        console.error('Analyze graph error:', error);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 生成排版建議
   */
  const handleLayout = async () => {
    if (!currentGraph) {
      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ 請先創建或加載一個圖譜，然後再進行排版。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, message]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '請幫我優化節點排版',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      console.log('[AI Assistant] Optimizing layout...');
      abortControllerRef.current = new AbortController();
      const prompt = layoutPrompt(JSON.stringify(currentGraph, null, 2));
      const response = await callAI(prompt, {
        signal: abortControllerRef.current.signal,
      });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let data: any = { layout: [] };
      
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse layout JSON:', e);
        }
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ 已優化 ${data.layout?.length || 0} 個節點的位置`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (onApplyLayout && data.layout) {
        onApplyLayout(data.layout);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const cancelMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⏹️ 已停止優化',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, cancelMessage]);
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ 佈局優化失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        console.error('Layout optimization error:', error);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 生成文檔
   */
  const handleGenerateDocument = async () => {
    if (!currentGraph) {
      const message: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ 請先創建或加載一個圖譜。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, message]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '生成專案文檔',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      console.log('[AI Assistant] Generating document...');
      abortControllerRef.current = new AbortController();
      const prompt = documentPrompt(JSON.stringify(currentGraph, null, 2));
      const response = await callAI(prompt, {
        signal: abortControllerRef.current.signal,
      });
      // 嘗試解析 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      let data: any = {};
      
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse document JSON:', e);
          data = { overview: response.substring(0, 1000) };
        }
      } else {
        data = { overview: response.substring(0, 1000) };
      }

      const documentText = `📄 **專案文檔**\n\n**概述：**\n${data.overview || '無'}\n\n**關鍵指標：**\n${data.keyMetrics?.map((m: any) => `- ${m.name}: ${m.value}`).join('\n') || '無'}\n\n**建議：**\n${data.recommendations?.join('\n') || '無'}`;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: documentText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const cancelMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '⏹️ 已停止生成',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, cancelMessage]);
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ 文檔生成失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        console.error('Document generation error:', error);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * 停止 AI 生成
   */
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('[AI Assistant] User stopped generation');
    }
  };

  /**
   * 發送消息
   */
  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    if (activeTab === 'generate') {
      await handleGenerateGraph(input);
    } else if (activeTab === 'analyze') {
      await handleAnalyzeGraph(input);
    } else {
      // 普通聊天
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // 簡單的關鍵詞匹配
      const lowerInput = input.toLowerCase();
      let responseText = '抱歉，我還不太理解這個問題。您可以：\n• 切換到「生成」標籤來創建圖譜\n• 切換到「分析」標籤來分析現有圖譜';

      if (lowerInput.includes('文檔') || lowerInput.includes('文件')) {
        await handleGenerateDocument();
        return;
      } else if (lowerInput.includes('排版') || lowerInput.includes('佈局') || lowerInput.includes('布局')) {
        await handleLayout();
        return;
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
      >
        💬
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg">
          AI 助手 {aiMode === 'local' ? '🏠' : '☁️'}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💾 <strong>設定存儲位置：</strong> 本地瀏覽器
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                您的 API Keys 和設定安全地儲存在本設備的瀏覽器中
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">AI 模式</label>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value as 'local' | 'cloud')}
                className="w-full mt-1 p-2 border rounded text-sm"
              >
                <option value="local">🏠 本地 AI (Ollama)</option>
                <option value="cloud">☁️ 雲端 AI</option>
              </select>
            </div>

            {aiMode === 'local' && (
              <div>
                <label className="text-sm font-medium">本地模型</label>
                <select
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  className="w-full mt-1 p-2 border rounded text-sm"
                >
                  <option value="phi">🚀 Phi (2.7B - 快速)</option>
                  <option value="gemma3:12b">💎 Gemma3 (12B - 詳細)</option>
                  <option value="mistral">🔥 Mistral (7B - 平衡)</option>
                  <option value="tinyllama">⚡ TinyLlama (1.1B - 超快)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  當前選擇會影響生成速度和品質
                </p>
              </div>
            )}

            {aiMode === 'cloud' && (
              <>
                <div>
                  <label className="text-sm font-medium">雲端服務</label>
                  <select
                    value={cloudProvider}
                    onChange={(e) => setCloudProvider(e.target.value as CloudAIProvider)}
                    className="w-full mt-1 p-2 border rounded text-sm"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="claude">Claude</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">模型</label>
                  <input
                    type="text"
                    value={cloudModel}
                    onChange={(e) => setCloudModel(e.target.value)}
                    placeholder="例如: gpt-4o-mini"
                    className="w-full mt-1 p-2 border rounded text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="輸入您的 API Key"
                    className="w-full mt-1 p-2 border rounded text-sm"
                  />
                </div>
              </>
            )}

            <Button
              onClick={saveSettings}
              className="w-full"
              size="sm"
            >
              儲存設定
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-sm ${
            activeTab === 'chat'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500'
          }`}
        >
          對話
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 py-2 text-sm ${
            activeTab === 'generate'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500'
          }`}
        >
          生成
        </button>
        <button
          onClick={() => setActiveTab('analyze')}
          className={`flex-1 py-2 text-sm ${
            activeTab === 'analyze'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500'
          }`}
        >
          分析
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <Loader className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              activeTab === 'generate'
                ? '描述您想要生成的圖譜...'
                : activeTab === 'analyze'
                  ? '詢問有關圖譜的問題...'
                  : '輸入消息...'
            }
            className="resize-none"
            rows={2}
            disabled={loading}
          />
          {loading ? (
            <Button
              onClick={handleStopGeneration}
              variant="destructive"
              className="h-full"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="h-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
