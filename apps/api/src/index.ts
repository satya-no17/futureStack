import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db';
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

// Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`[Inkloom API] Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Inkloom API] Startup failure:', err);
    process.exit(1);
  }
}

startServer();
