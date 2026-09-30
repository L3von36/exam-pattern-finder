'use client'

import { useEffect, useState } from 'react'
import { ExamInput } from '@/components/exam/exam-input'
import { ResultsDashboard } from '@/components/exam/results-dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AnalysisResult } from '@/lib/exam-analyzer'
import { useDashboardStore } from '@/lib/dashboard-store'
import { ScanSearch, AlertCircle, X, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AnalyzerView() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Local input state — synced with the dashboard store when a paper is loaded from the bank.
  const [localExamContent, setLocalExamContent] = useState<string | null>(null)
  const [localExamTitle, setLocalExamTitle] = useState<string | null>(null)

  const { preloadedExamContent, preloadedExamTitle, clearPreload } = useDashboardStore()

  // When the store has a preloaded paper (from question bank), surface it as a banner.
  useEffect(() => {
    if (preloadedExamContent) {
      setLocalExamContent(preloadedExamContent)
      setLocalExamTitle(preloadedExamTitle)
      // Clear result so old results don't confuse the user
      setResult(null)
    }
  }, [preloadedExamContent, preloadedExamTitle])

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
        throw new Error(data?.error || `Request failed with status ${res.status}`)
      }
      setResult(data.result as AnalysisResult)
      setTimeout(() => {
        document.getElementById('analyzer-results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function clearPreloadedPaper() {
    clearPreload()
    setLocalExamContent(null)
    setLocalExamTitle(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScanSearch className="size-7 text-emerald-700 dark:text-emerald-400" />
            Pattern Analyzer
          </h1>
          <p className="text-muted-foreground mt-1">
            Paste any exam paper — or load one from the Question Bank — and the LAYA engine surfaces patterns in seconds.
          </p>
        </div>
      </div>

      {localExamContent && localExamTitle && (
        <Card className="border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="size-4 text-emerald-700 dark:text-emerald-400" />
              <span className="font-medium">Loaded from Question Bank:</span>
              <span className="text-muted-foreground">{localExamTitle}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={clearPreloadedPaper} className="gap-1 h-7">
              <X className="size-3" />
              Clear
            </Button>
          </CardContent>
        </Card>
      )}

      <ExamInputWrapper
        onAnalyze={handleAnalyze}
        loading={loading}
        preloadedContent={localExamContent}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div id="analyzer-results-anchor" className="scroll-mt-20">
        {loading && <ResultsSkeleton />}
        {result && !loading && <ResultsDashboard result={result} />}
      </div>
    </div>
  )
}

/**
 * Wraps the existing ExamInput component to optionally inject preloaded
 * content (when the user arrives from the Question Bank with a paper selected).
 */
function ExamInputWrapper({
  onAnalyze,
  loading,
  preloadedContent,
}: {
  onAnalyze: (input: { examContent: string; bookContent?: string; focus?: string }) => void
  loading: boolean
  preloadedContent: string | null
}) {
  return (
    <ExamInput
      onAnalyze={onAnalyze}
      loading={loading}
      preloadedContent={preloadedContent ?? undefined}
    />
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
