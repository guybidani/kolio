import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port || '587'),
    secure: parseInt(port || '587') === 465,
    auth: { user, pass },
  })
}

const fromAddress = process.env.SMTP_FROM || 'Kolio <noreply@kolio.app>'

/**
 * Send an email. Falls back to console logging in development when SMTP is not configured.
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const transporter = getTransporter()

  if (!transporter) {
    console.log(`[Email] SMTP not configured — logging email:`)
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body: ${html.substring(0, 200)}...`)
    return true
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    })
    console.log(`[Email] Sent to ${to}: ${subject}`)
    return true
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error)
    return false
  }
}

/**
 * Send email to multiple recipients. Returns count of successful sends.
 */
export async function sendEmailBatch(
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  htmlFn: (name: string) => string
): Promise<number> {
  let sent = 0
  for (const recipient of recipients) {
    const success = await sendEmail({
      to: recipient.email,
      subject,
      html: htmlFn(recipient.name),
    })
    if (success) sent++
  }
  return sent
}
