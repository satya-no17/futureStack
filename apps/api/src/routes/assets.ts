import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../services/audit';
import { scanSlideDeck, SlideData } from '../services/review/slideScanner';
import multer from 'multer';
import { parsePptx } from '../services/review/pptxParser';
import { scanVisualAsset } from '../services/review/visualAssetScanner';
import { computeScore } from '../services/review/score';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });

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

// Accept PowerPoint, PDF, or image input for brand review.
router.post('/scan-upload', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (!err) return next();
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'This file exceeds the 25 MB upload limit.' : 'Could not receive this file. Choose one supported file and try again.' });
  });
}, async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'Choose a .pptx file to scan.' });
    return;
  }
  const extension = file.originalname.split('.').pop()?.toLowerCase();
  if (extension === 'pdf' || ['png', 'jpg', 'jpeg', 'webp'].includes(extension || '')) {
    const mimeType = extension === 'pdf' ? 'application/pdf' : extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
    if (file.size > 14 * 1024 * 1024) {
      res.status(413).json({ error: 'PDF and image scans are limited to 14 MB.' });
      return;
    }
    const validSignature = extension === 'pdf'
      ? file.buffer.subarray(0, 5).toString() === '%PDF-'
      : extension === 'png'
        ? file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : extension === 'webp'
          ? file.buffer.subarray(0, 4).toString() === 'RIFF' && file.buffer.subarray(8, 12).toString() === 'WEBP'
          : file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
    if (!validSignature) {
      res.status(400).json({ error: 'The file content does not match its extension. Choose a valid PDF or image.' });
      return;
    }
    try {
      const pages = await scanVisualAsset(file.buffer, mimeType);
      const title = file.originalname.replace(/\.(pdf|png|jpe?g|webp)$/i, '').slice(0, 180);
      const orgId = req.user!.orgId;
      const userId = req.user!.userId;
      const result = await scanSlideDeck(orgId, title, pages.map(({ slideNumber, title: pageTitle, body }) => ({ slideNumber, title: pageTitle, body })));
      result.slides = result.slides.map((slide, index) => {
        const visualIssues = pages[index].visualFindings.map((finding, findingIndex) => ({
          id: `visual-${slide.slideNumber}-${findingIndex + 1}`,
          slideNumber: slide.slideNumber,
          type: finding.type,
          severity: finding.severity,
          quote: finding.quote,
          explanation: `${finding.explanation} (visual review confidence: ${Math.round(finding.confidence * 100)}%)`,
          suggestion: finding.suggestion
        }));
        const issues = [...slide.issues, ...visualIssues] as any[];
        return { ...slide, issues, score: computeScore(issues as any) };
      });
      result.overallScore = Math.round(result.slides.reduce((sum, slide) => sum + slide.score, 0) / Math.max(1, result.slides.length));
      result.summary.totalIssues = result.slides.reduce((sum, slide) => sum + slide.issues.length, 0);
      result.summary.highSeverity = result.slides.reduce((sum, slide) => sum + slide.issues.filter((issue) => issue.severity === 'high').length, 0);
      result.summary.typographyIssues = result.slides.reduce((sum, slide) => sum + slide.issues.filter((issue) => issue.type === 'typography').length, 0);
      result.summary.logoWarnings = result.slides.reduce((sum, slide) => sum + slide.issues.filter((issue) => issue.type === 'logo_exclusion').length, 0);
      const asset = await queryOne<{ id: string }>(
        `INSERT INTO slide_assets (organization_id, uploaded_by, title, file_type, page_count, metadata)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [orgId, userId, title, extension === 'pdf' ? 'pdf' : 'image', pages.length, JSON.stringify({ overallScore: result.overallScore, summary: result.summary, source: 'visual_upload', aiVisualReview: true })]
      );
      if (asset?.id) {
        for (const slide of result.slides) {
          await query(`INSERT INTO slide_scans (organization_id, slide_asset_id, slide_number, extracted_text, visual_issues, score)
            VALUES ($1, $2, $3, $4, $5, $6)`, [orgId, asset.id, slide.slideNumber, slide.body, JSON.stringify(slide.issues), slide.score]);
        }
        await logAudit(orgId, userId, 'scan_visual_asset', 'slide_asset', asset.id, { title, assetType: extension === 'pdf' ? 'pdf' : 'image', pageCount: pages.length, overallScore: result.overallScore });
        result.assetId = asset.id;
      }
      res.json({ ...result, fileType: extension === 'pdf' ? 'pdf' : 'image', extractionNote: 'OCR and visual findings are AI-assisted estimates. Review each finding against the original asset; image text, logo identification, and spacing may be missed or imprecise.' });
      return;
    } catch (err) {
      console.error('[Assets] Failed to scan visual upload:', err);
      res.status(502).json({ error: err instanceof Error ? err.message : 'Visual review could not finish. Try again.' });
      return;
    }
  }
  if (!file.originalname.toLowerCase().endsWith('.pptx')) {
    res.status(415).json({ error: 'This file type is not supported. Choose .pptx, PDF, PNG, JPG, or WebP.' });
    return;
  }
  if (file.size < 22 || file.buffer.readUInt32LE(0) !== 0x04034b50) {
    res.status(400).json({ error: 'This file does not look like a valid .pptx presentation.' });
    return;
  }
  let slides: SlideData[];
  try {
    slides = parsePptx(file.buffer);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'This presentation could not be read.' });
    return;
  }
  const title = String(req.body.title || file.originalname.replace(/\.pptx$/i, '')).slice(0, 180);
  const orgId = req.user!.orgId;
  const userId = req.user!.userId;
  try {
    const scanResult = await scanSlideDeck(orgId, title, slides);
    const asset = await queryOne<{ id: string }>(
      `INSERT INTO slide_assets (organization_id, uploaded_by, title, file_type, page_count, metadata)
       VALUES ($1, $2, $3, 'pptx', $4, $5) RETURNING id`,
      [orgId, userId, title, slides.length, JSON.stringify({ overallScore: scanResult.overallScore, summary: scanResult.summary, source: 'pptx_upload', textOnly: true })]
    );
    if (asset?.id) {
      for (const slide of scanResult.slides) {
        await query(`INSERT INTO slide_scans (organization_id, slide_asset_id, slide_number, extracted_text, visual_issues, score)
          VALUES ($1, $2, $3, $4, $5, $6)`, [orgId, asset.id, slide.slideNumber, slide.body, JSON.stringify(slide.issues), slide.score]);
      }
      await logAudit(orgId, userId, 'scan_slide_deck', 'slide_asset', asset.id, { title, pageCount: slides.length, overallScore: scanResult.overallScore, source: 'pptx_upload' });
      scanResult.assetId = asset.id;
    }
    res.json({ ...scanResult, fileType: 'pptx', extractionNote: 'Scanned text in standard PowerPoint shapes. Text inside images, charts, and some SmartArt may not be included.' });
  } catch (err: any) {
    console.error('[Assets] Failed to scan uploaded PowerPoint:', err);
    res.status(500).json({ error: 'The presentation could not be scanned. Please try again.' });
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
