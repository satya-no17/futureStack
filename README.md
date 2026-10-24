# Inkloom AI — Pre-Publication Brand Governance Platform
**Prepared for Team SATYACODEZ**

Inkloom AI is an automated, pre-publication brand governance platform that scans content (social posts, marketing copy, announcements, technical specs) against approved brand guidelines and verified facts before it goes live.

---

## 🌟 Key Architecture & Highlights

- **Multi-Tenant Schema**: Full organization isolation across Postgres + pgvector.
- **pgvector Semantic Search**: Dense 384-dimensional vector embeddings with cosine distance (`<=>`) retrieval for facts and guideline chunks.
- **Hybrid AI Review Engine**:
  - **Rule Check**: Instant case-insensitive whole-word matching on banned and outdated terminology with preferred replacements.
  - **Tone Check**: Vector retrieval of brand voice guidelines + LLM audit of voice/style boundaries.
  - **Claim Verification**: Automatic claim extraction -> vector retrieval of top company facts -> LLM factual judgement (`supported`, `contradicted`, `unverifiable`) -> exact quote offset validation in text.
  - **Accessibility & Readability**: Pure code audit calculating WCAG 2.1 relative luminance & contrast ratios ($L = 0.2126R + 0.7152G + 0.0722B$, ratio $(L_1+0.05)/(L_2+0.05)$), missing image alt-text, >30-word run-on sentences, and all-caps blocks.
- **Intent-Preserving Fixes**: 1-click "Accept Fix" replaces flagged spans directly in the document and re-evaluates the score.
- **Collaborative Sign-off**: Version-by-version visual Diff Viewer (red removals, green additions), anchored reviewer comment threads, and structured approval decisions (`approved`, `changes_requested`, `rejected`).
- **Governance Analytics & Ambiguous Rules Detector**: Discovers brand guidelines that are frequently violated across multiple team members, alerting admins that a rule is ambiguous.
- **Immutable Audit Trail**: Cryptographic event log of every scan, dismissal, sign-off, and publication.

---

## 🚀 Live Demo Accounts

All demo accounts use password: `password123`

| Company / Workspace | Role | Email | Description |
|---|---|---|---|
| **Acme Enterprise Solutions** | Brand Manager (Admin) | `admin@acme.com` | Manages guidelines, banned terms, team, analytics, publishes |
| **Acme Enterprise Solutions** | Creator (Junior) | `creator@acme.com` | Drafts content, runs reviews, accepts fixes, submits for sign-off |
| **Acme Enterprise Solutions** | Reviewer (Senior) | `reviewer@acme.com` | Inspects approval queue, diff viewer, comments, approves/rejects |
| **Zest Social App** | Brand Manager (Admin) | `admin@zest.io` | Consumer mobile app rules (playful, friendly, casual) |
| **Zest Social App** | Creator | `creator@zest.io` | Tests conversational social copy under Zest guidelines |
| **Solo Studio** | Solo Creator | `solo@creator.dev` | 1-person workspace with direct publishing (no approvals required) |

---

## 🎬 4-Minute Hackathon Demo Script

1. **Open `http://localhost:3000`**:
   The app loads with the **Acme Creator** persona automatically selected in the top header quick switcher.
2. **Observe the Draft**:
   Select or inspect the draft:
   > *"Our app is the #1 fastest tool, guaranteed! Trusted by millions with cheap rates."*
3. **Run AI Review**:
   Click **"Run AI Review"**; the compliance score starts at **~19/100 (Red Tier)**. Notice the 7 issues flagged:
   - `"cheap"` (Banned term -> replace with *"cost-effective"*)
   - `"guaranteed"` (Banned term & contradicted -> replace with *"backed by our 99.95% SLA"*)
   - `"#1 fastest tool"` (Unverified ranking superlative)
   - `"Trusted by millions"` (Contradicted by Acme facts: Acme has 500+ enterprise clients, not millions of consumers)
   - `"Our app"` (Colloquial term -> replace with *"our enterprise platform"*)
4. **Accept Fixes (1-Click)**:
   Click **"Accept Fix"** on the issues. The text in the editor automatically transforms into compliant copy. Watch the compliance score jump from **19/100 to 93/100 (Emerald Tier)**!
5. **Submit for Sign-off**:
   Click **"Submit for Sign-off"**.
6. **Switch to Reviewer**:
   Click the top right profile dropdown and select **"Acme Reviewer (Senior)"**. Navigate to **"Approval Queue"**.
7. **Inspect Diff & Approve**:
   Inspect the word-level **Diff View** highlighting exact additions and deletions. Add an anchored comment: *"Verified against SOC2 and SLA specs"*, and click **"Approve Publication"**.
8. **Inspect Analytics & Ambiguity Detector**:
   Navigate to **"Analytics & Insights"**. View the top violated terms, score trends, and the **Ambiguous Rules Detector** highlighting rules broken by multiple team members.
9. **Multi-Tenant Comparison Demo**:
   Click **"Multi-Tenant Compare"** tab to see how the exact same copy (*"Our app is the #1 fastest tool..."*) is evaluated under **Acme Enterprise** (where *"our app"* is banned) versus **Zest Social** (where *"our app"* is fully encouraged and approved)!
10. **Accessibility Sandbox**:
    Navigate to **"Accessibility Tools"** to run the live WCAG 2.1 color contrast validator and readability analyzer.

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

### Verification Test Suites:
```bash
cd apps/api
npx ts-node test_drafts.ts    # Tests 10 sample drafts against AI engine
npx ts-node test_e2e_flow.ts  # Runs full end-to-end integration flow
```
