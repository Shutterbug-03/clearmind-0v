# ClearMind Unified Backend

Express + Prisma (SQLite) API for analysis and scan history.

## Endpoints

- POST `/api/analyze/text` `{ text }`
- POST `/api/analyze/link` `{ url }`
- POST `/api/analyze/file` (multipart form-data: `file`)
- GET `/api/scans`

## Run locally

1. Copy `.env.example` to `.env` and adjust if needed
2. Install deps and set up Prisma
   - `npm i`
   - `npx prisma generate`
   - `npx prisma migrate dev --name init`
3. Start dev server
   - `npm run dev`

Default port: 3001, CORS allows `http://localhost:8080`.

### Environment

Create `.env`:

```
PORT=3001
FRONTEND_ORIGIN=http://localhost:8080
DATABASE_URL=file:./prisma/dev.db
DETECTOR_PROVIDER=heuristic
```


