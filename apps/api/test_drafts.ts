import { query, queryOne, initDb } from './src/db';
import { runReviewPipeline } from './src/services/review';
import { computeScore } from './src/services/review/score';

async function runTests() {
  await initDb();
  console.log('--- Testing 10 Sample Drafts with Core AI Governance Engine ---');

  const acmeUser = await queryOne<{ id: string; organization_id: string }>(
    `SELECT id, organization_id FROM users WHERE email = 'creator@acme.com'`
  );
  if (!acmeUser) throw new Error('Acme creator not found');

  const sampleDrafts = [
    // 1. Bad: Overpromising, banned words, unverified rankings, contradicted scale
    {
      name: 'Draft 1: Blatant Violations',
      text: 'Our app is the #1 fastest tool, guaranteed! Trusted by millions with cheap rates.',
      expectedIssues: ['banned_term', 'unverified_claim', 'contradicted_claim']
    },
    // 2. Good: Compliant formal B2B post
    {
      name: 'Draft 2: Fully Compliant Enterprise Post',
      text: 'Acme provides enterprise data orchestration backed by a 99.95% uptime SLA and SOC2 Type II certification for Fortune 500 organizations.',
      expectedIssues: []
    },
    // 3. Tricky: Violent colloquial slang ("killer", "hack")
    {
      name: 'Draft 3: Slang and Jargon',
      text: 'Here is a killer hack to optimize your data workflows in our app.',
      expectedIssues: ['banned_term']
    },
    // 4. Accessibility: Long sentence (>30 words)
    {
      name: 'Draft 4: Readability Accessibility Failure',
      text: 'Our platform seamlessly connects to every disparate database across your distributed global enterprise cloud environment without requiring manual intervention, configuration scripts, developer overhead, or complex custom connectors in any AWS or Azure cloud datacenter region.',
      expectedIssues: ['accessibility']
    },
    // 5. Accessibility: Missing image alt text
    {
      name: 'Draft 5: Missing Alt Text',
      text: 'Check out our architecture diagram: ![](https://acme.com/assets/diagram.png) for full pipeline specs.',
      expectedIssues: ['accessibility']
    },
    // 6. Accessibility: All-caps shouting
    {
      name: 'Draft 6: All-Caps Shouting',
      text: 'UPGRADE YOUR SYSTEM TODAY TO EXPERIENCE MAXIMUM SCALABILITY AND SECURITY.',
      expectedIssues: ['accessibility']
    },
    // 7. Contradicted claims: claiming millions of consumers
    {
      name: 'Draft 7: Contradicted Consumer Claim',
      text: 'Trusted by millions of mobile consumers around the world.',
      expectedIssues: ['contradicted_claim']
    },
    // 8. Unverified superlative: "the absolute best"
    {
      name: 'Draft 8: Unverified Comparative Ranking',
      text: 'Acme is recognized as the fastest tool on the market.',
      expectedIssues: ['unverified_claim']
    },
    // 9. Banned term: "instant" and "magic"
    {
      name: 'Draft 9: Tech Hyperbole',
      text: 'Experience instant query execution with magic data pipelines.',
      expectedIssues: ['banned_term']
    },
    // 10. Mixed tricky draft with fixes needed
    {
      name: 'Draft 10: Mixed Enterprise Copy',
      text: 'Our enterprise platform powers data pipelines for 500 enterprise clients, but some say it is crazy fast.',
      expectedIssues: ['banned_term']
    }
  ];

  let passedTests = 0;

  for (let i = 0; i < sampleDrafts.length; i++) {
    const d = sampleDrafts[i];
    console.log(`\nEvaluating [${i + 1}/10] ${d.name}...`);

    // Create temp content and version
    const content = await queryOne<{ id: string }>(
      `INSERT INTO contents (organization_id, created_by, title, channel, status)
       VALUES ($1, $2, $3, 'LinkedIn', 'draft') RETURNING id`,
      [acmeUser.organization_id, acmeUser.id, d.name]
    );

    const version = await queryOne<{ id: string }>(
      `INSERT INTO content_versions (organization_id, content_id, version_no, body, created_by)
       VALUES ($1, $2, 1, $3, $4) RETURNING id`,
      [acmeUser.organization_id, content!.id, d.text, acmeUser.id]
    );

    await query(`UPDATE contents SET current_version_id = $1 WHERE id = $2`, [version!.id, content!.id]);

    const review = await queryOne<{ id: string }>(
      `INSERT INTO reviews (organization_id, content_version_id, status)
       VALUES ($1, $2, 'queued') RETURNING id`,
      [acmeUser.organization_id, version!.id]
    );

    await runReviewPipeline(review!.id, version!.id, acmeUser.organization_id);

    const reviewResult = await queryOne<{ score: number; status: string }>(
      `SELECT score, status FROM reviews WHERE id = $1`,
      [review!.id]
    );

    const issues = await query(
      `SELECT type, severity, quote, start_idx, end_idx, explanation, source_ref, suggestion
       FROM issues WHERE review_id = $1`,
      [review!.id]
    );

    console.log(` Score: ${reviewResult?.score}/100 | Issues found: ${issues.length}`);

    // Verify offset accuracy
    let offsetsValid = true;
    for (const iss of issues) {
      const slice = d.text.substring(iss.start_idx, iss.end_idx);
      if (slice.toLowerCase() !== iss.quote.toLowerCase()) {
        console.error(` Offset mismatch! Quote: "${iss.quote}", Slice: "${slice}"`);
        offsetsValid = false;
      }
      console.log(`   - [${iss.severity.toUpperCase()}] ${iss.type}: "${iss.quote}" -> "${iss.suggestion}" (Source: ${iss.source_ref})`);
    }

    if (offsetsValid) {
      passedTests++;
    }

    // Clean up test draft
    await query(`DELETE FROM contents WHERE id = $1`, [content!.id]);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passedTests}/${sampleDrafts.length} test drafts passed offset and audit validations!`);
  console.log(`========================================`);
}

runTests().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
