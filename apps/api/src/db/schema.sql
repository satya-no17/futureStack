-- Inkloom AI Database Schema
-- Multi-tenant schema with Postgres + pgvector

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'enterprise', -- 'enterprise' | 'solo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'creator', -- 'admin' | 'creator' | 'reviewer' | 'solo'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. guidelines
CREATE TABLE IF NOT EXISTS guidelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    kind VARCHAR(50) NOT NULL, -- 'voice' | 'terminology' | 'visual' | 'legal' | 'social'
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. guideline_chunks (vector DIM = 384)
CREATE TABLE IF NOT EXISTS guideline_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    guideline_id UUID NOT NULL REFERENCES guidelines(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384),
    section_ref VARCHAR(255) NOT NULL
);

-- 5. banned_terms
CREATE TABLE IF NOT EXISTS banned_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    preferred_replacement VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'high' -- 'high' | 'medium' | 'low'
);

-- 6. fact_documents
CREATE TABLE IF NOT EXISTS fact_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. fact_chunks (vector DIM = 384)
CREATE TABLE IF NOT EXISTS fact_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fact_document_id UUID NOT NULL REFERENCES fact_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384),
    section_ref VARCHAR(255) NOT NULL
);

-- 8. brand_assets
CREATE TABLE IF NOT EXISTS brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    kind VARCHAR(50) NOT NULL, -- 'logo' | 'palette' | 'font'
    file_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 9. contents
CREATE TABLE IF NOT EXISTS contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    channel VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft' | 'reviewed' | 'submitted' | 'changes_requested' | 'approved' | 'rejected' | 'published'
    current_version_id UUID,
    latest_score INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. content_versions
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    version_no INT NOT NULL DEFAULT 1,
    body TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued', -- 'queued' | 'running' | 'done' | 'failed'
    score INT DEFAULT 100,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- 12. issues
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'banned_term' | 'outdated_term' | 'tone' | 'unverified_claim' | 'contradicted_claim' | 'accessibility' | 'visual'
    severity VARCHAR(50) NOT NULL, -- 'high' | 'medium' | 'low'
    quote TEXT NOT NULL,
    start_idx INT NOT NULL,
    end_idx INT NOT NULL,
    explanation TEXT NOT NULL,
    source_ref TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open' | 'accepted' | 'dismissed'
    dismiss_reason TEXT
);

-- 13. comments
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    start_idx INT,
    end_idx INT,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. approvals
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL, -- 'approved' | 'changes_requested' | 'rejected'
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guideline_chunks_org ON guideline_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_fact_chunks_org ON fact_chunks(organization_id);
CREATE INDEX IF NOT EXISTS idx_contents_org ON contents(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_content ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_version ON reviews(content_version_id);
CREATE INDEX IF NOT EXISTS idx_issues_review ON issues(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_approvals_content ON approvals(content_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
