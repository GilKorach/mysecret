# MySecret

MySecret is a Hebrew-only, RTL, mobile-first anonymous social network for sharing text secrets.

## Setup

1. Copy `.env.example` to `.env` and fill in the MySQL connection values.
2. Make sure the existing schema `MySecret` already exists.
3. Run the migration:

```bash
npm run db:migrate
```

Optional demo data:

```bash
npm run db:seed
```

`SEED_USER_PASSWORD` must be set before seeding demo users.

4. Start development:

```bash
npm run dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4000`

The migration never creates a new schema. It starts with:

```sql
USE `MySecret`;
```
