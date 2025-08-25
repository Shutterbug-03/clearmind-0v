import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('API_KEY not found in environment variables. Please add it to your .env file.');
  // We don't want to exit the process in a real app, but for now it's a clear indicator.
  // In a real app, you'd have a more robust configuration management system.
  throw new Error('API_KEY is not defined in the environment variables.');
}

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const providedApiKey = authHeader.split(' ')[1];

  if (providedApiKey !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }

  next();
};
