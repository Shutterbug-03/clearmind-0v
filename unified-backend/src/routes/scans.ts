import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (_req, res) => {
  const scans = await prisma.scan.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return res.json(
    scans.map((s) => ({
      id: s.id,
      type: s.type,
      inputLabel: s.inputLabel,
      timestamp: s.createdAt,
      result: { confidence: s.confidence, flags: (s.flags as string[]) || [], summary: s.summary },
    }))
  );
});

export default router;


