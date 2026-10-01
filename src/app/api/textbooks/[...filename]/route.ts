// Returns the first ~12,000 characters of a textbook's extracted text.
// Used by the analyzer's "Reference book excerpt" field when a user selects a textbook.
//
// The 12 KB limit keeps the LLM prompt small enough to analyze alongside an exam paper
// (~12 KB book + ~40 KB exam = ~52 KB, well within context limits).
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const ROOT = '/home/z/my-project/scripts/temari-books-txt'
const MAX_CHARS = 12_000

export async function GET(_req: NextRequest, ctx: { params: Promise<{ filename: string[] }> }) {
  try {
    const { filename } = await ctx.params
    const segments = Array.isArray(filename) ? filename : [filename as string]
    if (segments.length < 2) {
      return NextResponse.json({ error: 'Invalid textbook id' }, { status: 400 })
    }
    const grade = segments[0]
    const base = segments[segments.length - 1]
    const fullPath = path.join(ROOT, grade, `${base}.txt`)

    // Security: ensure resolved path is still under ROOT
    const resolved = path.resolve(fullPath)
    if (!resolved.startsWith(ROOT)) {
      return NextResponse.json({ error: 'Forbidden path' }, { status: 403 })
    }

    const content = await fs.readFile(resolved, 'utf-8')
    // Take the first MAX_CHARS, but try to break at a paragraph or sentence boundary
    let excerpt = content.slice(0, MAX_CHARS)
    // Try to end at a paragraph break (double newline) within the last 1000 chars
    const lastPara = excerpt.lastIndexOf('\n\n', excerpt.length - 200)
    if (lastPara > MAX_CHARS * 0.8) {
      excerpt = excerpt.slice(0, lastPara)
    }
    return NextResponse.json({
      ok: true,
      id: `${grade}/${base}`,
      content: excerpt,
      totalChars: content.length,
      excerptChars: excerpt.length,
      truncated: content.length > excerpt.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: 'Textbook not found: ' + message }, { status: 404 })
  }
}
