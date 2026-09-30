'use client'

import { useDashboardStore, type DashboardView } from '@/lib/dashboard-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ScanSearch,
  Library,
  Target,
  Download,
  Brain,
} from 'lucide-react'

type NavItem = {
  id: DashboardView
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'analyzer', label: 'Pattern Analyzer', icon: ScanSearch },
  { id: 'question-bank', label: 'Question Bank', icon: Library },
  { id: 'patterns', label: 'Patterns Library', icon: Target },
  { id: 'downloads', label: 'Downloads', icon: Download },
]

export function SidebarNav() {
  const { view, setView } = useDashboardStore()

  return (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
      <div className="px-2 py-2 mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Workspace
        </p>
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = view === item.id
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-emerald-700 text-white hover:bg-emerald-800 hover:text-white'
            )}
          >
            <Icon className="size-4 flex-shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        )
      })}

      <div className="mt-6 pt-4 border-t">
        <div className="px-2 py-2 mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Source
          </p>
        </div>
        <a
          href="https://temari.et"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Brain className="size-4 flex-shrink-0" />
          <span>temari.et</span>
        </a>
        <a
          href="https://huggingface.co/convaiinnovations/laya"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Brain className="size-4 flex-shrink-0" />
          <span>convaiinnovations/laya</span>
        </a>
      </div>
    </nav>
  )
}
