import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Inkloom AI — Final Hackathon Submission Presentation</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap');

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
      padding: 56px 80px;
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
      margin-bottom: 20px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 24px;
      color: #0f172a;
    }

    .brand-icon {
      width: 30px;
      height: 30px;
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
      font-size: 38px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-bottom: 6px;
    }

    .slide-subtitle {
      font-size: 18px;
      font-weight: 600;
      color: #6366f1;
      margin-bottom: 24px;
    }

    /* Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 26px;
      flex: 1;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      flex: 1;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      flex: 1;
    }

    .card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
    }

    .card-purple-top {
      border-top: 5px solid #7c3aed;
    }

    .card-pink-top {
      border-top: 5px solid #ec4899;
    }

    .card-emerald-top {
      border-top: 5px solid #10b981;
    }

    .card-amber-top {
      border-top: 5px solid #f59e0b;
    }

    .card-blue-top {
      border-top: 5px solid #3b82f6;
    }

    .card-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-desc {
      font-size: 14px;
      line-height: 1.55;
      color: #475569;
    }

    .card-number {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    ul.bullet-list {
      list-style: none;
      margin-top: 10px;
    }

    ul.bullet-list li {
      position: relative;
      padding-left: 18px;
      margin-bottom: 8px;
      font-size: 13.5px;
      line-height: 1.45;
      color: #334155;
    }

    ul.bullet-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #7c3aed;
      font-weight: bold;
      font-size: 18px;
      line-height: 1;
    }

    .stat-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px 16px;
      margin-top: auto;
      padding-top: 10px;
    }

    .stat-val {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
    }

    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .tag {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      margin-right: 6px;
      margin-bottom: 6px;
    }

    .code-snippet {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: #0f172a;
      color: #f8fafc;
      padding: 14px;
      border-radius: 12px;
      line-height: 1.55;
      margin-top: 10px;
    }

    .info-callout {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 14px 22px;
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Slide Footer */
    .slide-footer {
      position: absolute;
      bottom: 30px;
      left: 80px;
      right: 80px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 14px;
    }
  </style>
</head>
<body>

  <!-- ========================================== -->
  <!-- SLIDE 1: COVER SLIDE                       -->
  <!-- ========================================== -->
  <div class="slide" style="justify-content: center; background: radial-gradient(circle at 90% 10%, #fdf4ff 0%, #ffffff 60%);">
    <div style="max-width: 1450px;">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
        <span class="brand-icon" style="width: 44px; height: 44px; border-radius: 12px;"></span>
        <span style="font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">Inkloom AI</span>
        <span class="badge-pill badge-emerald" style="margin-left: 16px; font-size: 13px; padding: 6px 18px;">
          ● Final Hackathon Project Submission
        </span>
      </div>

      <h1 style="font-size: 58px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-bottom: 18px; letter-spacing: -0.03em;">
        Intelligent Brand Governance & Publishing Platform
      </h1>

      <p style="font-size: 22px; color: #475569; font-weight: 500; max-width: 1150px; line-height: 1.55; margin-bottom: 36px;">
        A complete pre-publication quality and compliance system. Inkloom AI audits marketing text, visual banners, and multi-slide pitch decks against company rules and official technical facts before publication. It flags forbidden words, verifies facts, offers 1-click intent-preserving rewrites, enables team approvals, and publishes approved content directly to social media and external CMS platforms.
      </p>

      <!-- Key Value Pillars -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 36px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #7c3aed; text-transform: uppercase;">1. Text & Tone Audit</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">Sub-50ms regex and Gemini RAG checking voice, readability, and banned words.</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #ec4899; text-transform: uppercase;">2. Pitch Deck Scanner</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">Slide-by-slide checks for logo margins (&lt;20px), all-caps fonts, and slide claims.</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase;">3. 1-Click Publishing</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">Zero-API Twitter & LinkedIn Web Intents plus Universal Outbound Webhooks.</div>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase;">4. Self-Healing Rules</div>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">AI feedback loop clarifying frequently broken rules with Do's and Don'ts.</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px; max-width: 1100px;">
        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; padding: 20px 24px; border-radius: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Team Details</div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a;">SATYACODEZ</div>
          <div style="font-size: 13px; color: #6366f1; font-weight: 600; margin-top: 2px;">FutureStack Hackathon</div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; padding: 20px 24px; border-radius: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Team Leader</div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a;">Satyam Kumar</div>
          <div style="font-size: 13px; color: #475569; margin-top: 2px;">satyarajbarnwal0704@gmail.com</div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; padding: 20px 24px; border-radius: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Verified Source Code</div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a;">GitHub Public Repository</div>
          <div style="font-size: 13px; color: #7c3aed; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">satya-no17/futureStack</div>
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
      <span class="badge-pill badge-purple">Feature Architecture</span>
    </div>

    <h2 class="slide-title">The Complete Shipped Feature Suite</h2>
    <div class="slide-subtitle">A Fully Integrated Pre-Publication Ecosystem Working Across 8 Unified Dashboard Modules</div>

    <div class="grid-4">
      <div class="card card-purple-top">
        <div class="card-number">01</div>
        <div class="card-title" style="margin-top: 10px;">Pre-Publication Review</div>
        <p class="card-desc">
          Automated multi-stage analysis checking drafts for policy compliance before any live release.
        </p>
        <ul class="bullet-list">
          <li><strong>Banned Terminology:</strong> Catches legal risk words like "guaranteed" or "cheap".</li>
          <li><strong>Voice Consistency:</strong> Flags hype, passive voice, and aggressive slang.</li>
          <li><strong>Truth Verification:</strong> Verifies stats against technical fact sheets.</li>
          <li><strong>Readability:</strong> Scores Flesch-Kincaid grade level and sentence length.</li>
        </ul>
        <div class="stat-box">
          <div class="stat-val" style="color: #7c3aed;">Sub-50ms</div>
          <div class="stat-label">Local rule evaluation latency</div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-number">02</div>
        <div class="card-title" style="margin-top: 10px;">Intent-Preserving Fixes</div>
        <p class="card-desc">
          Pinpoint suggestions that improve brand alignment without wiping out the writer's authentic tone.
        </p>
        <ul class="bullet-list">
          <li><strong>Token Highlighting:</strong> Color-codes exact character ranges in draft text.</li>
          <li><strong>Non-Destructive:</strong> Fixes single phrases rather than rewriting whole paragraphs.</li>
          <li><strong>1-Click Replace:</strong> Swaps in approved vocabulary instantly.</li>
          <li><strong>Live Score Update:</strong> Recalculates 0-100 score immediately upon fix.</li>
        </ul>
        <div class="stat-box">
          <div class="stat-val" style="color: #ec4899;">100%</div>
          <div class="stat-label">Offset-grounded text fixes</div>
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-number">03</div>
        <div class="card-title" style="margin-top: 10px;">Team Review Queue</div>
        <p class="card-desc">
          Human-in-the-loop governance interface coordinating writers, editors, and brand leads.
        </p>
        <ul class="bullet-list">
          <li><strong>Approval Stages:</strong> Draft &rarr; In Review &rarr; Approved / Changes Requested.</li>
          <li><strong>Side-by-Side Diffs:</strong> Shows exact red deletions and green additions.</li>
          <li><strong>Threaded Comments:</strong> Contextual annotations attached to text lines.</li>
          <li><strong>Role Permissions:</strong> Creator, Reviewer, and Admin capabilities.</li>
        </ul>
        <div class="stat-box">
          <div class="stat-val" style="color: #10b981;">3 Roles</div>
          <div class="stat-label">Role-Based Access Control (RBAC)</div>
        </div>
      </div>

      <div class="card card-blue-top">
        <div class="card-number">04</div>
        <div class="card-title" style="margin-top: 10px;">Round 3 Commitments</div>
        <p class="card-desc">
          Delivered all three promised major capabilities fully verified in the live application.
        </p>
        <ul class="bullet-list">
          <li><strong>Slide Deck Scanner:</strong> Multi-slide layout margins, logo safety & claims.</li>
          <li><strong>Social Publishing:</strong> Zero-API Twitter/X & LinkedIn intent dispatch.</li>
          <li><strong>Universal Webhooks:</strong> Signed payloads to WordPress, Webflow, Zapier.</li>
          <li><strong>Self-Healing Rules:</strong> AI auto-clarification of repeated violations.</li>
        </ul>
        <div class="stat-box">
          <div class="stat-val" style="color: #2563eb;">3 of 3</div>
          <div class="stat-label">Major commitments completed</div>
        </div>
      </div>
    </div>

    <div class="info-callout">
      <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">
        ✓ Live Dashboard Modules: Draft Studio • Review Queue • Slide Deck Scanner • Guideline Vector Store • Technical Fact Sheets • Analytics Dashboard • Self-Healing Rules • Settings
      </div>
      <span class="badge-pill badge-emerald">All 8 Tabs Operational</span>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Complete Feature Suite</span>
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

    <h2 class="slide-title">The 4-Tier Hybrid Content Review Pipeline</h2>
    <div class="slide-subtitle">Multi-Dimensional Analysis Delivering Explainable, Fact-Grounded Findings in Milliseconds</div>

    <div class="grid-4">
      <div class="card" style="background: #faf5ff; border-color: #d8b4fe;">
        <span class="tag" style="background: #e9d5ff; color: #6b21a8;">Tier 1 • Instant Filter</span>
        <div class="card-title" style="margin-top: 8px;">Banned Terminology</div>
        <p class="card-desc">
          High-speed regex engine matching forbidden vocabulary, liability triggers, and outdated marketing claims.
        </p>
        <ul class="bullet-list">
          <li><strong>Prohibited Terms:</strong> "cheap", "guaranteed", "#1 best", "instant", "faultless".</li>
          <li><strong>Word Boundaries:</strong> Regex word boundary logic prevents false positive matches.</li>
          <li><strong>Severity Weighting:</strong> Flags categorized as High, Medium, or Low impact.</li>
          <li><strong>Recommended Terms:</strong> Pairs every banned word with approved brand phrasing.</li>
        </ul>
        <div class="stat-box" style="background: #ffffff;">
          <div class="stat-val" style="color: #7c3aed;">&lt; 5ms</div>
          <div class="stat-label">Execution speed</div>
        </div>
      </div>

      <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
        <span class="tag" style="background: #dbeafe; color: #1e40af;">Tier 2 • Semantic RAG</span>
        <div class="card-title" style="margin-top: 8px;">Voice & Tone Grounding</div>
        <p class="card-desc">
          Retrieves top guideline vector chunks via cosine similarity to analyze nuance, empathy, and professional style.
        </p>
        <ul class="bullet-list">
          <li><strong>Tone Analysis:</strong> Catches aggressive sales pressure, hyperbole, and slang.</li>
          <li><strong>Guideline Citation:</strong> Explains exactly which brand rule was breached and why.</li>
          <li><strong>Perspective Checks:</strong> Enforces first-person plural ("We build") vs impersonal voice.</li>
          <li><strong>Vector Retrieval:</strong> Queries 384-dimensional dense embeddings in pgvector.</li>
        </ul>
        <div class="stat-box" style="background: #ffffff;">
          <div class="stat-val" style="color: #2563eb;">Top-4</div>
          <div class="stat-label">Vector chunks matched</div>
        </div>
      </div>

      <div class="card" style="background: #fffbeb; border-color: #fde68a;">
        <span class="tag" style="background: #fef3c7; color: #92400e;">Tier 3 • Fact Verification</span>
        <div class="card-title" style="margin-top: 8px;">Claim Truth Checking</div>
        <p class="card-desc">
          Cross-examines promotional statistics, pricing, and technical claims against indexed company fact sheets.
        </p>
        <ul class="bullet-list">
          <li><strong>Tri-State Scoring:</strong> Supported (verified), Unverified (no proof), Contradicted (false).</li>
          <li><strong>SLA & Compliance:</strong> Confirms uptime claims (e.g. 99.95%) and SOC2 statements.</li>
          <li><strong>Source Attribution:</strong> Names the approved reference document for every check.</li>
          <li><strong>Anti-Hallucination:</strong> Strict prompt constraints prevent false AI assumptions.</li>
        </ul>
        <div class="stat-box" style="background: #ffffff;">
          <div class="stat-val" style="color: #d97706;">Tri-State</div>
          <div class="stat-label">Verification classification</div>
        </div>
      </div>

      <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
        <span class="tag" style="background: #d1fae5; color: #065f46;">Tier 4 • Readability & Visual</span>
        <div class="card-title" style="margin-top: 8px;">Accessibility & Scoring</div>
        <p class="card-desc">
          Computes readability grade levels and verifies image contrast standards for visual accessibility.
        </p>
        <ul class="bullet-list">
          <li><strong>Flesch-Kincaid:</strong> Computes reading grade level (optimal target: Grade 8 to 11).</li>
          <li><strong>Sentence Length:</strong> Flags dense sentences exceeding 30 words for clarity.</li>
          <li><strong>WCAG 2.1 AA/AAA:</strong> Audits visual banner color contrast ratios (min 4.5:1).</li>
          <li><strong>Weighted Score:</strong> Generates unified 0 to 100 overall compliance score.</li>
        </ul>
        <div class="stat-box" style="background: #ffffff;">
          <div class="stat-val" style="color: #059669;">WCAG AA</div>
          <div class="stat-label">Contrast ratio standard</div>
        </div>
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
      <span class="badge-pill badge-purple">Writer Experience</span>
    </div>

    <h2 class="slide-title">Draft Studio: In-Line Token Highlighter & 1-Click Fixes</h2>
    <div class="slide-subtitle">Precision Suggestions That Preserve the Author's Voice While Correcting Off-Brand Words</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">In-Line Visual Highlighter Mechanics</div>
        <p class="card-desc">
          Draft text renders with non-overlapping color-coded visual tokens. Each token marks the exact character offsets of an identified issue:
        </p>
        <div class="code-snippet">
<span style="color: #94a3b8;">// Live draft representation in Inkloom Draft Studio:</span>
"Our <span style="background: #fecaca; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">crazy fast</span> cloud is <span style="background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">guaranteed</span> to cut costs by 80% with <span style="background: #fed7aa; color: #9a3412; padding: 2px 6px; border-radius: 4px; font-weight: bold;">instant</span> setup."

<span style="color: #f87171;">• Red Token:</span> Banned Term ("crazy fast" &rarr; suggests "sub-50ms latency")
<span style="color: #facc15;">• Yellow Token:</span> Unverified Claim ("guaranteed" &rarr; suggests "backed by 99.95% SLA")
<span style="color: #fb923c;">• Orange Token:</span> Tone Deviation ("instant" &rarr; suggests "near real-time")
        </div>
        <ul class="bullet-list" style="margin-top: 14px;">
          <li><strong>Exact Character Offsets:</strong> Bounded by `startIndex` and `endIndex` to prevent text jumping.</li>
          <li><strong>Direct Inline Editing:</strong> Writers can edit text directly in place, then click "Check My Words" to re-evaluate in real time.</li>
          <li><strong>Selective Correction:</strong> Click any highlighted phrase to inspect the specific rule and reason.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-title">Intent-Preserving Correction Cards</div>
        <p class="card-desc">
          Generic AI tools rewrite entire paragraphs destructively. Inkloom isolates only the offending token and offers a 1-click replacement:
        </p>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-top: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="badge-pill" style="background: #fee2e2; color: #dc2626; font-size: 11px;">Must Fix • Banned Term</span>
            <span style="font-size: 11px; font-weight: 700; color: #64748b;">Source: Brand Policy #14</span>
          </div>
          <div style="font-size: 14.5px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Problem phrase: &ldquo;cheap cloud storage&rdquo;</div>
          <div style="font-size: 12.5px; color: #475569; margin-bottom: 12px; line-height: 1.45;">
            The word "cheap" conveys low reliability and compromises enterprise brand positioning.
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13.5px; font-weight: 700; color: #166534;">Fix: &ldquo;cost-effective cloud storage&rdquo;</span>
            <span style="font-size: 11.5px; font-weight: 800; background: #166534; color: #fff; padding: 5px 12px; border-radius: 6px;">1-Click Apply</span>
          </div>
        </div>

        <ul class="bullet-list" style="margin-top: 14px;">
          <li><strong>Dynamic Score Update:</strong> The document score increments immediately upon accepting a suggested fix.</li>
          <li><strong>Compliance Dismissal Note:</strong> Writers who reject a suggestion must submit a justification note, preserving audit accountability.</li>
          <li><strong>Tone Preservation:</strong> Sentence cadence and narrative voice remain 100% authored by the creator.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Draft Studio & 1-Click Fixes</span>
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

    <h2 class="slide-title">Editorial Review Queue & Side-by-Side Diff Viewer</h2>
    <div class="slide-subtitle">Structured Human-in-the-Loop Governance for Distributed Marketing Teams and Agencies</div>

    <div class="grid-2">
      <div class="card card-purple-top">
        <div class="card-title">Editorial Review Queue</div>
        <p class="card-desc">
          Submitted drafts transition into the Review Queue, providing marketing leads and reviewers with clear action stages:
        </p>
        <ul class="bullet-list" style="margin-top: 12px;">
          <li><strong>Stage Progression:</strong> Moves content cleanly from <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-size: 11px;">Draft</code> &rarr; <code style="font-family: 'JetBrains Mono'; color: #2563eb; font-size: 11px;">In Review</code> &rarr; <code style="font-family: 'JetBrains Mono'; color: #059669; font-size: 11px;">Approved</code> or <code style="font-family: 'JetBrains Mono'; color: #dc2626; font-size: 11px;">Changes Requested</code>.</li>
          <li><strong>Reviewer Decision Controls:</strong> Reviewers can approve compliant drafts or request revisions with structured feedback.</li>
          <li><strong>Threaded Annotations:</strong> Leave line-item feedback directly tied to specific paragraphs or claims.</li>
          <li><strong>Audit Trail Logging:</strong> Immutable timestamped records of who submitted, revised, and approved every asset.</li>
        </ul>
        <div class="stat-box" style="display: flex; justify-content: space-around; margin-top: 14px;">
          <div>
            <div class="stat-val" style="color: #7c3aed;">100%</div>
            <div class="stat-label">Logged Audit History</div>
          </div>
          <div>
            <div class="stat-val" style="color: #059669;">Instant</div>
            <div class="stat-label">Handoff to Reviewer</div>
          </div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Side-by-Side Version Diff Viewer</div>
        <p class="card-desc">
          Reviewers can inspect exact word-by-word differences between draft revisions, saving hours of manual proofreading:
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-top: 10px;">
          <div style="font-size: 11px; font-weight: 800; color: #dc2626; margin-bottom: 4px;">REMOVED IN REVISION (RED):</div>
          <div style="background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-family: 'JetBrains Mono', monospace; margin-bottom: 10px;">
            - "Our crazy fast platform is the cheapest on the market guaranteed."
          </div>
          <div style="font-size: 11px; font-weight: 800; color: #16a34a; margin-bottom: 4px;">APPROVED REVISION (GREEN):</div>
          <div style="background: #dcfce7; color: #166534; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-family: 'JetBrains Mono', monospace;">
            + "Our platform delivers sub-50ms latency backed by our 99.95% uptime SLA."
          </div>
        </div>
        <ul class="bullet-list" style="margin-top: 14px;">
          <li><strong>Version History:</strong> Step back through any historical snapshot with full restore capability.</li>
          <li><strong>Resolution Tracking:</strong> Highlights whether requested changes were addressed or dismissed.</li>
          <li><strong>Publish Gate:</strong> Prevents live publication until an authorized reviewer signs off.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Review Queue & Version History</span>
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
    <div class="slide-subtitle">Delivered: Automated Pitch Deck Ingestion, Layout Validation & Factual Spec Auditing</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">1. Presentation Ingestion & Parsing</div>
        <p class="card-desc">
          Parses structured multi-slide decks and PPTX XML layout trees, breaking decks down into individual slide nodes:
        </p>
        <ul class="bullet-list">
          <li><strong>Slide Segmentation:</strong> Extracts slide numbers, titles, body paragraphs, and visual bounding boxes.</li>
          <li><strong>Coordinate Mapping:</strong> Captures `(x, y, width, height)` coordinates for text boxes and image elements.</li>
          <li><strong>Slide-by-Slide Scoring:</strong> Computes an independent compliance score (0-100) for every slide.</li>
          <li><strong>Thumbnail Carousel:</strong> Visual slide selector in the UI for rapid navigation across the deck.</li>
        </ul>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">2. Layout Margins & Safety Zones</div>
        <p class="card-desc">
          Audits visual boundaries, brand logo exclusion margins, and visual typography guidelines:
        </p>
        <ul class="bullet-list">
          <li><strong>Logo Clearance Perimeter:</strong> Automatically flags any element violating the &lt;20px edge safety clearance.</li>
          <li><strong>Typography Violations:</strong> Detects aggressive ALL-CAPS headlines (&gt;4 consecutive capital words).</li>
          <li><strong>Element Crowding:</strong> Flags overlapping text boxes and poorly positioned graphics.</li>
          <li><strong>Visual Hierarchy:</strong> Checks title-to-body font scale ratios across all slides.</li>
        </ul>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">3. Slide Claim RAG Verification</div>
        <p class="card-desc">
          Cross-examines bullet-point claims and metrics on slides against approved technical fact sheets:
        </p>
        <ul class="bullet-list">
          <li><strong>Superlative Claims:</strong> Flags unsubstantiated marketing phrases like "#1 fastest" or "instant setup".</li>
          <li><strong>Metric Grounding:</strong> Verifies uptime numbers (99.95%) and SLA guarantees against spec sheets.</li>
          <li><strong>Slide Action Cards:</strong> Generates targeted correction cards directly attached to each offending slide.</li>
          <li><strong>Verified Pass Status:</strong> Decks pass only when all slides meet minimum compliance thresholds.</li>
        </ul>
      </div>
    </div>

    <div class="info-callout">
      <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">
        ✓ Verified in Automated Test Suite: Tested a 3-slide pitch deck with typography violations, boundary crowding, and unverified claims (caught 13 issues, score: 54/100).
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

    <h2 class="slide-title">Zero-API Social Publishing & Webhook Connectors</h2>
    <div class="slide-subtitle">Delivered: 1-Click Publishing to Social Networks and Outbound Headless Webhooks</div>

    <div class="grid-2">
      <div class="card card-purple-top">
        <div class="card-title">Zero-API Social Web Intent Publishing</div>
        <p class="card-desc">
          Judges and users can publish approved content immediately without needing developer API keys, OAuth credentials, or third-party approvals:
        </p>
        <ul class="bullet-list" style="margin-top: 12px;">
          <li><strong>Twitter / X Web Intent:</strong> Pre-formats approved text, validates character count against the 280-char limit, and launches a 1-click posting window (`twitter.com/intent/tweet`).</li>
          <li><strong>LinkedIn Share Intent:</strong> Automatically formats title, summary, and hashtags into LinkedIn's share interface (`linkedin.com/sharing/share-offsite`).</li>
          <li><strong>Compliance Trust Badge:</strong> Appends optional verifiable watermark: <code style="font-family: 'JetBrains Mono'; color: #059669; font-size: 11.5px;">[Verified by Inkloom AI — Score 100/100]</code>.</li>
          <li><strong>7 Target Channels:</strong> Twitter/X, LinkedIn, WordPress, Webflow, Shopify, Ghost, and Custom Webhooks.</li>
        </ul>
        <div class="stat-box" style="display: flex; justify-content: space-around; margin-top: 14px;">
          <div>
            <div class="stat-val" style="color: #7c3aed;">7 Channels</div>
            <div class="stat-label">Supported Destinations</div>
          </div>
          <div>
            <div class="stat-val" style="color: #059669;">Zero Setup</div>
            <div class="stat-label">No API Keys Required</div>
          </div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Universal Headless Webhook Dispatcher</div>
        <p class="card-desc">
          Pushes approved, compliant drafts directly to external CMS platforms (WordPress, Webflow) or automation pipelines (Zapier, Make, Slack):
        </p>
        <div class="code-snippet">
<span style="color: #94a3b8;">// Outbound Webhook JSON Contract:</span>
{
  "event": "content.published",
  "contentId": "c4b18e-49d4-9f15-published",
  "title": "Enterprise Cloud Infrastructure Launch",
  "score": 100,
  "status": "approved",
  "publishedBy": "reviewer@company.com",
  "timestamp": "2026-10-30T22:15:00Z",
  "verificationSignature": "sha256-hmac-inkloom-valid"
}
        </div>
        <ul class="bullet-list" style="margin-top: 12px;">
          <li><strong>Custom Authorization:</strong> Supports custom Bearer tokens and API key headers.</li>
          <li><strong>Safe Execution:</strong> 10-second timeout safeguard with automated delivery verification logging.</li>
          <li><strong>Audit Preservation:</strong> Persists webhook response codes and delivery status in PostgreSQL.</li>
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
          Continuously analyzes audit logs and review history to identify brand rules that team members frequently fail:
        </p>
        <ul class="bullet-list">
          <li><strong>Failure Tracking:</strong> Counts repeated violation frequencies per guideline rule chunk.</li>
          <li><strong>Violator Diversity:</strong> Identifies rules failed by multiple independent team members.</li>
          <li><strong>Dismissal Detection:</strong> Flags rules where writers frequently dismiss AI suggestions with notes.</li>
          <li><strong>Ambiguity Radar:</strong> Automatically surfaces problematic rules on the Dashboard.</li>
        </ul>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">2. AI-Driven Rule Clarification</div>
        <p class="card-desc">
          Queries Google Gemini with the ambiguous guideline chunk and real failure cases to draft clear instructions:
        </p>
        <ul class="bullet-list">
          <li><strong>Actionable Phrasing:</strong> Replaces vague advice ("Be punchy") with explicit, actionable boundaries.</li>
          <li><strong>Do & Don't Pairs:</strong> Generates concrete pairs of acceptable and prohibited writing examples.</li>
          <li><strong>Root Cause Analysis:</strong> Explains exactly why creators struggled with the original wording.</li>
          <li><strong>Review Ready:</strong> Delivers clean, ready-to-approve revision cards to marketing leads.</li>
        </ul>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">3. 1-Click Rulebook & Vector Update</div>
        <p class="card-desc">
          Marketing leads can review the suggested clarification and apply it to the live governance engine in one click:
        </p>
        <ul class="bullet-list">
          <li><strong>Instant DB Sync:</strong> Appends or updates the clarified rule in the PostgreSQL database.</li>
          <li><strong>Vector Re-indexing:</strong> Re-chunks text and updates vector embeddings in pgvector.</li>
          <li><strong>Zero Restart:</strong> All future content scans immediately enforce the newly clarified rule.</li>
          <li><strong>Revision History:</strong> Maintains an immutable log of who approved guideline changes.</li>
        </ul>
      </div>
    </div>

    <div class="info-callout">
      <div style="font-size: 13.5px; font-weight: 700; color: #0f172a;">
        ✓ Live on the Score & Reports Tab: SelfHealingCard displays active AI recommendations with a 1-click "Apply Clarification" button that updates the rule store.
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
    <div class="slide-subtitle">Modular TypeScript Microservice, Vector-Indexed Cloud Storage, and Resilient AI Failover</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">Frontend Layer</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Next.js 16 + React 19 + Tailwind CSS</p>
        <p class="card-desc">
          App Router architecture with Turbopack compilation. Features high-contrast light theme, React Error Boundaries, and offline fallback interceptors.
        </p>
        <div class="code-snippet">
• Next.js 16 App Router & React 19
• Tailwind CSS custom design tokens
• Character-level text highlight engine
• Interactive multi-slide preview modal
• Lucide React icon suite
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">Backend API Layer</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Node.js + Express + TypeScript</p>
        <p class="card-desc">
          High-throughput REST API running on port 4000. Coordinates deterministic regex rule checks and vector RAG retrieval with SHA-256 payload caching.
        </p>
        <div class="code-snippet">
• Modular Express route controllers
• Zod schema validation on all inputs
• PPTX XML slide parsing engine
• JWT auth & bcrypt password hashing
• Sub-50ms deterministic regex scanner
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Database & Vector Store</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">PostgreSQL + pgvector Extension</p>
        <p class="card-desc">
          Relational storage managing drafts, reviews, comments, and audit logs. Executes sub-10ms cosine similarity searches across brand guideline embeddings.
        </p>
        <div class="code-snippet">
• 384-dimensional dense vectors
• Cosine distance search (&lt;=&gt; operator)
• Drizzle ORM schema migrations
• Multi-role permissions schema
• Audit log persistence tables
        </div>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 16px 24px; margin-top: 18px;">
      <div style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
        Google Gemini 1.5 Flash AI with Deterministic Heuristic Failover
      </div>
      <div style="font-size: 12.5px; color: #475569; line-height: 1.5;">
        Powered by <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">Google Gemini 1.5 Flash</code> for semantic voice analysis, claim grounding, and self-healing rule synthesis. If network outages occur or API keys are missing, the system gracefully falls back to deterministic rule checks (banned words, grade level, layout margins) with a visible "Rule Checks Only" badge. Zero white-screen errors.
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

    <h2 class="slide-title">Testing Verification & Future Product Roadmap</h2>
    <div class="slide-subtitle">100% Pass Rate Across 42 Automated Scenarios and Long-Term Development Vision</div>

    <div class="grid-2">
      <div class="card card-emerald-top">
        <div class="card-title">Comprehensive Testing Verification</div>
        <p class="card-desc">
          Verified through an automated 4-tier resilience suite (<code style="font-family: 'JetBrains Mono'; font-size: 11.5px;">verify-resilience.mjs</code>) and Round 3 module tests:
        </p>
        <ul class="bullet-list" style="margin-top: 10px;">
          <li><strong>Tier 1: Feature Coverage (24/24 PASS):</strong> Verified error boundaries, offline fallback data across 8 tabs, walkthrough steps, tooltips, and WCAG AA contrast.</li>
          <li><strong>Tier 2: Boundary & Stress (8/8 PASS):</strong> Network timeouts, HTTP 500 recovery, session corruption, and extreme 50,000-character inputs.</li>
          <li><strong>Tier 3: Offline Reliability (6/6 PASS):</strong> Full dashboard navigation and 1-click suggestion replacements without database or internet.</li>
          <li><strong>Tier 4: E2E User Journeys (4/4 PASS):</strong> Creator Drafting, Reviewer Sign-Off, Outage Recovery, and Keyboard Navigation.</li>
          <li><strong>Round 3 Features (4/4 PASS):</strong> Verified Slide Deck Scanner, Zero-API Publishing, Universal Webhook dispatch, and Self-Healing rules.</li>
        </ul>
        <div class="stat-box" style="margin-top: 12px;">
          <div class="stat-val" style="color: #059669;">42 / 42 PASS (100%)</div>
          <div class="stat-label">Automated verification scenarios passing</div>
        </div>
      </div>

      <div class="card card-purple-top">
        <div class="card-title">Where It Goes Next (Product Roadmap)</div>
        <p class="card-desc">
          Strategic product expansion plan for post-hackathon commercial deployment:
        </p>
        <ul class="bullet-list" style="margin-top: 10px;">
          <li><strong>Phase 1 (Q1) — In-Context Browser & Figma Extension:</strong> Chrome/Edge extension bringing Inkloom's rule engine directly into Google Docs, Notion, Canva, and Figma canvas without tab switching.</li>
          <li><strong>Phase 2 (Q2) — Two-Way CMS Synchronization:</strong> Bi-directional webhooks with WordPress, Webflow, and Contentful to automatically flag live websites when company facts or pricing change.</li>
          <li><strong>Phase 3 (Q3) — Multi-Language Brand Voice:</strong> Grounding brand tone across global marketing teams (Spanish, German, French, Japanese) using multilingual dense vector embeddings.</li>
          <li><strong>Phase 4 (Q4) — Enterprise SSO & SOC2 Compliance:</strong> SAML/Okta single sign-on, immutable SOC2 audit log exports, and multi-tenant workspace isolation.</li>
        </ul>
        <div class="stat-box" style="margin-top: 12px;">
          <div class="stat-val" style="color: #7c3aed;">4 Phases</div>
          <div class="stat-label">Structured commercial roadmap</div>
        </div>
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
