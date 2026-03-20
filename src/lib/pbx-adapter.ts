/**
 * Universal PBX Adapter
 * Auto-detects PBX type from webhook payload and normalizes to a common format.
 * Supports: Voicenter, 3CX, FreePBX, Asterisk, Grandstream, Yeastar, Twilio, Vonage, CloudTalk, Generic
 */

export interface NormalizedCallData {
  repName: string
  extension: string
  callDate: string
  durationSeconds: number
  callerPhone: string
  calledPhone: string
  recordingUrl: string
  direction: 'inbound' | 'outbound' | 'unknown'
  callId: string
  pbxType: string
  authRequired?: boolean
  authType?: 'basic' | 'bearer'
  authCredentials?: string
}

type PbxParser = (body: Record<string, unknown>, extensionMap: Record<string, string>) => NormalizedCallData

function today() {
  return new Date().toISOString().split('T')[0]
}

function resolveName(ext: string, extensionMap: Record<string, string>) {
  return extensionMap[ext] || (ext ? `Ext ${ext}` : 'Unknown')
}

// --- Adapters ---

const parseVoicenter: PbxParser = (b, extMap) => {
  const ext = String(b.CallerExtension || b.TargetExtension || b.RepresentativeCode || '')
  return {
    repName: String(b.RepresentativeName || '') || resolveName(ext, extMap),
    extension: ext,
    callDate: (String(b.Date || '').split(' ')[0]) || today(),
    durationSeconds: parseInt(String(b.Duration || '0'), 10),
    callerPhone: b.Type === 'incoming' ? String(b.CallerNumber || '') : String(b.TargetNumber || ''),
    calledPhone: b.Type === 'incoming' ? String(b.TargetNumber || '') : String(b.CallerNumber || ''),
    recordingUrl: String(b.RecordURL || ''),
    direction: b.Type === 'incoming' ? 'inbound' : 'outbound',
    callId: String(b.CallID || ''),
    pbxType: 'voicenter',
  }
}

const parse3CX: PbxParser = (b, extMap) => {
  const ext = String(b.user || '')
  let dur = 0
  const m = String(b.title || '').match(/\((\d+):(\d+)\)/)
  if (m) dur = parseInt(m[1]) * 60 + parseInt(m[2])
  const files = b.FILES as string[] | undefined
  return {
    repName: resolveName(ext, extMap),
    extension: ext,
    callDate: b.timestamp ? String(b.timestamp).split('T')[0] : today(),
    durationSeconds: dur,
    callerPhone: String(b.callerid || ''),
    calledPhone: '',
    recordingUrl: (files && files[0]) || '',
    direction: b.event === 'incoming' ? 'inbound' : 'outbound',
    callId: String(b.id || b.chid || ''),
    pbxType: '3cx',
  }
}

const parseFreePBX: PbxParser = (b, extMap) => {
  const ext = String(b.AMPUSER || b.extension || '')
  const rec = String(b.MIXMONITOR_FILENAME || b.recording || '')
  const url = rec.startsWith('http') ? rec : rec
  return {
    repName: resolveName(ext, extMap),
    extension: ext,
    callDate: b.start ? String(b.start).split(' ')[0] : today(),
    durationSeconds: parseInt(String(b.billsec || b.duration || '0'), 10),
    callerPhone: String(b.callerid || b.src || ''),
    calledPhone: String(b.dst || ''),
    recordingUrl: url,
    direction: String(b.dcontext || '').includes('from-internal') ? 'outbound' : 'inbound',
    callId: String(b.uniqueid || ''),
    pbxType: 'freepbx',
  }
}

const parseYeastar: PbxParser = (b, extMap) => {
  const ext = String(b.callto || '')
  const rec = String(b.recording || '')
  const typeMap: Record<string, 'inbound' | 'outbound'> = { Inbound: 'inbound', Outbound: 'outbound' }
  return {
    repName: resolveName(ext, extMap),
    extension: ext,
    callDate: b.timestart ? String(b.timestart).split(' ')[0] : today(),
    durationSeconds: parseInt(String(b.talkduraction || b.callduraction || '0'), 10),
    callerPhone: String(b.callfrom || ''),
    calledPhone: String(b.callto || ''),
    recordingUrl: rec,
    direction: typeMap[String(b.type || '')] || 'unknown',
    callId: String(b.callid || ''),
    pbxType: 'yeastar',
  }
}

const parseGrandstream: PbxParser = (b, extMap) => {
  const ext = String(b.channel_ext || b.dst || '')
  const rec = String(b.recordfiles || '')
  return {
    repName: resolveName(ext, extMap),
    extension: ext,
    callDate: b.start ? String(b.start).split(' ')[0] : today(),
    durationSeconds: parseInt(String(b.billsec || b.duration || '0'), 10),
    callerPhone: String(b.src || b.clid || ''),
    calledPhone: String(b.dst || ''),
    recordingUrl: rec,
    direction: 'unknown',
    callId: String(b.uniqueid || ''),
    pbxType: 'grandstream',
  }
}

const parseTwilio: PbxParser = (b, extMap) => {
  const url = b.RecordingUrl ? `${b.RecordingUrl}.mp3` : ''
  return {
    repName: resolveName(String(b.To || ''), extMap),
    extension: String(b.To || ''),
    callDate: b.RecordingStartTime
      ? new Date(String(b.RecordingStartTime)).toISOString().split('T')[0]
      : today(),
    durationSeconds: parseInt(String(b.RecordingDuration || '0'), 10),
    callerPhone: String(b.From || ''),
    calledPhone: String(b.To || ''),
    recordingUrl: url,
    direction: b.Direction === 'inbound' ? 'inbound' : 'outbound',
    callId: String(b.CallSid || ''),
    pbxType: 'twilio',
    authRequired: true,
    authType: 'basic',
    authCredentials: String(b.AccountSid || ''),
  }
}

const parseVonage: PbxParser = (b, extMap) => {
  let dur = 0
  if (b.start_time && b.end_time) {
    dur = (new Date(String(b.end_time)).getTime() - new Date(String(b.start_time)).getTime()) / 1000
  }
  return {
    repName: resolveName('', extMap),
    extension: '',
    callDate: b.start_time ? new Date(String(b.start_time)).toISOString().split('T')[0] : today(),
    durationSeconds: dur,
    callerPhone: String(b.from || ''),
    calledPhone: String(b.to || ''),
    recordingUrl: String(b.recording_url || ''),
    direction: 'unknown',
    callId: String(b.conversation_uuid || ''),
    pbxType: 'vonage',
    authRequired: true,
    authType: 'bearer',
  }
}

const parseCloudTalk: PbxParser = (b, extMap) => {
  const aid = String(b.agent_id || '')
  return {
    repName: String(b.agent_name || '') || resolveName(aid, extMap),
    extension: aid,
    callDate: b.started_at ? new Date(String(b.started_at)).toISOString().split('T')[0] : today(),
    durationSeconds: parseInt(String(b.duration || '0'), 10),
    callerPhone: String(b.caller_number || ''),
    calledPhone: String(b.called_number || ''),
    recordingUrl: String(b.recording_url || ''),
    direction: b.direction === 'inbound' ? 'inbound' : 'outbound',
    callId: String(b.call_id || ''),
    pbxType: 'cloudtalk',
  }
}

const parseGeneric: PbxParser = (b, extMap) => {
  const ext = String(b.extension || b.ext || b.agent || b.user || b.to || '')
  const caller = String(
    b.caller || b.caller_id || b.callerid || b.from || b.phone || b.src || b.CallerNumber || ''
  )
  const rec = String(
    b.recording_url || b.recording || b.recordingUrl || b.RecordURL || b.audio_url || ''
  )
  const dur = parseInt(String(b.duration || b.Duration || b.billsec || b.talkduraction || '0'), 10)
  const ts = String(b.timestamp || b.date || b.Date || b.start_time || b.timestart || '')
  const cd = ts ? new Date(ts).toISOString().split('T')[0] : today()
  const dirMap: Record<string, 'inbound' | 'outbound'> = {
    incoming: 'inbound',
    inbound: 'inbound',
    outgoing: 'outbound',
    outbound: 'outbound',
    Inbound: 'inbound',
    Outbound: 'outbound',
  }
  return {
    repName: resolveName(ext, extMap),
    extension: ext,
    callDate: cd,
    durationSeconds: dur > 300 ? dur : dur * 60,
    callerPhone: caller,
    calledPhone: String(b.dst || b.to || b.called || ''),
    recordingUrl: rec,
    direction: dirMap[String(b.direction || b.type || b.Type || '')] || 'unknown',
    callId: String(b.call_id || b.callid || b.CallID || b.uniqueid || ''),
    pbxType: 'generic',
  }
}

// --- Detector ---

export function detectPbxType(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): string {
  if (body.RecordURL || body.RepresentativeName || body.CallerExtension) return 'voicenter'
  if (body.FILES || (body.event && body.chid)) return '3cx'
  if (body.recording && body.callfrom && body.talkduraction) return 'yeastar'
  if (body.event === 'NewCdr') return 'yeastar'
  if (body.recordfiles || body.channel_ext) return 'grandstream'
  if (body.RecordingSid || body.RecordingUrl) return 'twilio'
  if (body.recording_url && body.recording_uuid) return 'vonage'
  if (body.recording_url && body.agent_id) return 'cloudtalk'
  if (body.MIXMONITOR_FILENAME || body.AMPUSER) return 'freepbx'
  if (body.pbx_type) return String(body.pbx_type).toLowerCase()

  const ua = (headers['user-agent'] || '').toLowerCase()
  if (ua.includes('twilio')) return 'twilio'
  if (ua.includes('vonage') || ua.includes('nexmo')) return 'vonage'

  return 'generic'
}

const adapters: Record<string, PbxParser> = {
  voicenter: parseVoicenter,
  '3cx': parse3CX,
  freepbx: parseFreePBX,
  asterisk: parseFreePBX,
  grandstream: parseGrandstream,
  yeastar: parseYeastar,
  twilio: parseTwilio,
  vonage: parseVonage,
  nexmo: parseVonage,
  cloudtalk: parseCloudTalk,
  generic: parseGeneric,
}

export function parsePbxWebhook(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
  extensionMap: Record<string, string> = {}
): NormalizedCallData | null {
  const pbxType = detectPbxType(body, headers)
  const parser = adapters[pbxType] || parseGeneric
  const result = parser(body, extensionMap)

  // Skip empty/very short calls with no recording
  if (result.durationSeconds < 60 && !result.recordingUrl) {
    return null
  }

  return result
}
