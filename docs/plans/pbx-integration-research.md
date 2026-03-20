# Kolio PBX/Telephony Integration Research

**Date:** 2026-03-21
**Purpose:** Comprehensive research of all PBX/telephony systems relevant to the Israeli and global SMB market, with exact API/webhook documentation for call recording retrieval.

---

## Table of Contents

1. [Israeli PBX Systems](#1-israeli-pbx-systems)
2. [Global Cloud PBX Systems](#2-global-cloud-pbx-systems)
3. [Israeli VoIP Providers](#3-israeli-voip-providers)
4. [Open Source PBX](#4-open-source-pbx)
5. [Universal Fallbacks](#5-universal-fallbacks)
6. [Mobile Recording Apps](#6-mobile-recording-apps)
7. [Prioritized Integration Roadmap](#7-prioritized-integration-roadmap)

---

## 1. Israeli PBX Systems

### 1.1 Voicenter (PRIORITY #1 - Israeli Market Leader)

**Market share (Israel):** ~30-40% of cloud PBX SMBs. 50,000+ users worldwide, majority Israeli. Dominant in call centers and sales teams.

**How to get recordings:** Webhook (CDR push) + Polling API

**CDR Notification System (Webhook):**
- **Method:** HTTP POST to your endpoint
- **Formats:** POST-JSON, XML-RPC, or application/x-www-form-urlencoded
- **Authentication:** Account code provided by Voicenter backoffice + IP whitelist
- **Recording URL field:** `record` field in CDR payload
- **Recording URL format:** `https://cpanel.voicenter.co.il/CallsHistory/PlayRecord/{timestamp}{phone}.mp3.{id}.enc`
- **Recording format:** MP3 (encrypted on server)
- **Retry policy:** Voicenter retries on non-200 response. Retry count and intervals set on Voicenter side.
- **Response required:** HTTP 200 OK acknowledgement

**CDR Webhook Payload Fields:**
| Field | Description |
|-------|-------------|
| `ivruniqueid` | Unique call identifier |
| `time` | Epoch timestamp (Israel TZ) |
| `direction` | incoming/outgoing/internal |
| `caller`, `callerPhone` | Originating party |
| `target` | Destination number |
| `extenUser` | Agent extension |
| `representative_name` | Agent name |
| `representative_code` | Agent code |
| `duration` | Total call length (seconds) |
| `actualCallDuration` | Conversation time only |
| `isAnswer` | 0/1 answer indicator |
| `status` | ANSWER, BUSY, NOANSWER, CANCEL, ABANDONE |
| `record` | **Recording URL** |
| `price` | Call cost in ILS cents |
| `queueid`, `queuename` | Queue info |
| `seconds_waiting_in_queue` | Wait time |
| `aiData` | Optional: AI insights, emotions, transcript |

**Call Log API (Polling):**
- **Endpoint:** REST API pull
- **Limit:** Up to 10,000 CDR per request with filters
- **Auth:** Account code + IP whitelist

**AI Data (Bonus):** Voicenter optionally provides `aiData` with call insights, sentence-level emotion detection, and full transcript with speaker identification. This could supplement or replace Kolio's own transcription.

**Setup complexity:** Easy - Just provide webhook URL to Voicenter support
**Rate limits:** None documented for webhook receipt; polling limited to 10k per request

---

### 1.2 Bezeq Business

**Market share (Israel):** ~15-20% of business telephony (largest telco overall)

**How to get recordings:** No public API documented. Bezeq Business offers cloud PBX services but operates as a traditional telco with managed services rather than developer-friendly APIs.

**Integration approach:**
- SIP trunk recording (SIPREC) if customer uses Bezeq SIP trunks
- Manual export from Bezeq admin panel
- Contact Bezeq Business division for custom integration (enterprise only)

**Recording format:** Unknown - likely WAV
**Setup complexity:** Hard - requires enterprise sales engagement, no self-service API
**Rate limits:** N/A

---

### 1.3 Partner Business (formerly Orange Israel)

**Market share (Israel):** ~10-15% of business telephony

**How to get recordings:** No public API. Partner is primarily a mobile carrier with business telephony add-ons. Cloud PBX is usually resold from third-party solutions (often 3CX or Voicenter white-label).

**Integration approach:**
- Identify underlying PBX platform (often 3CX or white-labeled Voicenter)
- Integrate via underlying platform's API
- SIP trunk recording as fallback

**Setup complexity:** Hard - no direct API, requires identifying underlying platform
**Rate limits:** N/A

---

### 1.4 Cellcom Business

**Market share (Israel):** ~8-12% of business telephony. Owns 013 Netvision (36% of international telephony).

**How to get recordings:** No public API. Similar to Partner - primarily mobile carrier with business add-ons. May use white-labeled solutions underneath.

**Integration approach:**
- Identify underlying platform
- SIP trunk recording
- Manual export

**Setup complexity:** Hard
**Rate limits:** N/A

---

### 1.5 HOT Business

**Market share (Israel):** ~5-8% of business telephony (strong in cable/internet bundle customers)

**How to get recordings:** No public API. HOT provides business telephony mainly through cable infrastructure.

**Integration approach:**
- SIP trunk recording
- Manual export
- Enterprise custom integration

**Setup complexity:** Hard
**Rate limits:** N/A

---

### 1.6 013 Netvision (Cellcom subsidiary)

**Market share (Israel):** 36% of international telephony; smaller in PBX

**How to get recordings:** No public API for call recordings. Provides ISP, international calls, and hosting services. PBX offering is limited compared to Voicenter/3CX.

**Setup complexity:** Hard
**Rate limits:** N/A

---

### 1.7 Mitel Israel

**Market share (Israel):** ~3-5% (enterprise segment, legacy on-premise PBX)

**How to get recordings:** API via Mitel CloudLink

**API Details:**
- **Media API:** Call control, conference management, access call records and recordings
- **Notifications API:** Webhook (JSON) or WebSocket for CTI events
- **Authentication:** OAuth via CloudLink platform
- **Recording:** Requires MiVoice Call Recording add-on or third-party partner (dvsAnalytics, Red Box)
- **Webhook format:** JSON with callId for correlation

**Setup complexity:** Hard - requires CloudLink gateway, recording add-on license, enterprise deployment
**Recording format:** WAV (via recording partner)
**Rate limits:** Not documented

---

### 1.8 Xorcom (Israeli PBX manufacturer)

**Market share (Israel):** ~5-8% (on-premise IP-PBX for SMBs)

**How to get recordings:** API (CompletePBX system, Asterisk-based)

**API Details:**
- **Platform:** CompletePBX (built on Asterisk/FreePBX)
- **Recording:** On-demand recording via API + automatic recording
- **Cloud recording:** Recordings can be uploaded to Xorcom Cloud, encrypted and secured
- **API:** REST API with recording control methods
- **File format:** WAV (native Asterisk)

**Integration approach:** Same as FreePBX/Asterisk since Xorcom is Asterisk-based
**Setup complexity:** Medium - Asterisk knowledge required
**Rate limits:** None (self-hosted)

---

## 2. Global Cloud PBX Systems

### 2.1 3CX (PRIORITY #2 - Very Popular in Israel)

**Market share (Israel):** ~15-20% of SMB market. Two official Israeli distributors (Ergocom, Avalon Telecom). Globally 4,100+ companies.

**How to get recordings:** Webhook push + API polling

**Webhook Configuration:**
- **Config file:** `TCXWebAPI.ini`
- **Settings:** `WEBHOOK_URL`, `RECORDING_FULL_INFO = 1`, `POST = 1`
- **Method:** HTTP POST
- **Recording URL format:** `https://{3CXFQDN}/webapi/recording/{callid}.mp3`
- **Payload:** Contains `FILES` field with recording URL, call ID for correlation with start/end events
- **Conversion:** Native WAV auto-converted to MP3 by webhooks module

**V20 API Authentication:**
- **Token endpoint:** POST `/connect/token` with `client_id` and `client_secret`
- **Content-Type:** application/x-www-form-urlencoded
- **Returns:** Bearer token (valid 60 minutes)
- **Usage:** `Authorization: Bearer {token}` header

**Recording format:** WAV (native), MP3 (via webhook module conversion)
**Setup complexity:** Medium - requires ini file configuration on 3CX server
**Rate limits:** None (self-hosted)

---

### 2.2 Twilio (PRIORITY #3 - Global Standard)

**Market share (Israel):** ~5% direct, but many Israeli SaaS products use Twilio underneath

**How to get recordings:** Webhook (RecordingStatusCallback)

**Webhook Configuration:**
- **Parameter:** `RecordingStatusCallback` URL in TwiML or API call
- **Method:** POST (default) or GET via `RecordingStatusCallbackMethod`
- **Events:** `in-progress`, `completed`, `absent`, `failed` (default: `completed`)
- **Recording URL:** `RecordingUrl` parameter in webhook payload
- **Format:** WAV (128kbps) by default; append `.mp3` to URL for MP3 (32kbps)
- **Authentication:** Twilio signs requests with X-Twilio-Signature (HMAC-SHA1)

**API Polling:**
- **Endpoint:** `GET /2010-04-01/Accounts/{AccountSid}/Recordings/{RecordingSid}`
- **Authentication:** Basic Auth (AccountSid:AuthToken)
- **Download:** Append `.wav` or `.mp3` to recording URI

**Recording limits:** 3600 seconds (1 hour) normal; 120 seconds transcribed; 600 seconds SDK
**Pricing:** ~$0.0025/minute for recording storage
**Setup complexity:** Easy - excellent docs, SDK in every language
**Rate limits:** Concurrency-based (100 concurrent by default)

---

### 2.3 RingCentral

**Market share (Israel):** ~2-3% (limited presence)

**How to get recordings:** Webhook notification + API polling

**Webhook:**
- **Event filter:** `/restapi/v1.0/account/~/extension/~/telephony/sessions`
- **Notification:** Contains `telephonySessionId`
- **Method:** Subscribe via API, receive JSON webhook

**API Polling:**
- **Endpoint:** Call Log API with `recordingType=All` filter
- **Download:** URL from Call Log response
- **Authentication:** Bearer token (OAuth 2.0)
- **Header:** `Authorization: Bearer {access_token}` or `?access_token=` query param (media.ringcentral.com only)

**Recording format:** MP3 or WAV (account-level setting, not API-configurable)
**Permission required:** `ReadCallRecording`
**Setup complexity:** Medium - good docs but OAuth flow required
**Rate limits:** User-level limits per (user, app_id) pair; check `X-Rate-Limit-Group` header

---

### 2.4 Vonage (Nexmo)

**Market share (Israel):** ~1-2%

**How to get recordings:** Webhook push

**Webhook Details:**
- **Configuration:** Via NCCO (Nexmo Call Control Object) `record` action with `eventUrl`
- **Method:** POST to your eventUrl
- **Payload fields:** `start_time`, `recording_url`, `size`, `recording_uuid`, `end_time`, `conversation_uuid`, `timestamp`
- **Authentication:** JWT in webhook Authorization header; verify with API key signature secret (HS256)
- **Download:** Authenticated GET to `recording_url` with JWT bearer token
- **Payload verification:** SHA-256 hash comparison via `payload_hash` in JWT claims

**Recording format:** MP3
**Setup complexity:** Medium - JWT auth adds complexity
**Rate limits:** Standard Vonage API limits

---

### 2.5 Zoom Phone

**Market share (Israel):** ~3-5% (growing with Zoom adoption)

**How to get recordings:** Webhook + API polling

**Webhook:**
- **Event:** `phone.recording_completed`
- **Payload:** Contains `download_url` in format `https://zoom.us/v2/phone/recording/download/{recording_id}`

**API Polling:**
- **Endpoint:** `GET /phone/call_logs/{id}/recordings`
- **Authentication:** OAuth 2.0 (Bearer token or access_token query param)
- **Scopes required:** `phone:read:recording_transcript`

**Recording format:** MP3/MP4
**Setup complexity:** Medium - OAuth app setup, scopes configuration
**Rate limits:** Per account type, varies by plan
**Known issues:** Some developers report 404 on download_url; timing-sensitive after call completion

---

### 2.6 Microsoft Teams Phone

**Market share (Israel):** ~5-8% (growing fast with M365 adoption)

**How to get recordings:** Webhook notification (post-call only) OR compliance recording partner

**Graph API (Post-call metadata only):**
- **Subscribe:** `communications/onlineMeetings/getAllRecordings`
- **Call Records API:** Subscribe to call records for near-real-time reports
- **Notification delay:** ~30 minutes after call ends
- **Download:** `GET /communications/callRecords/{id}` via Graph API

**CRITICAL LIMITATION:** Graph API provides post-call metadata only. It does NOT support real-time audio recording. For actual call recording audio, you MUST use a certified third-party compliance recording partner.

**Compliance Recording Partners:**
- CallCabinet, Imagicle, Luware, Nuclei, Red Box, ASC Technologies
- These partners use Graph cloud communications APIs + `updateRecordingStatus`
- Bot is auto-invited to calls per Teams recording policy

**Recording format:** Varies by partner (typically WAV/MP3)
**Setup complexity:** Hard - requires compliance partner, Teams admin policies, Graph API app registration
**Rate limits:** Graph API throttling applies

---

### 2.7 Google Voice (Business)

**Market share (Israel):** ~1-2% (limited; requires Google Workspace)

**How to get recordings:** NO API. Manual only.

**Current state:**
- On-demand recording available on all plans (Starter, Standard, Premier) since Nov 2025
- Automatic recording only on Premier plan
- **No official API exists** for Google Voice
- Data export only via Google Takeout (HTML format)
- No webhooks, no programmatic access
- Third-party tools (voice2json) can parse Takeout exports

**Integration approach:** Google Drive monitoring (if user saves recordings to Drive)
**Setup complexity:** N/A (no API)
**Rate limits:** N/A

---

### 2.8 Grasshopper

**Market share (Israel):** Negligible (US-focused)

**How to get recordings:** NO call recording feature exists. Grasshopper is a basic virtual phone system with no recording capability.

**Integration approach:** Not applicable
**Setup complexity:** N/A

---

### 2.9 Dialpad

**Market share (Israel):** ~1%

**How to get recordings:** Webhook push

**Webhook Details:**
- **Setup:** Create webhook via API, then create call event subscription
- **Method:** POST to your webhook URL
- **Encoding:** JWT (HS256 with shared secret) or plain JSON (if no secret provided)
- **Events:** Call lifecycle events including recording states
- **Granularity:** Company-wide, office-level, call center, or per-user subscriptions

**Recording format:** MP3
**Setup complexity:** Medium - webhook + subscription creation via API
**Rate limits:** Not documented

---

### 2.10 Aircall (PRIORITY #4 for global expansion)

**Market share (Israel):** ~2-3% (popular with SaaS sales teams)

**How to get recordings:** Webhook push + API polling

**Webhook Events:**
- **Event:** `call.ended` includes recording data
- **Backup event:** `call.comm_assets_generated` provides recording/voicemail links that may be missing in `call.ended`
- **Recording fields in payload:**
  - `data.recording` - Direct MP3 URL (only if call was answered)
  - `data.recording_short_url` - Short URL format: `https://short-urls.aircall.io/v1/{uuid}`
  - `data.voicemail` - Direct MP3 URL (if voicemail left)
  - `data.asset` - Secured webpage requiring auth

**CRITICAL:** Recording URLs expire in 10 minutes. Short URLs expire in 3 hours (previously documented as 1 hour). Must download async immediately.

**API Polling:**
- **Endpoint:** `GET /v1/calls/{id}`
- **Authentication:** Basic Auth (api_id:api_token) or OAuth 2.0 Bearer token
- **Rate limit:** 60 requests/minute/company
- **Headers:** `X-AircallApi-Limit`, `X-AircallApi-Remaining`, `X-AircallApi-Reset`

**Recording format:** MP3
**Setup complexity:** Easy - excellent developer docs and tutorials
**Rate limits:** 60 req/min per company

---

### 2.11 CloudTalk

**Market share (Israel):** ~1-2%

**How to get recordings:** API + Webhooks

**API Details:**
- **Docs:** https://developers.cloudtalk.io/
- **Features:** REST API, webhooks management, sandbox environment, OpenAPI/Swagger spec
- **Authentication:** API key based
- **Webhooks:** Configurable via API for call events
- **Recording:** Available via call settings per number

**Recording format:** MP3
**Setup complexity:** Medium
**Rate limits:** Not publicly documented

---

### 2.12 JustCall

**Market share (Israel):** ~1%

**How to get recordings:** Webhook push + API polling

**Webhook Details:**
- **Method:** POST with content-type: application/json
- **Security:** Dynamic webhook signatures, SHA256 algorithm
- **Authentication:** api_key:api_secret in Authorization header
- **Events:** Call outcomes, including recording links and AI transcript data
- **Version:** V2 webhooks (current, recommended)

**Recording format:** MP3
**Setup complexity:** Easy - clear developer docs
**Rate limits:** Not documented

---

## 3. Israeli VoIP Providers

### 3.1 Voicenter
See Section 1.1 above (PRIORITY #1)

### 3.2 MaxPhone

**Market share (Israel):** ~2-3% (small VoIP provider)

**How to get recordings:** No public API documentation found. MaxPhone appears to be a smaller Israeli VoIP provider without developer-facing APIs.

**Integration approach:**
- Contact directly for custom webhook integration
- SIP trunk recording as fallback

**Setup complexity:** Hard (no documented API)

### 3.3 Aeronet

**Market share (Israel):** ~1-2% (niche VoIP provider)

**How to get recordings:** No public API documentation found.

**Integration approach:**
- Contact directly
- SIP trunk recording as fallback

**Setup complexity:** Hard (no documented API)

### 3.4 Bezeqint (Bezeq International)

**Market share (Israel):** ~10% (ISP with PBX services)

**How to get recordings:** Web-based PBX management portal at selfservice.bezeqint.net. No public API for call recordings.

**PBX offering:** Cloud PBX as part of business solutions bundle
**Integration approach:** Manual export or SIP trunk recording
**Setup complexity:** Hard

### 3.5 012 Smile (now part of Partner)

**Market share (Israel):** Merged into Partner Communications. Services now under Partner brand.

**Integration approach:** See Partner Business (Section 1.3)

---

## 4. Open Source PBX

### 4.1 Asterisk (PRIORITY #5 - Universal Fallback)

**Market share (Israel):** ~10-15% (powers many white-label solutions including Xorcom, FreePBX installations)

**How to get recordings:** ARI (Asterisk REST Interface) + AMI (Asterisk Manager Interface) + File system access

**ARI (Modern approach):**
- **Recording API:** `POST /channels/{channelId}/record` to start recording
- **Stop recording:** `POST /recordings/live/{recordingName}/stop`
- **Events:** WebSocket-based real-time event stream for recording state changes
- **File storage:** `/var/spool/asterisk/recording/` (ARI) or `/var/spool/asterisk/monitor/` (native)
- **Authentication:** HTTP Basic Auth or ARI credentials in `ari.conf`

**AMI (Legacy approach):**
- **CDR Manager:** Enable `cdr_manager.conf` for real-time CDR events over TCP socket
- **Monitor command:** `Action: Monitor` to start recording
- **Events:** CDR events pushed over AMI connection

**Recording format:** WAV (native), can be converted to MP3/OGG via `sox` or `lame`
**Setup complexity:** Medium-Hard (requires server access, Asterisk knowledge)
**Rate limits:** None (self-hosted)
**Storage:** Local filesystem, can sync to cloud via cron/inotify

---

### 4.2 FreePBX (Asterisk GUI - PRIORITY #5b)

**Market share (Israel):** ~5-10% (common in SMBs that self-host)

**How to get recordings:** REST API + File system + Community webhooks

**REST/GraphQL API:**
- **Recording control:** Trigger on-demand recording via API
- **Recording retrieval:** Limited - no native API for fetching recordings
- **File location:** `/var/spool/asterisk/monitor/YYYY/MM/DD/`
- **FTP export:** Built-in FTP settings to push recordings to external server
- **CDR data:** XML file accompanies each recording with call metadata

**Community Solutions:**
- [flexie-crm/freepbx-webhooks](https://github.com/flexie-crm/freepbx-webhooks) - Real-time webhook integration
- Custom AGI scripts for webhook notifications

**Recording format:** WAV
**Setup complexity:** Medium (requires server access)
**Rate limits:** None (self-hosted)

---

### 4.3 FreeSWITCH

**Market share (Israel):** ~2-3% (used in carrier-grade and custom solutions)

**How to get recordings:** Event Socket + Eqivo API

**Event Socket (mod_event_socket):**
- **Inbound mode:** Connect to FreeSWITCH on port 8021, send commands, receive events
- **Outbound mode:** FreeSWITCH connects to your app on call events
- **Recording events:** Subscribe to RECORD_START, RECORD_STOP, BACKGROUND_JOB events
- **WebSocket:** Real-time event stream
- **Libraries:** Node.js (esl), Python (greenswitch), Go (go-eventsocket), Elixir (SwitchX)

**Eqivo API Platform:**
- **Webhooks:** `recordUrl`, `defaultAnswerUrl`, `defaultHangupUrl`, `callHeartbeatUrl`
- **Recording:** Configurable per call via API parameters
- **Format:** WAV, MP3

**Recording format:** WAV, MP3 (configurable)
**Setup complexity:** Hard (requires telecom expertise)
**Rate limits:** None (self-hosted)

---

### 4.4 Kamailio

**Market share (Israel):** ~1% (SIP proxy, not PBX)

**How to get recordings:** Kamailio is a SIP proxy/router, NOT a media server. It does not handle call recordings directly.

**Integration approach:**
- Route calls through a media server (Asterisk, FreeSWITCH) for recording
- Use SIPREC to fork media to a recording server
- Kamailio's `dialog` module can trigger HTTP notifications on call events

**Setup complexity:** Hard (requires separate recording infrastructure)

---

## 5. Universal Fallbacks

### 5.1 SIP Trunk Recording (SIPREC)

**What it is:** SIPREC (SIP Recording) is an open protocol (RFC 7245) that enables any SIP-capable device to fork call media to a recording server, regardless of the PBX vendor.

**How it works:**
1. **SRC (Session Recording Client):** The PBX, SBC, or gateway
2. **SRS (Session Recording Server):** Your recording infrastructure
3. SRC duplicates RTP media streams and sends them to SRS alongside SIP metadata
4. Works with both RTP and SRTP (encrypted) media

**Compatible with:**
- Cisco CUBE (native SIPREC support)
- AudioCodes Mediant SBCs
- Ribbon/Sonus SBCs
- Any SBC with SIPREC support

**When to use:** When the PBX has no API but routes calls through a SIP trunk or SBC that supports SIPREC.

**Recording format:** WAV (raw RTP capture)
**Setup complexity:** Hard - requires SBC configuration, recording server deployment
**Best for:** Enterprise customers on legacy PBXes (Bezeq, Partner, Cellcom)

---

### 5.2 Manual Upload

**What it is:** Allow users to manually upload call recording files through the Kolio dashboard.

**How it works:**
1. User downloads recordings from their PBX admin panel
2. Uploads via Kolio dashboard (drag & drop)
3. Kolio processes normally (transcribe + analyze)

**Supported formats:** WAV, MP3, M4A, OGG, WEBM, FLAC
**Setup complexity:** None (already built into Kolio)
**Best for:** Any PBX without API, low-volume users, trials

---

### 5.3 Google Drive / Dropbox Monitoring

**What it is:** Monitor a cloud storage folder for new recordings, auto-import into Kolio.

**How it works:**
1. User configures their PBX to export recordings to Google Drive or Dropbox
2. Kolio monitors the folder via Google Drive API or Dropbox API
3. New files are auto-downloaded and processed

**Google Drive API:**
- **Watch endpoint:** `POST /files/{fileId}/watch` for push notifications
- **Polling:** `GET /files` with `modifiedTime` filter
- **Auth:** OAuth 2.0

**Dropbox API:**
- **Webhook:** Dropbox sends notification when files change
- **Download:** `POST /files/download` with file path
- **Auth:** OAuth 2.0

**Setup complexity:** Easy-Medium (OAuth consent flow)
**Best for:** Google Voice users, any PBX with export-to-cloud feature

---

## 6. Mobile Recording Apps

### 6.1 Cube ACR

**What it is:** Android/iOS call recording app that records all phone calls including VoIP (WhatsApp, Viber, etc.)

**Cloud Backup:**
- Auto-upload to Google Drive or Dropbox
- Email sending of recordings
- Premium feature required for cloud backup

**Integration approach:**
- User installs Cube ACR on sales rep phones
- Recordings auto-upload to Google Drive
- Kolio monitors Google Drive folder (see 5.3)

**Recording format:** MP3, M4A, WAV, OGG, 3GP, AMR
**Setup complexity:** Easy for user; Medium for integration (Google Drive monitoring)
**Best for:** Field sales reps, mobile-first teams, businesses without PBX
**Limitations:** Android 9+ has restrictions on call recording; requires accessibility service

### 6.2 Other Mobile Recording Apps
- **ACR (Another Call Recorder):** Similar to Cube ACR, Google Drive sync
- **Automatic Call Recorder (Appliqato):** Google Drive/Dropbox auto-upload
- **TapeACall:** iOS-focused, cloud storage, no API
- **Rev Call Recorder:** Free, includes transcription, limited API

**Integration pattern for all:** Google Drive / Dropbox folder monitoring

---

## 7. Prioritized Integration Roadmap

### Phase 1: Israeli Market Launch (Week 1-2)
**Target: 60-70% of Israeli SMB market coverage**

| Priority | System | Method | Effort | Market Coverage |
|----------|--------|--------|--------|-----------------|
| 1 | **Voicenter** | CDR Webhook (POST) | 2 days | ~30-40% |
| 2 | **3CX** | Webhook (POST) + API | 3 days | ~15-20% |
| 3 | **Manual Upload** | File upload UI | Already built | Universal fallback |
| 4 | **Asterisk/FreePBX** | ARI WebSocket + file monitor | 3 days | ~10-15% |

**Phase 1 Total Coverage: ~60-75% of Israeli SMB market**

### Phase 2: Global Cloud PBX (Week 3-4)
**Target: International expansion + remaining Israeli market**

| Priority | System | Method | Effort | Market Coverage |
|----------|--------|--------|--------|-----------------|
| 5 | **Twilio** | RecordingStatusCallback webhook | 1 day | +5% IL, large global |
| 6 | **Aircall** | Webhook (call.ended) | 1 day | +2-3% |
| 7 | **Zoom Phone** | Webhook + API | 2 days | +3-5% |
| 8 | **Google Drive Monitor** | Drive API polling/watch | 2 days | Universal (GV, mobile) |

**Phase 2 Total Coverage: ~80-85% of Israeli SMB market + global reach**

### Phase 3: Enterprise & Remaining (Week 5-8)
**Target: Enterprise segment + long tail**

| Priority | System | Method | Effort | Market Coverage |
|----------|--------|--------|--------|-----------------|
| 9 | **Microsoft Teams Phone** | Graph API + compliance partner | 5 days | +5-8% |
| 10 | **RingCentral** | Webhook + Call Log API | 2 days | +2-3% |
| 11 | **Vonage** | NCCO webhook | 2 days | +1-2% |
| 12 | **Dialpad** | Webhook subscription | 2 days | +1% |
| 13 | **JustCall** | Webhook | 1 day | +1% |
| 14 | **CloudTalk** | REST API + webhooks | 2 days | +1% |
| 15 | **FreeSWITCH** | Event Socket | 3 days | +2% |
| 16 | **Dropbox Monitor** | Webhook + download | 1 day | Universal fallback |

### Phase 4: Universal / Legacy (Month 2-3)

| Priority | System | Method | Effort | Market Coverage |
|----------|--------|--------|--------|-----------------|
| 17 | **SIPREC Gateway** | SBC integration | 2 weeks | Legacy enterprise |
| 18 | **Mitel** | CloudLink API | 1 week | Enterprise only |
| 19 | **Mobile app SDK** | Cube ACR + Drive | 1 week | Field sales |

---

## Summary: API Authentication Quick Reference

| System | Auth Method | Token Type |
|--------|-----------|------------|
| Voicenter | Account code + IP whitelist | Static code |
| 3CX | client_id + client_secret | Bearer (60 min) |
| Twilio | AccountSid:AuthToken | Basic Auth |
| RingCentral | OAuth 2.0 | Bearer |
| Vonage | JWT (HS256) | Bearer JWT |
| Zoom Phone | OAuth 2.0 | Bearer |
| MS Teams | Azure AD OAuth | Bearer |
| Aircall | api_id:api_token | Basic Auth / OAuth |
| Dialpad | API key + secret | JWT (HS256) |
| JustCall | api_key:api_secret | Basic Auth |
| CloudTalk | API key | API Key header |
| Asterisk ARI | Username:Password | Basic Auth |

## Summary: Recording Format Quick Reference

| System | Native Format | Alt Format | Bitrate |
|--------|--------------|------------|---------|
| Voicenter | MP3 (encrypted) | - | Standard |
| 3CX | WAV | MP3 (converted) | Standard |
| Twilio | WAV (128kbps) | MP3 (32kbps) | Low MP3 |
| RingCentral | MP3 or WAV | Account setting | Standard |
| Vonage | MP3 | - | Standard |
| Zoom Phone | MP3/MP4 | - | Standard |
| Aircall | MP3 | - | Standard |
| Asterisk | WAV | MP3 (via sox/lame) | 16-bit PCM |
| FreeSWITCH | WAV | MP3 | Configurable |

---

## Key Recommendations for Kolio Architecture

1. **Universal webhook receiver** (`/api/webhooks/pbx`) should detect PBX type from headers/payload structure and route accordingly. Already designed in the current architecture.

2. **Download recordings async** - Use BullMQ job to download recording from URL immediately after webhook, especially for Aircall (10-min expiry).

3. **Normalize to single format** - Convert all incoming formats to 16kHz mono WAV before sending to Deepgram (optimal for Hebrew STT).

4. **Voicenter's aiData is gold** - If available, use Voicenter's built-in transcript as a fallback/comparison to Deepgram. Could save transcription costs for Voicenter customers.

5. **Google Drive integration is strategic** - Covers Google Voice users, mobile recording app users, and any PBX with export-to-cloud feature. Should be Phase 2 priority.

6. **Israeli telcos (Bezeq, Partner, Cellcom, HOT) have no APIs** - Don't waste time trying to integrate directly. Instead, identify the underlying PBX platform they use or offer SIP trunk recording / manual upload as fallbacks.
