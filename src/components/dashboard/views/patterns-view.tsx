'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/lib/dashboard-store'
import { Target, Loader2, FileText, ScanSearch, Library, ArrowRight, Lightbulb } from 'lucide-react'

type Exam = {
  id: string
  subject: string
  title: string
  year: string
  version: string
  sizeKb: number
  contentPreview: string
}
type ExamList = { ok: boolean; total: number; exams: Exam[] }

export function PatternsView() {
  const { setView, loadExamIntoAnalyzer } = useDashboardStore()

  const { data: examData, isLoading } = useQuery<ExamList>({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then((r) => r.json()),
    staleTime: 60_000,
  })

  const exams = examData?.exams ?? []
  // Group by subject
  const bySubject = new Map<string, Exam[]>()
  for (const e of exams) {
    if (!bySubject.has(e.subject)) bySubject.set(e.subject, [])
    bySubject.get(e.subject)!.push(e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Target className="size-7 text-emerald-700 dark:text-emerald-400" />
          Patterns Library
        </h1>
        <p className="text-muted-foreground mt-1">
          Aggregated patterns observed across the scraped Ethiopian papers. Pick any paper to dive deeper with the analyzer.
        </p>
      </div>

      {isLoading && (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && exams.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="size-12 mx-auto text-muted-foreground mb-3 opacity-40" />
            <h3 className="font-semibold mb-1">No papers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once papers are scraped from temari.et, this view will surface the cross-paper patterns.
            </p>
            <Button onClick={() => setView('question-bank')} className="gap-1">
              <Library className="size-4" />
              Go to Question Bank
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && exams.length > 0 && (
        <>
          {/* Subject overview cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(bySubject.entries()).map(([subject, papers]) => (
              <Card key={subject} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{subject}</CardTitle>
                    <Badge variant="secondary">{papers.length}</Badge>
                  </div>
                  <CardDescription>
                    {new Set(papers.map((p) => p.year)).size} years covered
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {papers.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => loadExamIntoAnalyzer(p.contentPreview + '...', p.title)}
                      className="w-full text-left p-2 rounded-md hover:bg-accent text-xs flex items-center justify-between gap-2 group"
                    >
                      <span className="line-clamp-1 flex-1">
                        {p.title}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {p.year} EC
                      </span>
                    </button>
                  ))}
                  {papers.length > 3 && (
                    <p className="text-xs text-muted-foreground pt-1">
                      +{papers.length - 3} more...
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Insight prompt */}
          <Card className="border-2 border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="size-5 text-amber-600 dark:text-amber-400" />
                How to use this library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                The LAYA exam-pattern engine surfaces recurring topics, question-type mixes, difficulty weighting,
                and predicted focus areas for any single paper. To find patterns that span multiple years:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-foreground">
                <li>Pick a subject above and click any paper.</li>
                <li>The analyzer opens with that paper pre-loaded — click <span className="font-medium">Find Patterns</span>.</li>
                <li>Switch back to the Question Bank and load the same subject from a different year.</li>
                <li>Compare the <span className="font-medium">Predicted Focus</span> tab — topics that appear across multiple years are the ones to drill into.</li>
              </ol>
              <div className="pt-2">
                <Button onClick={() => setView('analyzer')} size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800">
                  <ScanSearch className="size-4" />
                  Open analyzer
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
