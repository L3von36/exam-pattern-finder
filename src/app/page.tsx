'use client'

import { useState } from 'react'
import { ExamInput } from '@/components/exam/exam-input'
import { ResultsDashboard } from '@/components/exam/results-dashboard'
import type { AnalysisResult } from '@/lib/exam-analyzer'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion } from 'framer-motion'
import {
  ScanSearch,
  Brain,
  TrendingUp,
  ShieldCheck,
  Github,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  X,
} from 'lucide-react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze(input: { examContent: string; bookContent?: string; focus?: string }) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.error || `Request failed with status ${res.status}`
        throw new Error(msg)
      }
      setResult(data.result as AnalysisResult)
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/30 via-background to-amber-50/20 dark:from-emerald-950/20 dark:via-background dark:to-amber-950/10">
      {/* Header */}
      <header className="border-b sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-600 to-amber-500 flex items-center justify-center text-white">
              <ScanSearch className="size-4" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">Exam Pattern Finder</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">powered by LAYA</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://huggingface.co/convaiinnovations/laya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Model: convaiinnovations/laya
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 pt-10 sm:pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-4">
              <Brain className="size-3" />
              AI-powered exam intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-emerald-900 via-amber-800 to-emerald-900 dark:from-emerald-300 dark:via-amber-300 dark:to-emerald-300 bg-clip-text text-transparent">
              Find the patterns hiding in your exams.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
              Paste a past paper, add a textbook sample, and let the LAYA exam-pattern engine surface recurring topics,
              question-type mixes, difficulty weighting, and predicted focus areas — so you know what to study next.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <FeaturePill icon={<TrendingUp className="size-3" />} label="Topic clustering" />
              <FeaturePill icon={<Brain className="size-3" />} label="Cognitive analysis" />
              <FeaturePill icon={<ShieldCheck className="size-3" />} label="Predicted focus" />
              <FeaturePill icon={<ScanSearch className="size-3" />} label="Pattern mining" />
            </div>
          </motion.div>

          <div className="flex justify-center mt-8">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => document.getElementById('input-anchor')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start analyzing
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </section>

        {/* Input section */}
        <section id="input-anchor" className="container mx-auto px-4 py-6 scroll-mt-20">
          <div className="max-w-4xl mx-auto">
            <ExamInput onAnalyze={handleAnalyze} loading={loading} />
          </div>
        </section>

        {/* Error display */}
        {error && (
          <section className="container mx-auto px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Analysis failed</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  <span>{error}</span>
                  <Button size="sm" variant="outline" onClick={() => setError(null)}>
                    <X className="size-3" /> Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          </section>
        )}

        {/* Results section */}
        <section id="results-anchor" className="container mx-auto px-4 py-8 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            {loading && <ResultsSkeleton />}
            {result && !loading && <ResultsDashboard result={result} />}
          </div>
        </section>
      </main>

      <footer className="border-t mt-auto bg-background/60">
        <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Exam Pattern Finder</span>
            <span className="text-border">·</span>
            <span>Analysis engine: {result?.rawModelLabel ?? 'LAYA exam-pattern engine'}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://huggingface.co/convaiinnovations/laya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              LAYA on Hugging Face
              <ExternalLink className="size-3" />
            </a>
            <a
              href="https://huggingface.co/convaiinnovations"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="size-3" />
              convaiinnovations
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-3 py-1.5">
      {icon}
      <span className="text-foreground/80">{label}</span>
    </span>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 rounded-xl bg-muted/40 animate-pulse" />
      <div className="h-12 rounded-lg bg-muted/30 animate-pulse" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-72 rounded-xl bg-muted/30 animate-pulse" />
        <div className="h-72 rounded-xl bg-muted/30 animate-pulse" />
      </div>
    </div>
  )
}
