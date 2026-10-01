// Lists all available textbooks (with metadata) for the analyzer's book-content dropdown.
// Reads from /home/z/my-project/scripts/temari-books-txt/ (pre-extracted text versions).
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const ROOT = '/home/z/my-project/scripts/temari-books-txt'

export type TextbookMeta = {
  id: string
  filename: string
  subject: string
  grade: 'Grade 11' | 'Grade 12'
  curriculum: 'current' | 'old'
  sizeKb: number
  pdfSizeMb: number
  hasGoodExtraction: boolean
}

const PDF_SIZES: Record<string, number> = {
  'biology__grade_11': 39,
  'chemistry__grade_11': 9,
  'english__grade_11': 140,
  'mathematics__grade_11_old_curriculum': 220,
  'physics__grade_11_old_curriculum': 93,
  'civics__ethical_education__grade_11_old_curriculum': 6,
  'biology__grade_12': 173,
  'chemistry__grade_12': 8,
  'english__grade_12': 16,
  'mathematics__grade_12': 118,
  'physics__grade_12': 11,
  'civics__ethical_education__grade_12_old_curriculum': 3,
}

function parseMeta(filename: string): Omit<TextbookMeta, 'id' | 'sizeKb' | 'hasGoodExtraction'> {
  const base = filename.replace(/\.txt$/, '')
  const isOld = base.includes('old_curriculum')
  const grade = base.includes('grade_11') ? 'Grade 11' : 'Grade 12'
  const subject = base
    .replace(/__grade_\d+.*$/, '')
    .replace(/_/g, ' ')
    .replace(/\bold curriculum\b/i, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace('Civics  Ethical Education', 'Civics & Ethical Education')
  return {
    filename: base,
    subject,
    grade,
    curriculum: isOld ? 'old' : 'current',
    pdfSizeMb: PDF_SIZES[base] ?? 0,
  }
}

export async function GET() {
  try {
    const textbooks: TextbookMeta[] = []
    for (const gradeDir of ['Grade_11', 'Grade_12']) {
      const dir = path.join(ROOT, gradeDir)
      const stat = await fs.stat(dir).catch(() => null)
      if (!stat || !stat.isDirectory()) continue
      const files = await fs.readdir(dir)
      for (const file of files) {
        if (!file.endsWith('.txt')) continue
        const fullPath = path.join(dir, file)
        const fileStat = await fs.stat(fullPath)
        const meta = parseMeta(file)
        // Treat files < 50 KB as "poor extraction" (scanned PDFs that need OCR)
        const hasGoodExtraction = fileStat.size > 50_000
        textbooks.push({
          id: `${gradeDir}/${file.replace(/\.txt$/, '')}`,
          ...meta,
          sizeKb: Math.round(fileStat.size / 1024),
          hasGoodExtraction,
        })
      }
    }
    // Sort: Grade 12 first, then Grade 11, then alphabetical by subject
    textbooks.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade === 'Grade 12' ? -1 : 1
      return a.subject.localeCompare(b.subject)
    })
    return NextResponse.json({ ok: true, total: textbooks.length, textbooks })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json(
      { ok: false, error: message, total: 0, textbooks: [] },
      { status: 200 }
    )
  }
}
