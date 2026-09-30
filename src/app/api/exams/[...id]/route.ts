// Returns the full text content of a single scraped exam paper.
// Path: /api/exams/[id] where id is "<Subject>/<filename-without-extension>"
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const ROOT = '/home/z/my-project/scripts/temari-papers'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string[] }> }) {
  try {
    const { id } = await ctx.params
    // id is an array of path segments
    const segments = Array.isArray(id) ? id : [id as string]
    // Last segment is the file basename, the rest form the subject folder
    // Pattern: <Subject>/<fileBaseName>
    if (segments.length < 2) {
      return NextResponse.json({ error: 'Invalid exam id' }, { status: 400 })
    }
    const subject = segments[0]
    const baseName = segments[segments.length - 1]
    const fullPath = path.join(ROOT, subject, `${baseName}.txt`)

    // Security: ensure resolved path is still under ROOT
    const resolved = path.resolve(fullPath)
    if (!resolved.startsWith(ROOT)) {
      return NextResponse.json({ error: 'Forbidden path' }, { status: 403 })
    }

    const content = await fs.readFile(resolved, 'utf-8')
    return NextResponse.json({
      ok: true,
      id: `${subject}/${baseName}`,
      subject,
      title: baseName.replace(/_/g, ' '),
      content,
      size: content.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json({ error: 'Exam not found: ' + message }, { status: 404 })
  }
}
