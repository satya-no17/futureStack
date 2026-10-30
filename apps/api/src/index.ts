import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, queryOne } from './db';
import { seedDatabase } from './db/seed';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import guidelinesRouter from './routes/guidelines';
import factsRouter from './routes/facts';
import bannedTermsRouter from './routes/bannedTerms';
import contentsRouter from './routes/contents';
import commentsRouter from './routes/comments';
import reviewsRouter from './routes/reviews';
import issuesRouter from './routes/issues';
import approvalsRouter from './routes/approvals';
import analyticsRouter from './routes/analytics';
import auditLogsRouter from './routes/auditLogs';
import accessibilityRouter from './routes/accessibility';
import assetsRouter from './routes/assets';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Inkloom AI Backend API',
    timestamp: new Date().toISOString()
  });
});

// Seed Endpoint (can be accessed via browser or POST request)
app.all('/seed', async (req, res) => {
  try {
    console.log('[Seed Endpoint] Seeding database via HTTP request...');
    await seedDatabase();
    res.json({
      status: 'success',
      message: 'Database seeded successfully with Acme Enterprise, Zest Social, and Solo Studio workspaces!',
      demoCredentials: {
        password: 'password123',
        accounts: [
          'admin@acme.com',
          'creator@acme.com',
          'reviewer@acme.com',
          'admin@zest.io',
          'creator@zest.io',
          'solo@creator.dev'
        ]
      }
    });
  } catch (err: any) {
    console.error('[Seed Endpoint] Error during seed:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Routes
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/guidelines', guidelinesRouter);
app.use('/facts', factsRouter);
app.use('/banned-terms', bannedTermsRouter);
app.use('/contents', contentsRouter);
app.use('/contents', commentsRouter);
app.use('/reviews', reviewsRouter);
app.use('/issues', issuesRouter);
app.use('/approvals', approvalsRouter);
app.use('/analytics', analyticsRouter);
app.use('/audit-logs', auditLogsRouter);
app.use('/accessibility', accessibilityRouter);
app.use('/assets', assetsRouter);

// Error Handler
app.use(errorHandler);

// Process safety guards
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});

async function startServer() {
  try {
    await initDb();

    // Auto-seed if database has 0 organizations (perfect for Render free tier!)
    try {
      const orgCount = await queryOne<{ count: string }>('SELECT count(*) FROM organizations');
      if (!orgCount || parseInt(orgCount.count, 10) === 0) {
        console.log('[Auto-Seed] Empty database detected. Seeding demo data automatically...');
        await seedDatabase();
      }
    } catch (err: any) {
      console.warn('[Auto-Seed] Notice checking organization count:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`[Inkloom API] Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Inkloom API] Startup failure:', err);
    process.exit(1);
  }
}

startServer();
