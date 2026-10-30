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
      margin-bottom: 28px;
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
      margin-bottom: 34px;
    }

    /* Grids */
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
      padding: 28px;
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
      font-size: 21px;
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
      margin-top: auto;
      padding-top: 14px;
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

      <h1 style="font-size: 62px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.03em;">
        Smart Brand Checker & Publishing Platform
      </h1>

      <p style="font-size: 24px; color: #475569; font-weight: 500; max-width: 1050px; line-height: 1.5; margin-bottom: 50px;">
        Inkloom AI helps companies check their writing and slide decks before publishing. It catches banned words, checks facts, fixes tone in one click, and lets you safely publish to social media and websites.
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
          <div style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Source Code</div>
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
      <span class="badge-pill badge-purple">What Inkloom Does</span>
    </div>

    <h2 class="slide-title">Everything Built and Working in the Product</h2>
    <div class="slide-subtitle">A Complete System That Keeps Company Content Accurate, On-Brand, and Ready to Publish</div>

    <div class="grid-4">
      <div class="card card-purple-top">
        <div class="card-number">01</div>
        <div class="card-title" style="margin-top: 12px;">Instant Content Check</div>
        <p class="card-desc">
          Catches bad words, overly casual tone, fake promises, and hard-to-read sentences before anything goes public.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #7c3aed;">Instant</div>
          <div class="stat-label">Fast local checks</div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-number">02</div>
        <div class="card-title" style="margin-top: 12px;">1-Click Smart Fixes</div>
        <p class="card-desc">
          Highlights the exact wrong word and replaces it with an approved brand phrase without rewriting the author's whole story.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #ec4899;">1 Click</div>
          <div class="stat-label">To apply approved fix</div>
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-number">03</div>
        <div class="card-title" style="margin-top: 12px;">Team Review Queue</div>
        <p class="card-desc">
          Managers and reviewers can see draft history, compare version differences, add comments, and sign off safely.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #10b981;">3 Roles</div>
          <div class="stat-label">Creator, Reviewer, Admin</div>
        </div>
      </div>

      <div class="card card-blue-top">
        <div class="card-number">04</div>
        <div class="card-title" style="margin-top: 12px;">All 3 Upgrades Shipped</div>
        <p class="card-desc">
          Slide Deck Scanner, 1-Click Social Media Publishing, and Self-Healing Brand Rules are all built and working.
        </p>
        <div class="stat-box">
          <div class="stat-val" style="color: #2563eb;">3 of 3</div>
          <div class="stat-label">Commitments Delivered</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Features Overview</span>
      <span>Page 2 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 3: 4-TIER GOVERNANCE ENGINE          -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">How It Works</span>
    </div>

    <h2 class="slide-title">The 4-Step Review Process</h2>
    <div class="slide-subtitle">Every Draft Goes Through 4 Clear Checks to Catch Different Types of Mistakes</div>

    <div class="grid-4">
      <div class="card" style="background: #faf5ff; border-color: #d8b4fe;">
        <span class="tag" style="background: #e9d5ff; color: #6b21a8;">Step 1 • Fast Filter</span>
        <div class="card-title" style="margin-top: 10px;">Banned Words</div>
        <p class="card-desc">
          Catches prohibited terms and risky promises like "cheap", "100% guaranteed", or "#1 best" in milliseconds.
        </p>
        <ul class="bullet-list">
          <li>Finds the exact word position</li>
          <li>Labels risk: High, Medium, or Low</li>
          <li>Shows the preferred company term</li>
        </ul>
      </div>

      <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
        <span class="tag" style="background: #dbeafe; color: #1e40af;">Step 2 • Voice Check</span>
        <div class="card-title" style="margin-top: 10px;">Brand Voice & Tone</div>
        <p class="card-desc">
          Reads the text like an editor to make sure it sounds professional, confident, and matches company personality.
        </p>
        <ul class="bullet-list">
          <li>Flags slang, hype, and pushy words</li>
          <li>Matches against company style rules</li>
          <li>Explains why the tone feels off</li>
        </ul>
      </div>

      <div class="card" style="background: #fffbeb; border-color: #fde68a;">
        <span class="tag" style="background: #fef3c7; color: #92400e;">Step 3 • Fact Checker</span>
        <div class="card-title" style="margin-top: 10px;">Truth & Claim Verification</div>
        <p class="card-desc">
          Compares numbers, pricing, and technical claims against official company documents and specs.
        </p>
        <ul class="bullet-list">
          <li>Flags unproven or exaggerated stats</li>
          <li>Labels: Supported, Unverified, False</li>
          <li>Cites the official source document</li>
        </ul>
      </div>

      <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
        <span class="tag" style="background: #d1fae5; color: #065f46;">Step 4 • Readability</span>
        <div class="card-title" style="margin-top: 10px;">Easy to Read & Accessible</div>
        <p class="card-desc">
          Scores reading difficulty and verifies that visual banners have high color contrast so anyone can read them.
        </p>
        <ul class="bullet-list">
          <li>Scores reading grade level</li>
          <li>Flags run-on sentences</li>
          <li>Checks WCAG color contrast standards</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • The 4 Review Steps</span>
      <span>Page 3 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 4: DRAFT STUDIO & 1-CLICK FIXES      -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Writing Experience</span>
    </div>

    <h2 class="slide-title">Writer Studio: See Mistakes & Fix Them in 1 Click</h2>
    <div class="slide-subtitle">We Help Writers Fix Off-Brand Words Without Destroying Their Original Message</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Color-Coded Visual Highlighter</div>
        <p class="card-desc">
          Writers type naturally. When they click "Check My Words", the app highlights exact problem words in color:
        </p>
        <div class="code-snippet">
<span style="color: #94a3b8;">// Example of what the writer sees:</span>
"Our <span style="background: #fecaca; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold;">cheap cloud</span> is <span style="background: #fef08a; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-weight: bold;">guaranteed</span> to work with <span style="background: #fed7aa; color: #9a3412; padding: 2px 6px; border-radius: 4px; font-weight: bold;">instant</span> setup."

<span style="color: #38bdf8;">• Red:</span> Banned Word ("cheap" sounds low quality)
<span style="color: #facc15;">• Yellow:</span> Unproven Claim ("guaranteed" has legal risks)
<span style="color: #fb923c;">• Orange:</span> Wrong Tone ("instant" is misleading hype)
        </div>
        <ul class="bullet-list" style="margin-top: 16px;">
          <li>Click any colored word to open a helpful explanation card.</li>
          <li>Writers stay in control—no automatic surprise overwrites.</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-title">Helpful Suggestion Cards with 1-Click Fix</div>
        <p class="card-desc">
          Instead of rewriting the entire paragraph, Inkloom suggests a clean, approved replacement that fits right in.
        </p>

        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-top: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge-pill" style="background: #fee2e2; color: #dc2626; font-size: 11px;">Must Fix • Banned Word</span>
            <span style="font-size: 11px; font-weight: 700; color: #64748b;">Rule: Company Brand Vocabulary</span>
          </div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Problem phrase: &ldquo;cheap cloud storage&rdquo;</div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 14px;">The word 'cheap' makes our enterprise cloud sound fragile.</div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; font-weight: 700; color: #166534;">Suggested: &ldquo;cost-effective cloud storage&rdquo;</span>
            <span style="font-size: 12px; font-weight: 800; background: #166534; color: #fff; padding: 5px 12px; border-radius: 6px;">1-Click Apply</span>
          </div>
        </div>

        <ul class="bullet-list" style="margin-top: 18px;">
          <li>Your brand score updates instantly the moment you accept a fix.</li>
          <li>If you disagree, you can dismiss it with an explanation note.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Writer Studio & 1-Click Fixes</span>
      <span>Page 4 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 5: REVIEW QUEUE & DIFF VIEWER        -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-emerald">Team Teamwork</span>
    </div>

    <h2 class="slide-title">Team Review Queue & Before-and-After Viewer</h2>
    <div class="slide-subtitle">Managers Can Review, Compare Changes, and Sign Off in Seconds</div>

    <div class="grid-2">
      <div class="card card-purple-top">
        <div class="card-title">Editorial Review Queue</div>
        <p class="card-desc">
          When writers submit content, it automatically appears in the team review queue so nothing gets lost in email chains or chat messages.
        </p>
        <ul class="bullet-list" style="margin-top: 16px;">
          <li><strong>Approve:</strong> Signs off on good drafts and marks them ready to publish.</li>
          <li><strong>Request Changes:</strong> Sends constructive notes back to the writer with highlighted mistakes.</li>
          <li><strong>Full Audit Trail:</strong> Records who reviewed what and when.</li>
        </ul>
        <div class="stat-box" style="display: flex; justify-content: space-around;">
          <div>
            <div class="stat-val" style="color: #7c3aed;">100%</div>
            <div class="stat-label">Actions Logged</div>
          </div>
          <div>
            <div class="stat-val" style="color: #059669;">Instant</div>
            <div class="stat-label">Handoff to Reviewer</div>
          </div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Before & After Changes Viewer</div>
        <p class="card-desc">
          Reviewers can instantly see what was changed between revisions with red and green text highlights. No need to re-read everything.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-top: 12px;">
          <div style="font-size: 12px; font-weight: 800; color: #dc2626; margin-bottom: 6px;">REMOVED IN REVISION (RED):</div>
          <div style="background: #fee2e2; color: #991b1b; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-family: 'JetBrains Mono', monospace; margin-bottom: 12px;">
            - "Our crazy fast platform is the cheapest on the market guaranteed."
          </div>
          <div style="font-size: 12px; font-weight: 800; color: #16a34a; margin-bottom: 6px;">NEW APPROVED TEXT (GREEN):</div>
          <div style="background: #dcfce7; color: #166534; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-family: 'JetBrains Mono', monospace;">
            + "Our platform delivers sub-50ms latency backed by our 99.95% uptime SLA."
          </div>
        </div>
        <p class="card-desc" style="margin-top: 14px;">
          Writers and managers can leave comments on specific lines to quickly resolve questions.
        </p>
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

    <h2 class="slide-title">Pitch Deck & Slide Scanner</h2>
    <div class="slide-subtitle">Delivered: Upload Presentation Decks to Check Slide Margins, Typography, and Claims</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">1. Reads Multi-Slide Decks</div>
        <p class="card-desc">
          Extracts titles, bullet points, and layout coordinates from slide decks to inspect each slide individually.
        </p>
        <ul class="bullet-list">
          <li>Supports structured presentations & PPTX files</li>
          <li>Calculates a safety score for each slide</li>
          <li>Interactive slide thumbnail navigation in the app</li>
        </ul>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">2. Logo Margins & Layout Checks</div>
        <p class="card-desc">
          Checks visual space around logos and warns if text is messy or violating company branding.
        </p>
        <ul class="bullet-list">
          <li><strong>Logo Clearance:</strong> Flags logos placed &lt;20px too close to slide edges</li>
          <li><strong>All-Caps Check:</strong> Flags aggressive SHOUTING headlines</li>
          <li><strong>Crowding:</strong> Flags overlapping text boxes and images</li>
        </ul>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">3. Checks Claims on Slides</div>
        <p class="card-desc">
          Compares bullet points on slides against verified company technical spec sheets.
        </p>
        <ul class="bullet-list">
          <li>Flags exaggerated claims like "#1 fastest"</li>
          <li>Verifies uptime claims against SLA sheets</li>
          <li>Gives slide-by-slide fix suggestions</li>
        </ul>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 18px 28px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
        ✓ Tested and working in automated test suite: Tested a 3-slide pitch deck and caught 13 margin, font, and claim mistakes.
      </div>
      <span class="badge-pill badge-emerald">Verified Working</span>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Improvement 1: Slide Scanner</span>
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

    <h2 class="slide-title">1-Click Social Media & Webhook Publishing</h2>
    <div class="slide-subtitle">Delivered: Publish Approved Content Straight to Social Media Without Needing API Keys</div>

    <div class="grid-2">
      <div class="card card-purple-top">
        <div class="card-title">Zero-API Social Publishing</div>
        <p class="card-desc">
          Anyone and any hackathon judge can test publishing immediately. No developer accounts, OAuth setup, or secret keys needed.
        </p>
        <ul class="bullet-list" style="margin-top: 14px;">
          <li><strong>Twitter / X:</strong> Formats the approved draft, checks the 280-character limit, and opens a 1-click posting window.</li>
          <li><strong>LinkedIn:</strong> Opens a pre-filled share window ready to post to your profile or company page.</li>
          <li><strong>Verification Trust Badge:</strong> Adds an optional proof tag: <code style="font-family: 'JetBrains Mono'; color: #059669; font-size: 12px;">[Verified by Inkloom AI — Score 100/100]</code>.</li>
        </ul>
        <div class="stat-box" style="display: flex; justify-content: space-around;">
          <div>
            <div class="stat-val" style="color: #7c3aed;">7 Channels</div>
            <div class="stat-label">Social & CMS Targets</div>
          </div>
          <div>
            <div class="stat-val" style="color: #059669;">Zero Setup</div>
            <div class="stat-label">Works Out of the Box</div>
          </div>
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Universal Webhook Dispatcher</div>
        <p class="card-desc">
          Automatically sends approved articles and compliance reports directly to websites (WordPress, Webflow) or workflows (Zapier, Slack).
        </p>
        <div class="code-snippet">
<span style="color: #94a3b8;">// Webhook data sent when you hit Publish:</span>
{
  "event": "content.published",
  "title": "Enterprise Cloud Announcement",
  "score": 100,
  "status": "approved",
  "publishedBy": "reviewer@company.com",
  "timestamp": "2026-10-30T22:15:00Z"
}
        </div>
        <ul class="bullet-list" style="margin-top: 14px;">
          <li>Sends text, score, and author info in clean JSON.</li>
          <li>Has a 10-second safety timeout and delivery verification.</li>
        </ul>
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Improvement 2: Social & Webhook Publishing</span>
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

    <h2 class="slide-title">Self-Healing Brand Rules Engine</h2>
    <div class="slide-subtitle">Delivered: When Writers Keep Breaking a Rule, AI Automatically Rewrites It in Plain English</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">1. Finds Confusing Rules</div>
        <p class="card-desc">
          Looks at history logs to find rules that multiple team members keep failing over and over again.
        </p>
        <ul class="bullet-list">
          <li>Counts violation frequency per rule</li>
          <li>Spots when multiple writers struggle</li>
          <li>Surfaces the problem rule on the Dashboard</li>
        </ul>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">2. AI Suggests Clearer Rule</div>
        <p class="card-desc">
          Uses Google Gemini to rewrite the vague rule in simple English, adding clear "Do" and "Don't" examples.
        </p>
        <ul class="bullet-list">
          <li>Replaces confusing jargon with clear instructions</li>
          <li>Provides concrete good and bad examples</li>
          <li>Explains why writers were confused</li>
        </ul>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">3. 1-Click Rulebook Update</div>
        <p class="card-desc">
          Brand managers review the suggestion and click "Apply Clarification" to update the company rulebook instantly.
        </p>
        <ul class="bullet-list">
          <li>Instantly updates active database rules</li>
          <li>Keeps full history of all rule changes</li>
          <li>All future scans immediately enforce the new rule</li>
        </ul>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 18px 28px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 14px; font-weight: 700; color: #0f172a;">
        ✓ Live on the Score & Reports Tab: SelfHealingCard displays active suggestions with a 1-click button to update the rules.
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
      <span class="badge-pill badge-emerald">Technology Stack</span>
    </div>

    <h2 class="slide-title">How the System is Built</h2>
    <div class="slide-subtitle">Modern, Reliable Web Technologies Connected to Fast AI and Vector Search</div>

    <div class="grid-3">
      <div class="card card-purple-top">
        <div class="card-title">Frontend (User Interface)</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Next.js 16 + React 19 + Tailwind CSS</p>
        <p class="card-desc">
          A clean, modern interface that loads instantly, handles draft editing, slide uploading, and works smoothly on desktop and mobile.
        </p>
        <div class="code-snippet">
• Next.js App Router for fast pages
• Tailwind CSS for clean layout
• Lucide icons for visual clarity
• Interactive step-by-step walkthrough
        </div>
      </div>

      <div class="card card-emerald-top">
        <div class="card-title">Backend (API & Rules)</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">Node.js + Express + TypeScript</p>
        <p class="card-desc">
          Runs instant rule checks in under 50ms, parses presentations, coordinates AI reviews, and delivers fast results.
        </p>
        <div class="code-snippet">
• REST API endpoints
• Instant regex checks
• Presentation XML & layout parsing
• Secure passwords and role checks
        </div>
      </div>

      <div class="card card-pink-top">
        <div class="card-title">Database & Search</div>
        <p class="card-desc" style="font-weight: 700; color: #0f172a; margin-bottom: 8px;">PostgreSQL with pgvector</p>
        <p class="card-desc">
          Stores team drafts, review comments, and uses fast vector similarity search to find matching brand rules in milliseconds.
        </p>
        <div class="code-snippet">
• Fast vector similarity search
• Safe draft & revision history
• Multi-role team permissions
• Automated database setup
        </div>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 20px 28px; margin-top: 24px;">
      <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
        Google Gemini AI with Offline Fallback Protection
      </div>
      <div style="font-size: 13px; color: #475569; line-height: 1.5;">
        Uses <code style="font-family: 'JetBrains Mono'; color: #7c3aed; font-weight: bold;">Google Gemini 1.5 Flash</code> for smart tone review. If internet or API keys are ever unavailable, the system automatically falls back to local rules so writers are never blocked and the screen never crashes.
      </div>
    </div>

    <div class="slide-footer">
      <span>Inkloom AI • Technology & Architecture</span>
      <span>Page 9 of 10</span>
    </div>
  </div>


  <!-- ========================================== -->
  <!-- SLIDE 10: TESTING, RESILIENCE & ROADMAP    -->
  <!-- ========================================== -->
  <div class="slide">
    <div class="top-header">
      <div class="brand-logo"><span class="brand-icon"></span> Inkloom AI</div>
      <span class="badge-pill badge-purple">Testing & What We Will Build Next</span>
    </div>

    <h2 class="slide-title">Testing Results & Future Roadmap</h2>
    <div class="slide-subtitle">100% Passed Across 42 Automated Scenarios and Clear Next Steps</div>

    <div class="grid-2">
      <div class="card card-emerald-top">
        <div class="card-title">Testing: 100% Pass Rate (42/42 Tests)</div>
        <p class="card-desc">
          Tested thoroughly with an automated test suite (<code style="font-family: 'JetBrains Mono'; font-size: 12px;">verify-resilience.mjs</code>) covering 4 key areas:
        </p>
        <ul class="bullet-list" style="margin-top: 12px;">
          <li><strong>Feature Checks (24/24 PASS):</strong> Every button, walkthrough step, demo card, and color contrast passed.</li>
          <li><strong>Stress & Bad Inputs (8/8 PASS):</strong> Handled network drops, invalid passwords, and giant 50,000-character inputs smoothly.</li>
          <li><strong>Offline Reliability (6/6 PASS):</strong> Every single tab in the app works even with internet or database disconnected.</li>
          <li><strong>Complete User Journeys (4/4 PASS):</strong> Tested complete writer, reviewer, and admin flows from start to finish.</li>
        </ul>
      </div>

      <div class="card card-purple-top">
        <div class="card-title">Where It Goes Next (Product Roadmap)</div>
        <p class="card-desc">
          What we will build next and who it is for:
        </p>
        <ul class="bullet-list" style="margin-top: 12px;">
          <li><strong>1. Browser Extension for Google Docs & Notion:</strong> Content creators can see brand warnings right inside Google Docs, Notion, or Canva while typing.</li>
          <li><strong>2. Two-Way Website Sync (WordPress & Webflow):</strong> For marketing teams—automatically updates live blog posts when brand rules change.</li>
          <li><strong>3. Multi-Language Brand Voice:</strong> For global companies—ensures consistent tone across English, Spanish, French, and Japanese.</li>
          <li><strong>4. Enterprise Single Sign-On (SSO):</strong> For large companies needing Okta, Google Workspace, and Microsoft Azure login.</li>
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
