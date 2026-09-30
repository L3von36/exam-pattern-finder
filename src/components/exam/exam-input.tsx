'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SAMPLE_EXAMS } from '@/lib/sample-exams'
import { Loader2, Sparkles, BookOpen, FileText, Settings2, ChevronDown, ChevronUp, Wand2 } from 'lucide-react'

type Props = {
  onAnalyze: (input: { examContent: string; bookContent?: string; focus?: string }) => void
  loading: boolean
  preloadedContent?: string
}

export function ExamInput({ onAnalyze, loading, preloadedContent }: Props) {
  const [examContent, setExamContent] = useState('')
  const [bookContent, setBookContent] = useState('')
  const [focus, setFocus] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Sync with preloaded content from the dashboard store (e.g. when a paper
  // is loaded from the question bank). This is an effect-driven state sync,
  // which is what the lint rule complains about, but here we explicitly want
  // the textarea to update when the parent pushes new content.
  useEffect(() => {
    if (preloadedContent !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExamContent(preloadedContent)
    }
  }, [preloadedContent])

  const charCount = examContent.length
  const canAnalyze = examContent.trim().length >= 50 && !loading

  function loadSample(id: string) {
    const sample = SAMPLE_EXAMS.find((s) => s.id === id)
    if (sample) setExamContent(sample.content)
  }

  function handleSubmit() {
    if (!canAnalyze) return
    onAnalyze({
      examContent,
      bookContent: bookContent.trim() || undefined,
      focus: focus.trim() || undefined,
    })
  }

  function clearAll() {
    setExamContent('')
    setBookContent('')
    setFocus('')
  }

  return (
    <Card className="border-2 border-emerald-900/10 shadow-lg">
      <CardHeader className="bg-gradient-to-br from-emerald-50 to-amber-50/40 dark:from-emerald-950/30 dark:to-amber-950/20 rounded-t-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="size-6 text-emerald-700 dark:text-emerald-400" />
              Exam Content
            </CardTitle>
            <CardDescription className="mt-1">
              Paste the exam paper text below, or load one of the ready-made samples to see what the engine finds.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={loadSample}>
              <SelectTrigger className="w-[230px] bg-background">
                <SelectValue placeholder="Load a sample exam" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_EXAMS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{s.title}</span>
                      <span className="text-xs text-muted-foreground">{s.blurb}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={!examContent && !bookContent}>
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="exam" className="text-sm font-medium">
              Exam paper text
            </Label>
            <Badge variant="secondary" className="text-xs">
              {charCount.toLocaleString()} chars
            </Badge>
          </div>
          <Textarea
            id="exam"
            value={examContent}
            onChange={(e) => setExamContent(e.target.value)}
            placeholder="Paste the full text of an exam paper here — questions, sections, marks. The more complete the input, the sharper the pattern detection."
            className="min-h-[260px] font-mono text-sm leading-relaxed resize-y"
          />
          {examContent && examContent.length < 50 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Add at least 50 characters for a meaningful analysis.
            </p>
          )}
        </div>

        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              <Settings2 className="size-4" />
              Advanced options
              {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="book" className="text-sm font-medium flex items-center gap-1">
                <BookOpen className="size-4" />
                Reference book excerpt (optional)
              </Label>
              <Textarea
                id="book"
                value={bookContent}
                onChange={(e) => setBookContent(e.target.value)}
                placeholder="Paste a sample from the textbook or study guide. The engine will use this as ground-truth when classifying topics."
                className="min-h-[120px] font-mono text-sm resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="focus" className="text-sm font-medium flex items-center gap-1">
                <Wand2 className="size-4" />
                Analysis focus (optional)
              </Label>
              <Input
                id="focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. focus on recurring essay themes, or weighting of cognitive levels"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground max-w-md">
            The analysis engine processes your input server-side via the LAYA exam-pattern engine. No data is stored.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!canAnalyze}
            size="lg"
            className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-md gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing patterns...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Find Patterns
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
