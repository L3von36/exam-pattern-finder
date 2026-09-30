// Zustand store for the dashboard's current view + navigation.
import { create } from 'zustand'

export type DashboardView = 'overview' | 'analyzer' | 'question-bank' | 'patterns' | 'downloads'

type DashboardState = {
  view: DashboardView
  /** When the user clicks "Analyze this exam" in the question bank,
   * we prefill the analyzer with this exam's content and switch view. */
  preloadedExamContent: string | null
  preloadedExamTitle: string | null
  setView: (v: DashboardView) => void
  loadExamIntoAnalyzer: (content: string, title: string) => void
  clearPreload: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  view: 'overview',
  preloadedExamContent: null,
  preloadedExamTitle: null,
  setView: (view) => set({ view }),
  loadExamIntoAnalyzer: (content, title) =>
    set({
      preloadedExamContent: content,
      preloadedExamTitle: title,
      view: 'analyzer',
    }),
  clearPreload: () => set({ preloadedExamContent: null, preloadedExamTitle: null }),
}))
