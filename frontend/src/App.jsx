import { useState } from 'react'
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'

export default function App() {
  const [clicked, setClicked] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      {/* Container */}
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-md">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tailwind CSS v4 Connected
          </div>
          <span className="text-xs text-slate-500 font-mono">React 19 + Vite</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
          AI Support & Refund Agent
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Tailwind styling and icons are working seamlessly. This component confirms that utilities, gradients, borders, and interactivity are active.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3 hover:border-indigo-500/50 transition-colors">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">SSE Streaming</div>
              <div className="text-xs text-slate-400">Realtime tokens</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-start gap-3 hover:border-purple-500/50 transition-colors">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">HITL Approvals</div>
              <div className="text-xs text-slate-400">Human in the loop</div>
            </div>
          </div>
        </div>

        {/* Interactive Button */}
        <button
          onClick={() => setClicked(!clicked)}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 hover:from-indigo-500 to-purple-600 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          {clicked ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Tailwind & State Interactive! Click again</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Click to test interactive state</span>
            </>
          )}
        </button>

        {clicked && (
          <div className="mt-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs text-center animate-fade-in">
            🎉 Tailwind CSS styling, animations, and React state reactivity are 100% operational!
          </div>
        )}

      </div>
    </div>
  )
}
