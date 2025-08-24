# Database

This project uses SQLite via Prisma. The schema and migrations live in `backend/prisma/`.

Key files:
- `backend/prisma/schema.prisma`
- SQLite DB file configured by `DATABASE_URL` in `backend/.env` (default `file:./dev.db`)

Use Prisma CLI from the `backend/` directory:
- `npx prisma generate`
- `npx prisma migrate dev --name init`
- `npx prisma studio`


