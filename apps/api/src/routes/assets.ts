import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../services/audit';
import { scanSlideDeck, SlideData } from '../services/review/slideScanner';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
router.param('id', (req, res, next, id) => {
  if (!UUID_REGEX.test(id)) {
    res.status(404).json({ error: 'Slide asset not found' });
    return;
  }
  next();
});

// 1. Scan Slide Deck / Visual Asset
router.post('/scan-slide-deck', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  const { title = 'Untitled Slide Deck', fileType = 'pdf', slides = [] } = req.body;

  if (!Array.isArray(slides) || slides.length === 0) {
    res.status(400).json({ error: 'Please provide at least one slide with content' });
    return;
  }

  try {
    const scanResult = await scanSlideDeck(orgId, title, slides as SlideData[]);

    // Persist to slide_assets
    const asset = await queryOne<{ id: string; created_at: string }>(
      `INSERT INTO slide_assets (organization_id, uploaded_by, title, file_type, page_count, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        orgId,
        userId,
        title,
        fileType,
        slides.length,
        JSON.stringify({ overallScore: scanResult.overallScore, summary: scanResult.summary })
      ]
    );

    // Persist slide scans
    if (asset?.id) {
      for (const s of scanResult.slides) {
        await query(
          `INSERT INTO slide_scans (organization_id, slide_asset_id, slide_number, extracted_text, visual_issues, score)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orgId, asset.id, s.slideNumber, s.body, JSON.stringify(s.issues), s.score]
        );
      }

      await logAudit(orgId, userId, 'scan_slide_deck', 'slide_asset', asset.id, {
        title,
        pageCount: slides.length,
        overallScore: scanResult.overallScore
      });

      scanResult.assetId = asset.id;
    }

    res.json(scanResult);
  } catch (err: any) {
    console.error('[Assets] Failed to scan slide deck:', err);
    res.status(500).json({ error: 'Failed to scan slide deck', details: err.message });
  }
});

// 2. Get Recent Slide Scans
router.get('/slide-decks', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;

  const assets = await query(
    `SELECT a.id, a.title, a.file_type, a.page_count, a.metadata, a.created_at,
            u.name as uploader_name
     FROM slide_assets a
     JOIN users u ON a.uploaded_by = u.id
     WHERE a.organization_id = $1
     ORDER BY a.created_at DESC
     LIMIT 20`,
    [orgId]
  );

  res.json({ assets });
});

// 3. Get Slide Deck Details
router.get('/slide-decks/:id', authenticate, async (req: Request, res: Response) => {
  const orgId = req.user!.orgId;
  const { id } = req.params;

  const asset = await queryOne(
    `SELECT a.id, a.title, a.file_type, a.page_count, a.metadata, a.created_at,
            u.name as uploader_name
     FROM slide_assets a
     JOIN users u ON a.uploaded_by = u.id
     WHERE a.id = $1 AND a.organization_id = $2`,
    [id, orgId]
  );

  if (!asset) {
    res.status(404).json({ error: 'Slide asset not found' });
    return;
  }

  const slides = await query(
    `SELECT slide_number, extracted_text, visual_issues, score
     FROM slide_scans
     WHERE slide_asset_id = $1 AND organization_id = $2
     ORDER BY slide_number ASC`,
    [id, orgId]
  );

  res.json({ asset, slides });
});

// 4. Built-in Demo Presentation Generator (For 1-click test/demo)
router.get('/demo-deck', authenticate, async (req: Request, res: Response) => {
  const demoSlides: SlideData[] = [
    {
      slideNumber: 1,
      title: 'ACME ENTERPRISE GROWTH & PRODUCT LAUNCH 2026',
      body: 'Leading the future of next-gen enterprise data workflows.\nNotice: Confidential investor preview.',
      elements: [
        { type: 'logo', content: 'Acme Logo', x: 10, y: 12, width: 120, height: 40 },
        { type: 'text', content: 'Confidential investor preview text touching logo perimeter', x: 135, y: 15, width: 250, height: 30 }
      ]
    },
    {
      slideNumber: 2,
      title: 'Market Superiority',
      body: 'Our app is the #1 fastest tool, guaranteed! We offer cheap rates and 100% market dominance across every cloud region.',
      elements: [
        { type: 'text', content: '#1 fastest tool with cheap rates', x: 50, y: 100, width: 400, height: 60 }
      ]
    },
    {
      slideNumber: 3,
      title: 'Scale & User Adoption',
      body: 'Trusted by millions of active daily users globally with zero downtime ever recorded.',
      elements: [
        { type: 'text', content: 'Trusted by millions of active daily users', x: 50, y: 120, width: 350, height: 50 }
      ]
    },
    {
      slideNumber: 4,
      title: 'Enterprise Architecture & Reliability',
      body: 'Acme provides enterprise data orchestration backed by a 99.95% uptime SLA and SOC2 Type II certification for 500+ Fortune 500 organizations.',
      elements: [
        { type: 'logo', content: 'Acme Logo', x: 50, y: 50, width: 120, height: 40 },
        { type: 'text', content: 'Enterprise SLA & Security Specs', x: 50, y: 160, width: 500, height: 80 }
      ]
    }
  ];

  res.json({
    title: 'Acme Q4 Enterprise Launch Pitch Deck',
    fileType: 'pptx',
    slides: demoSlides
  });
});

export default router;
