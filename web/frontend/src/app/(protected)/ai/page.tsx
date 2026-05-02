'use client'

import { useState, useRef, useEffect } from 'react'
import { aiChat, aiInsights, aiRecommend } from '@/lib/api'
import { Bot, Send, Loader2, Sparkles, TrendingUp, Lightbulb, RotateCcw } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : <span key={i}>{part}</span>
  )
}

function renderMarkdown(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (trimmed === '') {
      elements.push(<div key={i} className="h-1.5" />)
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+\.)/)?.[1] ?? ''
      const text = trimmed.replace(/^\d+\.\s*/, '')
      elements.push(
        <div key={i} className="flex gap-2 mb-1">
          <span className="font-semibold text-orange-500 flex-shrink-0 min-w-[1.2rem]">{num}</span>
          <span>{renderInline(text)}</span>
        </div>
      )
    } else if (/^[-*]\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s*/, '')
      elements.push(
        <div key={i} className="flex gap-2 mb-1">
          <span className="text-orange-400 flex-shrink-0">•</span>
          <span>{renderInline(text)}</span>
        </div>
      )
    } else {
      elements.push(<p key={i} className="mb-1">{renderInline(line)}</p>)
    }
  })
  return elements
}

const SUGGESTIONS = [
  'Which item has the highest sales?',
  'What are the peak sales days of the week?',
  'How does weather affect demand for Kottu?',
  'Give me recommendations for Colombo restaurant this week.',
  'What is the best performing location?',
  'How do Poya days affect different menu items?',
]

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can answer questions about your restaurant\'s sales data, forecast trends, and provide actionable recommendations. How can I help you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [recommendLoading, setRecommendLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const content = text ?? input.trim()
    if (!content || loading) return
    setInput('')
    const updated: Message[] = [...messages, { role: 'user', content }]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await aiChat(updated.map(m => ({ role: m.role, content: m.content })))
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '?? Sorry, I could not reach the AI service. Make sure the backend is running.' }])
    } finally {
      setLoading(false)
    }
  }

  async function loadInsights() {
    setInsightsLoading(true)
    try {
      const res = await aiInsights()
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'Generate AI insights from the latest sales data.' },
        { role: 'assistant', content: res.insights },
      ])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '?? Could not load insights.' }])
    } finally {
      setInsightsLoading(false)
    }
  }

  async function loadRecommendations() {
    setRecommendLoading(true)
    try {
      const res = await aiRecommend()
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'What are today\'s operational recommendations?' },
        { role: 'assistant', content: res.recommendations },
      ])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '?? Could not load recommendations.' }])
    } finally {
      setRecommendLoading(false)
    }
  }

  function reset() {
    setMessages([{
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
    }])
  }

  return (
    <div className="p-8 h-[calc(100vh-0px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-xs text-gray-400">Powered by AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInsights}
            disabled={insightsLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition disabled:opacity-50"
          >
            {insightsLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI Insights
          </button>
          <button
            onClick={loadRecommendations}
            disabled={recommendLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition disabled:opacity-50"
          >
            {recommendLoading ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />}
            Recommendations
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-full hover:border-orange-300 hover:text-orange-600 transition disabled:opacity-50"
          >
            <Lightbulb size={10} />
            {s}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
              msg.role === 'assistant'
                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}>
              {msg.role === 'assistant' ? <Bot size={14} /> : 'U'}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-white border border-gray-100 text-gray-800 shadow-sm'
                : 'bg-orange-500 text-white whitespace-pre-wrap'
            }`}>
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-orange-400" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about sales, forecasts, or get recommendations..."
          disabled={loading}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="orange-btn px-4 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
