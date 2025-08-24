import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import scansRouter from './routes/scans';
import summaryRouter from './routes/summary';
import electionAnalysisRouter from './routes/election-analysis';
import eciFactCheckRouter from './routes/eci-fact-check';

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:8080';

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/analyze', analyzeRouter);
app.use('/api/scans', scansRouter);
app.use('/api/analyze', summaryRouter); // AI-powered summary generation
app.use('/api/summary', summaryRouter); // Alternative route for summary
app.use('/api/election', electionAnalysisRouter); // God-tier India election analysis
app.use('/api/eci', eciFactCheckRouter); // ECI fact-checking and verification services

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


