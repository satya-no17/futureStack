import bcrypt from 'bcryptjs';
import { query, queryOne, initDb } from './index';
import { chunkDocument } from '../services/ingestion/chunk';
import { storeGuidelineChunks, storeFactChunks } from '../services/ingestion/store';
import { logAudit } from '../services/audit';

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Initializing database schema...');
  await initDb();

  const passwordHash = await bcrypt.hash('password123', 10);

  // Clear existing demo data
  console.log('[Seed] Cleaning old demo records...');
  await query(`DELETE FROM organizations WHERE name IN ('Acme Enterprise Solutions', 'Zest Social App', 'Solo Studio')`);

  // ==========================================
  // 1. ACME ENTERPRISE SOLUTIONS (B2B Formal)
  // ==========================================
  console.log('[Seed] Seeding Acme Enterprise Solutions...');
  const acmeOrg = await queryOne<{ id: string }>(
    `INSERT INTO organizations (name, type) VALUES ('Acme Enterprise Solutions', 'enterprise') RETURNING id`
  );
  const acmeId = acmeOrg!.id;

  // Acme Users
  const acmeAdmin = await queryOne<{ id: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, 'Victoria Brand', 'admin@acme.com', $2, 'admin') RETURNING id`,
    [acmeId, passwordHash]
  );
  const acmeCreator = await queryOne<{ id: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, 'Leo Writer', 'creator@acme.com', $2, 'creator') RETURNING id`,
    [acmeId, passwordHash]
  );
  const acmeReviewer = await queryOne<{ id: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, 'Sarah Approver', 'reviewer@acme.com', $2, 'reviewer') RETURNING id`,
    [acmeId, passwordHash]
  );

  // Acme Banned Terms (12 terms)
  const acmeBanned = [
    { term: 'cheap', rep: 'cost-effective', reason: 'Diminishes perception of enterprise grade software.', sev: 'high' },
    { term: 'guaranteed', rep: 'backed by our 99.95% SLA', reason: 'Unqualified performance guarantees create contractual liability.', sev: 'high' },
    { term: '#1', rep: 'industry-leading', reason: 'Unsubstantiated numerical ranking prohibited by compliance.', sev: 'high' },
    { term: 'instant', rep: 'near real-time', reason: 'Overpromising response latency.', sev: 'medium' },
    { term: 'hack', rep: 'strategic optimization', reason: 'Informal jargon unsuitable for Fortune 500 audience.', sev: 'medium' },
    { term: 'killer', rep: 'premier', reason: 'Violent or sensationalized vernacular is strictly barred.', sev: 'high' },
    { term: 'our app', rep: 'our enterprise platform', reason: 'Colloquial terminology; refer to product as platform or solution.', sev: 'medium' },
    { term: 'customers', rep: 'enterprise clients', reason: 'Standard brand voice designates B2B buyers as enterprise clients.', sev: 'low' },
    { term: 'disruptive', rep: 'transformative', reason: 'Overused buzzword discouraged in corporate publications.', sev: 'low' },
    { term: 'magic', rep: 'automated workflows', reason: 'Tech descriptions must remain rigorously factual.', sev: 'medium' },
    { term: 'free stuff', rep: 'complimentary tier', reason: 'Unprofessional language.', sev: 'medium' },
    { term: 'crazy fast', rep: 'sub-50ms median latency', reason: 'Informal hyperbole not permitted in brand copy.', sev: 'high' }
  ];

  for (const b of acmeBanned) {
    await query(
      `INSERT INTO banned_terms (organization_id, term, preferred_replacement, reason, severity)
       VALUES ($1, $2, $3, $4, $5)`,
      [acmeId, b.term, b.rep, b.reason, b.sev]
    );
  }

  // Acme Brand Guidelines (Voice & Policy)
  const acmeGuideText = `
# Acme Brand Voice & Style Guide

## 1. Executive Summary & Brand Identity
Acme Enterprise Solutions builds enterprise-grade data orchestration software for Fortune 500 organizations. Our brand voice is authoritative, measured, trustworthy, and precise. We never rely on sensationalism, internet slang, or unverified superlatives. Every claim must be demonstrable through verified technical benchmarks and SOC2-compliant certifications.

## 2. Tone and Terminology Guidelines
We speak with quiet confidence. Avoid aggressive sales pitches or unhedged guarantees. Refer to our software as "our platform", "our solution", or "the Acme infrastructure", never as "our app" or "a little tool". Refer to partners as "enterprise clients" or "organizations", never "users" or "customers".

## 3. Legal and Compliance Boundaries
Never declare Acme as "#1" or "the single best" in marketing collateral unless citing a specifically approved Gartner Magic Quadrant report. Absolute guarantees of 100% security or zero bugs are strictly prohibited. Performance claims must specify exact benchmark conditions.
`;

  const acmeGuide = await queryOne<{ id: string }>(
    `INSERT INTO guidelines (organization_id, title, kind, file_url)
     VALUES ($1, 'Acme Global Brand Style Guide', 'voice', 'acme_brand_guide_2026.pdf') RETURNING id`,
    [acmeId]
  );
  const acmeGuideChunks = chunkDocument(acmeGuideText, 'Acme Brand Voice');
  await storeGuidelineChunks(acmeId, acmeGuide!.id, acmeGuideChunks);

  // Acme Approved Facts
  const acmeFactsText = `
# Acme Enterprise Fact Sheet & Specifications

## Section 1: Reliability and Architecture
- Fact 1: Acme platform provides a contractual 99.95% uptime SLA backed by automated failover.
- Fact 2: System is SOC2 Type II certified and ISO 27001 compliant across all AWS and Azure regions.
- Fact 3: System architecture supports up to 100,000 concurrent streaming pipelines.
- Fact 4: Global median API response latency is 45 milliseconds under standard enterprise load.

## Section 2: Clients and Scale
- Fact 5: Acme powers data pipelines for over 500 enterprise clients worldwide, including 38 Fortune 100 companies.
- Fact 6: The platform processes over 12 billion events daily across 14 geographic data centers.
- Fact 7: We do not serve individual consumer accounts or millions of mobile users; our market is enterprise B2B.

## Section 3: Pricing and Commercial Terms
- Fact 8: Enterprise tier pricing starts at $499 per month billed annually, with custom dedicated clusters available.
- Fact 9: Onboarding includes dedicated technical account management with a 15-minute emergency response SLA.
- Fact 10: Data is encrypted at rest using AES-256 and in transit using TLS 1.3.
- Fact 11: Acme was founded in 2021 by veterans of distributed systems engineering.
- Fact 12: Zero data retention on third-party LLM evaluation pipelines; customer data is never used to train public models.
`;

  const acmeFactsDoc = await queryOne<{ id: string }>(
    `INSERT INTO fact_documents (organization_id, title, file_url, effective_date)
     VALUES ($1, 'Acme Verified Technical Facts & Specs', 'acme_facts_2026.pdf', CURRENT_DATE) RETURNING id`,
    [acmeId]
  );
  const acmeFactChunks = chunkDocument(acmeFactsText, 'Acme Technical Specs');
  await storeFactChunks(acmeId, acmeFactsDoc!.id, acmeFactChunks);

  // Acme Draft 1: Reviewed with open issues
  const draft1 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'Q4 Enterprise Launch LinkedIn Announcement', 'LinkedIn', 'reviewed', 45) RETURNING id`,
    [acmeId, acmeCreator!.id]
  );
  const draft1Body = `Our app is the #1 fastest tool, guaranteed! Trusted by millions of businesses to handle data pipelines with cheap pricing and zero downtime.`;
  const draft1Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [acmeId, draft1!.id, draft1Body, acmeCreator!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [draft1Ver!.id, draft1!.id]);

  const review1 = await queryOne<{ id: string }>(
    `INSERT INTO reviews (organization_id, content_version_id, status, score, finished_at)
     VALUES ($1, $2, 'done', 45, CURRENT_TIMESTAMP) RETURNING id`,
    [acmeId, draft1Ver!.id]
  );

  const acmeIssues = [
    {
      type: 'tone',
      sev: 'medium',
      quote: 'Our app',
      start: 0,
      end: 7,
      exp: 'Colloquial phrasing violates enterprise brand standards. Refer to software as platform or solution.',
      source: 'Acme Brand Voice Guide §2',
      sug: 'Our enterprise platform'
    },
    {
      type: 'unverified_claim',
      sev: 'high',
      quote: '#1 fastest tool',
      start: 15,
      end: 30,
      exp: 'No approved industry benchmark certifies #1 speed ranking. Superlatives create compliance exposure.',
      source: 'Acme Brand Voice Guide §3',
      sug: 'sub-50ms latency platform'
    },
    {
      type: 'banned_term',
      sev: 'high',
      quote: 'guaranteed',
      start: 32,
      end: 42,
      exp: 'Unqualified performance guarantees violate corporate legal guidelines.',
      source: 'Acme Banned Vocabulary Rule',
      sug: 'backed by our 99.95% SLA'
    },
    {
      type: 'contradicted_claim',
      sev: 'high',
      quote: 'millions of businesses',
      start: 55,
      end: 77,
      exp: 'Acme verified client records document 500+ enterprise clients, not millions of consumer accounts.',
      source: 'Acme Technical Specs Fact #5 & #7',
      sug: 'over 500 enterprise clients'
    },
    {
      type: 'banned_term',
      sev: 'high',
      quote: 'cheap pricing',
      start: 110,
      end: 123,
      exp: 'The word cheap degrades product standing and diminishes Fortune 500 brand perception.',
      source: 'Acme Banned Vocabulary Rule',
      sug: 'cost-effective plans starting at $499/mo'
    }
  ];

  for (const iss of acmeIssues) {
    await query(
      `INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open')`,
      [acmeId, review1!.id, iss.type, iss.sev, iss.quote, iss.start, iss.end, iss.exp, iss.source, iss.sug]
    );
  }

  // Acme Draft 2: Submitted waiting in review queue
  const draft2 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'SOC2 Security Certification Press Release', 'Press Release', 'submitted', 92) RETURNING id`,
    [acmeId, acmeCreator!.id]
  );
  const draft2Body = `Acme is pleased to announce completion of our annual SOC2 Type II audit. Our enterprise platform continues to deliver 99.95% uptime SLA for Fortune 500 clients.`;
  const draft2Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [acmeId, draft2!.id, draft2Body, acmeCreator!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [draft2Ver!.id, draft2!.id]);

  const review2 = await queryOne<{ id: string }>(
    `INSERT INTO reviews (organization_id, content_version_id, status, score, finished_at)
     VALUES ($1, $2, 'done', 92, CURRENT_TIMESTAMP) RETURNING id`,
    [acmeId, draft2Ver!.id]
  );
  await query(
    `INSERT INTO comments (organization_id, content_id, version_id, author_id, body)
     VALUES ($1, $2, $3, $4, 'Great work! The citation of our SOC2 compliance and 99.95% SLA matches our verified specs perfectly.')`,
    [acmeId, draft2!.id, draft2Ver!.id, acmeReviewer!.id]
  );

  // Acme Draft 3: Published
  const draft3 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'Annual Engineering Uptime Report', 'Blog', 'published', 100) RETURNING id`,
    [acmeId, acmeAdmin!.id]
  );
  const draft3Body = `In our annual reliability audit, Acme delivered 99.98% actual uptime across all geographic regions, outperforming our contractual 99.95% SLA commitment.`;
  const draft3Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [acmeId, draft3!.id, draft3Body, acmeAdmin!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [draft3Ver!.id, draft3!.id]);

  // Acme Draft 4: Changes Requested
  const draft4 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'Stream Engine Latency Benchmark', 'Blog', 'changes_requested', 72) RETURNING id`,
    [acmeId, acmeCreator!.id]
  );
  const draft4Body = `Our crazy fast data pipeline processes over 12 billion events daily with instant failover support for enterprise clients.`;
  const draft4Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [acmeId, draft4!.id, draft4Body, acmeCreator!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [draft4Ver!.id, draft4!.id]);
  const review4 = await queryOne<{ id: string }>(
    `INSERT INTO reviews (organization_id, content_version_id, status, score, finished_at)
     VALUES ($1, $2, 'done', 72, CURRENT_TIMESTAMP) RETURNING id`,
    [acmeId, draft4Ver!.id]
  );
  await query(
    `INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
     VALUES ($1, $2, 'banned_term', 'high', 'crazy fast', 4, 14, 'Informal hyperbole not permitted in brand copy.', 'Acme Banned Vocabulary', 'sub-50ms latency', 'open')`,
    [acmeId, review4!.id]
  );
  await query(
    `INSERT INTO comments (organization_id, content_id, version_id, author_id, body)
     VALUES ($1, $2, $3, $4, 'Please replace crazy fast with exact median latency specs before we can sign off on this post.')`,
    [acmeId, draft4!.id, draft4Ver!.id, acmeReviewer!.id]
  );

  // Acme Audit Logs
  await logAudit(acmeId, acmeAdmin!.id, 'system_seed', 'organization', acmeId, { description: 'Workspace configured' });
  await logAudit(acmeId, acmeCreator!.id, 'create_content', 'content', draft1!.id, { title: 'Q4 Enterprise Launch LinkedIn Announcement' });
  await logAudit(acmeId, acmeCreator!.id, 'submit_content', 'content', draft2!.id, { title: 'SOC2 Security Certification Press Release' });
  await logAudit(acmeId, acmeAdmin!.id, 'publish_content', 'content', draft3!.id, { title: 'Annual Engineering Uptime Report' });
  await logAudit(acmeId, acmeReviewer!.id, 'request_changes', 'content', draft4!.id, { note: 'Please replace crazy fast with exact latency specs' });

  // ==========================================
  // 2. ZEST SOCIAL APP (Consumer Playful)
  // ==========================================
  console.log('[Seed] Seeding Zest Social App...');
  const zestOrg = await queryOne<{ id: string }>(
    `INSERT INTO organizations (name, type) VALUES ('Zest Social App', 'enterprise') RETURNING id`
  );
  const zestId = zestOrg!.id;

  const zestAdmin = await queryOne<{ id: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, 'Chloe Director', 'admin@zest.io', $2, 'admin') RETURNING id`,
    [zestId, passwordHash]
  );
  const zestCreator = await queryOne<{ id: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, 'Alex Social', 'creator@zest.io', $2, 'creator') RETURNING id`,
    [zestId, passwordHash]
  );
  const zestReviewer = await queryOne<{ id: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, 'Marcus Editor', 'reviewer@zest.io', $2, 'reviewer') RETURNING id`,
    [zestId, passwordHash]
  );

  const zestBanned = [
    { term: 'synergistic', rep: 'fun and connected', reason: 'Stiff corporate jargon forbidden in consumer app.', sev: 'high' },
    { term: 'enterprise-grade', rep: 'super smooth', reason: 'Zest is a casual consumer product, not enterprise B2B.', sev: 'high' },
    { term: 'heretofore', rep: 'until now', reason: 'Archaic terminology.', sev: 'medium' },
    { term: 'furthermore', rep: 'plus', reason: 'Stuffy academic phrasing.', sev: 'low' },
    { term: 'pursuant to', rep: 'as we promised', reason: 'Legalistic phrasing not aligned with upbeat vibe.', sev: 'high' },
    { term: 'leverage', rep: 'use', reason: 'Corporate buzzword.', sev: 'medium' }
  ];

  for (const b of zestBanned) {
    await query(
      `INSERT INTO banned_terms (organization_id, term, preferred_replacement, reason, severity)
       VALUES ($1, $2, $3, $4, $5)`,
      [zestId, b.term, b.rep, b.reason, b.sev]
    );
  }

  const zestGuideText = `
# Zest Social App Voice & Creative Guidelines
Zest is playful, vibrant, conversational, and energetic! We love emojis, friendly banter, and direct address. Use short punchy sentences. Avoid corporate speak, bureaucratic jargon, or pretentious vocabulary.
`;
  const zestGuide = await queryOne<{ id: string }>(
    `INSERT INTO guidelines (organization_id, title, kind, file_url)
     VALUES ($1, 'Zest Community Tone & Playbook', 'voice', 'zest_playbook.md') RETURNING id`,
    [zestId]
  );
  const zestGuideChunks = chunkDocument(zestGuideText, 'Zest Brand Playbook');
  await storeGuidelineChunks(zestId, zestGuide!.id, zestGuideChunks);

  const zestFactsText = `
# Zest Verified Facts
- Fact 1: Zest has over 500,000 active community members worldwide.
- Fact 2: Available on iOS App Store and Google Play Store with a 4.8 star average rating.
- Fact 3: Over 2 million creative photos and reels shared each week.
- Fact 4: 100% free starter tier with no advertisements for early adopters.
`;
  const zestFactsDoc = await queryOne<{ id: string }>(
    `INSERT INTO fact_documents (organization_id, title, file_url, effective_date)
     VALUES ($1, 'Zest App Verified Metrics', 'zest_metrics.md', CURRENT_DATE) RETURNING id`,
    [zestId]
  );
  const zestFactChunks = chunkDocument(zestFactsText, 'Zest Community Facts');
  await storeFactChunks(zestId, zestFactsDoc!.id, zestFactChunks);

  // Zest Draft 1: Reviewed
  const zDraft1 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'Weekend Photo Challenge Announcement', 'Twitter / X', 'reviewed', 78) RETURNING id`,
    [zestId, zestCreator!.id]
  );
  const zDraft1Body = `Hey besties! Ready for our weekend photo challenge? Share your coolest sunset photos and tag our app! The #1 fastest poster wins custom profile badges!`;
  const zDraft1Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [zestId, zDraft1!.id, zDraft1Body, zestCreator!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [zDraft1Ver!.id, zDraft1!.id]);
  const zReview1 = await queryOne<{ id: string }>(
    `INSERT INTO reviews (organization_id, content_version_id, status, score, finished_at)
     VALUES ($1, $2, 'done', 78, CURRENT_TIMESTAMP) RETURNING id`,
    [zestId, zDraft1Ver!.id]
  );
  await query(
    `INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
     VALUES ($1, $2, 'unverified_claim', 'medium', '#1 fastest poster', 113, 131, 'Avoid superlative ranking; emphasize creative participation instead.', 'Zest Playbook §2', 'most creative photo', 'open')`,
    [zestId, zReview1!.id]
  );

  // Zest Draft 2: Submitted in Queue
  const zDraft2 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'New Creator Filters & Sticker Packs Release', 'Blog', 'submitted', 96) RETURNING id`,
    [zestId, zestCreator!.id]
  );
  const zDraft2Body = `We just dropped 20 brand new creator filters and animated sticker packs! Try them out today with all your friends and share your story.`;
  const zDraft2Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [zestId, zDraft2!.id, zDraft2Body, zestCreator!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [zDraft2Ver!.id, zDraft2!.id]);
  await query(
    `INSERT INTO reviews (organization_id, content_version_id, status, score, finished_at)
     VALUES ($1, $2, 'done', 96, CURRENT_TIMESTAMP)`,
    [zestId, zDraft2Ver!.id]
  );
  await query(
    `INSERT INTO comments (organization_id, content_id, version_id, author_id, body)
     VALUES ($1, $2, $3, $4, 'Love the tone here! Clean, upbeat, and fits our mobile community guidelines.')`,
    [zestId, zDraft2!.id, zDraft2Ver!.id, zestReviewer!.id]
  );

  // Zest Draft 3: Published
  const zDraft3 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'Zest Celebrates 500,000 Community Members!', 'LinkedIn', 'published', 100) RETURNING id`,
    [zestId, zestAdmin!.id]
  );
  const zDraft3Body = `We hit 500,000 active community members on Zest! Thank you to every creator sharing photos and stories with us every single day.`;
  const zDraft3Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [zestId, zDraft3!.id, zDraft3Body, zestAdmin!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [zDraft3Ver!.id, zDraft3!.id]);

  // Zest Audit Logs
  await logAudit(zestId, zestAdmin!.id, 'system_seed', 'organization', zestId, { description: 'Zest workspace loaded' });
  await logAudit(zestId, zestCreator!.id, 'create_content', 'content', zDraft1!.id, { title: 'Weekend Photo Challenge Announcement' });
  await logAudit(zestId, zestCreator!.id, 'submit_content', 'content', zDraft2!.id, { title: 'New Creator Filters & Sticker Packs Release' });
  await logAudit(zestId, zestAdmin!.id, 'publish_content', 'content', zDraft3!.id, { title: 'Zest Celebrates 500,000 Community Members!' });

  // ==========================================
  // 3. SOLO WORKSPACE (One-person studio)
  // ==========================================
  console.log('[Seed] Seeding Solo Workspace...');
  const soloOrg = await queryOne<{ id: string }>(
    `INSERT INTO organizations (name, type) VALUES ('Solo Studio', 'solo') RETURNING id`
  );
  const soloId = soloOrg!.id;

  const soloUser = await queryOne<{ id: string }>(
    `INSERT INTO users (organization_id, name, email, password_hash, role)
     VALUES ($1, 'Sam Solo', 'solo@creator.dev', $2, 'solo') RETURNING id`,
    [soloId, passwordHash]
  );

  const soloBanned = [
    { term: 'cheap', rep: 'accessible', reason: 'Cheap makes development work feel rushed or low quality.', sev: 'high' },
    { term: 'guaranteed', rep: 'designed for reliability', reason: 'Overpromising creates unrealistic expectations.', sev: 'high' },
    { term: 'hack', rep: 'workflow technique', reason: 'Maintain technical professionalism in published guides.', sev: 'medium' },
    { term: '100% risk free', rep: 'straightforward setup', reason: 'Sensational marketing phrasing.', sev: 'high' },
    { term: 'blast', rep: 'send', reason: 'Email marketing buzzword.', sev: 'low' }
  ];

  for (const b of soloBanned) {
    await query(
      `INSERT INTO banned_terms (organization_id, term, preferred_replacement, reason, severity)
       VALUES ($1, $2, $3, $4, $5)`,
      [soloId, b.term, b.rep, b.reason, b.sev]
    );
  }

  const soloGuideText = `
# Solo Creator Tech & Craft Handbook
Authentic, developer-friendly, and practical. Write direct tutorials and breakdown posts that respect the reader's time. Always explain trade-offs and never overpromise easy shortcuts.
`;
  const soloGuide = await queryOne<{ id: string }>(
    `INSERT INTO guidelines (organization_id, title, kind, file_url)
     VALUES ($1, 'Solo Studio Tech & Voice Guidelines', 'voice', 'solo_guide.md') RETURNING id`,
    [soloId]
  );
  const soloGuideChunks = chunkDocument(soloGuideText, 'Solo Voice Handbook');
  await storeGuidelineChunks(soloId, soloGuide!.id, soloGuideChunks);

  const soloFactsText = `
# Solo Studio Portfolio & Stats
- Fact 1: Over 45,000 YouTube subscribers and developer community members.
- Fact 2: Author of 12 open source utilities with over 200,000 combined downloads.
- Fact 3: Solo indie software engineer and educator active since 2023.
`;
  const soloFactsDoc = await queryOne<{ id: string }>(
    `INSERT INTO fact_documents (organization_id, title, file_url, effective_date)
     VALUES ($1, 'Solo Studio Verified Facts', 'solo_facts.md', CURRENT_DATE) RETURNING id`,
    [soloId]
  );
  const soloFactChunks = chunkDocument(soloFactsText, 'Solo Studio Facts');
  await storeFactChunks(soloId, soloFactsDoc!.id, soloFactChunks);

  // Solo Draft 1: Reviewed with issue
  const sDraft1 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'How I Built a Full Stack SaaS in 30 Days', 'Blog', 'reviewed', 88) RETURNING id`,
    [soloId, soloUser!.id]
  );
  const sDraft1Body = `Here is my complete 30-day breakdown of designing, coding, and deploying an indie SaaS app with cheap database hosting and clean code architecture.`;
  const sDraft1Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [soloId, sDraft1!.id, sDraft1Body, soloUser!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [sDraft1Ver!.id, sDraft1!.id]);
  const sReview1 = await queryOne<{ id: string }>(
    `INSERT INTO reviews (organization_id, content_version_id, status, score, finished_at)
     VALUES ($1, $2, 'done', 88, CURRENT_TIMESTAMP) RETURNING id`,
    [soloId, sDraft1Ver!.id]
  );
  await query(
    `INSERT INTO issues (organization_id, review_id, type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion, status)
     VALUES ($1, $2, 'banned_term', 'high', 'cheap database hosting', 89, 110, 'Use professional phrasing like cost-effective or budget-friendly.', 'Solo Studio Guidelines', 'cost-effective cloud hosting', 'open')`,
    [soloId, sReview1!.id]
  );

  // Solo Draft 2: Submitted in Queue
  const sDraft2 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'Open Source Developer Tools Digest #42', 'Email Newsletter', 'submitted', 95) RETURNING id`,
    [soloId, soloUser!.id]
  );
  const sDraft2Body = `In this week's issue, we review five lightweight command line tools that simplify database migrations and API testing.`;
  const sDraft2Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [soloId, sDraft2!.id, sDraft2Body, soloUser!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [sDraft2Ver!.id, sDraft2!.id]);
  await query(
    `INSERT INTO reviews (organization_id, content_version_id, status, score, finished_at)
     VALUES ($1, $2, 'done', 95, CURRENT_TIMESTAMP)`,
    [soloId, sDraft2Ver!.id]
  );

  // Solo Draft 3: Published
  const sDraft3 = await queryOne<{ id: string }>(
    `INSERT INTO contents (organization_id, created_by, title, channel, status, latest_score)
     VALUES ($1, $2, 'Launching My New Web Architecture Guide', 'Twitter / X', 'published', 100) RETURNING id`,
    [soloId, soloUser!.id]
  );
  const sDraft3Body = `Thrilled to release my complete full-stack web architecture guide! 10 chapters on building clean, high-performance web applications.`;
  const sDraft3Ver = await queryOne<{ id: string }>(
    `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
     VALUES ($1, $2, 1, $3, $4) RETURNING id`,
    [soloId, sDraft3!.id, sDraft3Body, soloUser!.id]
  );
  await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [sDraft3Ver!.id, sDraft3!.id]);

  // Solo Audit Logs
  await logAudit(soloId, soloUser!.id, 'system_seed', 'organization', soloId, { description: 'Solo Studio workspace created' });
  await logAudit(soloId, soloUser!.id, 'create_content', 'content', sDraft1!.id, { title: 'How I Built a Full Stack SaaS in 30 Days' });
  await logAudit(soloId, soloUser!.id, 'submit_content', 'content', sDraft2!.id, { title: 'Open Source Developer Tools Digest #42' });
  await logAudit(soloId, soloUser!.id, 'publish_content', 'content', sDraft3!.id, { title: 'Launching My New Web Architecture Guide' });

  console.log('[Seed] Database successfully seeded with Acme, Zest, and Solo workspaces!');
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Seed script error:', err);
      process.exit(1);
    });
}
