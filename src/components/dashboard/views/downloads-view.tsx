'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { Download, FileArchive, FileText, Github, ExternalLink, Loader2, Package, FolderTree } from 'lucide-react'

type ExamList = {
  ok: boolean
  total: number
  exams: Array<{ id: string; subject: string; title: string; sizeKb: number; year: string }>
}

export function DownloadsView() {
  const { data, isLoading } = useQuery<ExamList>({
    queryKey: ['exams'],
    queryFn: () => fetch('/api/exams').then((r) => r.json()),
    staleTime: 60_000,
  })

  const totalKb = data?.exams?.reduce((acc, e) => acc + e.sizeKb, 0) ?? 0
  const subjects = new Set(data?.exams?.map((e) => e.subject) ?? [])
  const years = new Set(data?.exams?.map((e) => e.year) ?? [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Download className="size-7 text-emerald-700 dark:text-emerald-400" />
          Downloads
        </h1>
        <p className="text-muted-foreground mt-1">
          Grab the scraped Ethiopian exam archive, the source code, or both.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Scraped exams zip */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="size-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-2">
                <FileArchive className="size-6 text-emerald-700 dark:text-emerald-400" />
              </div>
              <Badge variant="secondary">Dataset</Badge>
            </div>
            <CardTitle className="text-xl">Ethiopian Exam Archive</CardTitle>
            <CardDescription>
              All scraped Grade 12 exam papers (text-extracted), organised by subject.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Papers" value={data?.total ?? 0} />
              <Stat label="Subjects" value={subjects.size} />
              <Stat label="Years" value={years.size} />
            </div>
            <div className="text-xs text-muted-foreground">
              Total size: <span className="font-medium text-foreground">{(totalKb / 1024).toFixed(2)} MB</span> of text content
            </div>
            <Button
              className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800"
              disabled={isLoading || !data?.total}
              asChild
            >
              {isLoading ? (
                <span>
                  <Loader2 className="size-4 animate-spin" />
                  Preparing...
                </span>
              ) : (
                <a href="/downloads/ethiopian-exams.zip" download>
                  <Download className="size-4" />
                  Download .zip archive
                </a>
              )}
            </Button>
            {data?.total === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Archive will be empty until the scraper has run.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Source code zip */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="size-12 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-2">
                <Package className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <Badge variant="secondary">Source code</Badge>
            </div>
            <CardTitle className="text-xl">Project Source Code</CardTitle>
            <CardDescription>
              Full Next.js 16 + TypeScript source for the dashboard, analyzer, and scraper.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <FolderTree className="size-3" />
                <code className="bg-muted px-1 py-0.5 rounded">src/components/dashboard</code>
                <span>— sidebar, views, routing</span>
              </li>
              <li className="flex items-center gap-2">
                <FolderTree className="size-3" />
                <code className="bg-muted px-1 py-0.5 rounded">src/lib/exam-analyzer.ts</code>
                <span>— LAYA pattern engine</span>
              </li>
              <li className="flex items-center gap-2">
                <FolderTree className="size-3" />
                <code className="bg-muted px-1 py-0.5 rounded">scripts/temari-scraper.py</code>
                <span>— the scraper script</span>
              </li>
            </ul>
            <Button asChild className="w-full gap-2" variant="outline">
              <a
                href="https://github.com/L3von36/exam-pattern-finder"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                View on GitHub
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* What's in the zip */}
      {data && data.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5 text-emerald-700 dark:text-emerald-400" />
              What&apos;s inside the zip
            </CardTitle>
            <CardDescription>The archive is organised by subject folder, each containing <code>.txt</code> files of the extracted exam content.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(new Set(data.exams.map((e) => e.subject))).sort().map((subject) => {
                const papers = data.exams.filter((e) => e.subject === subject)
                return (
                  <div key={subject} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{subject}</span>
                      <Badge variant="outline" className="text-xs">
                        {papers.length} papers
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {papers.map((p) => p.year).filter((y, i, arr) => arr.indexOf(y) === i).sort().join(', ')} EC
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}
