-- Migration 002: Round 3 Extensions
-- 1. Publishing Records (Zero-API Intent & Low-API Webhook publishing)
CREATE TABLE IF NOT EXISTS publishing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    published_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(100) NOT NULL, -- 'twitter', 'linkedin', 'threads', 'bluesky', 'reddit', 'telegram', 'whatsapp', 'webhook'
    method VARCHAR(50) NOT NULL, -- 'intent_url', 'clipboard_context', 'webhook'
    destination_url TEXT,
    payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_publishing_records_org ON publishing_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_publishing_records_content ON publishing_records(content_id);

-- 2. Slide Assets & Scans (Multi-modal slide deck visual ingestion)
CREATE TABLE IF NOT EXISTS slide_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'pptx', 'image'
    page_count INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slide_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    slide_asset_id UUID NOT NULL REFERENCES slide_assets(id) ON DELETE CASCADE,
    slide_number INT NOT NULL,
    extracted_text TEXT NOT NULL,
    typography_meta JSONB DEFAULT '{}'::jsonb,
    visual_issues JSONB DEFAULT '[]'::jsonb,
    score INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slide_assets_org ON slide_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_slide_scans_asset ON slide_scans(slide_asset_id);

-- 3. Self-Healing Rule Suggestions
CREATE TABLE IF NOT EXISTS rule_clarification_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_ref TEXT NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    violation_count INT NOT NULL DEFAULT 0,
    distinct_violators INT NOT NULL DEFAULT 0,
    original_guideline TEXT NOT NULL,
    suggested_revision TEXT NOT NULL,
    dos_and_donts JSONB DEFAULT '[]'::jsonb,
    suggested_fact_update TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'dismissed'
    accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rule_suggestions_org ON rule_clarification_suggestions(organization_id);
