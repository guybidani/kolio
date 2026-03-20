import { Worker, Job } from 'bullmq'
const connection = {
  host: new URL(process.env.REDIS_URL || 'redis://localhost:6379').hostname || 'localhost',
  port: parseInt(new URL(process.env.REDIS_URL || 'redis://localhost:6379').port || '6379'),
}
import { db } from '@/lib/db'
import { transcribeAudio, formatTranscript } from '@/lib/deepgram'
import { getSignedAudioUrl } from '@/lib/r2'

interface TranscribeJobData {
  callId: string
  orgId: string
}

async function processTranscription(job: Job<TranscribeJobData>) {
  const { callId, orgId } = job.data

  // Tenant isolation: always verify call belongs to the expected org
  const call = await db.call.findFirst({ where: { id: callId, orgId } })
  if (!call) throw new Error(`Call ${callId} not found for org ${orgId}`)

  // Update status
  await db.call.update({
    where: { id: callId },
    data: { status: 'TRANSCRIBING' },
  })

  try {
    // Get signed URL for the audio file
    const audioKey = new URL(call.audioUrl).pathname.replace(/^\//, '')
    const signedUrl = await getSignedAudioUrl(audioKey)

    // Transcribe with Deepgram
    const result = await transcribeAudio(signedUrl)
    const { text, utterances } = formatTranscript(result as Record<string, unknown>)

    // Extract duration from Deepgram metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duration = Math.round((result as any)?.metadata?.duration || call.duration)

    // Update call with transcript
    await db.call.update({
      where: { id: callId },
      data: {
        status: 'TRANSCRIBED',
        transcript: JSON.parse(JSON.stringify(utterances)),
        transcriptText: text,
        language: 'he',
        duration,
      },
    })

    return { callId, wordCount: text.split(/\s+/).length }
  } catch (error) {
    await db.call.update({
      where: { id: callId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Transcription failed',
      },
    })
    throw error
  }
}

export const transcribeWorker = new Worker('call-pipeline', processTranscription, {
  connection,
  concurrency: 3,
  limiter: {
    max: 10,
    duration: 60000,
  },
})

transcribeWorker.on('completed', (job) => {
  console.log(`[Transcribe] Completed: ${job.id}`)
})

transcribeWorker.on('failed', (job, err) => {
  console.error(`[Transcribe] Failed: ${job?.id}`, err.message)
})
