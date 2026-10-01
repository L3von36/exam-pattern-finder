// Aggregates topic keywords across all 214 scraped exam papers, grouped by year.
// Uses simple keyword matching — no LLM needed. Returns a year-over-year matrix
// that the Patterns Library view renders as a heatmap.
//
// Topic keywords are subject-specific (Biology keywords are different from Math keywords).
// A paper "covers" a topic if any of its keywords appear in the paper's text content.
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const ROOT = '/home/z/my-project/scripts/temari-papers'

// Subject-specific topic keywords. Each entry is [topic, [keywords...]].
// A paper covers a topic if ANY keyword matches (case-insensitive).
const TOPIC_KEYWORDS: Record<string, Array<[string, string[]]>> = {
  Biology: [
    ['Cell Biology', ['cell', 'mitochondr', 'nucleus', 'ribosome', 'membrane', 'cytoplasm', 'organelle', 'mitosis', 'meiosis', 'chromosome']],
    ['Genetics', ['gene', 'dna', 'rna', 'heredity', 'mutation', 'allele', 'genotype', 'phenotype', 'mendel']],
    ['Ecology', ['ecosystem', 'population', 'community', 'biotic', 'abiotic', 'food chain', 'trophic', 'biodiversity', 'conservation']],
    ['Human Physiology', ['respiration', 'circulation', 'digestion', 'excretion', 'nervous', 'endocrine', 'immune', 'hormone']],
    ['Plant Biology', ['photosynthesis', 'transpiration', 'xylem', 'phloem', 'stomata', 'root', 'leaf', 'flower', 'pollination']],
    ['Evolution', ['evolution', 'natural selection', 'adaptation', 'species', 'lamarck', 'darwin']],
    ['Biotechnology', ['biotechnology', 'gmo', 'transgenic', 'genetic engineering', 'fermentation', 'microorganism']],
    ['Reproduction', ['reproduction', 'fertilization', 'gamete', 'ovule', 'sperm', 'gestation', 'placenta']],
  ],
  Chemistry: [
    ['Atomic Structure', ['atom', 'proton', 'neutron', 'electron', 'orbital', 'quantum', 'isotope', 'atomic number']],
    ['Chemical Bonding', ['bond', 'ionic', 'covalent', 'metallic', 'molecule', 'lewis', 'octet']],
    ['Stoichiometry', ['mole', 'stoichiometry', 'molar mass', 'avogadro', 'limiting reactant', 'yield']],
    ['Acids & Bases', ['acid', 'base', 'ph', 'indicator', 'titration', 'buffer', 'neutralization']],
    ['Organic Chemistry', ['organic', 'hydrocarbon', 'alkane', 'alkene', 'alcohol', 'polymer', 'functional group']],
    ['Electrochemistry', ['electrochem', 'electrolysis', 'galvanic', 'cell potential', 'oxidation', 'reduction']],
    ['Thermodynamics', ['thermodynam', 'enthalpy', 'entropy', 'exothermic', 'endothermic', 'gibbs']],
    ['Reaction Kinetics', ['kinetic', 'rate of reaction', 'catalyst', 'activation energy', 'equilibrium']],
  ],
  Physics: [
    ['Mechanics', ['motion', 'velocity', 'acceleration', 'force', 'momentum', 'newton', 'friction', 'projectile']],
    ['Electricity & Magnetism', ['electric', 'magnetic', 'current', 'voltage', 'resistance', 'ohm', 'circuit', 'electromagnet']],
    ['Waves & Optics', ['wave', 'light', 'optics', 'reflection', 'refraction', 'lens', 'mirror', 'interference', 'diffraction']],
    ['Thermodynamics', ['thermodynam', 'heat', 'temperature', 'entropy', 'specific heat', 'gas law']],
    ['Modern Physics', ['quantum', 'relativ', 'nuclear', 'radioactiv', 'fission', 'fusion', 'photoelectric']],
    ['Gravitation', ['gravity', 'gravitation', 'kepler', 'orbit', 'planetary']],
    ['Fluid Mechanics', ['fluid', 'pressure', 'buoyancy', 'archimedes', 'bernoulli', 'viscosity']],
    ['Oscillations', ['oscillation', 'simple harmonic', 'pendulum', 'spring', 'frequency', 'amplitude']],
  ],
  Mathematics: [
    ['Algebra', ['equation', 'polynomial', 'factor', 'inequality', 'quadratic', 'linear', 'simultaneous']],
    ['Calculus', ['derivative', 'integral', 'differentiation', 'limit', 'continuity', 'rate of change']],
    ['Trigonometry', ['trigonom', 'sine', 'cosine', 'tangent', 'angle', 'radian', 'identity']],
    ['Geometry', ['geometr', 'triangle', 'circle', 'polygon', 'area', 'volume', 'coordinate']],
    ['Probability', ['probabilit', 'permutation', 'combination', 'random', 'event']],
    ['Statistics', ['statistic', 'mean', 'median', 'mode', 'variance', 'standard deviation', 'distribution']],
    ['Sequence & Series', ['sequence', 'series', 'arithmetic', 'geometric', 'progression', 'sum']],
    ['Complex Numbers', ['complex number', 'imaginary', 'real part', 'modulus', 'argument']],
  ],
  English: [
    ['Grammar', ['grammar', 'tense', 'verb', 'noun', 'adjective', 'adverb', 'preposition', 'conjunction']],
    ['Vocabulary', ['vocabular', 'synonym', 'antonym', 'analogy', 'word choice']],
    ['Reading Comprehension', ['comprehension', 'passage', 'reading', 'main idea', 'inference']],
    ['Writing', ['essay', 'paragraph', 'composition', 'letter writing', 'summary']],
    ['Literature', ['literature', 'poetry', 'poem', 'drama', 'shakespeare', 'figurative']],
    ['Listening', ['listening', 'audio', 'conversation', 'lecture']],
    ['Speaking', ['speaking', 'oral', 'presentation', 'debate']],
  ],
  Aptitude: [
    ['Verbal Reasoning', ['analogy', 'word relation', 'synonym', 'antonym', 'odd one out']],
    ['Numerical Reasoning', ['numerical', 'series', 'sequence', 'arithmetic reasoning']],
    ['Logical Reasoning', ['logical', 'syllogism', 'deduction', 'induction', 'argument']],
    ['Spatial Reasoning', ['spatial', 'shape', 'rotation', 'mirror', 'fold']],
    ['Quantitative Comparison', ['comparison', 'greater than', 'less than', 'equal to']],
  ],
  'Civics and Ethical Education': [
    ['Citizenship', ['citizen', 'citizenship', 'civic', 'rights', 'responsibilities', 'duties']],
    ['Ethics', ['ethic', 'moral', 'virtue', 'integrity', 'honesty']],
    ['Democracy', ['democracy', 'election', 'vote', 'parliament', 'constitution']],
    ['Human Rights', ['human right', 'freedom', 'equality', 'dignity']],
    ['Justice', ['justice', 'law', 'court', 'judge', 'trial']],
    ['Government', ['government', 'federal', 'state', 'executive', 'legislative', 'judicial']],
  ],
  'Scholastic Aptitude Test': [
    ['Quantitative', ['quantitative', 'mathematical', 'arithmetic', 'algebra']],
    ['Verbal', ['verbal', 'reading', 'vocabulary', 'analogy']],
    ['Logical', ['logical', 'reasoning', 'analytical']],
    ['Analytical', ['analytical', 'data sufficiency', 'problem solving']],
  ],
}

type SubjectYearMatrix = {
  subject: string
  years: string[]
  topics: Array<{
    topic: string
    yearCounts: Array<{ year: string; count: number; total: number }>
    totalPapers: number
  }>
}

export async function GET() {
  try {
    const subjectFolders = await fs.readdir(ROOT)
    const subjects: SubjectYearMatrix[] = []

    for (const subject of subjectFolders) {
      const subjPath = path.join(ROOT, subject)
      const stat = await fs.stat(subjPath).catch(() => null)
      if (!stat || !stat.isDirectory()) continue
      // Map subject folder name → topic keyword key
      const subjectKey = subject.replace(/_/g, ' ').replace(/-/g, ' ')
      let topicSet = TOPIC_KEYWORDS[subjectKey]
      if (!topicSet) {
        for (const k of Object.keys(TOPIC_KEYWORDS)) {
          if (subjectKey.includes(k) || k.includes(subjectKey)) {
            topicSet = TOPIC_KEYWORDS[k]
            break
          }
        }
      }
      if (!topicSet) continue

      const files = await fs.readdir(subjPath)
      const papersByYear = new Map<string, { filename: string; content: string }[]>()

      for (const file of files) {
        if (!file.endsWith('.txt')) continue
        const fullPath = path.join(subjPath, file)
        const fileStat = await fs.stat(fullPath).catch(() => null)
        if (!fileStat) continue
        const content = await fs.readFile(fullPath, 'utf-8')
        const yearMatch = file.match(/(\d{4})_EC/)
        const year = yearMatch ? yearMatch[1] : 'unknown'
        if (!papersByYear.has(year)) papersByYear.set(year, [])
        papersByYear.get(year)!.push({ filename: file, content })
      }

      const years = Array.from(papersByYear.keys()).sort()
      if (years.length === 0) continue

      const topics = topicSet.map(([topic, keywords]) => {
        const yearCounts = years.map((year) => {
          const papers = papersByYear.get(year) || []
          let count = 0
          for (const p of papers) {
            const lower = p.content.toLowerCase()
            if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
              count++
            }
          }
          return { year, count, total: papers.length }
        })
        const totalPapers = yearCounts.reduce((acc, yc) => acc + yc.count, 0)
        return { topic, yearCounts, totalPapers }
      })

      subjects.push({ subject: subjectKey, years, topics })
    }

    subjects.sort((a, b) => a.subject.localeCompare(b.subject))

    return NextResponse.json({
      ok: true,
      totalSubjects: subjects.length,
      subjects,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json(
      { ok: false, error: message, totalSubjects: 0, subjects: [] },
      { status: 200 }
    )
  }
}
