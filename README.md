# Inkloom AI — Pre-Publication Brand Governance Platform
**Prepared for Team SATYACODEZ**

Inkloom AI is an automated, pre-publication brand governance platform that scans content (social posts, marketing copy, announcements, technical specs, and slide decks) against approved brand guidelines and verified facts before it goes live.

---

## 🌟 Key Architecture & Highlights

- **Multi-Tenant Schema**: Full organization isolation across Postgres + pgvector.
- **pgvector Semantic Search**: Dense 384-dimensional vector embeddings with cosine distance (`<=>`) retrieval for facts and guideline chunks.
- **Hybrid AI Review Engine**:
  - **Rule Check**: Instant case-insensitive whole-word matching on banned and outdated terminology with preferred replacements.
  - **Tone Check**: Vector retrieval of brand voice guidelines + LLM audit of voice/style boundaries with transparent fallback indicators.
  - **Claim Verification**: Automatic claim extraction -> vector retrieval of top company facts -> LLM factual judgement (`supported`, `contradicted`, `unverifiable`) -> exact quote offset validation in text.
  - **Accessibility & Readability**: Pure code audit calculating WCAG 2.1 relative luminance & contrast ratios ($L = 0.2126R + 0.7152G + 0.0722B$, ratio $(L_1+0.05)/(L_2+0.05)$), missing image alt-text, >30-word run-on sentences, and all-caps blocks.
- **Intent-Preserving Fixes**: 1-click "Accept Fix" replaces flagged spans directly in the document and re-evaluates the score.
- **Collaborative Sign-off**: Version-by-version visual Diff Viewer (red removals, green additions), anchored reviewer comment threads, and structured approval decisions (`approved`, `changes_requested`, `rejected`).
- **Zero-API Social Publishing Engine**:
  - **Zero-API Web Share Intents**: Instant 1-click launch to Twitter/X, LinkedIn, Threads, Bluesky, Reddit, Telegram, and WhatsApp with pre-filled compliant copy.
  - **Context-Aware Formatting**: Auto-calculates character limits per channel (280 Twitter, 500 Threads, 300 Bluesky) and formats text with verified brand compliance badges (`🛡️ Verified Brand-Compliant by Inkloom AI`).
  - **Low-API Universal Webhooks**: Dispatches compliant JSON payloads to incoming webhooks (Slack, Discord, Zapier) without OAuth or app review friction.
- **Multi-Modal Visual Asset & Slide Deck Scanner**:
  - Ingests multi-page slide presentations (`.pptx` / `.pdf`) and image banners.
  - Checks typography rules (detecting all-caps title shouts), logo safety exclusion zone margins (<24px clearance, text crowding), and extracts visual claims for pgvector semantic verification.
- **Self-Healing Brand Rules & Ambiguity Clarifier**:
  - Analyzes repeated violation patterns across multiple authors to discover high-friction, ambiguous rules.
  - Prompts Google Gemini to formulate crystal-clear guideline revisions with concrete "Do's and Don'ts" pairings and fact sheet updates.
  - 1-click "Apply Clarification" automatically updates rules, regenerates 384-dimensional embeddings, and synchronizes vector chunks in Neon DB.
- **Tamper-Evident Audit Trail**: Cryptographic event log of every scan, dismissal, sign-off, rule edit, and publication with actor metadata.

---

## 🚀 Live Demo Accounts

All demo accounts use password: `password123`

| Company / Workspace | Role | Email | Description |
|---|---|---|---|
| **Acme Enterprise Solutions** | Brand Manager (Admin) | `admin@acme.com` | Manages guidelines, banned terms, team, analytics, self-healing rules, publishes |
| **Acme Enterprise Solutions** | Creator (Junior) | `creator@acme.com` | Drafts content, runs reviews, accepts fixes, submits for sign-off |
| **Acme Enterprise Solutions** | Reviewer (Senior) | `reviewer@acme.com` | Inspects approval queue, diff viewer, comments, approves/rejects |
| **Zest Social App** | Brand Manager (Admin) | `admin@zest.io` | Consumer mobile app rules (playful, friendly, casual) |
| **Zest Social App** | Creator | `creator@zest.io` | Tests conversational social copy under Zest guidelines |
| **Solo Studio** | Solo Creator | `solo@creator.dev` | 1-person workspace with direct publishing (no approvals required) |

---

## 🎬 Hackathon Demo Script (Complete Walkthrough)

1. **Open `http://localhost:3000`**:
   The app loads with the **Acme Creator** persona automatically selected in the top header quick switcher.
2. **Observe the Draft**:
   Select the canonical draft:
   > *"Our app is the #1 fastest tool, guaranteed! Trusted by millions with cheap rates."*
3. **Run AI Review**:
   Click **"Run AI Review"**; the compliance score starts at **~19/100 (Red Tier)** with 7 flagged issues:
   - `"cheap"` (Banned term -> replace with *"cost-effective"*)
   - `"guaranteed"` (Banned term & contradicted -> replace with *"backed by our 99.95% SLA"*)
   - `"#1 fastest tool"` (Unverified ranking superlative)
   - `"Trusted by millions"` (Contradicted by Acme facts: Acme has 500+ enterprise clients, not millions of consumers)
   - `"Our app"` (Colloquial term -> replace with *"our enterprise platform"*)
4. **Accept Fixes (1-Click)**:
   Click **"Accept Fix"** on the issues. The text transforms into compliant copy; watch the score jump to **>90/100 (Emerald Tier)**!
5. **Submit for Sign-off**:
   Click **"Submit for Sign-off"**.
6. **Switch to Reviewer**:
   Select **"Acme Reviewer (Senior)"** from the top right profile dropdown. Navigate to **"Approval Queue"**.
7. **Inspect Diff & Approve**:
   Inspect the word-level **Diff View** highlighting exact additions and deletions. Add an anchored comment and click **"Approve Publication"**.
8. **Zero-API Social Publish**:
   Click the **"Zero-API Publish"** button. The interactive modal opens:
   - Select **Twitter / X**, **LinkedIn**, or **Threads**.
   - Inspect the live character count meter, hashtags, and the optional **"Verified Brand-Compliant"** certification badge.
   - Click **"Launch in Social & Publish"** to trigger the native web share intent with zero API keys, locking the content and recording it in the tamper-evident audit log.
9. **Inspect Slide Deck Scanner**:
   Click the **"Slide Deck Scanner"** tab in the navigation bar.
   - Click **"Load Demo Pitch Deck & Scan"** to ingest the 4-slide Acme Enterprise Launch Deck.
   - Observe visual bounding boxes detecting all-caps typography on Slide 1, logo exclusion margin errors, and unverified superlative claims on Slide 2.
10. **Inspect Self-Healing Brand Rules**:
    Click **"Score & Reports"** (Analytics tab).
    - Observe the **"Self-Healing Brand Rules & Ambiguity Clarifier"** card discovering high-friction rules tripped by multiple writers.
    - Click **"Apply AI Clarification"** to automatically update the brand guideline and re-index vector embeddings in Neon DB.
11. **Multi-Tenant Comparison Demo**:
    Click **"Compare Brands"** tab to see how the exact same copy is evaluated under **Acme Enterprise** (where *"our app"* is banned) versus **Zest Social** (where *"our app"* is fully encouraged and approved)!

---

## 🛠️ Running Locally

### Backend (`apps/api`):
```bash
cd apps/api
npm install
npm run seed   # Seeds Acme, Zest, Solo, guidelines, facts, banned terms
npm run dev    # Starts API on http://localhost:3001
```

### Frontend (`apps/web`):
```bash
cd apps/web
npm install
npm run dev    # Starts Next.js App on http://localhost:3000
```

### Automated Verification Test Suites:
```bash
cd apps/api
npx ts-node test_round3_features.ts  # Verifies Zero-API publishing, Slide Deck scanner, Self-Healing rules
npx ts-node test_drafts.ts           # Tests 10 sample drafts against hybrid review engine
npx ts-node test_e2e_flow.ts         # Runs full end-to-end integration flow
```
