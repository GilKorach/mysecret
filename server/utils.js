const hebrewStopWords = new Set(['של', 'את', 'על', 'עם', 'אני', 'זה', 'זו', 'היה', 'היא', 'הוא', 'אבל', 'כי', 'לא', 'כן', 'יש']);

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    nickname: row.nickname,
    gender: row.gender,
    age: row.birth_date ? calculateAge(row.birth_date) : row.age,
    bio: row.bio,
    externalLink: row.external_link,
    followersCount: Number(row.followers_count || 0),
    createdAt: row.created_at
  };
}

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function meaningfulWords(text, min = 6, max = 10) {
  const words = String(text || '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((word) => word && !hebrewStopWords.has(word));
  const selected = words.slice(0, Math.max(min, Math.min(max, words.length || min)));
  return selected.length ? selected.join(' ') : String(text || '').trim().split(/\s+/).slice(0, max).join(' ');
}

function makeTitle(content) {
  return meaningfulWords(content, 6, 10).slice(0, 180) || 'סוד אנונימי';
}

function makeSlug(title) {
  const slug = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 300);
  return slug || 'secret';
}

function secretRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    content: row.content,
    title: row.title,
    slug: row.slug,
    url: `/secret/${row.id}/${row.slug}`,
    backgroundPreset: row.background_preset,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    textAlign: row.text_align,
    reactionsCount: Number(row.reactions_count || 0),
    commentsCount: Number(row.comments_count || 0),
    userReaction: row.user_reaction || null,
    createdAt: row.created_at
  };
}

module.exports = { publicUser, makeTitle, makeSlug, secretRow };
