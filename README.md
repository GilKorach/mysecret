# MySecret

MySecret is a Hebrew-only, RTL, mobile-first anonymous social network for sharing text secrets.

## Environment

1. Copy `.env.example` to `.env`.
2. Fill in the real production values on the server.
3. Do not commit `.env`.

Example server setup:

```bash
cp .env.example .env
```

Required values in `.env`:

```bash
DB_HOST=localhost
DB_USER=AI
DB_PASSWORD=your_real_database_password
DB_NAME=MySecret
JWT_SECRET=your_long_random_jwt_secret
PORT=3001
NODE_ENV=production
```

## Setup

1. Make sure the existing schema `MySecret` already exists.
2. Run the migration:

```bash
npm run db:migrate
```

Optional demo data:

```bash
SEED_USER_PASSWORD=your_demo_password npm run db:seed
```

3. Start development:

```bash
npm run dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:3001`

The migration only targets the existing schema and starts with:

```sql
USE `MySecret`;
```

## Deployment

On the server:

```bash
chmod +x deploy.sh
./deploy.sh
```

The deploy script runs:

```bash
git pull
npm install
npm run build
pm2 restart mysecret
```
