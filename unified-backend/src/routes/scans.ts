import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

router.get('/', async (req, res) => {
  const parse = paginationSchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid query parameters', details: parse.error.errors });
  }

  const { page, pageSize } = parse.data;
  const skip = (page - 1) * pageSize;

  const [scans, total] = await prisma.$transaction([
    prisma.scan.findMany({
      orderBy: { createdAt: 'desc' },
      take: pageSize,
      skip,
    }),
    prisma.scan.count(),
  ]);

  return res.json({
    scans: scans.map((s) => ({
      id: s.id,
      type: s.type,
      inputLabel: s.inputLabel,
      timestamp: s.createdAt,
      result: { confidence: s.confidence, flags: (s.flags as string[]) || [], summary: s.summary },
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

export default router;


