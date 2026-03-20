import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeCallTranscript(
  transcript: string,
  repName: string,
  callerPhone: string,
  callDate: string,
  durationMinutes: number,
  direction: string,
  playbookContext?: string
): Promise<Record<string, unknown>> {
  const userMessage = `נתח את תמלול שיחת המכירה הבאה:

נציג: ${repName}
מספר טלפון: ${callerPhone}
תאריך: ${callDate}
משך שיחה: ${durationMinutes} דקות
כיוון: ${direction === 'outbound' ? 'יוצאת' : 'נכנסת'}

${playbookContext || ''}

---
${transcript}
---`

  const { ANALYSIS_SYSTEM_PROMPT } = await import('./analysis-prompt')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  })

  const content = response.choices[0]?.message?.content || '{}'

  try {
    return JSON.parse(content)
  } catch {
    return { error: 'Failed to parse analysis', raw: content }
  }
}
