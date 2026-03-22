/**
 * HTML email templates for Kolio.
 * All templates are RTL Hebrew, inline CSS, Gmail/Outlook compatible.
 */

interface WeeklyDigestData {
  recipientName: string
  weekStartDate: string // formatted: "16.03.2026"
  weekEndDate: string   // formatted: "22.03.2026"
  totalCalls: number
  avgScore: number | null
  activeReps: number
  topRepName: string | null
  topRepScore: number | null
  scoreTrend: number | null // percentage change from last week, positive = up
  callsNeedingAttention: Array<{
    repName: string
    score: number
    callId: string
  }>
  keyInsight: string | null
  appUrl: string
  unsubscribeUrl: string
}

function scoreColor(score: number): string {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#eab308'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

function trendArrow(trend: number | null): string {
  if (trend === null || trend === 0) return '<span style="color:#94a3b8;">&#8212;</span>'
  if (trend > 0) {
    return `<span style="color:#22c55e;font-size:18px;">&#9650;</span> <span style="color:#22c55e;font-weight:600;">${trend.toFixed(1)}%</span>`
  }
  return `<span style="color:#ef4444;font-size:18px;">&#9660;</span> <span style="color:#ef4444;font-weight:600;">${Math.abs(trend).toFixed(1)}%</span>`
}

export function weeklyDigestEmail(data: WeeklyDigestData): string {
  const {
    recipientName,
    weekStartDate,
    weekEndDate,
    totalCalls,
    avgScore,
    activeReps,
    topRepName,
    topRepScore,
    scoreTrend,
    callsNeedingAttention,
    keyInsight,
    appUrl,
    unsubscribeUrl,
  } = data

  const attentionRows = callsNeedingAttention
    .slice(0, 3)
    .map(
      (c) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${c.repName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
          <span style="background:${scoreColor(c.score)};color:#fff;padding:2px 10px;border-radius:12px;font-size:13px;font-weight:600;">${c.score.toFixed(1)}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
          <a href="${appUrl}/dashboard/calls/${c.callId}" style="color:#6366f1;text-decoration:none;font-size:13px;font-weight:500;">&#8592; צפה</a>
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>דוח שבועי - Kolio</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;direction:rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:32px 28px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="text-align:center;">
                    <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Kolio</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:8px;">
                    <span style="font-size:15px;color:rgba(255,255,255,0.85);">דוח שבועי | ${weekStartDate} - ${weekEndDate}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 28px 12px;">
              <p style="margin:0;font-size:16px;color:#1e293b;font-weight:600;">שלום ${recipientName},</p>
              <p style="margin:8px 0 0;font-size:14px;color:#64748b;line-height:1.6;">הנה סיכום הביצועים של הצוות שלך השבוע:</p>
            </td>
          </tr>

          <!-- Quick Stats -->
          <tr>
            <td style="background-color:#ffffff;padding:12px 28px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td width="33%" style="text-align:center;padding:20px 8px;border-left:1px solid #e2e8f0;">
                    <div style="font-size:28px;font-weight:800;color:#4f46e5;">${totalCalls}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">שיחות</div>
                  </td>
                  <td width="33%" style="text-align:center;padding:20px 8px;border-left:1px solid #e2e8f0;">
                    <div style="font-size:28px;font-weight:800;color:${avgScore ? scoreColor(avgScore) : '#94a3b8'};">${avgScore ? avgScore.toFixed(1) : '-'}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">ציון ממוצע</div>
                  </td>
                  <td width="33%" style="text-align:center;padding:20px 8px;">
                    <div style="font-size:28px;font-weight:800;color:#0ea5e9;">${activeReps}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:4px;">נציגים פעילים</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score Trend -->
          <tr>
            <td style="background-color:#ffffff;padding:0 28px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size:14px;color:#475569;font-weight:600;">מגמת ציונים</td>
                        <td style="text-align:left;font-size:14px;">${trendArrow(scoreTrend)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top Rep -->
          ${topRepName ? `
          <tr>
            <td style="background-color:#ffffff;padding:0 28px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#fef9c3,#fef08a);border-radius:12px;border:1px solid #fde047;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <span style="font-size:22px;">&#127942;</span>
                          <span style="font-size:14px;font-weight:700;color:#854d0e;margin-right:8px;">נציג השבוע</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:8px;">
                          <span style="font-size:20px;font-weight:800;color:#713f12;">${topRepName}</span>
                          ${topRepScore ? `<span style="font-size:14px;color:#a16207;margin-right:12px;">ציון ממוצע: ${topRepScore.toFixed(1)}</span>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Calls Needing Attention -->
          ${callsNeedingAttention.length > 0 ? `
          <tr>
            <td style="background-color:#ffffff;padding:0 28px 20px;">
              <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#1e293b;">שיחות שדורשות תשומת לב</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <tr style="background-color:#f8fafc;">
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">נציג</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">ציון</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">פעולה</th>
                </tr>
                ${attentionRows}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Key Insight -->
          ${keyInsight ? `
          <tr>
            <td style="background-color:#ffffff;padding:0 28px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#3b82f6;font-weight:700;">&#128161; תובנה מרכזית</p>
                    <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">${keyInsight}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="background-color:#ffffff;padding:8px 28px 32px;text-align:center;">
              <a href="${appUrl}/dashboard/analytics" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;">
                &#8592; צפה בדוח המלא ב-Kolio
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:20px 28px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                המייל הזה נשלח מ-Kolio - ניתוח שיחות מכירה חכם
              </p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">הסרה מרשימת תפוצה</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Simple notification email template ──

interface NotificationEmailData {
  recipientName: string
  title: string
  body: string
  ctaText?: string
  ctaUrl?: string
  appUrl: string
  unsubscribeUrl: string
}

export function notificationEmail(data: NotificationEmailData): string {
  const { recipientName, title, body, ctaText, ctaUrl, appUrl, unsubscribeUrl } = data

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Kolio</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;direction:rtl;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
              <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Kolio</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color:#ffffff;padding:28px;border-radius:0 0 16px 16px;">
              <p style="margin:0 0 8px;font-size:14px;color:#64748b;">שלום ${recipientName},</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1e293b;">${title}</p>
              <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7;">${body}</p>
              ${ctaText && ctaUrl ? `
              <div style="text-align:center;margin-bottom:8px;">
                <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
                  ${ctaText}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                <a href="${appUrl}" style="color:#94a3b8;text-decoration:none;">Kolio</a>
                &nbsp;|&nbsp;
                <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">הסרה מרשימת תפוצה</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
