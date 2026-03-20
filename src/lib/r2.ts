import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET || 'kolio-audio'

export async function uploadAudio(key: string, body: Buffer, contentType: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export async function getSignedAudioUrl(key: string) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: 3600 }
  )
}

export function getAudioKey(orgId: string, callId: string, ext: string = 'mp3') {
  // Sanitize inputs to prevent path traversal in S3/R2 keys
  const safeOrg = orgId.replace(/[^a-zA-Z0-9_-]/g, '')
  const safeCall = callId.replace(/[^a-zA-Z0-9_-]/g, '')
  const safeExt = ext.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp3'
  return `${safeOrg}/${safeCall}.${safeExt}`
}
