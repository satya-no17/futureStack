import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// GET /analytics/summary
router.get('/summary', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  // 1. Top violated rules & banned terms
  const topViolations = await query(
    `SELECT i.quote, i.type, i.severity, i.source_ref, COUNT(*)::int as count
     FROM issues i
     WHERE i.organization_id = $1
     GROUP BY i.quote, i.type, i.severity, i.source_ref
     ORDER BY count DESC
     LIMIT 10`,
    [orgId]
  );

  // 2. Score trend by week
  const scoreTrend = await query(
    `SELECT TO_CHAR(DATE_TRUNC('week', r.started_at), 'YYYY-"W"IW') as week,
            ROUND(AVG(r.score), 1)::float as avg_score,
            COUNT(r.id)::int as reviews_count
     FROM reviews r
     WHERE r.organization_id = $1 AND r.status = 'done'
     GROUP BY DATE_TRUNC('week', r.started_at)
     ORDER BY DATE_TRUNC('week', r.started_at) ASC
     LIMIT 12`,
    [orgId]
  );

  // 3. Repeat issues by user
  const repeatIssuesByUser = await query(
    `SELECT u.id as user_id, u.name as user_name, u.email as user_email,
            COUNT(DISTINCT c.id)::int as contents_created,
            COUNT(i.id)::int as total_issues_triggered,
            COUNT(CASE WHEN i.severity = 'high' THEN 1 END)::int as high_issues
     FROM users u
     JOIN contents c ON c.created_by = u.id AND c.organization_id = u.organization_id
     LEFT JOIN content_versions cv ON cv.content_id = c.id
     LEFT JOIN reviews r ON r.content_version_id = cv.id
     LEFT JOIN issues i ON i.review_id = r.id
     WHERE u.organization_id = $1
     GROUP BY u.id, u.name, u.email
     ORDER BY total_issues_triggered DESC`,
    [orgId]
  );

  // 4. Ambiguous rules: rules broken frequently by 2 or more distinct authors
  const ambiguousRules = await query(
    `SELECT i.source_ref, i.type,
            COUNT(DISTINCT c.created_by)::int as distinct_violators,
            COUNT(i.id)::int as total_occurrences
     FROM issues i
     JOIN reviews r ON r.id = i.review_id
     JOIN content_versions cv ON cv.id = r.content_version_id
     JOIN contents c ON c.id = cv.content_id
     WHERE i.organization_id = $1
     GROUP BY i.source_ref, i.type
     HAVING COUNT(DISTINCT c.created_by) >= 2
     ORDER BY total_occurrences DESC
     LIMIT 5`,
    [orgId]
  );

  // 5. High-level metric cards
  const stats = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM contents WHERE organization_id = $1) as total_drafts,
       (SELECT COUNT(*)::int FROM contents WHERE organization_id = $1 AND status IN ('approved', 'published')) as approved_count,
       (SELECT COALESCE(ROUND(AVG(score), 1), 100)::float FROM reviews WHERE organization_id = $1 AND status = 'done') as org_avg_score,
       (SELECT COUNT(*)::int FROM issues WHERE organization_id = $1 AND status = 'open') as open_issues_count`,
    [orgId]
  );

  res.json({
    stats: stats[0] || {},
    topViolations,
    scoreTrend,
    repeatIssuesByUser,
    ambiguousRules
  });
});

export default router;
