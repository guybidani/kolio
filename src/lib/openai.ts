import OpenAI from 'openai'

// ---------------------------------------------------------------------------
// AI Provider Abstraction Layer
// Supports OpenAI (GPT), Google AI Studio (Gemma 4), and Ollama as backends.
//
// Env vars:
//   AI_PROVIDER        = "openai" | "google" | "gemma"  (default: "openai")
//   OPENAI_MODEL       = OpenAI model to use (default: "gpt-4o")
//   GOOGLE_AI_API_KEY  = Google AI Studio API key
//   GOOGLE_AI_MODEL    = Google AI model name (default: "gemma-4-27b-it")
//   OLLAMA_BASE_URL    = Ollama OpenAI-compat endpoint (default: "http://localhost:11434/v1")
//   OLLAMA_MODEL       = Model name to use with Ollama (default: "gemma4:27b")
//   AI_FALLBACK        = "true" to fall back to OpenAI when primary fails (default: "false")
// ---------------------------------------------------------------------------

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase()
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:27b'
const AI_FALLBACK = process.env.AI_FALLBACK === 'true'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o'
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || 'not-set'
const GOOGLE_AI_MODEL = process.env.GOOGLE_AI_MODEL || 'gemma-4-27b-it'

// OpenAI client (always created — needed for fallback)
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'not-set',
})

// Google AI Studio client (OpenAI-compatible)
const googleClient = new OpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  apiKey: GOOGLE_AI_API_KEY,
})

// Ollama client (OpenAI-compatible)
const ollamaClient = new OpenAI({
  apiKey: 'ollama', // Ollama doesn't need a real key but the SDK requires one
  baseURL: OLLAMA_BASE_URL,
})

/** Returns the active AI client based on AI_PROVIDER env var. */
function getClient(): OpenAI {
  switch (AI_PROVIDER) {
    case 'google':
      return googleClient
    case 'gemma':
      return ollamaClient
    default:
      return openaiClient
  }
}

/** Returns the active model name based on AI_PROVIDER env var. */
function getModel(overrideModel?: string): string {
  if (overrideModel) return overrideModel
  switch (AI_PROVIDER) {
    case 'google':
      return GOOGLE_AI_MODEL
    case 'gemma':
      return OLLAMA_MODEL
    default:
      return OPENAI_MODEL
  }
}

/**
 * Backward-compatible export — existing code that imports `openai` will
 * continue to work, but now routes through the configured provider.
 */
export const openai = new Proxy(openaiClient, {
  get(target, prop, receiver) {
    const client = getClient()
    return Reflect.get(client, prop, receiver)
  },
})

// ---------------------------------------------------------------------------
// Provider info helper (for logging / debugging)
// ---------------------------------------------------------------------------
export function getAIProviderInfo() {
  return {
    provider: AI_PROVIDER,
    model: getModel(),
    fallbackEnabled: AI_FALLBACK,
    ollamaBaseUrl: AI_PROVIDER === 'gemma' ? OLLAMA_BASE_URL : undefined,
    googleBaseUrl: AI_PROVIDER === 'google' ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined,
  }
}

// ---------------------------------------------------------------------------
// Chat completion wrapper with fallback support
// ---------------------------------------------------------------------------
interface ChatCompletionParams {
  model?: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  max_tokens?: number
  temperature?: number
  response_format?: { type: 'json_object' | 'text' }
}

/**
 * Create a chat completion using the configured AI provider.
 * If AI_FALLBACK=true and the primary provider (Gemma) fails, retries with OpenAI.
 */
export async function createChatCompletion(params: ChatCompletionParams) {
  const client = getClient()
  const model = getModel(params.model)

  const requestParams: OpenAI.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: params.messages,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
  }

  // Ollama supports json mode but some local models may not handle response_format
  // well. We always set it when requested — if the model doesn't support it,
  // we'll catch the error in fallback.
  if (params.response_format) {
    requestParams.response_format = params.response_format
  }

  try {
    return await client.chat.completions.create(requestParams)
  } catch (error) {
    // If using a non-OpenAI provider and fallback is enabled, retry with OpenAI
    if (AI_PROVIDER !== 'openai' && AI_FALLBACK) {
      console.warn(
        `[AI] ${AI_PROVIDER} request failed, falling back to OpenAI (${OPENAI_MODEL}):`,
        error instanceof Error ? error.message : error
      )
      return await openaiClient.chat.completions.create({
        ...requestParams,
        model: OPENAI_MODEL,
      })
    }
    throw error
  }
}

// ---------------------------------------------------------------------------
// Call transcript analysis (uses the wrapper with fallback)
// ---------------------------------------------------------------------------
export async function analyzeCallTranscript(
  transcript: string,
  repName: string,
  callerPhone: string,
  callDate: string,
  durationMinutes: number,
  direction: string,
  playbookContext?: string,
  customSystemPrompt?: string
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

  let systemPrompt: string
  if (customSystemPrompt) {
    systemPrompt = customSystemPrompt
  } else {
    const { ANALYSIS_SYSTEM_PROMPT } = await import('./analysis-prompt')
    systemPrompt = ANALYSIS_SYSTEM_PROMPT
  }

  const response = await createChatCompletion({
    max_tokens: 4096,
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
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
