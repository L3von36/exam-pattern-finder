'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/lib/dashboard-store'
import { Search, Library, Loader2, FileText, ScanSearch, Eye, X } from 'lucide-react'

type Exam = {
  id: string
  subject: string
  title: string
  filename: string
  year: string
  version: string
  sizeKb: number
  contentPreview: string
}

type ExamList = { ok: boolean; total: number; exams: Exam[] }
type ExamDetail = { ok: boolean; id: string; subject: string; title: string; content: string; size: number }

export function QuestionBankView() {
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { loadExamIntoAnalyzer } = useDashboardStore()

  const { data: examData, isLoading: listLoading } = useQuery<ExamList>({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then((r) => r.json()),
    staleTime: 60_000,
  })

  const { data: selectedExam, isLoading: detailLoading } = useQuery<ExamDetail>({
    queryKey: ['exam', selectedId],
    queryFn: () => fetch(`/api/exams/${selectedId}`).then((r) => r.json()),
    enabled: !!selectedId,
    staleTime: 5 * 60_000,
  })

  const subjects = useMemo(
    () => Array.from(new Set(examData?.exams?.map((e) => e.subject) ?? [])).sort(),
    [examData]
  )
  const years = useMemo(
    () => Array.from(new Set(examData?.exams?.map((e) => e.year) ?? [])).sort().reverse(),
    [examData]
  )

  const filtered = useMemo(() => {
    const list = examData?.exams ?? []
    return list.filter((e) => {
      if (subjectFilter !== 'all' && e.subject !== subjectFilter) return false
      if (yearFilter !== 'all' && e.year !== yearFilter) return false
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [examData, search, subjectFilter, yearFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Library className="size-7 text-emerald-700 dark:text-emerald-400" />
          Question Bank
        </h1>
        <p className="text-muted-foreground mt-1">
          {examData ? `${examData.total} scraped Ethiopian Grade 12 exam papers from temari.et` : 'Loading...'}.
          Click any paper to preview its content, or load it directly into the analyzer.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search papers by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y} EC</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List + detail split */}
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Papers ({filtered.length})</span>
              {listLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] px-3 pb-3">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {listLoading ? 'Loading papers...' : 'No papers match your filters.'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => setSelectedId(exam.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                        selectedId === exam.id
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {exam.subject}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {exam.year} EC · {exam.sizeKb} KB
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {exam.title}
                      </p>
                      {exam.version !== 'main' && (
                        <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                          {exam.version}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-emerald-700 dark:text-emerald-400" />
                {selectedExam ? selectedExam.title : 'Select a paper to preview'}
              </CardTitle>
              <CardDescription>
                {selectedExam
                  ? `${selectedExam.subject} · ${selectedExam.size.toLocaleString()} characters`
                  : 'Click any paper on the left to preview its content here.'}
              </CardDescription>
            </div>
            {selectedExam && (
              <Button
                size="sm"
                onClick={() => loadExamIntoAnalyzer(selectedExam.content, selectedExam.title)}
                className="gap-1 bg-emerald-700 hover:bg-emerald-800"
              >
                <ScanSearch className="size-4" />
                Analyze this paper
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedId && (
              <div className="h-[500px] flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed rounded-lg p-6">
                <Eye className="size-10 mb-3 opacity-40" />
                <p className="text-sm">Pick a paper on the left to see its full text here.</p>
              </div>
            )}
            {selectedId && detailLoading && (
              <div className="h-[500px] flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {selectedExam && (
              <ScrollArea className="h-[500px] rounded-lg border p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedExam.content}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
