'use client'

import { useState, useEffect } from 'react'
import { predictSingle, fetchWeather, fetchHolidayForDate, aiExplain } from '@/lib/api'
import { Sparkles, Loader2, TriangleAlert, CalendarCheck, Bot, Bookmark, BookmarkCheck } from 'lucide-react'

const SRI_LANKA_LOCATIONS = ['Colombo', 'Kandy', 'Galle', 'Negombo']

const MENU_ITEMS = [
  'Rice & Curry', 'Devilled Chicken', 'Kottu', 'String Hoppers', 'Hoppers',
  'Fish Curry', 'Fried Rice', 'Lamprais', 'Egg Roti', 'Roti',
  'Noodles', 'Pittu', 'Short Eats', 'Juice', 'Tea / Coffee',
]

const HOLIDAYS = [
  'None',
  'Sinhala & Tamil New Year', 'Sinhala New Year Day 2', 'Thai Pongal',
  'Vesak Full Moon', 'Vesak Holiday', 'Poson Poya', 'Esala Poya', 'Nikini Poya',
  'Binara Poya', 'Vap Poya', 'Il Poya', 'Unduvap Poya', 'Duruthu Poya',
  'Navam Poya', 'Medin Poya', 'Bak Poya',
  'Eid ul Fitr', 'Day Before Eid ul Fitr', 'Eid ul Adha', 'Milad-Un-Nabi',
  'Deepavali',
  'Christmas', 'Christmas Eve', 'Good Friday',
  'Independence Day', 'May Day',
  'New Year Eve', 'New Year Day',
]

// Fixed Sri Lankan public holidays (same date every year)
const FIXED_HOLIDAY_BY_DATE: Record<string, string> = {
  '01-01': 'New Year Day',
  '02-04': 'Independence Day',
  '04-14': 'Sinhala & Tamil New Year',
  '05-01': 'May Day',
  '12-25': 'Christmas',
}

const FIXED_HOLIDAY_TO_MMDD: Record<string, string> = {
  'New Year Day':          '01-01',
  'Independence Day':      '02-04',
  'Sinhala & Tamil New Year': '04-14',
  'May Day':               '05-01',
  'Christmas':             '12-25',
}

function getNextOccurrence(mmdd: string): string {
  const [mm, dd] = mmdd.split('-')
  const now = new Date()
  const todayNorm = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisYear  = new Date(now.getFullYear(), parseInt(mm) - 1, parseInt(dd))
  const year = thisYear >= todayNorm ? now.getFullYear() : now.getFullYear() + 1
  return `${year}-${mm}-${dd}`
}

interface PredictResult {
  date: string
  item: string
  location: string
  ml_prediction: number
  rule_factor: number
  final_forecast: number
  rules_applied: { rule: string; factor: number }[]
}

interface SavedEntry extends PredictResult {
  id: string
  savedAt: string
  rainfall_mm: number
  temperature: number
  holiday_name: string
}

export default function PredictPage() {
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    date:         today,
    item:         MENU_ITEMS[0],
    location:     SRI_LANKA_LOCATIONS[0],
    rainfall_mm:  '0',
    temperature:  '30',
    holiday_name: 'None',
  })
  const [loading, setLoading]                       = useState(false)
  const [result, setResult]                         = useState<PredictResult | null>(null)
  const [error, setError]                           = useState<string | null>(null)
  const [weatherLoading, setWeatherLoading]         = useState(false)
  const [weatherSource, setWeatherSource]           = useState('')
  const [weatherCondition, setWeatherCondition]     = useState('')
  const [holidayAutoDetected, setHolidayAutoDetected] = useState(false)
  const [aiExplanation, setAiExplanation]           = useState<string | null>(null)
  const [aiLoading, setAiLoading]                   = useState(false)
  const [saved, setSaved]                           = useState(false)

  function set(key: string, value: string) {
    if (key === 'holiday_name') {
      const mmdd = FIXED_HOLIDAY_TO_MMDD[value]
      if (mmdd) {
        // Fixed holiday selected → auto-fill date to next occurrence
        const nextDate = getNextOccurrence(mmdd)
        setForm(f => ({ ...f, holiday_name: value, date: nextDate }))
        setHolidayAutoDetected(true)
        return
      }
      setHolidayAutoDetected(false)
    }
    setForm(f => ({ ...f, [key]: value }))
  }

  // Auto-fetch weather when date or location changes
  useEffect(() => {
    if (!form.date || !form.location) return
    setWeatherLoading(true)
    fetchWeather(form.date, form.location)
      .then((w: { temperature: number; rainfall_mm: number; source: string; condition: string }) => {
        setForm(f => ({ ...f, temperature: String(w.temperature), rainfall_mm: String(w.rainfall_mm) }))
        setWeatherSource(w.source)
        setWeatherCondition(w.condition ?? '')
      })
      .catch(() => { setWeatherSource(''); setWeatherCondition('') })
      .finally(() => setWeatherLoading(false))
  }, [form.date, form.location])

  // Auto-detect holiday when date changes
  useEffect(() => {
    if (!form.date) return
    const mmdd = form.date.slice(5) // "MM-DD"
    const fixed = FIXED_HOLIDAY_BY_DATE[mmdd]
    if (fixed) {
      // Client-side detection for fixed annual holidays (no API needed)
      setForm(f => ({ ...f, holiday_name: fixed }))
      setHolidayAutoDetected(true)
      return
    }
    fetchHolidayForDate(form.date)
      .then((h: { holiday_name: string; is_holiday: boolean }) => {
        const detected = h.holiday_name && h.holiday_name !== 'None' ? h.holiday_name : 'None'
        setForm(f => ({ ...f, holiday_name: detected }))
        setHolidayAutoDetected(h.is_holiday === true)
      })
      .catch(() => {})
  }, [form.date])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.date < today) {
      setError('Cannot get a forecast for a past date. Please select today or a future date.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setSaved(false)
    try {
      const payload = {
        date:         form.date,
        item:         form.item,
        location:     form.location,
        rainfall_mm:  parseFloat(form.rainfall_mm) || 0,
        temperature:  parseFloat(form.temperature) || 30,
        holiday_name: form.holiday_name,
      }
      const res = await predictSingle(payload)
      setResult(res)
      setAiExplanation(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleAiExplain() {
    if (!result) return
    setAiLoading(true)
    try {
      const res = await aiExplain(result as unknown as Record<string, unknown>)
      setAiExplanation(res.explanation)
    } catch {
      setAiExplanation('AI explanation unavailable — make sure the AI API key is set.')
    } finally {
      setAiLoading(false)
    }
  }

  function savePrediction() {
    if (!result) return
    const entry: SavedEntry = {
      id:           Date.now().toString(),
      savedAt:      new Date().toISOString(),
      rainfall_mm:  parseFloat(form.rainfall_mm) || 0,
      temperature:  parseFloat(form.temperature) || 30,
      holiday_name: form.holiday_name,
      ...result,
    }
    const stored  = localStorage.getItem('foresto_predictions')
    const existing: SavedEntry[] = stored ? JSON.parse(stored) : []
    localStorage.setItem('foresto_predictions', JSON.stringify([entry, ...existing].slice(0, 200)))
    setSaved(true)
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Demand Predictor</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Get a real-time demand forecast for any item, date &amp; weather condition
        </p>
      </div>

      <div className="surface-shell grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ── Form ── */}
        <div className="section-card">
          <h2 className="text-sm font-semibold text-gray-800 mb-5">Prediction Parameters</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  min={today}
                  onChange={e => set('date', e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm transition focus-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
                <select
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm transition bg-white focus-orange"
                >
                  {SRI_LANKA_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Menu Item</label>
              <select
                value={form.item}
                onChange={e => set('item', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm transition bg-white focus-orange"
              >
                {MENU_ITEMS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  Temperature (°C)
                  {weatherLoading && <Loader2 size={11} className="animate-spin text-gray-400" />}
                  {!weatherLoading && weatherSource === 'nasa_power' && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5 font-medium">NASA</span>
                  )}
                  {!weatherLoading && weatherSource === 'historical_csv' && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5 font-medium">Historical</span>
                  )}
                  {!weatherLoading && weatherSource === 'monthly_avg' && (
                    <span className="text-[10px] bg-amber-100 text-amber-600 rounded px-1.5 py-0.5 font-medium">Estimate</span>
                  )}
                </label>
                <input
                  type="number"
                  value={form.temperature}
                  onChange={e => set('temperature', e.target.value)}
                  min={15} max={45} step={0.1}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm transition focus-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                  Rainfall (mm)
                  {!weatherLoading && weatherCondition && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-medium">{weatherCondition}</span>
                  )}
                </label>
                <input
                  type="number"
                  value={form.rainfall_mm}
                  onChange={e => set('rainfall_mm', e.target.value)}
                  min={0} step={0.1}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm transition focus-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                Holiday / Event
                {holidayAutoDetected && (
                  <span className="flex items-center gap-0.5 text-[10px] bg-orange-100 text-orange-600 rounded px-1.5 py-0.5 font-medium">
                    <CalendarCheck size={10} />
                    Auto-detected
                  </span>
                )}
              </label>
              <select
                value={form.holiday_name}
                onChange={e => set('holiday_name', e.target.value)}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 transition bg-white ${
                  holidayAutoDetected ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}
              >
                {HOLIDAYS.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="orange-btn w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Predicting…</>
                : <><Sparkles size={16} /> Get Forecast</>
              }
            </button>
          </form>
        </div>

        {/* ── Result ── */}
        <div className="space-y-4">
          {error && (
            <div className="section-card border-red-200 bg-red-50 flex items-start gap-3">
              <TriangleAlert size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Prediction Failed</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
                <p className="text-xs text-red-400 mt-1">Make sure the FastAPI server is running on port 8000.</p>
              </div>
            </div>
          )}

          {result && (
            <>
              <div className="section-card border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Final Forecast</p>
                <p className="text-5xl font-bold text-orange-500">{Math.round(result.final_forecast)}</p>
                <p className="text-sm text-gray-500 mt-1">units of <strong>{result.item}</strong></p>
                <p className="text-xs text-gray-400 mt-0.5">{result.date} · {result.location}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="section-card text-center">
                  <p className="text-xs text-gray-400 mb-1">ML Prediction</p>
                  <p className="text-2xl font-bold text-gray-800">{Number(result.ml_prediction).toFixed(1)}</p>
                </div>
                <div className="section-card text-center">
                  <p className="text-xs text-gray-400 mb-1">Rule Factor</p>
                  <p className="text-2xl font-bold text-gray-800">×{Number(result.rule_factor).toFixed(2)}</p>
                </div>
              </div>

              {result.rules_applied?.length > 0 && (
                <div className="section-card">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Rules Applied</p>
                  <div className="space-y-1">
                    {result.rules_applied.map((r, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                          <span className="text-xs text-gray-600">{r.rule}</span>
                        </div>
                        <span className="text-xs font-semibold text-orange-500 flex-shrink-0">
                          ×{Number(r.factor).toFixed(3).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.rules_applied?.length === 0 && (
                <div className="section-card">
                  <p className="text-xs text-gray-400">No business rules triggered for this scenario.</p>
                </div>
              )}

              {/* Save + AI Explain */}
              <div className="flex gap-2">
                <button
                  onClick={savePrediction}
                  disabled={saved}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed ${
                    saved
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {saved
                    ? <><BookmarkCheck size={15} /> Saved</>
                    : <><Bookmark size={15} /> Save Prediction</>
                  }
                </button>
                <button
                  onClick={handleAiExplain}
                  disabled={aiLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {aiLoading
                    ? <><Loader2 size={15} className="animate-spin" /> Asking AI…</>
                    : <><Bot size={15} /> Explain with AI</>
                  }
                </button>
              </div>

              {aiExplanation && (
                <div className="section-card border-purple-200 bg-purple-50/40">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Bot size={13} className="text-purple-600" />
                    </div>
                    <p className="text-xs font-semibold text-purple-700">AI Explanation</p>
                  </div>
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {aiExplanation
                      .split(/\*\*(.+?)\*\*/g)
                      .map((part, i) =>
                        i % 2 === 1
                          ? <strong key={i} className="text-gray-900 font-semibold">{part}</strong>
                          : <span key={i}>{part}</span>
                      )
                    }
                  </div>
                </div>
              )}
            </>
          )}

          {!result && !error && (
            <div className="section-card h-64 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center border border-orange-200">
                <Sparkles size={22} className="text-orange-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                Fill in the parameters and click<br />Get Forecast to see results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
