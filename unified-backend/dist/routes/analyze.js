import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { analyzeFileBuffer, analyzeLink, analyzeText } from '../services/analyzer';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const TextSchema = z.object({ text: z.string().min(1) });
const LinkSchema = z.object({ url: z.string().url() });
router.post('/text', async (req, res) => {
    const parse = TextSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: 'Invalid body' });
    const { text } = parse.data;
    const result = await analyzeText(text);
    const scan = await prisma.scan.create({
        data: {
            type: 'text',
            inputLabel: text.slice(0, 80),
            confidence: result.confidence,
            flags: result.flags,
            summary: result.summary,
        },
    });
    return res.json({ id: scan.id, type: scan.type, inputLabel: scan.inputLabel, timestamp: scan.createdAt, result });
});
router.post('/link', async (req, res) => {
    const parse = LinkSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: 'Invalid body' });
    const { url } = parse.data;
    const result = await analyzeLink(url);
    const scan = await prisma.scan.create({
        data: {
            type: 'link',
            inputLabel: url,
            confidence: result.confidence,
            flags: result.flags,
            summary: result.summary,
        },
    });
    return res.json({ id: scan.id, type: scan.type, inputLabel: scan.inputLabel, timestamp: scan.createdAt, result });
});
router.post('/file', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: 'No file uploaded' });
    const result = await analyzeFileBuffer(file.buffer, file.mimetype, file.originalname, file.size);
    const type = file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : 'image';
    const label = `${file.originalname} (${Math.round(file.size / 1024)}KB)`;
    const scan = await prisma.scan.create({
        data: {
            type,
            inputLabel: label,
            confidence: result.confidence,
            flags: result.flags,
            summary: result.summary,
        },
    });
    return res.json({ id: scan.id, type: scan.type, inputLabel: scan.inputLabel, timestamp: scan.createdAt, result });
});
export default router;
