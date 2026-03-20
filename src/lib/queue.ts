import { Queue } from 'bullmq'

function getRedisConnection() {
  const url = new URL(process.env.REDIS_URL || 'redis://localhost:6379')
  return {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '6379'),
    password: url.password || undefined,
    username: url.username && url.username !== 'default' ? url.username : undefined,
  }
}

const connection = getRedisConnection()

export const callQueue = new Queue('call-pipeline', { connection })

export const reportQueue = new Queue('weekly-report', { connection })

export { connection }

export async function enqueueCallProcessing(callId: string, orgId: string) {
  await callQueue.add(
    'process-call',
    { callId, orgId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    }
  )
}

export async function enqueueWeeklyReport(orgId: string) {
  await reportQueue.add(
    'generate-report',
    { orgId },
    {
      attempts: 2,
      backoff: { type: 'fixed', delay: 30000 },
    }
  )
}
