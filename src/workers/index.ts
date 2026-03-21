import { transcribeWorker } from './transcribe.worker'
import { analyzeWorker } from './analyze.worker'
import { reportWorker } from './report.worker'

const HEARTBEAT_INTERVAL = 5 * 60 * 1000 // 5 minutes

console.log('[Workers] Starting Kolio workers...')
console.log(`[Workers] Transcribe worker: queue="${transcribeWorker.name}", concurrency=3`)
console.log(`[Workers] Analyze worker: queue="${analyzeWorker.name}", concurrency=2`)
console.log(`[Workers] Report worker: queue="${reportWorker.name}", concurrency=1`)
console.log('[Workers] All workers started successfully')

// Heartbeat log so we know workers are alive
const heartbeat = setInterval(() => {
  const now = new Date().toISOString()
  console.log(`[Workers] Heartbeat at ${now} - transcribe:${transcribeWorker.isRunning() ? 'running' : 'stopped'} analyze:${analyzeWorker.isRunning() ? 'running' : 'stopped'} report:${reportWorker.isRunning() ? 'running' : 'stopped'}`)
}, HEARTBEAT_INTERVAL)

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[Workers] Received ${signal}, shutting down gracefully...`)
  clearInterval(heartbeat)

  try {
    await Promise.allSettled([
      transcribeWorker.close(),
      analyzeWorker.close(),
      reportWorker.close(),
    ])
    console.log('[Workers] All workers closed')
    process.exit(0)
  } catch (err) {
    console.error('[Workers] Error during shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Catch unhandled errors so the process doesn't silently die
process.on('unhandledRejection', (err) => {
  console.error('[Workers] Unhandled rejection:', err)
})

process.on('uncaughtException', (err) => {
  console.error('[Workers] Uncaught exception:', err)
  shutdown('uncaughtException')
})
