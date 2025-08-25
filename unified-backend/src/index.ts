import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import scansRouter from './routes/scans';
import summaryRouter from './routes/summary';
import { apiKeyAuth } from './middleware/auth';

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8080';

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

// Public health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Protected API routes (auth disabled for development)
const apiRouter = express.Router();
// apiRouter.use(apiKeyAuth); // Disabled for development

apiRouter.use('/analyze', analyzeRouter);
apiRouter.use('/scans', scansRouter);
apiRouter.use('/summary', summaryRouter);

app.use('/api', apiRouter);


app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


