'use client'

import { useDashboardStore } from '@/lib/dashboard-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { ScanSearch, Library, Target, Download, ArrowRight, Brain, TrendingUp, FileText } from 'lucide-react'

type ExamList = {
  ok: boolean
  total: number
  exams: Array<{
    id: string
    subject: string
    title: string
    year: string
    version: string
    sizeKb: number
  }>
}

export function OverviewView() {
  const { setView } = useDashboardStore()

  const { data: examData } = useQuery<ExamList>({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then((r) => r.json()),
    staleTime: 60_000,
  })

  const totalExams = examData?.total ?? 0
  const subjects = new Set(examData?.exams?.map((e) => e.subject) ?? [])
  const years = new Set(examData?.exams?.map((e) => e.year) ?? [])
  const totalKb =
    examData?.exams?.reduce((acc, e) => acc + e.sizeKb, 0) ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Ethiopian Grade 12 national exam pattern intelligence, sourced from temari.et
          </p>
        </div>
        <Button onClick={() => setView('analyzer')} className="bg-emerald-700 hover:bg-emerald-800 gap-2">
          <ScanSearch className="size-4" />
          Analyze a paper
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="size-5" />}
          label="Scraped exams"
          value={String(totalExams)}
          color="emerald"
        />
        <StatCard
          icon={<Library className="size-5" />}
          label="Subjects covered"
          value={String(subjects.size)}
          color="amber"
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Years of past papers"
          value={String(years.size)}
          color="violet"
        />
        <StatCard
          icon={<Brain className="size-5" />}
          label="Total text mined"
          value={`${(totalKb / 1024).toFixed(1)} MB`}
          color="sky"
        />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          icon={<ScanSearch className="size-5" />}
          title="Pattern Analyzer"
          description="Paste any exam paper and let the LAYA engine surface topics, question types, difficulty, recurring patterns, and predictions."
          onClick={() => setView('analyzer')}
          cta="Open analyzer"
        />
        <QuickActionCard
          icon={<Library className="size-5" />}
          title="Question Bank"
          description="Browse real scraped Ethiopian Grade 12 papers, organised by subject and year. Load any paper into the analyzer in one click."
          onClick={() => setView('question-bank')}
          cta="Browse question bank"
        />
        <QuickActionCard
          icon={<Target className="size-5" />}
          title="Patterns Library"
          description="Aggregated patterns observed across multiple scraped papers. Spot which topics recur year after year."
          onClick={() => setView('patterns')}
          cta="See cross-paper patterns"
        />
        <QuickActionCard
          icon={<Download className="size-5" />}
          title="Downloads"
          description="Download a zip of every scraped exam paper, plus the analysis engine source code."
          onClick={() => setView('downloads')}
          cta="View downloads"
        />
      </div>

      {/* Recent exams preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recently scraped</CardTitle>
            <CardDescription>Latest papers pulled from temari.et</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setView('question-bank')} className="gap-1">
            View all
            <ArrowRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {totalExams === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
              No scraped papers yet. Run the scraper to populate the question bank.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(examData?.exams ?? []).slice(0, 6).map((exam) => (
                <div key={exam.id} className="p-3 rounded-lg border bg-card space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {exam.subject}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{exam.year} EC</span>
                  </div>
                  <p className="text-sm font-medium leading-snug line-clamp-2">{exam.title}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{exam.version}</span>
                    <span>{exam.sizeKb} KB</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'emerald' | 'amber' | 'violet' | 'sky'
}) {
  const colorMap = {
    emerald: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30',
    amber: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
    violet: 'text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30',
    sky: 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30',
  }
  return (
    <Card className="border-2">
      <CardContent className="p-5">
        <div className={`size-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  cta,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  cta: string
}) {
  return (
    <Card className="border-2 hover:shadow-md transition-shadow cursor-pointer group" onClick={onClick}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">{description}</p>
        </div>
        <div className="text-xs font-medium text-primary">{cta}</div>
      </CardContent>
    </Card>
  )
}
