"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/lib/analysis-prompt.ts
var analysis_prompt_exports = {};
__export(analysis_prompt_exports, {
  ANALYSIS_SYSTEM_PROMPT: () => ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt: () => buildAnalysisPrompt
});
function buildAnalysisPrompt(playbook) {
  if (!playbook) return ANALYSIS_SYSTEM_PROMPT;
  const stages = Array.isArray(playbook.stages) ? playbook.stages : [];
  const objections = Array.isArray(playbook.objectionBank) ? playbook.objectionBank : [];
  const techniques = Array.isArray(playbook.techniques) ? playbook.techniques : [];
  const keywords = playbook.keywords && typeof playbook.keywords === "object" ? playbook.keywords : {};
  const scripts = Array.isArray(playbook.scripts) ? playbook.scripts : [];
  let playbookSection = `

## Organization Playbook: ${playbook.name}

**IMPORTANT:** Score and evaluate this call based on the organization's custom playbook below, NOT generic methodology. Reference specific playbook stages, techniques, and objection responses in your feedback.

### Custom Sales Stages
The organization defines these sales stages. Evaluate how well the rep followed each stage:
`;
  if (stages.length > 0) {
    stages.forEach((s, i) => {
      playbookSection += `${i + 1}. **${s.name}** (weight: ${s.weight}/10): ${s.criteria}
`;
    });
  }
  if (objections.length > 0) {
    playbookSection += `
### Known Objections & Ideal Responses
Compare the rep's objection handling to these approved responses:
`;
    objections.forEach((o) => {
      playbookSection += `- **"${o.objection}"** (${o.category}): ${o.idealResponse}
`;
    });
  }
  if (techniques.length > 0) {
    playbookSection += `
### Sales Techniques to Detect
Award points when the rep uses these techniques. Note in feedback which were used and which were missed:
`;
    techniques.forEach((t) => {
      playbookSection += `- **${t.name}**: ${t.description} (example: "${t.example}")
`;
    });
  }
  if (keywords && (Array.isArray(keywords.positive) || Array.isArray(keywords.negative))) {
    playbookSection += `
### Keywords
`;
    if (Array.isArray(keywords.positive) && keywords.positive.length > 0) {
      playbookSection += `- **Positive keywords** (reward usage): ${keywords.positive.join(", ")}
`;
    }
    if (Array.isArray(keywords.negative) && keywords.negative.length > 0) {
      playbookSection += `- **Negative keywords** (penalize usage): ${keywords.negative.join(", ")}
`;
    }
  }
  if (scripts.length > 0) {
    playbookSection += `
### Reference Call Scripts
Compare the rep's actual conversation flow to these reference scripts:
`;
    scripts.forEach((s) => {
      const content = typeof s.content === "string" ? s.content.slice(0, 2e3) : "";
      if (content) {
        playbookSection += `#### ${s.name}
${content}

`;
      }
    });
  }
  const outputFormatIndex = ANALYSIS_SYSTEM_PROMPT.indexOf("## Output Format");
  if (outputFormatIndex > 0) {
    return ANALYSIS_SYSTEM_PROMPT.slice(0, outputFormatIndex) + playbookSection + "\n" + ANALYSIS_SYSTEM_PROMPT.slice(outputFormatIndex);
  }
  return ANALYSIS_SYSTEM_PROMPT + playbookSection;
}
var ANALYSIS_SYSTEM_PROMPT;
var init_analysis_prompt = __esm({
  "src/lib/analysis-prompt.ts"() {
    "use strict";
    ANALYSIS_SYSTEM_PROMPT = `You are an expert Israeli sales coach specializing in digital marketing agency sales. You analyze Hebrew sales call transcripts and provide structured, actionable coaching feedback.

## Context
The salesperson works for a digital marketing agency in Israel selling:
- **Paid advertising management** (Facebook, Instagram, Google Ads) - monthly retainer model
- **AI chatbots** for WhatsApp/Instagram lead qualification (basic button-flow and Pro AI conversation bots)
- **Setup fees** that are often waived as a closing incentive
- **Minimum commitments** of 3-12 months depending on tier

Typical clients: cosmetics professionals, contractors, coaches, real estate agents, lawyers, finance professionals, e-commerce stores, clinics.

Pricing tiers range from 1,500-2,800+ NIS/month management fees, with media budgets from 1,500-3,000+ NIS.

## Your Analysis Framework

### Step 1: Read the full transcript carefully
Identify who is the salesperson and who is the prospect. Track the conversation flow.

### Step 2: Map the sales process stages that occurred
- Opening / rapport building
- Discovery / needs assessment
- Pain point identification
- Solution presentation
- Value demonstration
- Objection handling
- Pricing discussion
- Closing attempt
- Next steps / follow-up

### Step 3: Evaluate using a hybrid SPIN + Challenger framework
**SPIN Analysis:**
- **Situation questions**: Did the salesperson understand the prospect's current business state? (how they get clients today, what platforms they use, monthly revenue, team size)
- **Problem questions**: Did they uncover specific pain points? (not enough leads, leads that don't convert, time wasted on unqualified prospects, inconsistent flow)
- **Implication questions**: Did they deepen the pain? (what happens if this continues, how much revenue is lost, what's the cost of doing nothing)
- **Need-payoff questions**: Did they get the prospect to articulate the value of a solution? (what would X more clients mean for your business)

**Challenger Analysis:**
- **Teach**: Did the salesperson share an insight the prospect didn't know? (market data, competitor info, industry benchmark)
- **Tailor**: Did they customize the pitch to this specific prospect's situation?
- **Take control**: Did they confidently lead the conversation toward a decision?

### Step 4: Detect signals
- **Buying signals**: questions about pricing, implementation timeline, "how does it work", leaning in, asking about other clients' results
- **Objections**: stated and unstated resistance (price, timing, trust, past bad experience, need to consult someone)
- **Pain points**: explicit problems mentioned and implicit ones revealed through context
- **Decision-making dynamics**: Is this the decision maker? Who else is involved?

### Step 5: Compute advanced metrics
- **Talk-to-listen ratio**: Estimate percentage of time the rep talks vs the prospect. Use speaker turns and segment lengths from the transcript.
- **Filler words**: Count Hebrew fillers ("\u05D0\u05DE\u05DE", "\u05D0\u05D4\u05D4", "\u05DB\u05D0\u05D9\u05DC\u05D5", "\u05D1\u05E2\u05E6\u05DD", "\u05E0\u05DB\u05D5\u05DF?") and English fillers ("um", "uh", "like", "you know", "right?") used by the rep.
- **Question count**: How many questions did the rep ask during the call?
- **Longest monologue**: Estimate the longest uninterrupted stretch of rep speech, in seconds.
- **Silence gaps**: Estimate number of pauses longer than 3 seconds.
- **Energy score**: Rate 1-10 based on enthusiasm, pace variation, vocal engagement.
- **Competitor mentions**: List any competitor names mentioned, with context.
- **Pricing discussion**: Did price come up? At what point? How was it handled?
- **Next steps clarity**: Did the call end with clear next steps? Rate 1-10.
- **Customer sentiment trajectory**: Was the prospect positive/negative/neutral at the start, middle, and end of the call?

### Step 6: Score and provide feedback
All feedback must reference SPECIFIC moments in the call. Never give generic advice.

BAD feedback: "You should handle objections better"
GOOD feedback: "When the prospect said '\u05D0\u05E0\u05D9 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D7\u05E9\u05D5\u05D1 \u05E2\u05DC \u05D6\u05D4' at the end, you said '\u05D1\u05E1\u05D3\u05E8, \u05EA\u05D7\u05E9\u05D5\u05D1'. Instead, you could have responded: '\u05DE\u05D4 \u05D1\u05D3\u05D9\u05D5\u05E7 \u05D0\u05EA\u05D4 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D7\u05E9\u05D5\u05D1 \u05E2\u05DC\u05D9\u05D5? \u05D0\u05DD \u05D6\u05D4 \u05D4\u05E0\u05D5\u05E9\u05D0 \u05E9\u05DC \u05D4\u05EA\u05E7\u05E6\u05D9\u05D1, \u05D1\u05D5\u05D0 \u05E0\u05E1\u05EA\u05DB\u05DC \u05D1\u05D9\u05D7\u05D3 \u05E2\u05DC \u05D4\u05DE\u05E1\u05E4\u05E8\u05D9\u05DD \u05D5\u05E0\u05E8\u05D0\u05D4 \u05DE\u05D4 \u05D4\u05D2\u05D9\u05D5\u05E0\u05D9'"

BAD feedback: "Good job building rapport"
GOOD feedback: "The way you connected to the prospect's frustration about the previous agency ('\u05D0\u05E0\u05D9 \u05DE\u05D1\u05D9\u05DF \u05DC\u05DE\u05D4 \u05D0\u05EA\u05D4 \u05DE\u05EA\u05D5\u05E1\u05DB\u05DC, \u05D6\u05D4 \u05D1\u05D3\u05D9\u05D5\u05E7 \u05DE\u05D4 \u05E9\u05D0\u05E0\u05D7\u05E0\u05D5 \u05E8\u05D5\u05D0\u05D9\u05DD \u05D0\u05E6\u05DC \u05DC\u05E7\u05D5\u05D7\u05D5\u05EA \u05E9\u05DE\u05D2\u05D9\u05E2\u05D9\u05DD \u05DE\u05E1\u05D5\u05DB\u05E0\u05D5\u05D9\u05D5\u05EA \u05E9\u05DC\u05D0 \u05E2\u05D5\u05D1\u05D3\u05D5\u05EA \u05E2\u05DD \u05D1\u05D5\u05D8\u05D9\u05DD') was effective because it validated their pain AND positioned your differentiator"

## Output Format

Return a single JSON object with the following structure. All free-text fields must be in Hebrew. Field names and enum values stay in English.

{
  "call_metadata": {
    "prospect_name": "string",
    "prospect_business": "string",
    "prospect_tier": "starter | classic | premium | ecommerce | downsell | unknown",
    "estimated_media_budget": "string",
    "call_duration_estimate": "short | medium | long",
    "decision_maker": true/false,
    "other_stakeholders": "string | null"
  },
  "summary": {
    "prospect_needs": "string",
    "what_was_offered": "string",
    "what_was_agreed": "string",
    "current_marketing": "string"
  },
  "scores": {
    "overall": 1-10,
    "discovery": 1-10,
    "objection_handling": 1-10,
    "closing": 1-10,
    "rapport": 1-10,
    "value_communication": 1-10
  },
  "scores_reasoning": "string",
  "buying_signals": [
    {
      "signal": "string",
      "interpretation": "string",
      "was_leveraged": true/false,
      "how_to_leverage": "string"
    }
  ],
  "objections_detected": [
    {
      "objection": "string",
      "type": "price | timing | trust | authority | need | competition | past_experience",
      "how_handled": "string",
      "effectiveness": "effective | partially_effective | ineffective | not_handled",
      "suggested_response": "string"
    }
  ],
  "pain_points": [
    {
      "pain": "string",
      "explicit": true/false,
      "was_deepened": true/false,
      "deepening_suggestion": "string"
    }
  ],
  "rep_id": "string",
  "retention_points": [
    {
      "what": "string",
      "when_in_call": "string",
      "why_effective": "string",
      "quote": "string | null",
      "playbook_worthy": true/false
    }
  ],
  "improvement_points": [
    {
      "what": "string",
      "when_in_call": "string",
      "current_behavior": "string",
      "suggested_behavior": "string",
      "quote_current": "string | null",
      "quote_suggested": "string",
      "impact": "high | medium | low"
    }
  ],
  "next_call_prep": {
    "recommended_callback": "string",
    "opening_line": "string",
    "key_points_to_address": ["string"],
    "materials_to_prepare": ["string"],
    "objections_to_preempt": ["string"],
    "closing_strategy": "string"
  },
  "advanced_metrics": {
    "talk_ratio_rep": 0-100,
    "talk_ratio_customer": 0-100,
    "filler_word_count": 0,
    "question_count": 0,
    "longest_monologue_seconds": 0,
    "silence_gaps": 0,
    "energy_score": 1-10,
    "next_steps_score": 1-10,
    "competitor_mentions": [
      {
        "name": "string",
        "context": "string",
        "timestamp": "string"
      }
    ],
    "pricing_discussion": {
      "mentioned": true/false,
      "timestamp": "string | null",
      "handling": "string"
    },
    "sentiment_trajectory": {
      "start": "positive | negative | neutral",
      "middle": "positive | negative | neutral",
      "end": "positive | negative | neutral"
    }
  },
  "missed_opportunities": ["string"],
  "spin_analysis": {
    "situation_questions_asked": "string",
    "situation_questions_missing": "string",
    "problem_questions_asked": "string",
    "problem_questions_missing": "string",
    "implication_questions_asked": "string",
    "implication_questions_missing": "string",
    "need_payoff_questions_asked": "string",
    "need_payoff_questions_missing": "string"
  },
  "_internal": {
    "israeli_market_insight": "string",
    "objection_pattern_id": "string",
    "prospect_persona": "string",
    "sales_stage_accuracy": "string",
    "closing_window_detected": true/false,
    "closing_window_description": "string",
    "competitor_mentions": ["string"],
    "budget_signals": "string",
    "decision_timeline": "string",
    "trust_level": "low | medium | high",
    "conversion_probability": 0-100,
    "recommended_approach_next": "string",
    "pattern_tags": ["string"],
    "learnings_for_playbook": "string"
  }
}

## Critical Rules
1. EVERY improvement point must include a specific suggested quote in Hebrew - what to actually SAY
2. EVERY retention point must reference a specific moment, not a general observation
3. Never give more than 5 retention points and 5 improvement points - prioritize the highest-impact ones
4. The overall score should reflect: 1-3 = poor fundamentals, 4-5 = needs work, 6-7 = solid with room to grow, 8-9 = strong performance, 10 = masterclass
5. If the call is clearly not a sales call (support, existing client check-in, etc.), note this in the summary and adjust analysis accordingly
6. All Hebrew text should be natural, conversational Israeli Hebrew - not formal/literary
7. Buying signals and objections arrays can be empty if none were detected
8. For the prospect_tier field, match to the closest tier based on context clues (business type, budget mentioned, sophistication level)
9. If a Playbook context is provided, reference it in your coaching. For example: "\u05D1\u05E9\u05D9\u05D7\u05D5\u05EA \u05E7\u05D5\u05D3\u05DE\u05D5\u05EA, \u05D4\u05EA\u05D2\u05D5\u05D1\u05D4 X \u05E2\u05D1\u05D3\u05D4 \u05D8\u05D5\u05D1 \u05DE\u05D5\u05DC \u05D4\u05EA\u05E0\u05D2\u05D3\u05D5\u05EA \u05D3\u05D5\u05DE\u05D4"
10. If a rep profile is provided, focus improvement points on their known weak areas and acknowledge growth in their strong areas
11. When detecting a technique that worked exceptionally well, flag it as "playbook_worthy": true in the retention_points - this will be saved to the playbook for other reps`;
  }
});

// src/workers/transcribe.worker.ts
var import_bullmq2 = require("bullmq");

// src/lib/queue.ts
var import_bullmq = require("bullmq");
function getRedisConnection() {
  const url = new URL(process.env.REDIS_URL || "redis://localhost:6379");
  return {
    host: url.hostname || "localhost",
    port: parseInt(url.port || "6379"),
    password: url.password || void 0,
    username: url.username && url.username !== "default" ? url.username : void 0
  };
}
var connection = getRedisConnection();
var callQueue = new import_bullmq.Queue("call-pipeline", { connection });
var reportQueue = new import_bullmq.Queue("weekly-report", { connection });

// src/lib/db.ts
var import_client = require("@prisma/client");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_pg = __toESM(require("pg"));
var globalForPrisma = globalThis;
function createPrismaClient() {
  const pool = new import_pg.default.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 3e4,
    connectionTimeoutMillis: 5e3
  });
  const adapter = new import_adapter_pg.PrismaPg(pool);
  return new import_client.PrismaClient({ adapter });
}
var db = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// src/lib/deepgram.ts
var DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
async function transcribeAudio(audioUrl) {
  const params = new URLSearchParams({
    model: "nova-3",
    language: "he",
    smart_format: "true",
    diarize: "true",
    paragraphs: "true",
    utterances: "true"
  });
  const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: audioUrl })
  });
  if (!response.ok) {
    throw new Error(`Deepgram error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
function formatTranscript(result) {
  const utterances = [];
  const rawUtterances = result?.results?.utterances || [];
  if (rawUtterances.length > 0) {
    for (const utt of rawUtterances) {
      utterances.push({
        speaker: utt.speaker,
        text: utt.transcript,
        start: utt.start,
        end: utt.end
      });
    }
  } else {
    const paragraphs = result?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs || [];
    for (const para of paragraphs) {
      for (const sentence of para.sentences) {
        utterances.push({
          speaker: para.speaker,
          text: sentence.text,
          start: sentence.start,
          end: sentence.end
        });
      }
    }
  }
  const text = utterances.map((u) => `Speaker ${u.speaker}: ${u.text}`).join("\n");
  return { text, utterances };
}

// src/lib/r2.ts
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var r2 = new import_client_s3.S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY
  }
});
var BUCKET = process.env.R2_BUCKET || "kolio-audio";
async function getSignedAudioUrl(key) {
  return (0, import_s3_request_presigner.getSignedUrl)(
    r2,
    new import_client_s3.GetObjectCommand({
      Bucket: BUCKET,
      Key: key
    }),
    { expiresIn: 3600 }
  );
}

// src/workers/transcribe.worker.ts
var analysisQueue = new import_bullmq2.Queue("call-analysis", { connection });
async function processTranscription(job) {
  const { callId, orgId } = job.data;
  const call = await db.call.findFirst({ where: { id: callId, orgId } });
  if (!call) throw new Error(`Call ${callId} not found for org ${orgId}`);
  await db.call.update({
    where: { id: callId },
    data: { status: "TRANSCRIBING" }
  });
  try {
    const audioKey = new URL(call.audioUrl).pathname.replace(/^\//, "");
    const signedUrl = await getSignedAudioUrl(audioKey);
    const result = await transcribeAudio(signedUrl);
    const { text, utterances } = formatTranscript(result);
    const duration = Math.round(result?.metadata?.duration || call.duration);
    await db.call.update({
      where: { id: callId },
      data: {
        status: "TRANSCRIBED",
        transcript: JSON.parse(JSON.stringify(utterances)),
        transcriptText: text,
        language: "he",
        duration
      }
    });
    await analysisQueue.add(
      "analyze-call",
      { callId, orgId },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5e3 },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 }
      }
    );
    return { callId, wordCount: text.split(/\s+/).length };
  } catch (error) {
    await db.call.update({
      where: { id: callId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Transcription failed"
      }
    });
    throw error;
  }
}
var transcribeWorker = new import_bullmq2.Worker("call-pipeline", processTranscription, {
  connection,
  concurrency: 3,
  limiter: {
    max: 10,
    duration: 6e4
  }
});
transcribeWorker.on("completed", (job) => {
  console.log(`[Transcribe] Completed: ${job.id}`);
});
transcribeWorker.on("failed", (job, err) => {
  console.error(`[Transcribe] Failed: ${job?.id}`, err.message);
});

// src/workers/analyze.worker.ts
var import_bullmq3 = require("bullmq");
var import_client3 = require("@prisma/client");

// src/lib/openai.ts
var import_openai = __toESM(require("openai"));
var openai = new import_openai.default({
  apiKey: process.env.OPENAI_API_KEY
});
async function analyzeCallTranscript(transcript, repName, callerPhone, callDate, durationMinutes, direction, playbookContext, customSystemPrompt) {
  const userMessage = `\u05E0\u05EA\u05D7 \u05D0\u05EA \u05EA\u05DE\u05DC\u05D5\u05DC \u05E9\u05D9\u05D7\u05EA \u05D4\u05DE\u05DB\u05D9\u05E8\u05D4 \u05D4\u05D1\u05D0\u05D4:

\u05E0\u05E6\u05D9\u05D2: ${repName}
\u05DE\u05E1\u05E4\u05E8 \u05D8\u05DC\u05E4\u05D5\u05DF: ${callerPhone}
\u05EA\u05D0\u05E8\u05D9\u05DA: ${callDate}
\u05DE\u05E9\u05DA \u05E9\u05D9\u05D7\u05D4: ${durationMinutes} \u05D3\u05E7\u05D5\u05EA
\u05DB\u05D9\u05D5\u05D5\u05DF: ${direction === "outbound" ? "\u05D9\u05D5\u05E6\u05D0\u05EA" : "\u05E0\u05DB\u05E0\u05E1\u05EA"}

${playbookContext || ""}

---
${transcript}
---`;
  let systemPrompt;
  if (customSystemPrompt) {
    systemPrompt = customSystemPrompt;
  } else {
    const { ANALYSIS_SYSTEM_PROMPT: ANALYSIS_SYSTEM_PROMPT2 } = await Promise.resolve().then(() => (init_analysis_prompt(), analysis_prompt_exports));
    systemPrompt = ANALYSIS_SYSTEM_PROMPT2;
  }
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 4096,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ]
  });
  const content = response.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { error: "Failed to parse analysis", raw: content };
  }
}

// src/workers/analyze.worker.ts
init_analysis_prompt();

// src/lib/badges.ts
var import_client2 = require("@prisma/client");
var BADGE_DEFINITIONS = {
  FIRST_CALL: {
    name: "\u05E9\u05D9\u05D7\u05D4 \u05E8\u05D0\u05E9\u05D5\u05E0\u05D4",
    description: "\u05D4\u05E2\u05DC\u05D9\u05EA \u05D0\u05EA \u05D4\u05E9\u05D9\u05D7\u05D4 \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D4 \u05E9\u05DC\u05DA \u05DC\u05E0\u05D9\u05EA\u05D5\u05D7"
  },
  PERFECT_SCORE: {
    name: "\u05E6\u05D9\u05D5\u05DF \u05DE\u05D5\u05E9\u05DC\u05DD",
    description: "\u05E7\u05D9\u05D1\u05DC\u05EA \u05E6\u05D9\u05D5\u05DF 90+ \u05D1\u05E9\u05D9\u05D7\u05D4"
  },
  STREAK_7: {
    name: "\u05E8\u05E6\u05E3 \u05E9\u05D1\u05D5\u05E2\u05D9",
    description: "7 \u05D9\u05DE\u05D9\u05DD \u05E8\u05E6\u05D5\u05E4\u05D9\u05DD \u05E9\u05DC \u05E9\u05D9\u05D7\u05D5\u05EA"
  },
  STREAK_30: {
    name: "\u05E8\u05E6\u05E3 \u05D7\u05D5\u05D3\u05E9\u05D9",
    description: "30 \u05D9\u05DE\u05D9\u05DD \u05E8\u05E6\u05D5\u05E4\u05D9\u05DD \u05E9\u05DC \u05E9\u05D9\u05D7\u05D5\u05EA"
  },
  OBJECTION_MASTER: {
    name: "\u05DE\u05D0\u05E1\u05D8\u05E8 \u05D4\u05EA\u05E0\u05D2\u05D3\u05D5\u05D9\u05D5\u05EA",
    description: "\u05D8\u05D9\u05E4\u05DC\u05EA \u05D1-10+ \u05D4\u05EA\u05E0\u05D2\u05D3\u05D5\u05D9\u05D5\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4"
  },
  DISCOVERY_PRO: {
    name: "\u05DE\u05D5\u05DE\u05D7\u05D4 \u05D2\u05D9\u05DC\u05D5\u05D9 \u05E6\u05E8\u05DB\u05D9\u05DD",
    description: "\u05E6\u05D9\u05D5\u05DF 90+ \u05D1\u05D2\u05D9\u05DC\u05D5\u05D9 \u05E6\u05E8\u05DB\u05D9\u05DD 3 \u05E4\u05E2\u05DE\u05D9\u05DD \u05D1\u05E8\u05E6\u05E3"
  },
  CLOSER: {
    name: "\u05E1\u05D5\u05D2\u05E8 \u05E2\u05E1\u05E7\u05D0\u05D5\u05EA",
    description: "\u05E6\u05D9\u05D5\u05DF 90+ \u05D1\u05E1\u05D2\u05D9\u05E8\u05D4 3 \u05E4\u05E2\u05DE\u05D9\u05DD \u05D1\u05E8\u05E6\u05E3"
  },
  MOST_IMPROVED: {
    name: "\u05D4\u05E9\u05D9\u05E4\u05D5\u05E8 \u05D4\u05D2\u05D3\u05D5\u05DC",
    description: "\u05D4\u05E9\u05D9\u05E4\u05D5\u05E8 \u05D4\u05D2\u05D3\u05D5\u05DC \u05D1\u05D9\u05D5\u05EA\u05E8 \u05D1\u05E6\u05D9\u05D5\u05DF \u05D4\u05E9\u05D1\u05D5\u05E2"
  },
  REP_OF_THE_WEEK: {
    name: "\u05E0\u05E6\u05D9\u05D2 \u05D4\u05E9\u05D1\u05D5\u05E2",
    description: "\u05D4\u05E0\u05E6\u05D9\u05D2 \u05E2\u05DD \u05D4\u05D1\u05D9\u05E6\u05D5\u05E2\u05D9\u05DD \u05D4\u05D8\u05D5\u05D1\u05D9\u05DD \u05D1\u05D9\u05D5\u05EA\u05E8 \u05D4\u05E9\u05D1\u05D5\u05E2"
  },
  HUNDRED_CALLS: {
    name: "100 \u05E9\u05D9\u05D7\u05D5\u05EA",
    description: "100 \u05E9\u05D9\u05D7\u05D5\u05EA \u05E0\u05D5\u05EA\u05D7\u05D5"
  }
};
async function checkAndAwardBadges(callId, orgId, repId) {
  const awarded = [];
  const call = await db.call.findUnique({
    where: { id: callId },
    select: {
      overallScore: true,
      scores: true,
      objections: true
    }
  });
  if (!call) return awarded;
  const existingBadges = await db.badge.findMany({
    where: { orgId, repId },
    select: { type: true, weekOf: true }
  });
  const existingTypes = new Set(existingBadges.map((b) => b.type));
  async function award(type, weekOf) {
    if (weekOf) {
      const alreadyThisWeek = existingBadges.some(
        (b) => b.type === type && b.weekOf?.getTime() === weekOf.getTime()
      );
      if (alreadyThisWeek) return;
    } else if (existingTypes.has(type)) {
      return;
    }
    const def = BADGE_DEFINITIONS[type];
    await db.badge.create({
      data: {
        orgId,
        repId,
        type,
        name: def.name,
        description: def.description,
        weekOf: weekOf || null
      }
    });
    awarded.push({ type, name: def.name, description: def.description });
  }
  if (!existingTypes.has("FIRST_CALL")) {
    const callCount = await db.call.count({
      where: { orgId, repId, status: "COMPLETE" }
    });
    if (callCount >= 1) {
      await award("FIRST_CALL");
    }
  }
  if (!existingTypes.has("HUNDRED_CALLS")) {
    const callCount = await db.call.count({
      where: { orgId, repId, status: "COMPLETE" }
    });
    if (callCount >= 100) {
      await award("HUNDRED_CALLS");
    }
  }
  const score = call.overallScore;
  if (score && score >= 9 && !existingTypes.has("PERFECT_SCORE")) {
    await award("PERFECT_SCORE");
  }
  if (!existingTypes.has("OBJECTION_MASTER")) {
    const completedCalls = await db.call.findMany({
      where: { orgId, repId, status: "COMPLETE" },
      select: { objections: true }
    });
    let totalObjections = 0;
    for (const c of completedCalls) {
      if (Array.isArray(c.objections)) {
        totalObjections += c.objections.length;
      }
    }
    if (totalObjections >= 10) {
      await award("OBJECTION_MASTER");
    }
  }
  if (!existingTypes.has("DISCOVERY_PRO")) {
    const recentCalls = await db.call.findMany({
      where: { orgId, repId, status: "COMPLETE", scores: { not: import_client2.Prisma.AnyNull } },
      orderBy: { recordedAt: "desc" },
      take: 3,
      select: { scores: true }
    });
    if (recentCalls.length >= 3) {
      const allHighDiscovery = recentCalls.every((c) => {
        const s = c.scores;
        return s && (s.discovery ?? 0) >= 9;
      });
      if (allHighDiscovery) {
        await award("DISCOVERY_PRO");
      }
    }
  }
  if (!existingTypes.has("CLOSER")) {
    const recentCalls = await db.call.findMany({
      where: { orgId, repId, status: "COMPLETE", scores: { not: import_client2.Prisma.AnyNull } },
      orderBy: { recordedAt: "desc" },
      take: 3,
      select: { scores: true }
    });
    if (recentCalls.length >= 3) {
      const allHighClosing = recentCalls.every((c) => {
        const s = c.scores;
        return s && (s.closing ?? 0) >= 9;
      });
      if (allHighClosing) {
        await award("CLOSER");
      }
    }
  }
  const streak = await db.streak.findUnique({
    where: { orgId_repId_type: { orgId, repId, type: "DAILY_CALLS" } }
  });
  if (streak) {
    if (streak.currentCount >= 7 && !existingTypes.has("STREAK_7")) {
      await award("STREAK_7");
    }
    if (streak.currentCount >= 30 && !existingTypes.has("STREAK_30")) {
      await award("STREAK_30");
    }
  }
  return awarded;
}

// src/lib/streaks.ts
async function updateStreaks(repId, orgId, callScore) {
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const results = [];
  results.push(await updateStreak(orgId, repId, "DAILY_CALLS", today, true));
  if (callScore !== null) {
    const qualifies = callScore >= 7;
    results.push(await updateStreak(orgId, repId, "HIGH_SCORE", today, qualifies));
  }
  return results;
}
async function updateStreak(orgId, repId, type, today, qualifies) {
  const existing = await db.streak.findUnique({
    where: { orgId_repId_type: { orgId, repId, type } }
  });
  if (!existing) {
    const streak2 = await db.streak.create({
      data: {
        orgId,
        repId,
        type,
        currentCount: qualifies ? 1 : 0,
        bestCount: qualifies ? 1 : 0,
        lastDate: today
      }
    });
    return {
      type,
      currentCount: streak2.currentCount,
      bestCount: streak2.bestCount,
      isAtRisk: false
    };
  }
  const lastDate = new Date(existing.lastDate);
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
  const daysDiff = Math.floor((today.getTime() - lastDay.getTime()) / (1e3 * 60 * 60 * 24));
  let newCount = existing.currentCount;
  if (daysDiff === 0) {
    if (type === "HIGH_SCORE") {
      newCount = qualifies ? existing.currentCount + 1 : 0;
    }
  } else if (daysDiff === 1) {
    newCount = qualifies ? existing.currentCount + 1 : 0;
  } else {
    newCount = qualifies ? 1 : 0;
  }
  const newBest = Math.max(existing.bestCount, newCount);
  const streak = await db.streak.update({
    where: { orgId_repId_type: { orgId, repId, type } },
    data: {
      currentCount: newCount,
      bestCount: newBest,
      lastDate: today
    }
  });
  return {
    type,
    currentCount: streak.currentCount,
    bestCount: streak.bestCount,
    isAtRisk: false
  };
}

// src/lib/notifications.ts
async function notifyCallEvent(callId, orgId, repId, score, badges) {
  const rep = await db.rep.findUnique({
    where: { id: repId },
    select: {
      name: true,
      userId: true,
      managerId: true
    }
  });
  if (!rep) return;
  const userIds = [];
  if (rep.userId) userIds.push(rep.userId);
  if (rep.managerId) userIds.push(rep.managerId);
  if (userIds.length === 0) return;
  const notifications = [];
  if (score !== null && score >= 9) {
    for (const uid of userIds) {
      notifications.push({
        userId: uid,
        type: "HIGH_SCORE",
        title: "\u05E6\u05D9\u05D5\u05DF \u05D2\u05D1\u05D5\u05D4!",
        body: `${rep.name} \u05E7\u05D9\u05D1\u05DC/\u05D4 \u05E6\u05D9\u05D5\u05DF ${score.toFixed(1)} \u05D1\u05E9\u05D9\u05D7\u05D4`,
        data: { callId, repId, score }
      });
    }
  }
  if (score !== null && score < 4 && rep.managerId) {
    notifications.push({
      userId: rep.managerId,
      type: "LOW_SCORE",
      title: "\u05E6\u05D9\u05D5\u05DF \u05E0\u05DE\u05D5\u05DA - \u05D3\u05E8\u05D5\u05E9 \u05EA\u05E9\u05D5\u05DE\u05EA \u05DC\u05D1",
      body: `${rep.name} \u05E7\u05D9\u05D1\u05DC/\u05D4 \u05E6\u05D9\u05D5\u05DF ${score.toFixed(1)} \u05D1\u05E9\u05D9\u05D7\u05D4`,
      data: { callId, repId, score }
    });
  }
  for (const badge of badges) {
    for (const uid of userIds) {
      notifications.push({
        userId: uid,
        type: "BADGE_EARNED",
        title: "\u05EA\u05D2 \u05D7\u05D3\u05E9!",
        body: `${rep.name} \u05D4\u05E8\u05D5\u05D5\u05D9\u05D7/\u05D4 \u05D0\u05EA \u05D4\u05EA\u05D2 "${badge.name}"`,
        data: { callId, repId, badgeType: badge.type }
      });
    }
  }
  if (notifications.length > 0) {
    await db.notification.createMany({
      data: notifications.map((n) => ({
        orgId,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: JSON.parse(JSON.stringify(n.data))
      }))
    });
  }
}

// src/workers/analyze.worker.ts
async function processAnalysis(job) {
  const { callId, orgId } = job.data;
  const call = await db.call.findFirst({
    where: { id: callId, orgId },
    include: { rep: true }
  });
  if (!call) throw new Error(`Call ${callId} not found for org ${orgId}`);
  if (!call.transcriptText) throw new Error(`Call ${callId} has no transcript`);
  await db.call.update({
    where: { id: callId },
    data: { status: "ANALYZING" }
  });
  try {
    const playbook = await db.playbook.findFirst({
      where: { orgId, isDefault: true, isActive: true }
    });
    const customSystemPrompt = buildAnalysisPrompt(
      playbook ? {
        name: playbook.name,
        stages: playbook.stages,
        objectionBank: playbook.objectionBank,
        keywords: playbook.keywords,
        techniques: playbook.techniques,
        scripts: playbook.scripts
      } : null
    );
    const analysis = await analyzeCallTranscript(
      call.transcriptText,
      call.rep?.name || "Unknown",
      call.callerNumber || "",
      call.recordedAt.toISOString().split("T")[0],
      Math.round(call.duration / 60),
      call.direction,
      void 0,
      customSystemPrompt
    );
    const toJson = (val) => JSON.parse(JSON.stringify(val ?? null));
    await db.call.update({
      where: { id: callId },
      data: {
        status: "COMPLETE",
        overallScore: analysis.scores?.overall || null,
        scores: toJson(analysis.scores),
        summary: analysis.summary?.prospect_needs || null,
        prospectName: analysis.call_metadata?.prospect_name || null,
        prospectBusiness: analysis.call_metadata?.prospect_business || null,
        objections: toJson(analysis.objections_detected),
        retentionPoints: toJson(analysis.retention_points),
        improvementPoints: toJson(analysis.improvement_points),
        nextCallPrep: toJson(analysis.next_call_prep),
        spinAnalysis: toJson(analysis.spin_analysis),
        internalInsights: toJson(analysis._internal),
        coachingTips: toJson(analysis.improvement_points?.map((p) => p.suggested_behavior)),
        talkRatio: import_client3.Prisma.JsonNull,
        // Advanced analytics fields
        fillerWordCount: analysis.advanced_metrics?.filler_word_count ?? null,
        questionCount: analysis.advanced_metrics?.question_count ?? null,
        longestMonologue: analysis.advanced_metrics?.longest_monologue_seconds ?? null,
        silenceGaps: analysis.advanced_metrics?.silence_gaps ?? null,
        talkRatioRep: analysis.advanced_metrics?.talk_ratio_rep ?? null,
        talkRatioCustomer: analysis.advanced_metrics?.talk_ratio_customer ?? null,
        energyScore: analysis.advanced_metrics?.energy_score ?? null,
        nextStepsScore: analysis.advanced_metrics?.next_steps_score ?? null,
        competitorMentions: toJson(analysis.advanced_metrics?.competitor_mentions),
        pricingDiscussion: toJson(analysis.advanced_metrics?.pricing_discussion),
        sentimentTrajectory: toJson(analysis.advanced_metrics?.sentiment_trajectory),
        processedAt: /* @__PURE__ */ new Date()
      }
    });
    const playbookWorthy = analysis.retention_points?.filter((p) => p.playbook_worthy) || [];
    if (playbookWorthy.length > 0 && playbook) {
      const currentBank = playbook.objectionBank || [];
      await db.playbook.update({
        where: { id: playbook.id },
        data: {
          objectionBank: toJson([...currentBank, ...playbookWorthy])
        }
      });
    }
    const overallScore = analysis.scores?.overall ?? null;
    if (call.repId) {
      try {
        const [badges] = await Promise.all([
          checkAndAwardBadges(callId, orgId, call.repId),
          updateStreaks(call.repId, orgId, overallScore)
        ]);
        await notifyCallEvent(callId, orgId, call.repId, overallScore, badges);
      } catch (gamificationError) {
        console.error("[Analyze] Gamification error:", gamificationError);
      }
    }
    return { callId, score: analysis.scores?.overall };
  } catch (error) {
    await db.call.update({
      where: { id: callId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Analysis failed"
      }
    });
    throw error;
  }
}
var analyzeWorker = new import_bullmq3.Worker("call-analysis", processAnalysis, {
  connection,
  concurrency: 2,
  limiter: {
    max: 5,
    duration: 6e4
  }
});
analyzeWorker.on("completed", (job) => {
  console.log(`[Analyze] Completed: ${job.id}`);
});
analyzeWorker.on("failed", (job, err) => {
  console.error(`[Analyze] Failed: ${job?.id}`, err.message);
});

// src/workers/report.worker.ts
var import_bullmq4 = require("bullmq");
async function generateWeeklyReport(job) {
  const { orgId, weekStart: weekStartStr } = job.data;
  const now = /* @__PURE__ */ new Date();
  let weekStart;
  if (weekStartStr) {
    weekStart = new Date(weekStartStr);
  } else {
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - 6);
    weekStart.setHours(0, 0, 0, 0);
  }
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const calls = await db.call.findMany({
    where: {
      orgId,
      status: "COMPLETE",
      recordedAt: {
        gte: weekStart,
        lt: weekEnd
      }
    },
    include: { rep: true }
  });
  if (calls.length === 0) {
    return { orgId, message: "No calls this week" };
  }
  const totalCalls = calls.length;
  const scoredCalls = calls.filter((c) => c.overallScore !== null);
  const avgScore = scoredCalls.length > 0 ? scoredCalls.reduce((sum, c) => sum + (c.overallScore || 0), 0) / scoredCalls.length : null;
  const repStats = {};
  for (const call of calls) {
    const repId = call.repId || "unassigned";
    const repName = call.rep?.name || "Unassigned";
    if (!repStats[repId]) {
      repStats[repId] = { name: repName, calls: 0, totalScore: 0 };
    }
    repStats[repId].calls++;
    repStats[repId].totalScore += call.overallScore || 0;
  }
  const leaderboard = Object.entries(repStats).map(([id, stats]) => ({
    repId: id,
    name: stats.name,
    calls: stats.calls,
    avgScore: stats.calls > 0 ? stats.totalScore / stats.calls : 0
  })).sort((a, b) => b.avgScore - a.avgScore);
  const topRep = leaderboard[0]?.name || null;
  const highlights = calls.filter((c) => c.retentionPoints).flatMap((c) => {
    const points = c.retentionPoints;
    return points.filter((p) => p.playbook_worthy).map((p) => p.what);
  }).slice(0, 5);
  const objectionTypes = {};
  for (const call of calls) {
    const objections = call.objections;
    if (objections) {
      for (const obj of objections) {
        objectionTypes[obj.type] = (objectionTypes[obj.type] || 0) + 1;
      }
    }
  }
  const scoreDistribution = {
    poor: scoredCalls.filter((c) => (c.overallScore || 0) <= 3).length,
    needsWork: scoredCalls.filter((c) => (c.overallScore || 0) > 3 && (c.overallScore || 0) <= 5).length,
    solid: scoredCalls.filter((c) => (c.overallScore || 0) > 5 && (c.overallScore || 0) <= 7).length,
    strong: scoredCalls.filter((c) => (c.overallScore || 0) > 7 && (c.overallScore || 0) <= 9).length,
    masterclass: scoredCalls.filter((c) => (c.overallScore || 0) === 10).length
  };
  const toJson = (val) => JSON.parse(JSON.stringify(val ?? null));
  const report = await db.weeklyReport.upsert({
    where: {
      orgId_weekStart: { orgId, weekStart }
    },
    create: {
      orgId,
      weekStart,
      weekEnd,
      totalCalls,
      avgScore,
      topRep,
      highlights: toJson(highlights),
      data: toJson({ leaderboard, objectionTypes, scoreDistribution })
    },
    update: {
      totalCalls,
      avgScore,
      topRep,
      highlights: toJson(highlights),
      data: toJson({ leaderboard, objectionTypes, scoreDistribution })
    }
  });
  return { reportId: report.id, totalCalls, avgScore };
}
var reportWorker = new import_bullmq4.Worker("weekly-report", generateWeeklyReport, {
  connection,
  concurrency: 1
});
reportWorker.on("completed", (job) => {
  console.log(`[Report] Completed: ${job.id}`);
});
reportWorker.on("failed", (job, err) => {
  console.error(`[Report] Failed: ${job?.id}`, err.message);
});

// src/workers/index.ts
var HEARTBEAT_INTERVAL = 5 * 60 * 1e3;
console.log("[Workers] Starting Kolio workers...");
console.log(`[Workers] Transcribe worker: queue="${transcribeWorker.name}", concurrency=3`);
console.log(`[Workers] Analyze worker: queue="${analyzeWorker.name}", concurrency=2`);
console.log(`[Workers] Report worker: queue="${reportWorker.name}", concurrency=1`);
console.log("[Workers] All workers started successfully");
var heartbeat = setInterval(() => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[Workers] Heartbeat at ${now} - transcribe:${transcribeWorker.isRunning() ? "running" : "stopped"} analyze:${analyzeWorker.isRunning() ? "running" : "stopped"} report:${reportWorker.isRunning() ? "running" : "stopped"}`);
}, HEARTBEAT_INTERVAL);
async function shutdown(signal) {
  console.log(`[Workers] Received ${signal}, shutting down gracefully...`);
  clearInterval(heartbeat);
  try {
    await Promise.allSettled([
      transcribeWorker.close(),
      analyzeWorker.close(),
      reportWorker.close()
    ]);
    console.log("[Workers] All workers closed");
    process.exit(0);
  } catch (err) {
    console.error("[Workers] Error during shutdown:", err);
    process.exit(1);
  }
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => {
  console.error("[Workers] Unhandled rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("[Workers] Uncaught exception:", err);
  shutdown("uncaughtException");
});
