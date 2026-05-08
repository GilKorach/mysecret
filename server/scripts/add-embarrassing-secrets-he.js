const { pool, transaction } = require('../db');
const { makeTitle, makeSlug } = require('../utils');

const secrets = [
  'הפדיחה הכי גדולה שלי הייתה כששלחתי הודעת קול על הבוס שלי לקבוצה של העבודה במקום לחבר. ניסיתי למחוק מהר, אבל כולם כבר שמעו.',
  'נכנסתי לחתונה באולם הלא נכון, בירכתי את הכלה, הצטלמתי עם המשפחה ורק אחרי רבע שעה הבנתי שאני לא מכיר שם אף אחד.',
  'באמצע דייט ראשון קראתי לה בשם של האקסית שלי. היא צחקה, אני צחקתי, אבל בפנים רציתי להיעלם מתחת לשולחן.',
  'עליתי לאוטובוס, אמרתי לנהג בוקר טוב בקול גדול, ואז נתקעתי בדלת כי התיק שלי נתפס. כל האוטובוס הסתכל.',
  'חשבתי שהמצלמה בזום כבויה וקמתי להביא מים עם פיג׳מה מצחיקה. רק כשכולם התחילו לחייך הבנתי שאני עדיין בשידור חי.',
  'שלחתי לאמא שלי צילום מסך של שיחה עם חבר, ושכחתי שמעל זה פתוח חיפוש בגוגל על איך להתחמק מארוחת שישי.',
  'במסעדה ניסיתי להרשים ואמרתי למלצר שאני מבין ביין. בסוף הזמנתי בטעות את הבקבוק הכי יקר בתפריט ולא היה לי נעים לבטל.',
  'נופפתי למישהו ברחוב בהתלהבות, רצתי אליו כמעט בחיבוק, ואז הבנתי שזה לא מי שחשבתי. המשכתי ללכת כאילו אני מתאמן.',
  'באתי לראיון עבודה עם חולצה הפוכה. המראיין אמר לי בסוף השיחה שיש לי תווית גדולה על החזה. לא קיבלתי את העבודה.',
  'שלחתי הודעה רומנטית למישהי שאני אוהב, אבל בטעות שלחתי אותה לקבוצת המשפחה. סבתא שלי ענתה ראשונה: "בהצלחה חמוד".',
  'עמדתי בתור לקופה ודיברתי לעצמי על כמה התור איטי. רק כששמעתי צחוק מאחורי הבנתי שהאוזניות שלי בכלל לא מחוברות לטלפון.',
  'בישיבה בעבודה ניסיתי להגיד משהו חכם באנגלית, התבלבלתי במילה, ואז המשכתי בביטחון כאילו המצאתי מושג מקצועי חדש.',
  'באתי לביקור אצל חבר, חלצתי נעליים בכניסה וגיליתי אחרי שעה שאני עם שני גרביים בצבעים שונים ועם חור בדיוק מול כולם.',
  'הזמנתי משלוח לדירה הישנה שלי, וכשהשליח התקשר כבר הייתי למטה בבניין החדש עם כפכפים ופיג׳מה, מנסה להסביר לו שאני בעצמי הבעיה.',
  'נכנסתי למעלית עם שכנה ואמרתי לה מזל טוב על ההריון. היא הסתכלה עליי ואמרה שהיא רק חוזרת מהסופר עם מעיל נפוח.',
  'שלחתי למורה של הילד הודעה שאמורה הייתה ללכת לבן הזוג שלי, כולל תלונה על כמה אין לי כוח לאסיפת ההורים.',
  'בחתונה רקדתי בהתלהבות ליד מעגל אנשים, ואז הבנתי שהם בכלל מצלמים סרטון שקט ומרגש לזוג ואני נכנסתי לפריים באמצע.',
  'בבית קפה ניסיתי למשוך דלת שכתוב עליה לדחוף, התעקשתי שלוש פעמים, ואז העובד פתח אותה מבפנים בלי להגיד מילה.',
  'עניתי לטלפון בעבודה בקול של תינוק כי הייתי בטוח שזה אחיין שלי. זה היה לקוח חדש שרצה הצעת מחיר.',
  'הלכתי ברחוב עם שקית אשפה בדרך לפח, ובטעות נכנסתי איתה למכולת כאילו זה תיק הקניות שלי.'
];

const palette = [
  ['#361b12', '#fff4ec', 'right'],
  ['#132c2a', '#edfffb', 'center'],
  ['#2b1834', '#fbf0ff', 'right'],
  ['#112b3a', '#ecf8ff', 'center'],
  ['#302615', '#fff8e8', 'right']
];

async function main() {
  const [users] = await pool.execute(
    'SELECT id FROM users WHERE is_active = 1 ORDER BY id ASC LIMIT 10'
  );

  if (!users.length) {
    throw new Error('No active users found.');
  }

  let inserted = 0;

  await transaction(async (conn) => {
    for (let i = 0; i < secrets.length; i += 1) {
      const content = secrets[i];
      const title = makeTitle(content);
      const slug = makeSlug(title);
      const userId = users[i % users.length].id;
      const [backgroundColor, textColor, textAlign] = palette[i % palette.length];
      const minutesAgo = i;

      const [result] = await conn.execute(
        `INSERT INTO secrets
          (user_id, content, title, slug, background_color, text_color, text_align, created_at, updated_at)
         SELECT :userId, :content, :title, :slug, :backgroundColor, :textColor, :textAlign,
                UTC_TIMESTAMP() - INTERVAL :minutesAgo MINUTE,
                UTC_TIMESTAMP() - INTERVAL :minutesAgo MINUTE
         WHERE NOT EXISTS (
           SELECT 1 FROM secrets WHERE user_id = :userId AND content = :content AND is_deleted = 0
         )`,
        {
          userId,
          content,
          title,
          slug,
          backgroundColor,
          textColor,
          textAlign,
          minutesAgo
        }
      );

      if (result.affectedRows > 0) {
        inserted += 1;
      }
    }
  });

  const [rows] = await pool.execute(
    `SELECT id, content, created_at
     FROM secrets
     WHERE content IN (${secrets.map(() => '?').join(',')})
       AND is_deleted = 0
     ORDER BY created_at DESC`,
    secrets
  );

  console.log(JSON.stringify({ inserted, totalPresent: rows.length, rows }, null, 2));
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
