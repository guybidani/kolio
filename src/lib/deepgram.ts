const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY!

export async function transcribeAudio(audioUrl: string): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({
    model: 'nova-3',
    language: 'he',
    smart_format: 'true',
    diarize: 'true',
    paragraphs: 'true',
    utterances: 'true',
  })

  const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: audioUrl }),
  })

  if (!response.ok) {
    throw new Error(`Deepgram error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function formatTranscript(result: Record<string, unknown>): {
  text: string
  utterances: Array<{
    speaker: number
    text: string
    start: number
    end: number
  }>
} {
  const utterances: Array<{
    speaker: number
    text: string
    start: number
    end: number
  }> = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawUtterances = (result as any)?.results?.utterances || []

  if (rawUtterances.length > 0) {
    for (const utt of rawUtterances) {
      utterances.push({
        speaker: utt.speaker,
        text: utt.transcript,
        start: utt.start,
        end: utt.end,
      })
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paragraphs = (result as any)?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs || []
    for (const para of paragraphs) {
      for (const sentence of para.sentences) {
        utterances.push({
          speaker: para.speaker,
          text: sentence.text,
          start: sentence.start,
          end: sentence.end,
        })
      }
    }
  }

  const text = utterances.map((u) => `Speaker ${u.speaker}: ${u.text}`).join('\n')

  return { text, utterances }
}
