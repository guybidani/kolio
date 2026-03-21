import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

const DEFAULT_STAGES = [
  { name: 'פתיחה', criteria: 'יצירת רושם ראשוני חיובי, הצגה עצמית, בניית אמון ראשוני', weight: 7 },
  { name: 'גילוי צרכים', criteria: 'שאלות פתוחות, הבנת המצב הנוכחי, זיהוי כאבים ואתגרים', weight: 9 },
  { name: 'הצגת ערך', criteria: 'התאמת הפתרון לצרכים שעלו, שימוש בדוגמאות ותוצאות', weight: 8 },
  { name: 'טיפול בהתנגדויות', criteria: 'הקשבה, הכלה, מענה מדויק, שימוש בהוכחות חברתיות', weight: 8 },
  { name: 'סגירה', criteria: 'סיכום ערך, יצירת דחיפות, הצעת צעד הבא ברור', weight: 9 },
]

const DEFAULT_OBJECTIONS = [
  { objection: 'יקר לי', category: 'price', idealResponse: 'אני מבין שהתקציב חשוב. בוא נסתכל על זה מזווית אחרת - כמה עולה לך היום כל ליד? עם השירות שלנו, העלות לליד יורדת משמעותית ואתה מקבל לידים איכותיים יותר' },
  { objection: 'אני צריך לחשוב על זה', category: 'timing', idealResponse: 'בהחלט, זו החלטה חשובה. מה בדיוק היית רוצה לבדוק? אם זה נושא התקציב או ההתאמה, בוא נעבור על זה ביחד עכשיו' },
  { objection: 'יש לי כבר ספק אחר', category: 'competition', idealResponse: 'מעולה שאתה כבר משקיע בשיווק. מה התוצאות שאתה מקבל היום? הרבה לקוחות שלנו הגיעו בדיוק מהמצב הזה וראו שיפור משמעותי' },
  { objection: 'לא עכשיו, אולי בעוד חודש', category: 'timing', idealResponse: 'אני מבין. רק שתדע - כל חודש שעובר זה לידים שאתה מפסיד. מה אם נתחיל עם תוכנית מצומצמת ונגדיל כשתהיה מוכן?' },
  { objection: 'אני צריך להתייעץ עם השותף', category: 'authority', idealResponse: 'בטח, חשוב שכולם יהיו על אותו דף. מה אם נקבע שיחה קצרה שלושתנו ביחד? ככה אני יכול לענות על כל השאלות ישירות' },
]

const DEFAULT_TECHNIQUES = [
  { name: 'שאלות פתוחות', description: 'שאילת שאלות שמעודדות תשובה מפורטת ולא רק כן/לא', example: 'ספר לי איך אתה מקבל לקוחות היום?' },
  { name: 'שיקוף', description: 'חזרה על דברי הלקוח במילים שלך כדי להראות הבנה', example: 'אם אני מבין נכון, מה שמפריע לך זה ש...' },
  { name: 'סיכום ביניים', description: 'עצירה באמצע השיחה לסכם מה עלה עד כה', example: 'אז בוא נסכם - דיברנו על X, Y ו-Z. נכון?' },
  { name: 'יצירת דחיפות', description: 'הדגשת מה הלקוח מפסיד בכל יום שהוא לא פועל', example: 'כל שבוע שעובר בלי נוכחות דיגיטלית זה לפחות 10 לידים שהלכו למתחרים' },
  { name: 'הוכחה חברתית', description: 'שיתוף סיפורי הצלחה ותוצאות של לקוחות דומים', example: 'לקוח שלנו בתחום שלך עלה מ-5 ל-30 לידים בחודש תוך 3 חודשים' },
]

const DEFAULT_KEYWORDS = {
  positive: ['ערבות', 'הבטחה', 'תוצאות', 'הצלחה', 'צמיחה', 'ROI', 'החזר השקעה', 'בדיוק', 'מצוין'],
  negative: ['אני חושב', 'אולי', 'לא בטוח', 'נראה לי', 'יכול להיות', 'אממ', 'כאילו'],
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const playbook = await db.playbook.findFirst({
      where: { orgId: session.orgId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })

    if (!playbook) {
      // Return default playbook structure (not saved yet)
      return NextResponse.json({
        id: null,
        name: 'תסריט מכירה ברירת מחדל',
        stages: DEFAULT_STAGES,
        objectionBank: DEFAULT_OBJECTIONS,
        techniques: DEFAULT_TECHNIQUES,
        keywords: DEFAULT_KEYWORDS,
        scripts: [],
        isDefault: true,
        isNew: true,
      })
    }

    return NextResponse.json({
      id: playbook.id,
      name: playbook.name,
      stages: playbook.stages,
      objectionBank: playbook.objectionBank,
      techniques: (playbook as Record<string, unknown>).techniques || [],
      keywords: playbook.keywords,
      scripts: (playbook as Record<string, unknown>).scripts || [],
      isDefault: playbook.isDefault,
      isNew: false,
    })
  } catch (error) {
    console.error('[Playbook GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: session.id } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }
    if (!can(rbacUser, 'playbook:manage')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, stages, objectionBank, keywords, techniques, scripts } = body

    if (!name || !stages) {
      return NextResponse.json({ error: 'Missing required fields: name, stages' }, { status: 400 })
    }

    // Upsert: find existing active playbook for this org, or create new
    const existing = await db.playbook.findFirst({
      where: { orgId: session.orgId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })

    const data = {
      name,
      stages: JSON.parse(JSON.stringify(stages)),
      objectionBank: JSON.parse(JSON.stringify(objectionBank || [])),
      keywords: JSON.parse(JSON.stringify(keywords || {})),
      techniques: JSON.parse(JSON.stringify(techniques || [])),
      scripts: JSON.parse(JSON.stringify(scripts || [])),
    }

    let playbook
    if (existing) {
      playbook = await db.playbook.update({
        where: { id: existing.id },
        data,
      })
    } else {
      playbook = await db.playbook.create({
        data: {
          ...data,
          orgId: session.orgId,
          isDefault: true,
          isActive: true,
        },
      })
    }

    return NextResponse.json({
      id: playbook.id,
      name: playbook.name,
      stages: playbook.stages,
      objectionBank: playbook.objectionBank,
      techniques: (playbook as Record<string, unknown>).techniques || [],
      keywords: playbook.keywords,
      scripts: (playbook as Record<string, unknown>).scripts || [],
      isDefault: playbook.isDefault,
      isNew: false,
    })
  } catch (error) {
    console.error('[Playbook POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
