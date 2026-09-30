import { NextRequest, NextResponse } from 'next/server'
import { analyzeExamPatterns } from '@/lib/exam-analyzer'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const examContent = (body?.examContent ?? '').toString().trim()
    const bookContent = (body?.bookContent ?? '').toString().trim()
    const focus = (body?.focus ?? '').toString().trim()

    if (!examContent) {
      return NextResponse.json(
        { error: 'examContent is required.' },
        { status: 400 }
      )
    }
    if (examContent.length < 50) {
      return NextResponse.json(
        { error: 'Exam content is too short (minimum 50 characters) for a meaningful pattern analysis.' },
        { status: 400 }
      )
    }

    const result = await analyzeExamPatterns({
      examContent,
      bookContent: bookContent || undefined,
      focus: focus || undefined,
    })

    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[analyze] error:', message)
    return NextResponse.json(
      { error: 'Analysis failed. ' + message },
      { status: 500 }
    )
  }
}
