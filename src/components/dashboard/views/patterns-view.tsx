'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/lib/dashboard-store'
import { Target, Loader2, Library, FileText, ScanSearch, ChevronRight } from 'lucide-react'

type TopicYearCount = { year: string; count: number; total: number }
type Topic = { topic: string; yearCounts: TopicYearCount[]; totalPapers: number }
type SubjectMatrix = { subject: string; years: string[]; topics: Topic[] }
type PatternData = { ok: boolean; totalSubjects: number; subjects: SubjectMatrix[] }

export function PatternsView() {
  const { setView, loadExamIntoAnalyzer } = useDashboardStore()
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  const { data, isLoading } = useQuery<PatternData>({
    queryKey: ['patterns'],
    queryFn: () => fetch('/api/patterns').then((r) => r.json()),
    staleTime: 5 * 60_000, // 5 min — the data only changes when papers are re-scraped
  })

  const subjects = data?.subjects ?? []
  const filteredSubjects = selectedSubject === 'all'
    ? subjects
    : subjects.filter((s) => s.subject === selectedSubject)

  // Compute global max for heatmap intensity scaling
  const maxCount = Math.max(
    1,
    ...subjects.flatMap((s) => s.topics.flatMap((t) => t.yearCounts.map((yc) => yc.count)))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="size-7 text-emerald-700 dark:text-emerald-400" />
            Patterns Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Topic coverage across {data?.totalSubjects ?? 0} subjects × multiple years of Ethiopian Grade 12 exam papers.
            Darker cells = more papers in that year covered the topic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects ({subjects.length})</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.subject} value={s.subject}>
                  {s.subject} ({s.topics[0]?.yearCounts.reduce((a, yc) => a + yc.total, 0) ?? 0} papers)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Analyzing 214 papers for topic patterns...</span>
        </div>
      )}

      {!isLoading && subjects.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="size-12 mx-auto text-muted-foreground mb-3 opacity-40" />
            <h3 className="font-semibold mb-1">No papers analyzed yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once papers are scraped from temari.et, this view shows which topics recur year after year.
            </p>
            <Button onClick={() => setView('question-bank')} className="gap-1">
              <Library className="size-4" />
              Go to Question Bank
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredSubjects.length > 0 && (
        <>
          {/* Quick-action banner */}
          <Card className="border-2 border-emerald-300/50 bg-emerald-50/30 dark:bg-emerald-950/10">
            <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <span className="font-medium">How to read this:</span>{' '}
                <span className="text-muted-foreground">
                  Each row is a topic, each column is a year. The cell shows how many of that year&apos;s papers covered the topic.
                  Click any cell to load the first matching paper into the analyzer.
                </span>
              </div>
              <Button onClick={() => setView('analyzer')} size="sm" variant="outline" className="gap-1">
                <ScanSearch className="size-4" />
                Open analyzer
              </Button>
            </CardContent>
          </Card>

          {/* Subject heatmaps */}
          {filteredSubjects.map((subject) => (
            <SubjectHeatmap
              key={subject.subject}
              subject={subject}
              maxCount={maxCount}
              onAnalyze={(content) => loadExamIntoAnalyzer(content, `${subject.subject} paper`)}
            />
          ))}
        </>
      )}
    </div>
  )
}

function SubjectHeatmap({
  subject,
  maxCount,
  onAnalyze,
}: {
  subject: SubjectMatrix
  maxCount: number
  onAnalyze: (content: string) => void
}) {
  // Sort topics by totalPapers descending (most-covered topics first)
  const sortedTopics = [...subject.topics].sort((a, b) => b.totalPapers - a.totalPapers)
  const totalPapersInSubject = subject.topics[0]?.yearCounts.reduce((a, yc) => a + yc.total, 0) ?? 0

  // Color scale: 0 → very light, maxCount → strong emerald
  function cellColor(count: number, total: number): string {
    if (count === 0 || total === 0) return 'transparent'
    const intensity = count / maxCount
    // Use emerald-100 (lightest) → emerald-700 (darkest)
    if (intensity > 0.75) return 'bg-emerald-700 text-white'
    if (intensity > 0.5) return 'bg-emerald-600 text-white'
    if (intensity > 0.35) return 'bg-emerald-500 text-white'
    if (intensity > 0.2) return 'bg-emerald-400 text-emerald-950'
    if (intensity > 0.1) return 'bg-emerald-300 text-emerald-950'
    if (intensity > 0.05) return 'bg-emerald-200 text-emerald-950'
    return 'bg-emerald-100 text-emerald-950'
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {subject.subject}
              <Badge variant="outline" className="text-xs">
                {totalPapersInSubject} papers
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {subject.years.length} years of past papers ({subject.years[0]}–{subject.years[subject.years.length - 1]} E.C.)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 font-medium sticky left-0 bg-inherit">
                  Topic
                </th>
                {subject.years.map((year) => (
                  <th key={year} className="text-center p-2 font-medium min-w-[60px]">
                    {year}
                  </th>
                ))}
                <th className="text-center p-2 font-medium bg-muted/50">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTopics.map((topic) => (
                <tr key={topic.topic} className="border-b last:border-b-0 hover:bg-accent/20">
                  <td className="p-2 font-medium sticky left-0 bg-inherit">
                    {topic.topic}
                  </td>
                  {topic.yearCounts.map((yc) => {
                    const cellClass = cellColor(yc.count, yc.total)
                    return (
                      <td key={yc.year} className="p-1 text-center">
                        <button
                          disabled={yc.count === 0}
                          onClick={() => onAnalyze(`Searching for ${topic.topic} papers from ${yc.year} E.C. — load one from the Question Bank filtered to ${subject.subject} ${yc.year} E.C.`)}
                          className={`size-9 rounded-md flex items-center justify-center text-xs font-medium transition-all ${cellClass} ${
                            yc.count > 0 ? 'hover:ring-2 hover:ring-emerald-700 cursor-pointer' : 'cursor-default'
                          }`}
                          title={`${yc.count} of ${yc.total} papers in ${yc.year} E.C. mention ${topic.topic}`}
                        >
                          {yc.count > 0 ? yc.count : '·'}
                        </button>
                      </td>
                    )
                  })}
                  <td className="p-2 text-center bg-muted/30 font-semibold">
                    {topic.totalPapers}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Intensity:</span>
            <div className="flex items-center gap-1">
              <div className="size-4 rounded bg-emerald-100" />
              <div className="size-4 rounded bg-emerald-300" />
              <div className="size-4 rounded bg-emerald-500" />
              <div className="size-4 rounded bg-emerald-700" />
            </div>
            <span>→ more papers covered this topic</span>
          </div>
          <Button
            onClick={() => onAnalyze(`Load a paper from the Question Bank — filter to ${subject.subject}.`)}
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            Browse {subject.subject} papers
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
