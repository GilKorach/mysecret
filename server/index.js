const express = require('express');
const next = require('next');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { ZodError } = require('zod');
const { env, validateConfig } = require('./config');

validateConfig();

const dev = env.nodeEnv !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

async function main() {
  await nextApp.prepare();

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: dev ? ['http://localhost:3000'] : true, credentials: true }));
  app.use(express.json({ limit: '128kb' }));
  app.use(cookieParser());
  app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/secrets', require('./routes/secrets'));
  app.use('/api/comments', require('./routes/comments'));
  app.use('/api/search', require('./routes/search'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/reports', require('./routes/reports'));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.all('*', (req, res) => handle(req, res));

  app.use((error, _req, res, _next) => {
    if (error instanceof ZodError) return res.status(400).json({ message: 'הנתונים שנשלחו אינם תקינים', issues: error.issues });
    console.error(error);
    return res.status(500).json({ message: 'אירעה שגיאה, נסו שוב בעוד רגע' });
  });

  app.listen(env.port, () => {
    console.log(`MySecret server listening on http://localhost:${env.port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
