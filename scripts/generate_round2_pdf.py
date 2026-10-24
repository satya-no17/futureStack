import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inkloom AI — Round 2 Build Presentation</title>
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
      margin-bottom: 40px;
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
      padding: 32px;
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
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 30px;">
        <span class="brand-icon" style="width: 48px; height: 48px; border-radius: 14px;"></span>
        <span style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">Inkloom AI</span>
        <span class="badge-pill badge-emerald" style="margin-left: 16px; font-size: 14px; padding: 8px 20px;">
          ● Round 2: The Build Submission
        </span>
      </div>

      <h1 style="font-size: 64px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-bottom: 24px; letter-spacing: -0.03em;">
        Intelligent Brand Governance Platform
      </h1>

      <p style="font-size: 24px; color: #475569; font-weight: 500; max-width: 1000px; line-height: 1.5; margin-bottom: 60px;">
        A real-time, pre-publication review engine that validates draft copy against official brand voice guidelines, verified facts, and terminology policies before live publication.
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
          <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Source Code & Build</div>
          <div style="font-size: 20px; font-weight: 800; color: #0f172a;">GitHub Verified</div>
          <div style="font-size: 13px; color: #7c3aed; font-family: 'JetBrains Mono', monospace; margin-top: 6px;">satya-no17/futureStack</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Round 2 Submission Deck</span>
      <span>Page 1 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 2: EXECUTIVE SUMMARY - WHAT WE BUILT  -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Round 2 Build Status</span>
    </div>

    <h2 class="slide-title">Executive Summary: What Was Shipped in Round 2</h2>
    <div class="slide-subtitle">From Architectural Blueprint to a Fully Functioning Multi-Tenant Product</div>

    <div class="grid-4">
      <div class="card card-purple-top">
        <div class="card-number">01</div>
        <div class="card-title" style="margin-top: 14px;">4-Tier Hybrid Pipeline</div>
        <p class="card-desc">
          Merged instant deterministic regex rules with semantic RAG retrieval and LLM claim verification. Checks words to avoid, brand voice tone, and technical claims.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #7c3aed;">Sub-50ms</div>
          <div class="stat-label">Deterministic rule speed</div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-number">02</div>
        <div class="card-title" style="margin-top: 14px;">1-Click Intent Fixes</div>
        <p class="card-desc">
          Generated in-place replacements that preserve the writer's original narrative and persuasive intent without generic destructive rewrites.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #ec4899;">100%</div>
          <div class="stat-label">Offset-grounded fixes</div>
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-number">03</div>
        <div class="card-title" style="margin-top: 14px;">Human Review Loop</div>
        <p class="card-desc">
          Complete editorial queue with visual character-level diff comparison, reviewer sign-offs, revision feedback notes, and publish gates.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #10b981;">4 Roles</div>
          <div class="stat-label">RBAC permissions model</div>
        </div>
      </div>

      <div class="card card-amber-top">
        <div class="card-number">04</div>
        <div class="card-title" style="margin-top: 14px;">Multi-Tenant RAG</div>
        <p class="card-desc">
          Strict tenant isolation powered by PostgreSQL pgvector. Pre-seeded with 3 enterprise, agency, and indie workspaces with distinct policies.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #f59e0b;">Zero Leak</div>
          <div class="stat-label">Cross-tenant isolation</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Executive Summary</span>
      <span>Page 2 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 3: 4-TIER GOVERNANCE ARCHITECTURE     -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Engine Deep Dive</span>
    </div>

    <h2 class="slide-title">Core AI Governance Engine: 4-Tier Pipeline</h2>
    <div class="slide-subtitle">Multi-Dimensional Analysis Delivering Explainable Findings in Parallel</div>

    <div class="grid-4">
      <div class="card" style="background: #faf5ff; border-color: #d8b4fe;">
        <span class="tag" style="background: #e9d5ff; color: #6b21a8;">Tier 1 • Instant</span>
        <div class="card-title" style="margin-top: 10px;">Words to Avoid (Regex)</div>
        <p class="card-desc">
          Scans for barred words, high-liability claims ("cheap", "guaranteed", "#1"), and outdated jargon using compiled word boundaries.
        </p>
        <ul class="bullet-list">
          <li>Exact character start/end offsets</li>
          <li>Severity weights (High, Med, Low)</li>
          <li>Immediate preferred replacements</li>
        </ul>
      </div>

      <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
        <span class="tag" style="background: #dbeafe; color: #1e40af;">Tier 2 • Semantic RAG</span>
        <div class="card-title" style="margin-top: 10px;">Tone & Voice Alignment</div>
        <p class="card-desc">
          Retrieves top-4 guideline vector chunks via cosine distance, querying Gemini to identify subtle tone deviations and hyperbole.
        </p>
        <ul class="bullet-list">
          <li>384-dimensional dense vectors</li>
          <li>Identifies sensationalism & slang</li>
          <li>Rule-cited explanations</li>
        </ul>
      </div>

      <div class="card" style="background: #fffbeb; border-color: #fde68a;">
        <span class="tag" style="background: #fef3c7; color: #92400e;">Tier 3 • Fact Verification</span>
        <div class="card-title" style="margin-top: 10px;">Claim Grounding</div>
        <p class="card-desc">
          Cross-examines claims against approved product technical specs to flag unsupported claims or contradicted statistics.
        </p>
        <ul class="bullet-list">
          <li>Tri-state: Supported, Contradicted, Unverified</li>
          <li>Suppresses hallucinated claims</li>
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
      <span>Inkloom AI • 4-Tier Pipeline Architecture</span>
      <span>Page 3 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 4: THE DRAFT STUDIO & INTENT FIXES    -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Interactive UI</span>
    </div>

    <h2 class="slide-title">Draft Studio: Live Highlighter & 1-Click Fixes</h2>
    <div class="slide-subtitle">Empowering Creators With Intent-Preserving Corrections, Not Destructive Rewrites</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Interactive Visual Copy Highlighter</div>
        <p class="card-desc">
          Draft text renders with non-overlapping visual highlight tokens corresponding to exact detected issues. Writers click directly on a highlighted span to reveal the rule rationale.
        </p>
        <div class="code-snippet">
<span style="color: #94a3b8;">// Example live draft scan representation</span>
"Our <span style="background: #fecaca; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">crazy fast</span> cloud is <span style="background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">guaranteed</span> to cut costs by 80% with <span style="background: #fed7aa; color: #9a3412; padding: 2px 6px; border-radius: 4px; font-weight: bold;">instant</span> setup."

<span style="color: #38bdf8;">→ Red Highlight:</span> Banned Term ("crazy fast" → "sub-50ms median latency")
<span style="color: #facc15;">→ Yellow Highlight:</span> Unverified Claim ("guaranteed" → "backed by 99.95% SLA")
<span style="color: #fb923c;">→ Orange Highlight:</span> Tone Violation ("instant" → "near real-time")
        </div>
        <ul class="bullet-list" style="margin-top: 16px;">
          <li>Zero text jumping: Exact index offsets guarantee perfect caret and selection positioning.</li>
          <li>Direct edit mode: Creators can type modifications freely, then hit "Check My Words".</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-title">Intent-Preserving Correction Cards</div>
        <p class="card-desc">
          Traditional AI proofreaders rewrite paragraphs destructively. Inkloom isolates the problematic phrase, identifies the exact brand rule broken, and delivers a 1-click replacement.
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
          <li>Instant score recalculation upon accepting suggestions.</li>
          <li>Optional skip with mandatory justification note for compliance tracking.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Draft Studio & Intent Fixes</span>
      <span>Page 4 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 5: REVIEW QUEUE & DIFF VIEWER         -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Workflow & Collaboration</span>
    </div>

    <h2 class="slide-title">Collaborative Review Queue & Version Diff Viewer</h2>
    <div class="slide-subtitle">Structured Human-in-the-Loop Governance for Distributed Marketing Teams</div>

    <div class="grid-2">
      <div class="card card-purple-top">
        <div class="card-title">Dedicated Approval Queue</div>
        <p class="card-desc">
          Submitted drafts automatically enter the Review Queue. Reviewers and Brand Leads can inspect the compliance score history, filter by channel, and take definitive action.
        </p>
        <ul class="bullet-list" style="margin-top: 16px;">
          <li><strong>Approve:</strong> Signs off on compliant drafts and moves status to "Approved".</li>
          <li><strong>Ask for Changes:</strong> Sends constructive revision notes back to the author with highlighted problem sections.</li>
          <li><strong>Publish Gate:</strong> Brand Leads can trigger final publication state once all checks pass.</li>
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
          Reviewers can immediately see exactly what words were added or removed between draft versions, eliminating manual proofreading time.
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
      <span>Inkloom AI • Collaborative Governance</span>
      <span>Page 5 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 6: MULTI-TENANT ISOLATION             -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Enterprise Security</span>
    </div>

    <h2 class="slide-title">Multi-Tenant Brand Rules & Fact Repositories</h2>
    <div class="slide-subtitle">Hermetic Isolation Protecting Brand Equity Across Diverse Organizational Workspaces</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">Acme Enterprise Solutions</div>
        <span class="tag" style="background: #f3e8ff; color: #7c3aed;">B2B Enterprise • Formal</span>
        <p class="card-desc" style="margin-top: 10px;">
          Strict Fortune-500 compliance. Informal jargon, unverified latency claims, and unqualified guarantees are barred.
        </p>
        <ul class="bullet-list">
          <li>12 Banned Terms ("cheap", "hack", "crazy fast")</li>
          <li>2 Verified Fact Sheets (SOC2 Type II, 99.95% SLA)</li>
          <li>Formal third-person voice enforcement</li>
        </ul>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Zest Social App</div>
        <span class="tag" style="background: #fce7f3; color: #be185d;">Consumer Tech • Vibrant</span>
        <p class="card-desc" style="margin-top: 10px;">
          Fast-paced Gen-Z social community. Dry corporate buzzwords are prohibited; energetic, clear messaging is enforced.
        </p>
        <ul class="bullet-list">
          <li>10 Avoided Terms ("synergy", "paradigm", "leverage")</li>
          <li>Verified Community Stats (500k active members)</li>
          <li>Active voice & casual, punchy headline rules</li>
        </ul>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">Solo Studio</div>
        <span class="tag" style="background: #ecfdf5; color: #047857;">Indie Creator • Technical</span>
        <p class="card-desc" style="margin-top: 10px;">
          Autonomous developer workspace. Streamlined governance ensuring developer guides and technical newsletters are verified.
        </p>
        <ul class="bullet-list">
          <li>Technical jargon checks ("magic", "no-brainer")</li>
          <li>Open source fact sheets & architecture docs</li>
          <li>Solo review & instant publish capabilities</li>
        </ul>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 20px 28px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span style="font-weight: 800; font-size: 16px; color: #0f172a;">Live Multi-Tenant Boundary Demonstration</span>
        <p style="font-size: 13px; color: #64748b; margin-top: 2px;">The phrase &ldquo;crazy fast hack&rdquo; triggers 2 High-Severity violations in Acme, but passes compliant in Zest.</p>
      </div>
      <span class="badge-pill badge-emerald">Isolated pgvector partitions</span>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Multi-Tenant Brand Governance</span>
      <span>Page 6 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 7: ANALYTICS & AUDIT TRAILS           -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Insights & Compliance</span>
    </div>

    <h2 class="slide-title">Brand Health Analytics & Tamper-Evident Audit Trail</h2>
    <div class="slide-subtitle">Transforming Editorial Corrections into Actionable Insights and Guideline Clarity</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Organizational Score & Mistakes Breakdown</div>
        <p class="card-desc">
          Aggregates scan performance across all authors, draft channels, and historical weeks to measure brand voice maturity.
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
          <div class="stat-box">
            <div class="stat-val" style="color: #7c3aed;">91.5%</div>
            <div class="stat-label">Organization Avg Score</div>
          </div>
          <div class="stat-box">
            <div class="stat-val" style="color: #059669;">100%</div>
            <div class="stat-label">Resolved Critical Errors</div>
          </div>
        </div>

        <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 14px; padding: 16px;">
          <div style="font-size: 13px; font-weight: 800; color: #b45309; margin-bottom: 4px;">Confusing Rules Helper</div>
          <div style="font-size: 13px; color: #92400e; line-height: 1.4;">
            Identifies policies repeatedly violated by 3+ distinct team members. Highlights ambiguity so brand managers can rewrite confusing guidelines.
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Tamper-Evident Chronological Audit Log</div>
        <p class="card-desc">
          Every critical governance action is recorded in an immutable audit ledger containing actor ID, role, action type, entity ID, and metadata.
        </p>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-top: 14px; font-size: 13px; font-family: 'JetBrains Mono', monospace; line-height: 1.7;">
          <div style="color: #0f172a;"><span style="color: #7c3aed;">[02:11:36]</span> Satyam Kumar scanned draft <span style="color: #059669;">"Q4 Enterprise Platform"</span></div>
          <div style="color: #0f172a;"><span style="color: #7c3aed;">[02:11:40]</span> 1-Click fix applied on <span style="color: #dc2626;">"crazy fast"</span> → <span style="color: #059669;">"sub-50ms"</span></div>
          <div style="color: #0f172a;"><span style="color: #7c3aed;">[02:11:44]</span> Sarah Approver approved draft v2 (Score: 100%)</div>
          <div style="color: #0f172a;"><span style="color: #7c3aed;">[02:11:48]</span> Victoria Brand authorized live publication</div>
        </div>

        <ul class="bullet-list" style="margin-top: 16px;">
          <li>Full accountability across distributed agencies and internal writers.</li>
          <li>Exportable compliance logs for corporate governance reviews.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Analytics & Audit Logs</span>
      <span>Page 7 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 8: TECHNICAL ARCHITECTURE & STACK    -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Full Stack System</span>
    </div>

    <h2 class="slide-title">Technology Stack & Implementation Deep Dive</h2>
    <div class="slide-subtitle">High-Throughput, Serverless Cloud Database with Vector Grounding and Multi-Model AI</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">Frontend & Workflow</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Next.js 16 + React 19 + Tailwind CSS</p>
        <p class="card-desc">
          Built on Turbopack with custom Landing Page design system. Zero heavy UI dependencies, responsive glassmorphism navigation, and sub-100ms client state transitions.
        </p>
        <div class="code-snippet">
- Next.js 16 App Router
- Tailwind CSS v4 design tokens
- Lucide React icon suite
- Custom text offset highlighter
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">Backend API & Ingestion</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Node.js + Express + TypeScript</p>
        <p class="card-desc">
          Asynchronous pipeline executing deterministic rule checks and RAG retrieval concurrently. In-memory content hash caching prevents redundant LLM evaluations.
        </p>
        <div class="code-snippet">
- Modular REST routing architecture
- Zod typed schema validation
- JWT & bcrypt RBAC middleware
- SHA-256 payload memoization
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Cloud DB & Vector Store</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Neon Serverless PostgreSQL + pgvector</p>
        <p class="card-desc">
          Serverless PostgreSQL cluster running pgvector. Performs sub-10ms cosine similarity searches across partitioned guideline and fact chunks.
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
        Google Gemini AI Integration Architecture
      </div>
      <div style="font-size: 13px; color: #475569; line-height: 1.5;">
        Uses <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">gemini-flash-lite-latest</code> with structured JSON outputs and automated fallback to <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">gemini-3.5-flash-lite</code>. Grounded by <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">gemini-embedding-001</code> vectors to eliminate hallucinations.
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Technology & Architecture</span>
      <span>Page 8 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 9: WHAT CHANGED FROM PROPOSAL & WHY   -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Evolution & Decisions</span>
    </div>

    <h2 class="slide-title">What Changed From Round 1 Proposal & Why</h2>
    <div class="slide-subtitle">Strategic Engineering Decisions Made to Maximize Working Software Quality</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">1. Deep Text Governance over Heavy Vision Models</div>
        <p class="card-desc" style="font-weight: 700; color: #7c3aed; margin-bottom: 8px;">Architectural Focus</p>
        <p class="card-desc">
          <strong>Original Plan:</strong> Equal distribution between computer vision image scanning and text governance.<br><br>
          <strong>What Changed:</strong> Market analysis showed 90% of compliance, legal, and tone risks originate in marketing copy, captions, and press claims. We prioritized sub-second text accuracy, 1-click fixes, and pgvector RAG, shipping an interactive WCAG contrast calculator for visual assets.
        </p>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">2. Transparent Error States vs Mock AI Fallback</div>
        <p class="card-desc" style="font-weight: 700; color: #ec4899; margin-bottom: 8px;">Trust & Reliability</p>
        <p class="card-desc">
          <strong>Original Plan:</strong> Built-in heuristic mock fallback if external LLMs experienced rate limits.<br><br>
          <strong>What Changed:</strong> In brand governance, fake AI responses destroy trust. We eliminated fallback simulations entirely, implementing multi-model failover and transparent UI banners: <em>&ldquo;AI not responded: Rule checks only&rdquo;</em> so compliance leads know exactly what was verified.
        </p>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">3. Multi-Tenant Side-by-Side Comparison Mode</div>
        <p class="card-desc" style="font-weight: 700; color: #059669; margin-bottom: 8px;">Demo Innovation</p>
        <p class="card-desc">
          <strong>Original Plan:</strong> Single workspace dashboard tested with sample text.<br><br>
          <strong>What Changed:</strong> To prove enterprise readiness, we pre-seeded and integrated 3 real-world workspaces (Enterprise, Social App, Indie Studio) with an interactive comparison screen proving strict tenant boundary enforcement.
        </p>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Evolution from Proposal</span>
      <span>Page 9 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 10: COMMITMENT TO ROUND 3             -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Round 3 Commitments</span>
    </div>

    <h2 class="slide-title">Known Limitations & Commitments for Round 3</h2>
    <div class="slide-subtitle">Three Substantial Product Milestones We Commit to Delivering for the Final Round</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <span class="badge-pill" style="background: #f3e8ff; color: #7c3aed; font-size: 11px;">Improvement 1</span>
        <div class="card-title" style="margin-top: 12px;">Multi-Modal Slide Deck Scanner</div>
        <p class="card-desc" style="margin-top: 8px;">
          <strong>What it is:</strong> Native ingestion of multi-page PDF presentation decks and social image banners.<br><br>
          <strong>What it changes for the user:</strong> Marketing and sales teams can upload complete PowerPoint and Canva pitch decks to automatically verify logo safety margins, typography rules, and OCR-extracted factual claims in seconds.
        </p>
      </div>

      <div class="card card-pink-top">
        <span class="badge-pill" style="background: #fce7f3; color: #be185d; font-size: 11px;">Improvement 2</span>
        <div class="card-title" style="margin-top: 12px;">1-Click CMS & Social Publishing</div>
        <p class="card-desc" style="margin-top: 8px;">
          <strong>What it is:</strong> Live webhook and API distribution connectors for WordPress, Webflow, Ghost, LinkedIn, and Twitter/X.<br><br>
          <strong>What it changes for the user:</strong> Eliminates manual copy-pasting. Once a draft receives final reviewer approval in Inkloom, it automatically publishes or schedules directly into external production content channels.
        </p>
      </div>

      <div class="card card-emerald-top">
        <span class="badge-pill" style="background: #ecfdf5; color: #047857; font-size: 11px;">Improvement 3</span>
        <div class="card-title" style="margin-top: 12px;">Self-Healing Brand Rules Engine</div>
        <p class="card-desc" style="margin-top: 8px;">
          <strong>What it is:</strong> Continuous AI clustering that monitors recurring reviewer overrides, author skips, and conflicting guidelines.<br><br>
          <strong>What it changes for the user:</strong> The system automatically suggests updated, clearer rule formulations to brand managers when multiple team members trip over ambiguous policies, keeping guidelines actively up to date.
        </p>
      </div>
    </div>

    <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 18px 28px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 14px; font-weight: 700; color: #475569;">
        Current Working Limitation: Slide deck OCR and external CMS publishing are currently simulated; scheduled for full Round 3 shipping.
      </div>
      <span class="badge-pill badge-emerald">Team SATYACODEZ Committed</span>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Round 3 Roadmap</span>
      <span>Page 10 of 10</span>
    </div>
  </div>

</body>
</html>
"""

html_path = "/tmp/round2_presentation.html"
pdf_path = "/home/satya/projects/hackathon/Inkloom_AI_Round2_Submission.pdf"

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
