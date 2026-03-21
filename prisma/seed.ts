import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'guy@kolio.ai'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!'
  const orgName = 'Project Adam'
  const orgSlug = 'project-adam'

  console.log('Seeding database...')

  // Create or find default org
  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: {
      name: orgName,
      slug: orgSlug,
      plan: 'PRO',
      planSeats: 20,
    },
  })
  console.log(`Organization: ${org.name} (${org.id})`)

  // Create or update admin user
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isAdmin: true,
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      name: 'Guy Bidani',
      passwordHash,
      orgId: org.id,
      role: 'ADMIN',
      isAdmin: true,
    },
  })
  console.log(`Admin user: ${user.email} (${user.id})`)
  console.log(`Password: ${adminPassword}`)

  // Create default playbook for the org
  const existingPlaybook = await prisma.playbook.findFirst({
    where: { orgId: org.id, isDefault: true },
  })

  if (!existingPlaybook) {
    const playbook = await prisma.playbook.create({
      data: {
        orgId: org.id,
        name: 'תסריט מכירה ראשי - Project Adam',
        description: 'תסריט ברירת מחדל למכירת שירותי שיווק דיגיטלי',
        isDefault: true,
        isActive: true,
        stages: [
          { name: 'פתיחה', criteria: 'יצירת רושם ראשוני חיובי, הצגה עצמית, בניית אמון ראשוני, שאלת שובר קרח', weight: 7 },
          { name: 'גילוי צרכים', criteria: 'שאלות פתוחות, הבנת המצב הנוכחי, זיהוי כאבים ואתגרים, הבנת תקציב ותהליך קבלת החלטות', weight: 9 },
          { name: 'הצגת ערך', criteria: 'התאמת הפתרון לצרכים שעלו, שימוש בדוגמאות ותוצאות, הדגמת ROI, הוכחות חברתיות', weight: 8 },
          { name: 'טיפול בהתנגדויות', criteria: 'הקשבה, הכלה, מענה מדויק, שימוש בהוכחות חברתיות, חזרה לערך', weight: 8 },
          { name: 'סגירה', criteria: 'סיכום ערך, יצירת דחיפות, הצעת צעד הבא ברור, קביעת מועד להמשך', weight: 9 },
        ],
        objectionBank: [
          { objection: 'יקר לי', category: 'price', idealResponse: 'אני מבין שהתקציב חשוב. בוא נסתכל על זה מזווית אחרת - כמה עולה לך היום כל ליד? עם השירות שלנו, העלות לליד יורדת משמעותית' },
          { objection: 'אני צריך לחשוב על זה', category: 'timing', idealResponse: 'בהחלט, זו החלטה חשובה. מה בדיוק היית רוצה לבדוק? אם זה נושא התקציב או ההתאמה, בוא נעבור על זה ביחד עכשיו' },
          { objection: 'יש לי כבר ספק אחר', category: 'competition', idealResponse: 'מעולה שאתה כבר משקיע בשיווק. מה התוצאות שאתה מקבל היום? הרבה לקוחות שלנו הגיעו בדיוק מהמצב הזה' },
          { objection: 'לא עכשיו, אולי בעוד חודש', category: 'timing', idealResponse: 'אני מבין. רק שתדע - כל חודש שעובר זה לידים שאתה מפסיד. מה אם נתחיל עם תוכנית מצומצמת?' },
          { objection: 'אני צריך להתייעץ עם השותף', category: 'authority', idealResponse: 'בטח, חשוב שכולם יהיו על אותו דף. מה אם נקבע שיחה קצרה שלושתנו ביחד?' },
        ],
        techniques: [
          { name: 'שאלות פתוחות', description: 'שאילת שאלות שמעודדות תשובה מפורטת ולא רק כן/לא', example: 'ספר לי איך אתה מקבל לקוחות היום?' },
          { name: 'שיקוף', description: 'חזרה על דברי הלקוח במילים שלך כדי להראות הבנה', example: 'אם אני מבין נכון, מה שמפריע לך זה ש...' },
          { name: 'סיכום ביניים', description: 'עצירה באמצע השיחה לסכם מה עלה עד כה', example: 'אז בוא נסכם - דיברנו על X, Y ו-Z. נכון?' },
          { name: 'יצירת דחיפות', description: 'הדגשת מה הלקוח מפסיד בכל יום שהוא לא פועל', example: 'כל שבוע שעובר בלי נוכחות דיגיטלית זה לפחות 10 לידים שהלכו למתחרים' },
          { name: 'הוכחה חברתית', description: 'שיתוף סיפורי הצלחה ותוצאות של לקוחות דומים', example: 'לקוח שלנו בתחום שלך עלה מ-5 ל-30 לידים בחודש תוך 3 חודשים' },
        ],
        keywords: {
          positive: ['ערבות', 'הבטחה', 'תוצאות', 'הצלחה', 'צמיחה', 'ROI', 'החזר השקעה', 'בדיוק', 'מצוין', 'בטוח'],
          negative: ['אני חושב', 'אולי', 'לא בטוח', 'נראה לי', 'יכול להיות', 'אממ', 'כאילו', 'בעצם'],
        },
        scripts: [],
        scoringWeights: {},
      },
    })
    console.log(`Default playbook: ${playbook.name} (${playbook.id})`)
  } else {
    console.log(`Default playbook already exists: ${existingPlaybook.name} (${existingPlaybook.id})`)
  }

  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
