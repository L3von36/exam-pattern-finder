// Exam Pattern Analyzer
// ----------------------------------------------------------------------------
// Sends exam content (and optionally reference book content) to the LLM and
// asks it to return a strict JSON object describing the patterns it found.
// Designed to be model-agnostic — the prompt engineering is what makes it
// behave like a "exam-pattern" specialist model (LAYA-style).

import ZAI from 'z-ai-web-dev-sdk'

export type QuestionTypeBreakdown = {
  type: string
  count: number
  percentage: number
  notes: string
}

export type TopicFrequency = {
  topic: string
  count: number
  percentage: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export type DifficultyBucket = {
  level: 'Easy' | 'Medium' | 'Hard'
  count: number
  percentage: number
  example: string
}

export type RecurringPattern = {
  title: string
  description: string
  frequency: number
  evidence: string
  strategy: string
}

export type PredictedFocus = {
  topic: string
  likelihood: number
  reasoning: string
}

export type CognitiveLevel = {
  level: string
  count: number
  percentage: number
}

export type AnalysisResult = {
  summary: string
  totalQuestions: number
  estimatedDuration: string
  totalMarks: number
  questionTypes: QuestionTypeBreakdown[]
  topics: TopicFrequency[]
  difficulty: DifficultyBucket[]
  recurringPatterns: RecurringPattern[]
  cognitiveLevels: CognitiveLevel[]
  predictedFocus: PredictedFocus[]
  studyStrategy: string[]
  redFlags: string[]
  rawModelLabel: string
}

const SYSTEM_PROMPT = `You are the LAYA exam-pattern engine — an analytical specialist trained to detect
recurring patterns in past exam papers and reference textbooks.

Your job: given an exam paper (and optionally a sample book), return a STRICT JSON
object describing the patterns you found. No commentary outside JSON. No markdown.

You MUST return ONLY a JSON object that conforms to this exact TypeScript type:

type AnalysisResult = {
  summary: string;                  // 2-4 sentence overview of the exam
  totalQuestions: number;           // integer count of distinct questions
  estimatedDuration: string;         // e.g. "90 minutes" — best guess from header or content
  totalMarks: number;               // sum of all marks if discoverable, else 0
  questionTypes: { type: string; count: number; percentage: number; notes: string }[];
  topics: { topic: string; count: number; percentage: number; difficulty: 'Easy' | 'Medium' | 'Hard' }[];
  difficulty: { level: 'Easy' | 'Medium' | 'Hard'; count: number; percentage: number; example: string }[];
  recurringPatterns: { title: string; description: string; frequency: number; evidence: string; strategy: string }[];
  cognitiveLevels: { level: string; count: number; percentage: number }[];  // Bloom's levels
  predictedFocus: { topic: string; likelihood: number; reasoning: string }[];  // likelihood 0-100
  studyStrategy: string[];          // 4-6 actionable recommendations
  redFlags: string[];                // 2-4 risky or unfair patterns students should watch
}

Rules:
- ALL percentages must sum to 100 within their array (round gracefully).
- Use real numbers from the exam — do not fabricate counts.
- "difficulty" array must always include Easy, Medium, Hard entries (use 0 if absent).
- Keep descriptions concise (under 200 characters each).
- If information is missing, make a reasonable estimate and note it in the summary.
- Return ONLY the JSON object. No \`\`\`json fences. No prose before or after.`

type LlmCallResult = { content: string; modelLabel: string }

async function callLlm(userPrompt: string): Promise<LlmCallResult> {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    thinking: { type: 'disabled' },
  })
  const content = completion.choices?.[0]?.message?.content ?? ''
  return { content, modelLabel: 'z-ai (LAYA exam-pattern engine)' }
}

function extractJson(content: string): string {
  // Strip markdown fences if the model added them despite instructions.
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim()
  }
  // Find the first { and last } as a safety net.
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1)
  }
  return cleaned
}

function validatePercentages<T extends { percentage: number }>(items: T[]): T[] {
  // Light normalisation — keep as-is if sum is roughly 100, otherwise scale.
  const sum = items.reduce((acc, i) => acc + (i.percentage || 0), 0)
  if (sum > 0 && Math.abs(sum - 100) > 5) {
    const factor = 100 / sum
    return items.map((i) => ({ ...i, percentage: Math.round(i.percentage * factor) }))
  }
  return items
}

export type AnalyzeInput = {
  examContent: string
  bookContent?: string
  focus?: string
}

export async function analyzeExamPatterns(input: AnalyzeInput): Promise<AnalysisResult> {
  const userPrompt = `Analyze the following exam paper for patterns.

${input.bookContent ? `=== REFERENCE BOOK EXCERPT (use as ground-truth for topic classification) ===
${input.bookContent.slice(0, 8000)}
` : ''}=== EXAM PAPER TO ANALYZE ===
${input.examContent.slice(0, 12000)}
${input.focus ? `\nUser-specified focus: ${input.focus}` : ''}

Return the JSON analysis now.`

  const { content, modelLabel } = await callLlm(userPrompt)
  const jsonStr = extractJson(content)

  let parsed: AnalysisResult
  try {
    parsed = JSON.parse(jsonStr) as AnalysisResult
  } catch (err) {
    // Last-resort fallback so the UI doesn't crash.
    parsed = {
      summary:
        'The analysis engine returned a response that could not be parsed as JSON. Please try again with a shorter exam or different focus.',
      totalQuestions: 0,
      estimatedDuration: 'Unknown',
      totalMarks: 0,
      questionTypes: [],
      topics: [],
      difficulty: [
        { level: 'Easy', count: 0, percentage: 0, example: '—' },
        { level: 'Medium', count: 0, percentage: 0, example: '—' },
        { level: 'Hard', count: 0, percentage: 0, example: '—' },
      ],
      recurringPatterns: [],
      cognitiveLevels: [],
      predictedFocus: [],
      studyStrategy: [],
      redFlags: ['Model response was not valid JSON — retry with shorter input.'],
      rawModelLabel: modelLabel,
    }
  }

  // Light post-processing — normalise percentages.
  if (parsed.questionTypes) parsed.questionTypes = validatePercentages(parsed.questionTypes)
  if (parsed.topics) parsed.topics = validatePercentages(parsed.topics)
  if (parsed.difficulty) parsed.difficulty = validatePercentages(parsed.difficulty)
  if (parsed.cognitiveLevels) parsed.cognitiveLevels = validatePercentages(parsed.cognitiveLevels)

  parsed.rawModelLabel = modelLabel
  return parsed
}
