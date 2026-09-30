// Lists all scraped Ethiopian exam papers as a structured catalogue.
// Reads the scraped files from /home/z/my-project/scripts/temari-papers/.
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const ROOT = '/home/z/my-project/scripts/temari-papers'

export type ScrapedExam = {
  id: string
  subject: string
  title: string
  filename: string
  year: string
  version: string
  sizeKb: number
  contentPreview: string
}

function parseMetadata(filename: string): { subject: string; year: string; version: string } {
  // Example: Aptitude_2018_EC_entrance_exam_version_1_627
  const base = filename.replace(/\.txt$/, '')
  const subject = base.split('_')[0] || 'Unknown'
  const yearMatch = base.match(/(\d{4})_EC/)
  const year = yearMatch ? yearMatch[1] : 'unknown'
  const versionMatch = base.match(/version_(\d+)/)
  const roundMatch = base.match(/round_(\d+)/)
  const version = versionMatch
    ? `v${versionMatch[1]}`
    : roundMatch
    ? `r${roundMatch[1]}`
    : 'main'
  return { subject, year, version }
}

export async function GET() {
  try {
    const subjects = await fs.readdir(ROOT)
    const exams: ScrapedExam[] = []

    for (const subj of subjects) {
      const subjPath = path.join(ROOT, subj)
      const stat = await fs.stat(subjPath).catch(() => null)
      if (!stat || !stat.isDirectory()) continue

      const files = await fs.readdir(subjPath)
      for (const file of files) {
        if (!file.endsWith('.txt')) continue
        const fullPath = path.join(subjPath, file)
        const fileStat = await fs.stat(fullPath).catch(() => null)
        if (!fileStat) continue
        const meta = parseMetadata(file)
        const id = `${subj}/${file.replace(/\.txt$/, '')}`
        // Read first 300 chars as preview
        const content = await fs.readFile(fullPath, 'utf-8')
        const preview = content.slice(0, 300).replace(/\s+/g, ' ').trim()
        exams.push({
          id,
          subject: subj,
          title: file.replace(/\.txt$/, '').replace(/_/g, ' '),
          filename: file,
          year: meta.year,
          version: meta.version,
          sizeKb: Math.round(fileStat.size / 1024),
          contentPreview: preview,
        })
      }
    }

    // Sort: subject alphabetical, then year desc, then version
    exams.sort((a, b) =>
      a.subject.localeCompare(b.subject) ||
      b.year.localeCompare(a.year) ||
      a.version.localeCompare(b.version)
    )

    return NextResponse.json({ ok: true, total: exams.length, exams })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json(
      { ok: false, error: 'Failed to list scraped exams: ' + message, total: 0, exams: [] },
      { status: 200 } // return 200 with empty list so the UI doesn't crash
    )
  }
}
