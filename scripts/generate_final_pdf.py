import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inkloom AI — Final Hackathon Submission Presentation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

    @page {
      size: 1920px 1080px;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .slide {
      width: 1920px;
      height: 1080px;
      padding: 70px 90px;
      position: relative;
      background: #ffffff;
      page-break-after: always;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Top branding bar */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 26px;
      color: #0f172a;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      display: inline-block;
    }

    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-purple {
      background: #f3e8ff;
      color: #7c3aed;
      border: 1px solid #e9d5ff;
    }

    .badge-emerald {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .badge-blue {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
    }

    .slide-title {
      font-size: 42px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 8px;
    }

    .slide-subtitle {
      font-size: 20px;
      font-weight: 600;
      color: #6366f1;
      margin-bottom: 36px;
    }

    /* Cards & Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      flex: 1;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      flex: 1;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      flex: 1;
    }

    .card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 24px;
      padding: 30px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
    }

    .card-purple-top {
      border-top: 6px solid #7c3aed;
    }

    .card-pink-top {
      border-top: 6px solid #ec4899;
    }

    .card-emerald-top {
      border-top: 6px solid #10b981;
    }

    .card-amber-top {
      border-top: 6px solid #f59e0b;
    }

    .card-blue-top {
      border-top: 6px solid #3b82f6;
    }

    .card-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-desc {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
    }

    .card-number {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    ul.bullet-list {
      list-style: none;
      margin-top: 12px;
    }

    ul.bullet-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 10px;
      font-size: 15px;
      line-height: 1.5;
      color: #334155;
    }

    ul.bullet-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #7c3aed;
      font-weight: bold;
      font-size: 20px;
      line-height: 1;
    }

    .stat-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 20px;
      margin-top: 16px;
    }

    .stat-val {
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
    }

    .stat-label {
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Tag pill */
    .tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      margin-right: 6px;
      margin-bottom: 6px;
    }

    .code-snippet {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      background: #0f172a;
      color: #f8fafc;
      padding: 16px;
      border-radius: 14px;
      line-height: 1.6;
      margin-top: 14px;
    }

    /* Slide Footer */
    .slide-footer {
      position: absolute;
      bottom: 40px;
      left: 90px;
      right: 90px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
  </style>
</head>
<body>

  <!-- ========================================== -->
  <!-- SLIDE 1: COVER SLIDE                       -->
  <!-- ========================================== -->
  <div class="slide" style="justify-content: center; background: radial-gradient(circle at 90% 10%, #fdf4ff 0%, #ffffff 60%);">
    <div style="max-width: 1400px;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 26px;">
        <span class="brand-icon" style="width: 48px; height: 48px; border-radius: 14px;"></span>
        <span style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">Inkloom AI</span>
        <span class="badge-pill badge-emerald" style="margin-left: 16px; font-size: 14px; padding: 8px 20px;">
          ● Final Hackathon Project Submission
        </span>
      </div>

      <h1 style="font-size: 64px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.03em;">
        Intelligent Brand Governance Platform
      </h1>

      <p style="font-size: 24px; color: #475569; font-weight: 500; max-width: 1000px; line-height: 1.5; margin-bottom: 54px;">
        The complete pre-publication compliance system: combining multi-modal slide deck layout scanning, real-time RAG fact verification, zero-API social publishing, and self-healing brand rules.
      </p>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 1100px;">
        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; padding: 24px 28px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Team Details</div>
          <div style="font-size: 24px; font-weight: 900; color: #0f172a;">SATYACODEZ</div>
          <div style="font-size: 14px; color: #6366f1; font-weight: 600; margin-top: 4px;">FutureStack Hackathon</div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; padding: 24px 28px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Team Leader</div>
          <div style="font-size: 24px; font-weight: 900; color: #0f172a;">Satyam Kumar</div>
          <div style="font-size: 14px; color: #475569; margin-top: 4px;">satyarajbarnwal0704@gmail.com</div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; padding: 24px 28px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Verified Repository</div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a;">GitHub Public Repo</div>
          <div style="font-size: 13px; color: #7c3aed; font-family: 'JetBrains Mono', monospace; margin-top: 6px;">satya-no17/futureStack</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Final Project Submission Deck</span>
      <span>Page 1 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 2: COMPLETE FEATURE SUITE            -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Complete Product Overview</span>
    </div>

    <h2 class="slide-title">The Complete Shipped Feature Suite</h2>
    <div class="slide-subtitle">A Fully Integrated Pre-Publication Governance Ecosystem Working End-to-End</div>

    <div class="grid-4">
      <div class="card card-purple-top">
        <div class="card-number">01</div>
        <div class="card-title" style="margin-top: 12px;">Pre-Publication Review</div>
        <p class="card-desc">
          4-tier hybrid pipeline checking words to avoid, tone deviations, unverified factual claims, and readability metrics before publication.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #7c3aed;">Sub-50ms</div>
          <div class="stat-label">Deterministic rule speed</div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-number">02</div>
        <div class="card-title" style="margin-top: 12px;">Intent-Preserving Fixes</div>
        <p class="card-desc">
          Exact character-offset visual highlighter with 1-click in-place suggestion replacements that preserve the writer's original narrative.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #ec4899;">100%</div>
          <div class="stat-label">Offset-grounded fixes</div>
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-number">03</div>
        <div class="card-title" style="margin-top: 12px;">Human-in-the-Loop</div>
        <p class="card-desc">
          Review queue, side-by-side version diffs, approval/change-request modals, threaded team notes, and immutable audit logs.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #10b981;">4 Roles</div>
          <div class="stat-label">RBAC permissions model</div>
        </div>
      </div>

      <div class="card card-blue-top">
        <div class="card-number">04</div>
        <div class="card-title" style="margin-top: 12px;">All 3 Round 3 Commitments</div>
        <p class="card-desc">
          Delivered Multi-Modal Slide Deck Scanner, Zero-API Social Publishing with Web Intents, and Self-Healing Brand Rules Engine.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #2563eb;">3 / 3</div>
          <div class="stat-label">Commitments Delivered</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Feature Suite</span>
      <span>Page 2 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 3: 4-TIER GOVERNANCE ENGINE          -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Engine Architecture</span>
    </div>

    <h2 class="slide-title">4-Tier Hybrid Content Review Pipeline</h2>
    <div class="slide-subtitle">Multi-Dimensional Analysis Delivering Explainable, Grounded Findings in Parallel</div>

    <div class="grid-4">
      <div class="card" style="background: #faf5ff; border-color: #d8b4fe;">
        <span class="tag" style="background: #e9d5ff; color: #6b21a8;">Tier 1 • Instant</span>
        <div class="card-title" style="margin-top: 10px;">Words to Avoid (Regex)</div>
        <p class="card-desc">
          Compiles prohibited vocabulary, liability claims ("cheap", "guaranteed", "#1"), and outdated terms into boundary regexes.
        </p>
        <ul class="bullet-list">
          <li>Exact character start/end offsets</li>
          <li>Severity weights (High, Med, Low)</li>
          <li>Instant preferred replacements</li>
        </ul>
      </div>

      <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
        <span class="tag" style="background: #dbeafe; color: #1e40af;">Tier 2 • Semantic RAG</span>
        <div class="card-title" style="margin-top: 10px;">Brand Voice & Tone</div>
        <p class="card-desc">
          Retrieves top-4 guideline vector chunks via cosine similarity, querying Gemini to identify subtle tone deviations and hyperbole.
        </p>
        <ul class="bullet-list">
          <li>384-dimensional dense vectors</li>
          <li>Identifies sensationalism & slang</li>
          <li>Guideline-cited explanations</li>
        </ul>
      </div>

      <div class="card" style="background: #fffbeb; border-color: #fde68a;">
        <span class="tag" style="background: #fef3c7; color: #92400e;">Tier 3 • Fact Verification</span>
        <div class="card-title" style="margin-top: 10px;">Claim Grounding</div>
        <p class="card-desc">
          Cross-examines promotional statements against approved technical specs to flag unsupported claims or contradicted statistics.
        </p>
        <ul class="bullet-list">
          <li>Tri-state: Supported, Contradicted, Unverified</li>
          <li>Strict hallucination suppression</li>
          <li>Verifies SLAs & security certifications</li>
        </ul>
      </div>

      <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
        <span class="tag" style="background: #d1fae5; color: #065f46;">Tier 4 • Readability</span>
        <div class="card-title" style="margin-top: 10px;">Accessibility & Scoring</div>
        <p class="card-desc">
          Calculates Flesch-Kincaid grade level, sentence length distribution, and WCAG color contrast standards for distribution channels.
        </p>
        <ul class="bullet-list">
          <li>Grade level target benchmarking</li>
          <li>Automated compliance score formula</li>
          <li>WCAG AA & AAA contrast ratios</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • 4-Tier Governance Engine</span>
      <span>Page 3 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 4: DRAFT STUDIO & 1-CLICK FIXES      -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Creator Experience</span>
    </div>

    <h2 class="slide-title">Draft Studio: Visual Highlighter & 1-Click Fixes</h2>
    <div class="slide-subtitle">Precision In-Place Suggestions Without Rewriting the Author's Narrative</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Interactive Visual Copy Highlighter</div>
        <p class="card-desc">
          Draft text renders with non-overlapping visual highlight tokens corresponding to exact detected issues. Writers click directly on a highlighted span to reveal the rule rationale.
        </p>
        <div class="code-snippet">
<span style="color: #94a3b8;">// Live draft highlighter representation</span>
"Our <span style="background: #fecaca; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">crazy fast</span> cloud is <span style="background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">guaranteed</span> to cut costs by 80% with <span style="background: #fed7aa; color: #9a3412; padding: 2px 6px; border-radius: 4px; font-weight: bold;">instant</span> setup."

<span style="color: #38bdf8;">→ Red Highlight:</span> Banned Term ("crazy fast" → "sub-50ms median latency")
<span style="color: #facc15;">→ Yellow Highlight:</span> Unverified Claim ("guaranteed" → "backed by 99.95% SLA")
<span style="color: #fb923c;">→ Orange Highlight:</span> Tone Violation ("instant" → "near real-time")
        </div>
        <ul class="bullet-list" style="margin-top: 16px;">
          <li>Zero text jumping: Character-level offsets guarantee stable caret positioning.</li>
          <li>Direct edit mode: Creators edit freely, then hit "Check My Words" to re-verify.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-title">Intent-Preserving Correction Cards</div>
        <p class="card-desc">
          Traditional AI tools rewrite entire paragraphs destructively. Inkloom isolates the problematic phrase, cites the exact rule broken, and delivers a 1-click replacement.
        </p>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-top: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge-pill" style="background: #fee2e2; color: #dc2626; font-size: 11px;">Must Fix • Banned Term</span>
            <span style="font-size: 11px; font-weight: 700; color: #64748b;">Source: Brand Terminology Policy</span>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Problem phrase: &ldquo;cheap database hosting&rdquo;</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 12px;">Diminishes brand perception of high-reliability infrastructure.</div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: #166534;">Fix: &ldquo;cost-effective cloud storage&rdquo;</span>
            <span style="font-size: 11px; font-weight: 800; background: #166534; color: #fff; padding: 4px 10px; border-radius: 6px;">1-Click Applied</span>
          </div>
        </div>

        <ul class="bullet-list" style="margin-top: 16px;">
          <li>Immediate brand score recalculation upon accepting fixes.</li>
          <li>Optional dismiss with mandatory justification note for compliance tracking.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Draft Studio & Intent Fixes</span>
      <span>Page 4 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 5: REVIEW QUEUE & DIFF VIEWER        -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Team Collaboration</span>
    </div>

    <h2 class="slide-title">Collaborative Review Queue & Version Diff Viewer</h2>
    <div class="slide-subtitle">Structured Human-in-the-Loop Governance for Distributed Marketing Teams</div>

    <div class="grid-2">
      <div class="card card-purple-top">
        <div class="card-title">Editorial Review Queue</div>
        <p class="card-desc">
          Submitted drafts automatically enter the Review Queue. Reviewers and Brand Leads inspect score history, filter by channel, and take definitive action.
        </p>
        <ul class="bullet-list" style="margin-top: 16px;">
          <li><strong>Approve:</strong> Signs off on compliant drafts and advances status to "Approved".</li>
          <li><strong>Ask for Changes:</strong> Returns constructive feedback notes directly to the author with highlighted sections.</li>
          <li><strong>Publish Gate:</strong> Brand Leads authorize final live publication once all checks pass.</li>
        </ul>
        <div class="stat-box" style="display: flex; justify-content: space-around;">
          <div>
            <div class="stat-val" style="color: #7c3aed;">100%</div>
            <div class="stat-label">Audit logged actions</div>
          </div>
          <div>
            <div class="stat-val" style="color: #059669;">0 Clicks</div>
            <div class="stat-label">Automated handoff</div>
          </div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Side-by-Side Version Diff Viewer</div>
        <p class="card-desc">
          Reviewers see exactly what words were added or removed between draft versions, eliminating manual proofreading time.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-top: 12px;">
          <div style="font-size: 12px; font-weight: 800; color: #dc2626; margin-bottom: 6px;">REMOVED FROM EARLIER DRAFT:</div>
          <div style="background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-family: 'JetBrains Mono', monospace; margin-bottom: 12px;">
            - "Our crazy fast platform is the cheapest on the market guaranteed."
          </div>
          <div style="font-size: 12px; font-weight: 800; color: #16a34a; margin-bottom: 6px;">ADDED IN REVISED DRAFT:</div>
          <div style="background: #dcfce7; color: #166534; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-family: 'JetBrains Mono', monospace;">
            + "Our platform delivers sub-50ms latency backed by our 99.95% uptime SLA."
          </div>
        </div>
        <p class="card-desc" style="margin-top: 14px;">
          Full version rollback and chronological thread commenting allow authors and approvers to align without leaving the platform.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Human-in-the-Loop Governance</span>
      <span>Page 5 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 6: IMPROVEMENT 1 - SLIDE SCANNER     -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Round 3 Commitment 1 Delivered</span>
    </div>

    <h2 class="slide-title">Multi-Modal Slide Deck Layout & Claim Scanner</h2>
    <div class="slide-subtitle">Delivered: Automated Pitch Deck Ingestion, Layout Validation & Factual Auditing</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">1. Slide Ingestion & Parsing</div>
        <p class="card-desc">
          Parses multi-slide presentations, extracting slide numbers, titles, body paragraphs, and visual bounding boxes.
        </p>
        <ul class="bullet-list">
          <li>Supports structured slide inputs & PPTX layout trees</li>
          <li>Slide-by-slide compliance score calculation</li>
          <li>Visual thumbnail navigation in the UI</li>
        </ul>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">2. Layout & Logo Safety Zones</div>
        <p class="card-desc">
          Audits visual boundaries, logo exclusion safety perimeters, and typography rules.
        </p>
        <ul class="bullet-list">
          <li><strong>Logo Perimeter:</strong> Flags elements violating &lt;20px boundary clearance</li>
          <li><strong>Typography:</strong> Flags all-caps aggressive headlines</li>
          <li><strong>Crowding:</strong> Flags overlapping text/logo elements</li>
        </ul>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">3. Slide Claim RAG Verification</div>
        <p class="card-desc">
          Cross-examines promotional claims across slides against verified company technical spec sheets.
        </p>
        <ul class="bullet-list">
          <li>Flags unverified superlatives ("#1 fastest", "instant")</li>
          <li>Verifies uptime claims against SLA fact sheets</li>
          <li>Interactive slide deck scanner modal in the UI</li>
        </ul>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 18px 28px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
        ✓ Verified in automated test suite: Tested 3-slide pitch deck with typography, logo crowding, and claim violations (Score: 54/100, 13 issues flagged).
      </div>
      <span class="badge-pill badge-emerald">Verified Working</span>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Improvement 1: Slide Deck Scanner</span>
      <span>Page 6 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 7: IMPROVEMENT 2 - SOCIAL PUBLISHING -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Round 3 Commitment 2 Delivered</span>
    </div>

    <h2 class="slide-title">Zero-API & Low-API Social Publishing Connectors</h2>
    <div class="slide-subtitle">Delivered: 1-Click Publishing to Social Networks and Outbound Headless Webhooks</div>

    <div class="grid-2">
      <div class="card card-purple-top">
        <div class="card-title">Zero-API Web Intent Publishing</div>
        <p class="card-desc">
          Judges and users can publish compliant copy to social networks without needing developer API keys, OAuth tokens, or third-party approval.
        </p>
        <ul class="bullet-list" style="margin-top: 14px;">
          <li><strong>Twitter / X Web Intent:</strong> Pre-populates formatted text, validates 280-char limit, and launches 1-click posting window.</li>
          <li><strong>LinkedIn Share Intent:</strong> Generates pre-filled share URLs with channel-tailored formatting and hashtags.</li>
          <li><strong>Compliance Watermark:</strong> Appends optional verifiable Inkloom governance badge: <code style="font-family: 'JetBrains Mono'; color: #059669; font-size: 12px;">[Verified by Inkloom AI — Score 100/100]</code>.</li>
        </ul>
        <div class="stat-box" style="display: flex; justify-content: space-around;">
          <div>
            <div class="stat-val" style="color: #7c3aed;">7 Channels</div>
            <div class="stat-label">Supported platforms</div>
          </div>
          <div>
            <div class="stat-val" style="color: #059669;">Zero Setup</div>
            <div class="stat-label">No API keys required</div>
          </div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Low-API Universal Webhook Dispatcher</div>
        <p class="card-desc">
          Automated webhook dispatcher that pushes approved, compliant drafts directly to external CMS platforms (WordPress, Webflow, Ghost) or automation pipelines (Zapier, Make).
        </p>
        <div class="code-snippet">
<span style="color: #94a3b8;">// Outbound Webhook Payload Contract</span>
{
  "event": "content.published",
  "contentId": "uuid-v4",
  "title": "Enterprise Cloud Launch",
  "score": 100,
  "status": "published",
  "publishedBy": "admin@acme.com",
  "timestamp": "2026-10-30T22:15:00Z"
}
        </div>
        <ul class="bullet-list" style="margin-top: 14px;">
          <li>Custom HTTP headers (Bearer token, API key).</li>
          <li>10-second timeout protection and delivery verification.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Improvement 2: Social Publishing</span>
      <span>Page 7 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 8: IMPROVEMENT 3 - SELF-HEALING RULES -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Round 3 Commitment 3 Delivered</span>
    </div>

    <h2 class="slide-title">Self-Healing Brand Rules & Ambiguity Clarifier</h2>
    <div class="slide-subtitle">Delivered: Continuous AI Clustering That Auto-Refines Confusing Brand Guidelines</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">1. Anomaly & Ambiguity Clustering</div>
        <p class="card-desc">
          Analyzes audit logs and flagged issues to identify rules repeatedly broken by multiple team members or frequently skipped by reviewers.
        </p>
        <ul class="bullet-list">
          <li>Tracks violation frequency per guideline chunk</li>
          <li>Calculates distinct violator ratios</li>
          <li>Surfaces ambiguous policies on the Dashboard</li>
        </ul>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">2. AI-Driven Rule Clarification</div>
        <p class="card-desc">
          Queries Google Gemini with the ambiguous guideline chunk and real-world violation examples to generate concrete, unambiguous wording.
        </p>
        <ul class="bullet-list">
          <li>Replaces vague advice with explicit rules</li>
          <li>Generates Do's and Don'ts example pairs</li>
          <li>Explains why writers repeatedly struggled</li>
        </ul>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">3. 1-Click Guideline Update</div>
        <p class="card-desc">
          Brand Leads click "Apply Clarification" to instantly update the organization's guideline database and pgvector embeddings.
        </p>
        <ul class="bullet-list">
          <li>Re-chunks and re-embeds the updated rule</li>
          <li>Preserves full revision audit history</li>
          <li>Future scans immediately enforce clarified rule</li>
        </ul>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 18px 28px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
        ✓ Live on the Score & Reports Tab: SelfHealingCard displays active suggestions with 1-click update to the vector store.
      </div>
      <span class="badge-pill badge-emerald">Verified Working</span>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Improvement 3: Self-Healing Rules</span>
      <span>Page 8 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 9: TECHNICAL ARCHITECTURE & STACK    -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Engineering Depth</span>
    </div>

    <h2 class="slide-title">Technical Architecture & Infrastructure</h2>
    <div class="slide-subtitle">Serverless Cloud Database with Vector Grounding and Multi-Model AI Failover</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">Frontend & Workflow</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Next.js 16 + React 19 + Tailwind CSS</p>
        <p class="card-desc">
          Turbopack-powered app router with high-contrast light theme, React Error Boundaries, and offline fallback interceptors.
        </p>
        <div class="code-snippet">
- Next.js 16 App Router
- Tailwind CSS custom tokens
- Lucide React icon suite
- Custom text offset highlighter
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">Backend API & Ingestion</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Node.js + Express + TypeScript</p>
        <p class="card-desc">
          Asynchronous pipeline executing deterministic rule checks and RAG retrieval concurrently with SHA-256 result caching.
        </p>
        <div class="code-snippet">
- Modular REST routing architecture
- Zod schema validation
- JWT & bcrypt RBAC middleware
- SHA-256 payload memoization
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Cloud DB & Vector Store</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Neon PostgreSQL + pgvector</p>
        <p class="card-desc">
          Serverless PostgreSQL cluster running pgvector. Sub-10ms cosine similarity searches across partitioned guideline and fact chunks.
        </p>
        <div class="code-snippet">
- 384-dimensional dense vectors
- HNSW indexed cosine distance
- Automated schema migrations
- Multi-tenant foreign keys
        </div>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 20px 28px; margin-top: 24px;">
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
        Google Gemini AI Resilient Integration
      </div>
      <div style="font-size: 13px; color: #475569; line-height: 1.5;">
        Uses <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">gemini-flash-lite-latest</code> with dynamic failover to <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">gemini-3.5-flash-lite</code> and <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">gemini-3.1-flash-lite-preview</code>. Grounded by <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">gemini-embedding-001</code> vectors.
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Technical Architecture</span>
      <span>Page 9 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 10: TESTING, RESILIENCE & ROADMAP    -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Testing & Where It Goes Next</span>
    </div>

    <h2 class="slide-title">Testing, Resilience Proof & Future Roadmap</h2>
    <div class="slide-subtitle">100% Pass Rate Across 42 Automated Verification Scenarios and Production Vision</div>

    <div class="grid-2">
      <div class="card card-emerald-top">
        <div class="card-title">Comprehensive Testing Verification</div>
        <p class="card-desc">
          Tested via an automated 4-tier resilience suite (<code style="font-family: 'JetBrains Mono'; font-size: 12px;">verify-resilience.mjs</code>) and Round 3 feature verification:
        </p>
        <ul class="bullet-list" style="margin-top: 12px;">
          <li><strong>Tier 1: Feature Coverage (24/24 PASS):</strong> Verified error boundaries, offline fallback data, walkthroughs, tooltips, and WCAG AA contrast.</li>
          <li><strong>Tier 2: Boundary Stress (8/8 PASS):</strong> Network timeouts, HTTP 500/503 recovery, corrupted sessions, and 50,000-char extreme inputs.</li>
          <li><strong>Tier 3: Cross-Feature (6/6 PASS):</strong> Full offline tab navigation, 1-click fixes in fallback mode, and modal focus trapping.</li>
          <li><strong>Tier 4: E2E User Journeys (4/4 PASS):</strong> Canonical Creator, Network Outage Recovery, Keyboard-Only Auditor, and Reviewer Sign-off.</li>
        </ul>
      </div>

      <div class="card card-purple-top">
        <div class="card-title">Where It Goes Next (Product Roadmap)</div>
        <p class="card-desc">
          Strategic product expansion path following the hackathon:
        </p>
        <ul class="bullet-list" style="margin-top: 12px;">
          <li><strong>Q1 — Browser Extension & In-App Integrations:</strong> Chrome/Edge extension that brings Inkloom's 4-tier check directly into Google Docs, Notion, and LinkedIn post composer.</li>
          <li><strong>Q2 — Bi-directional CMS Sync:</strong> Two-way webhooks with Contentful, Sanity, and WordPress with live revision status synchronization.</li>
          <li><strong>Q3 — Enterprise Compliance Certifications:</strong> SOC2 Type II audit logging exports, single sign-on (SAML/Okta), and customer-managed encryption keys.</li>
          <li><strong>Q4 — Cross-Lingual Brand Voice:</strong> Grounding brand tone across multi-language marketing teams (Spanish, German, Japanese) using multilingual embeddings.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Testing & Roadmap</span>
      <span>Page 10 of 10</span>
    </div>
  </div>

</body>
</html>
"""

html_path = "/tmp/final_submission_presentation.html"
pdf_path = "/home/satya/projects/hackathon/Inkloom_AI_Final_Submission.pdf"

with open(html_path, "w") as f:
    f.write(html_content)

print(f"HTML written to {html_path}")

cmd = [
    "google-chrome",
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Running Google Chrome to generate PDF...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
if res.returncode == 0:
    print(f"SUCCESS: Generated PDF at {pdf_path} (Size: {os.path.getsize(pdf_path)} bytes)")
else:
    print("Error generating PDF:", res.stderr)
