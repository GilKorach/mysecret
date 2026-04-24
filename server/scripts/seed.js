const bcrypt = require('bcryptjs');
const { env, validateConfig } = require('../config');
const { pool, transaction } = require('../db');
const { makeTitle, makeSlug } = require('../utils');

const users = [
  ['צל_שקט', 'female', '1997-04-12', 'כותבת את מה שקשה להגיד בקול.'],
  ['בלי_מסכה', 'male', '1992-11-03', 'כאן כדי להיות אמיתי פעם אחת ביום.'],
  ['לב_פתוח', 'other', '2000-08-22', 'סודות קטנים, נשימות גדולות.'],
  ['מישהו_מהעיר', 'male', '1989-02-18', 'לא מחפש שיראו אותי, רק שיבינו.'],
  ['אור_אחרי_חצות', 'female', '1995-06-09', 'יש דברים שנכתבים רק בלילה.'],
  ['כמעט_אמרתי', 'female', '2002-01-30', 'כל מה שנשאר על קצה הלשון.'],
  ['נשימה_עמוקה', 'other', '1999-09-14', 'מקום קטן לכנות גדולה.'],
  ['שקט_רועש', 'male', '1994-12-01', 'לפעמים השקט הוא הדבר הכי חזק.'],
  ['מאחורי_החיוך', 'female', '1991-05-25', 'חיוך בחוץ, אמת בפנים.'],
  ['שם_בדוי', 'male', '1998-03-17', 'אני לא אנונימי לעצמי.']
];

const secrets = [
  ['צל_שקט', 'הסוד שלי הוא שאני לא מתגעגעת לאדם שעזב, אני מתגעגעת לגרסה שלי שהאמינה שהכל עוד אפשרי.', '#2b1118', '#fff2f5', 'center'],
  ['בלי_מסכה', 'אני עונה "הכל בסדר" כל כך מהר, שאף אחד כבר לא שם לב שזה המשפט הכי לא אמיתי שאני אומר.', '#111827', '#f8fafc', 'right'],
  ['לב_פתוח', 'לפעמים אני מוחק הודעה לא כי התחרטתי, אלא כי פחדתי שמישהו סוף סוף יבין כמה אני צריך אותו.', '#12302b', '#eafff8', 'center'],
  ['מישהו_מהעיר', 'יש לי חלום ישן שאני מספר עליו כאילו ויתרתי עליו. האמת היא שאני בודק עליו מחירים כל שבוע.', '#1d1a2e', '#f5f0ff', 'right'],
  ['אור_אחרי_חצות', 'אני מקנא באנשים שיודעים לבקש עזרה בלי להרגיש שהם מפריעים לעולם.', '#301926', '#fff3fb', 'center'],
  ['כמעט_אמרתי', 'הכי קשה לי כשמישהו אומר לי "את חזקה". זה נשמע כמו מחמאה, אבל לפעמים זו רק דרך להשאיר אותי לבד עם הכל.', '#231a12', '#fff6e8', 'right'],
  ['נשימה_עמוקה', 'הבטחתי לעצמי שהשנה אני אהיה אמיץ. בינתיים האומץ היחיד שלי הוא להודות שאני עדיין מפחד.', '#0f2d3a', '#eaf9ff', 'center'],
  ['שקט_רועש', 'אני לא מפחד להיכשל. אני מפחד להצליח ואז לגלות שגם זה לא מילא את החור.', '#131516', '#f2f2ed', 'right'],
  ['מאחורי_החיוך', 'יש ימים שבהם אני מתלבש יפה רק כדי שאף אחד לא ישאל אם אני מתפרק.', '#2d1420', '#fff0f4', 'center'],
  ['שם_בדוי', 'אני שומר צילום מסך של מחמאה אחת מלפני שנתיים, כי לפעמים זה הדבר היחיד שמזכיר לי שאני לא בלתי נראה.', '#1b2631', '#eef7ff', 'right'],
  ['צל_שקט', 'פעם חשבתי שסגירת מעגל מגיעה משיחה. היום אני מבינה שלפעמים היא מגיעה מהרגע שבו מפסיקים לחכות לה.', '#25211a', '#fff8ec', 'right', 30],
  ['בלי_מסכה', 'אני מתגעגע לחבר שכבר לא מתאים לי בחיים, וזה מבלבל יותר מפרידה רומנטית.', '#142321', '#ecfffa', 'center', 31],
  ['לב_פתוח', 'הלוואי שמישהו היה רואה כמה מאמץ אני משקיע כדי להיראות רגיל.', '#241729', '#fbf0ff', 'center', 32],
  ['מישהו_מהעיר', 'כל פעם שאני אומר "לא אכפת לי", אני מקווה שמישהו מספיק חכם ישמע שזה כן.', '#111827', '#ffffff', 'right', 33],
  ['אור_אחרי_חצות', 'אני לא רוצה חיים מושלמים. אני רוצה בוקר אחד שבו אני לא מתעוררת עם רשימה של דברים שאני צריכה להוכיח.', '#2d1f13', '#fff4e5', 'right', 34],
  ['כמעט_אמרתי', 'הסיבה שלא שלחתי את ההודעה היא לא גאווה. זו הידיעה שאם לא יענו לי, אני אאמין לזה יותר מדי.', '#2a1322', '#fff0f8', 'center', 35],
  ['נשימה_עמוקה', 'התחלתי להציב גבולות, ואז גיליתי שחלק מהאנשים אהבו אותי רק כשלא היו לי כאלה.', '#102a24', '#f0fff9', 'right', 36],
  ['שקט_רועש', 'לפעמים אני נכנס לאפליקציות רק כדי להרגיש שיש עולם בחוץ, ואז יוצא יותר לבד ממה שנכנסתי.', '#161a24', '#f4f7ff', 'center', 37],
  ['מאחורי_החיוך', 'אני מפחדת שאם אפסיק להיות מצחיקה, אנשים יגלו שאני בעצם עצובה.', '#27131c', '#fff4f7', 'center', 38],
  ['שם_בדוי', 'יש אנשים שאני לא חוסם, רק כדי לא להודות בפני עצמי שאני עדיין מחכה שהם יחזרו.', '#182022', '#f1fffb', 'right', 39]
];

const comments = [
  'זה פגע לי ישר בלב.',
  'לא ידעתי שעוד מישהו מרגיש ככה.',
  'כתבת את זה מדויק מדי.',
  'לפעמים עצם הכתיבה היא התחלה של שחרור.',
  'הלוואי שתהיה לך נשימה קלה היום.',
  'קראתי פעמיים. תודה על האומץ.'
];

const reactions = ['love', 'sad', 'funny', 'shock', 'angry'];

async function main() {
  validateConfig();
  if (env.db.database !== 'MySecret') {
    throw new Error('Seed is allowed only for the MySecret schema.');
  }

  const password = process.env.SEED_USER_PASSWORD;
  if (!password) {
    throw new Error('SEED_USER_PASSWORD is required for seeding demo users.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await transaction(async (conn) => {
    const userIds = {};

    for (let index = 0; index < users.length; index += 1) {
      const [nickname, gender, birthDate, bio] = users[index];
      await conn.execute(
        `INSERT INTO users (nickname, email, password_hash, gender, birth_date, bio)
         VALUES (:nickname, :email, :passwordHash, :gender, :birthDate, :bio)
         ON DUPLICATE KEY UPDATE bio = VALUES(bio), updated_at = CURRENT_TIMESTAMP`,
        {
          nickname,
          email: `seed-${index + 1}@mysecret.local`,
          passwordHash,
          gender,
          birthDate,
          bio
        }
      );
      const [rows] = await conn.execute('SELECT id FROM users WHERE nickname = :nickname LIMIT 1', { nickname });
      userIds[nickname] = rows[0].id;
    }

    const secretIds = [];
    for (let index = 0; index < secrets.length; index += 1) {
      const [nickname, content, backgroundColor, textColor, textAlign, hoursAgo = index + 1] = secrets[index];
      const title = makeTitle(content);
      const slug = makeSlug(title);
      await conn.execute(
        `INSERT INTO secrets
          (user_id, content, title, slug, background_color, text_color, text_align, created_at, updated_at)
         SELECT :userId, :content, :title, :slug, :backgroundColor, :textColor, :textAlign,
          UTC_TIMESTAMP() - INTERVAL :hoursAgo HOUR,
          UTC_TIMESTAMP() - INTERVAL :hoursAgo HOUR
         WHERE NOT EXISTS (
          SELECT 1 FROM secrets WHERE user_id = :userId AND content = :content AND is_deleted = 0
         )`,
        {
          userId: userIds[nickname],
          content,
          title,
          slug,
          backgroundColor,
          textColor,
          textAlign,
          hoursAgo
        }
      );
      const [rows] = await conn.execute('SELECT id FROM secrets WHERE user_id = :userId AND content = :content LIMIT 1', {
        userId: userIds[nickname],
        content
      });
      secretIds.push({ id: rows[0].id, ownerId: userIds[nickname] });
    }

    const allUserIds = Object.values(userIds);
    for (let sIndex = 0; sIndex < secretIds.length; sIndex += 1) {
      const secret = secretIds[sIndex];
      for (let rIndex = 0; rIndex < allUserIds.length; rIndex += 1) {
        const userId = allUserIds[rIndex];
        if (userId === secret.ownerId || (sIndex + rIndex) % 3 === 0) continue;
        await conn.execute(
          `INSERT INTO secret_reactions (secret_id, user_id, reaction)
           VALUES (:secretId, :userId, :reaction)
           ON DUPLICATE KEY UPDATE reaction = VALUES(reaction), updated_at = CURRENT_TIMESTAMP`,
          {
            secretId: secret.id,
            userId,
            reaction: reactions[(sIndex + rIndex) % reactions.length]
          }
        );
      }

      for (let cIndex = 0; cIndex < 2; cIndex += 1) {
        const userId = allUserIds[(sIndex + cIndex + 2) % allUserIds.length];
        if (userId === secret.ownerId) continue;
        const content = comments[(sIndex + cIndex) % comments.length];
        await conn.execute(
          `INSERT INTO comments (secret_id, user_id, content, created_at, updated_at)
           SELECT :secretId, :userId, :content, UTC_TIMESTAMP(), UTC_TIMESTAMP()
           WHERE NOT EXISTS (
            SELECT 1 FROM comments WHERE secret_id = :secretId AND user_id = :userId AND content = :content
           )`,
          { secretId: secret.id, userId, content }
        );
      }
    }

    for (let index = 0; index < allUserIds.length - 1; index += 1) {
      await conn.execute(
        'INSERT IGNORE INTO followers (follower_id, following_id) VALUES (:followerId, :followingId)',
        { followerId: allUserIds[index], followingId: allUserIds[index + 1] }
      );
    }
  });

  console.log('Seed completed for MySecret.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
