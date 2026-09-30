'use client'

import { useDashboardStore } from '@/lib/dashboard-store'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { OverviewView } from '@/components/dashboard/views/overview-view'
import { AnalyzerView } from '@/components/dashboard/views/analyzer-view'
import { QuestionBankView } from '@/components/dashboard/views/question-bank-view'
import { PatternsView } from '@/components/dashboard/views/patterns-view'
import { DownloadsView } from '@/components/dashboard/views/downloads-view'
import { Button } from '@/components/ui/button'
import { ScanSearch, Menu, X, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardShell />
    </QueryClientProvider>
  )
}

function DashboardShell() {
  const { view } = useDashboardStore()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/20 via-background to-amber-50/10 dark:from-emerald-950/10 dark:via-background dark:to-amber-950/5">
      {/* Top bar */}
      <header className="border-b sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-600 to-amber-500 flex items-center justify-center text-white">
                <ScanSearch className="size-4" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold text-sm">Exam Pattern Finder</div>
                <div className="text-[11px] text-muted-foreground -mt-0.5">Ethiopian Grade 12 · powered by LAYA</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://huggingface.co/convaiinnovations/laya"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex text-xs text-muted-foreground hover:text-foreground items-center gap-1 transition-colors"
            >
              convaiinnovations/laya
              <ExternalLink className="size-3" />
            </a>
            <a
              href="https://temari.et"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex text-xs text-muted-foreground hover:text-foreground items-center gap-1 transition-colors"
            >
              source: temari.et
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-r bg-background/50 flex-shrink-0">
          <SidebarNav />
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileNavOpen(false)}>
            <aside
              className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold text-sm">Navigation</span>
                <Button variant="ghost" size="sm" onClick={() => setMobileNavOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <SidebarNav />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            {view === 'overview' && <OverviewView />}
            {view === 'analyzer' && <AnalyzerView />}
            {view === 'question-bank' && <QuestionBankView />}
            {view === 'patterns' && <PatternsView />}
            {view === 'downloads' && <DownloadsView />}
          </div>
        </main>
      </div>

      <footer className="border-t mt-auto bg-background/60">
        <div className="container mx-auto px-4 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Exam Pattern Finder</span>
            <span className="text-border">·</span>
            <span>Scraped from temari.et · analyzed with LAYA exam-pattern engine</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/L3von36/exam-pattern-finder"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://huggingface.co/convaiinnovations/laya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              LAYA model
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
