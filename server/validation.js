const { z } = require('zod');

const reaction = z.enum(['love', 'sad', 'funny', 'shock', 'angry']);
const reportReason = z.enum(['violence', 'hate_speech', 'personal_data', 'spam', 'explicit_sexual_content', 'threats', 'harassment', 'other']);

const register = z.object({
  nickname: z.string().trim().min(2).max(40),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  gender: z.enum(['female', 'male', 'other']),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const login = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

const secret = z.object({
  content: z.string().trim().min(5).max(4000),
  backgroundPreset: z.string().trim().max(60).optional().nullable(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#111827'),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  textAlign: z.enum(['right', 'center', 'left']).default('right')
});

const comment = z.object({
  content: z.string().trim().min(1).max(500),
  parentId: z.coerce.number().int().positive().optional().nullable()
});

const profile = z.object({
  bio: z.string().trim().max(500).optional().nullable(),
  externalLink: z.string().trim().url().max(500).optional().nullable()
});

const report = z.object({
  targetType: z.enum(['secret', 'comment', 'user']),
  targetId: z.coerce.number().int().positive(),
  reason: reportReason,
  details: z.string().trim().max(1000).optional().nullable()
});

module.exports = { schemas: { register, login, secret, comment, profile, reaction, report } };
