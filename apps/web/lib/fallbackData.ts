import { ContentItem, ContentDetails, User, Organization } from './api';

export interface GuidelineItem {
  id: string;
  title: string;
  kind: string;
  content?: string;
  chunk_count: number;
  created_at?: string;
}

export interface BrandFactItem {
  id: string;
  title: string;
  content?: string;
  effective_date: string;
  chunk_count: number;
}

export interface BannedTermItem {
  id: string;
  term: string;
  preferred_replacement: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AnalyticsData {
  stats: {
    total_drafts: number;
    approved_count: number;
    org_avg_score: number;
    open_issues_count: number;
  };
  topViolations: Array<{
    quote: string;
    count: number;
    source_ref: string;
  }>;
  ambiguousRules: Array<{
    source_ref: string;
    distinct_violators: number;
    total_occurrences: number;
  }>;
}

export interface AuditLogEntry {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ApprovalQueueItem {
  id: string;
  title: string;
  channel: string;
  author_name: string;
  created_at: string;
  latest_score: number;
  current_body: string;
}

export interface SlideDeckDemo {
  title: string;
  fileType: string;
  slides: Array<{
    slideNumber: number;
    title: string;
    text: string;
    layoutNotes?: string;
    issues?: Array<{
      id: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      suggestion: string;
    }>;
  }>;
}

export interface SelfHealingSuggestion {
  id: string;
  rule_reference: string;
  current_rule_text: string;
  proposed_clarification: string;
  rationale: string;
  ambiguity_score: number;
  affected_drafts_count: number;
}

export const FALLBACK_USER: User = {
  id: 'usr-fallback-demo',
  name: 'Demo Admin (Offline)',
  email: 'admin@acme.com',
  role: 'admin',
  organization_id: 'org-fallback-acme'
};

export const FALLBACK_ORG: Organization = {
  id: 'org-fallback-acme',
  name: 'Acme Enterprise Solutions',
  type: 'enterprise'
};

export const FALLBACK_CONTENTS: ContentItem[] = [
  {
    id: 'draft-fallback-1',
    title: 'Acme Q3 Enterprise Cloud Launch',
    channel: 'LinkedIn',
    status: 'reviewed',
    latest_score: 68,
    current_version_id: 'ver-fb-1-1',
    created_at: '2026-10-28T14:20:00Z',
    author_name: 'Alex Rivera (Product Marketing)',
    author_email: 'alex@acme.com',
    current_version_no: 1
  },
  {
    id: 'draft-fallback-2',
    title: 'Social Announcement: Summer Performance Upgrade',
    channel: 'Twitter / X',
    status: 'draft',
    latest_score: 48,
    current_version_id: 'ver-fb-2-1',
    created_at: '2026-10-29T08:15:00Z',
    author_name: 'Jamie Chen (Social Lead)',
    author_email: 'jamie@acme.com',
    current_version_no: 1
  },
  {
    id: 'draft-fallback-3',
    title: 'Technical Architecture & Security Whitepaper',
    channel: 'Blog',
    status: 'approved',
    latest_score: 96,
    current_version_id: 'ver-fb-3-2',
    created_at: '2026-10-27T11:00:00Z',
    author_name: 'David Kim (Staff Architect)',
    author_email: 'david@acme.com',
    current_version_no: 2
  },
  {
    id: 'draft-fallback-4',
    title: 'Global Compliance & Data Residency Update',
    channel: 'Press Release',
    status: 'submitted',
    latest_score: 89,
    current_version_id: 'ver-fb-4-1',
    created_at: '2026-10-29T06:30:00Z',
    author_name: 'Elena Rostova (Compliance Director)',
    author_email: 'elena@acme.com',
    current_version_no: 1
  }
];

export const FALLBACK_CONTENT_DETAILS: Record<string, ContentDetails> = {
  'draft-fallback-1': {
    content: FALLBACK_CONTENTS[0],
    versions: [
      {
        id: 'ver-fb-1-1',
        version_no: 1,
        body: 'Our revolutionary cloud platform is the #1 fastest solution on the market, guaranteed! Customers love our cheap migration packages and can achieve 10x ROI in just 3 days without downtime.',
        created_at: '2026-10-28T14:20:00Z',
        created_by_name: 'Alex Rivera'
      }
    ],
    latestReview: {
      id: 'rev-fb-1',
      status: 'done',
      score: 68,
      started_at: '2026-10-28T14:21:00Z',
      finished_at: '2026-10-28T14:21:03Z'
    },
    issues: [
      {
        id: 'iss-fb-1-1',
        type: 'banned_term',
        severity: 'high',
        quote: 'cheap',
        start_idx: 95,
        end_idx: 100,
        explanation: "The word 'cheap' degrades enterprise brand prestige and implies inferior build quality. Brand policy requires 'cost-effective' or 'economical'.",
        source_ref: 'Brand Voice: Pricing & Value Principles',
        suggestion: 'cost-effective',
        status: 'open'
      },
      {
        id: 'iss-fb-1-2',
        type: 'unverified_claim',
        severity: 'high',
        quote: '#1 fastest solution on the market, guaranteed!',
        start_idx: 41,
        end_idx: 86,
        explanation: 'Absolute superlatives and unqualified performance guarantees carry severe regulatory and legal risk unless supported by accredited third-party lab benchmarks.',
        source_ref: 'Legal Compliance: Performance Claims Policy',
        suggestion: 'industry-recognized high-performance solution',
        status: 'open'
      },
      {
        id: 'iss-fb-1-3',
        type: 'contradicted_claim',
        severity: 'medium',
        quote: '10x ROI in just 3 days',
        start_idx: 118,
        end_idx: 141,
        explanation: 'Contradicts verified corporate fact sheet: verified average enterprise customer onboarding is 45 days with 3.2x measured ROI.',
        source_ref: 'Fact Sheet: Acme Cloud Performance Metrics 2026',
        suggestion: 'measurable ROI within their first quarter',
        status: 'open'
      },
      {
        id: 'iss-fb-1-4',
        type: 'tone',
        severity: 'low',
        quote: 'revolutionary',
        start_idx: 4,
        end_idx: 17,
        explanation: "Overused industry hyperbole. Enterprise buyers favor concrete architectural explanations over sensational adjectives.",
        source_ref: 'Style Guide: B2B Technology Vocabulary',
        suggestion: 'next-generation enterprise',
        status: 'open'
      }
    ],
    comments: [
      {
        id: 'com-fb-1',
        body: 'Alex, please replace the superlatives and the word cheap before we send this to executive review.',
        version_id: 'ver-fb-1-1',
        created_at: '2026-10-28T14:35:00Z',
        author_name: 'Sarah Jenkins',
        author_role: 'Brand Lead'
      }
    ]
  },

  'draft-fallback-2': {
    content: FALLBACK_CONTENTS[1],
    versions: [
      {
        id: 'ver-fb-2-1',
        version_no: 1,
        body: 'Excited to reveal our killer upgrade! We now serve millions of businesses with zero bugs and flawless 100% uptime guaranteed.',
        created_at: '2026-10-29T08:15:00Z',
        created_by_name: 'Jamie Chen'
      }
    ],
    latestReview: {
      id: 'rev-fb-2',
      status: 'done',
      score: 48,
      started_at: '2026-10-29T08:16:00Z',
      finished_at: '2026-10-29T08:16:02Z'
    },
    issues: [
      {
        id: 'iss-fb-2-1',
        type: 'banned_term',
        severity: 'medium',
        quote: 'killer',
        start_idx: 22,
        end_idx: 28,
        explanation: "Colloquial slang violates Acme's formal executive voice.",
        source_ref: 'Words to Avoid: Professional Tone',
        suggestion: 'breakthrough',
        status: 'open'
      },
      {
        id: 'iss-fb-2-2',
        type: 'contradicted_claim',
        severity: 'high',
        quote: 'millions of businesses',
        start_idx: 47,
        end_idx: 69,
        explanation: 'Audited corporate metrics report 500+ enterprise customers, not consumer millions.',
        source_ref: 'Fact Sheet: Verified Customer Scale 2026',
        suggestion: 'hundreds of enterprise teams',
        status: 'open'
      },
      {
        id: 'iss-fb-2-3',
        type: 'unverified_claim',
        severity: 'high',
        quote: '100% uptime guaranteed',
        start_idx: 98,
        end_idx: 121,
        explanation: 'Official contractual SLA is 99.99%. Stating 100% guaranteed introduces contractual breach liability.',
        source_ref: 'SLA Agreement: Section 4.1',
        suggestion: '99.99% enterprise SLA',
        status: 'open'
      }
    ],
    comments: []
  },

  'draft-fallback-3': {
    content: FALLBACK_CONTENTS[2],
    versions: [
      {
        id: 'ver-fb-3-1',
        version_no: 1,
        body: 'Acme Cloud provides good security with encryption. Our system maintains compliance and 99.99% uptime.',
        created_at: '2026-10-27T09:00:00Z',
        created_by_name: 'David Kim'
      },
      {
        id: 'ver-fb-3-2',
        version_no: 2,
        body: 'Acme Cloud provides robust isolation across tenant workloads with end-to-end encryption at rest and in transit. Our infrastructure maintains SOC2 Type II compliance and delivers an audited 99.99% service level availability.',
        created_at: '2026-10-27T11:00:00Z',
        created_by_name: 'David Kim'
      }
    ],
    latestReview: {
      id: 'rev-fb-3',
      status: 'done',
      score: 96,
      started_at: '2026-10-27T11:05:00Z',
      finished_at: '2026-10-27T11:05:02Z'
    },
    issues: [],
    comments: [
      {
        id: 'com-fb-3',
        body: 'Excellent technical precision and perfect adherence to compliance standards. Approved for publication.',
        version_id: 'ver-fb-3-2',
        created_at: '2026-10-27T11:30:00Z',
        author_name: 'Sarah Jenkins',
        author_role: 'Reviewer'
      }
    ]
  },

  'draft-fallback-4': {
    content: FALLBACK_CONTENTS[3],
    versions: [
      {
        id: 'ver-fb-4-1',
        version_no: 1,
        body: 'Acme announces expanded data residency zones across the European Union and Asia-Pacific regions, supporting strict compliance requirements under GDPR and APPI frameworks.',
        created_at: '2026-10-29T06:30:00Z',
        created_by_name: 'Elena Rostova'
      }
    ],
    latestReview: {
      id: 'rev-fb-4',
      status: 'done',
      score: 89,
      started_at: '2026-10-29T06:35:00Z',
      finished_at: '2026-10-29T06:35:02Z'
    },
    issues: [
      {
        id: 'iss-fb-4-1',
        type: 'accessibility',
        severity: 'low',
        quote: 'supporting strict compliance requirements under GDPR and APPI frameworks',
        start_idx: 88,
        end_idx: 159,
        explanation: 'Flesch-Kincaid sentence length exceeds recommended 25 words for international press distribution.',
        source_ref: 'Readability Guidelines: Press Releases',
        suggestion: 'ensuring compliance with GDPR and APPI data protection regulations',
        status: 'open'
      }
    ],
    comments: []
  }
};

export const FALLBACK_GUIDELINES: GuidelineItem[] = [
  {
    id: 'g-1',
    title: 'Enterprise Tone & Executive Voice Guide',
    kind: 'tone',
    content: 'All B2B communications must project precision, technical competence, and measured confidence. Avoid colloquialisms, informal slang, and sensational adjectives.',
    chunk_count: 14,
    created_at: '2026-10-01T00:00:00Z'
  },
  {
    id: 'g-2',
    title: 'Product Terminology & Capitalization Standards',
    kind: 'terminology',
    content: 'Official naming rules: Acme Cloud is capitalized. Acme Gateway and Acme Shield must always be cited with proper trademark casing.',
    chunk_count: 9,
    created_at: '2026-10-05T00:00:00Z'
  },
  {
    id: 'g-3',
    title: 'Accessibility & Plain-Language Standards',
    kind: 'accessibility',
    content: 'Ensure all external content complies with WCAG 2.1 reading level grade 8, includes image alt-text, and avoids text-in-image traps.',
    chunk_count: 7,
    created_at: '2026-10-10T00:00:00Z'
  }
];

export const FALLBACK_FACTS: BrandFactItem[] = [
  {
    id: 'f-1',
    title: 'Verified Enterprise Performance Benchmarks',
    content: '99.99% contractual SLA availability; 45ms P99 latency across 14 global regions; average migration completion is 45 days.',
    effective_date: '2026-10-15',
    chunk_count: 8
  },
  {
    id: 'f-2',
    title: 'SOC2 Type II & ISO 27001 Certification Status',
    content: 'Annual audit completed September 2026 with zero critical findings. All data centers enforce AES-256 encryption at rest.',
    effective_date: '2026-09-01',
    chunk_count: 5
  },
  {
    id: 'f-3',
    title: 'Customer Scale & Transaction Volume',
    content: 'Active footprint covers 500+ enterprise clients across 3 continents processing 2.4 million daily transactions.',
    effective_date: '2026-10-01',
    chunk_count: 4
  }
];

export const FALLBACK_BANNED_TERMS: BannedTermItem[] = [
  {
    id: 'b-1',
    term: 'cheap',
    preferred_replacement: 'cost-effective',
    reason: 'Sounds low quality; undermines enterprise value proposition',
    severity: 'high'
  },
  {
    id: 'b-2',
    term: 'guaranteed',
    preferred_replacement: 'proven',
    reason: 'Legal liability without explicit contractual SLA guarantee',
    severity: 'high'
  },
  {
    id: 'b-3',
    term: 'killer app',
    preferred_replacement: 'flagship solution',
    reason: 'Unprofessional hyperbole for corporate audiences',
    severity: 'medium'
  },
  {
    id: 'b-4',
    term: '#1 in the world',
    preferred_replacement: 'top-tier enterprise platform',
    reason: 'Unsubstantiated comparative claim subject to regulatory challenge',
    severity: 'high'
  },
  {
    id: 'b-5',
    term: 'millions of users',
    preferred_replacement: 'hundreds of enterprise teams',
    reason: 'Fact sheet specifies 500+ enterprise clients, not consumer millions',
    severity: 'medium'
  }
];

export const FALLBACK_ANALYTICS: AnalyticsData = {
  stats: {
    total_drafts: 24,
    approved_count: 18,
    org_avg_score: 84,
    open_issues_count: 6
  },
  topViolations: [
    { quote: 'cheap', count: 14, source_ref: 'Brand Voice: Pricing & Value Principles' },
    { quote: '#1 fastest', count: 9, source_ref: 'Claims Policy: Verified Performance Claims' },
    { quote: 'guaranteed', count: 7, source_ref: 'Legal Compliance: Warranty & Disclaimers' },
    { quote: 'killer', count: 4, source_ref: 'Professional Tone: Modern B2B Vocabulary' }
  ],
  ambiguousRules: [
    {
      source_ref: 'Rule: Avoid casual idioms in technical copy',
      distinct_violators: 5,
      total_occurrences: 11
    },
    {
      source_ref: 'Rule: Always cite official benchmark source when claiming latency stats',
      distinct_violators: 3,
      total_occurrences: 6
    }
  ]
};

export const FALLBACK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    actor_name: 'Sarah Jenkins',
    action: 'approved',
    entity_type: 'content',
    metadata: { title: 'Technical Architecture & Security Whitepaper', score: 96 },
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'aud-2',
    actor_name: 'Alex Rivera',
    action: 'updated_version',
    entity_type: 'content',
    metadata: { title: 'Acme Q3 Enterprise Cloud Launch', version_no: 1 },
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'aud-3',
    actor_name: 'System AI Scanner',
    action: 'completed_review',
    entity_type: 'review',
    metadata: { issues_count: 4, score: 68 },
    created_at: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: 'aud-4',
    actor_name: 'Elena Rostova',
    action: 'added_rule',
    entity_type: 'banned_term',
    metadata: { term: 'killer app', preferred_replacement: 'flagship solution' },
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const FALLBACK_APPROVAL_QUEUE: ApprovalQueueItem[] = [
  {
    id: 'draft-fallback-4',
    title: 'Global Compliance & Data Residency Update',
    channel: 'Press Release',
    author_name: 'Elena Rostova',
    created_at: '2026-10-29T06:30:00Z',
    latest_score: 89,
    current_body: 'Acme announces expanded data residency zones across the European Union and Asia-Pacific regions, supporting strict compliance requirements under GDPR and APPI frameworks.'
  }
];

export const FALLBACK_SLIDE_DECK: SlideDeckDemo = {
  title: 'Acme Enterprise Pitch Deck',
  fileType: 'presentation',
  slides: [
    {
      slideNumber: 1,
      title: 'Acme Cloud Overview',
      text: 'THE ULTIMATE CLOUD INFRASTRUCTURE FOR MODERN ENTERPRISES',
      layoutNotes: 'Title slide with primary brand logo in top-left',
      issues: [
        {
          id: 'slide-iss-1',
          type: 'typography',
          severity: 'medium',
          title: 'All-Caps Heading Text',
          description: 'Slide heading uses ALL-CAPS shrieking which reduces readability.',
          suggestion: 'Change to Title Case: "The Ultimate Cloud Infrastructure for Modern Enterprises"'
        }
      ]
    },
    {
      slideNumber: 2,
      title: 'Architectural Performance',
      text: 'Our system guarantees 100% zero downtime and infinite horizontal scalability for any database workload.',
      layoutNotes: 'Two-column diagram comparing legacy architectures',
      issues: [
        {
          id: 'slide-iss-2',
          type: 'unverified_claim',
          severity: 'high',
          title: 'Unverified 100% Zero Downtime Claim',
          description: 'SLA guarantee contract specifies 99.99%, not 100% zero downtime.',
          suggestion: 'Update copy to state "Audited 99.99% service availability with active-active failover".'
        }
      ]
    },
    {
      slideNumber: 3,
      title: 'Enterprise Customer Footprint',
      text: 'Trusted by over 500 leading Global 2000 enterprises across financial services, healthcare, and retail.',
      layoutNotes: 'Logo grid of verified enterprise partners'
    },
    {
      slideNumber: 4,
      title: 'Security and Compliance',
      text: 'SOC2 Type II certified, ISO 27001 compliant, and HIPAA ready with end-to-end customer-managed encryption keys.',
      layoutNotes: 'Certification badges with verified audit report dates'
    }
  ]
};

export const FALLBACK_SELF_HEALING: SelfHealingSuggestion[] = [
  {
    id: 'sh-1',
    rule_reference: 'Rule: Avoid casual idioms in technical copy',
    current_rule_text: 'Avoid informal idioms or casual slang expressions in marketing content.',
    proposed_clarification: 'Avoid colloquial idioms (such as "killer feature", "magic bullet", "under the hood"). Instead, name the exact technical capability or benefit (e.g., "automated failover engine").',
    rationale: 'Tripped by 5 different authors across 11 drafts this month due to ambiguity in what constitutes an "idiom".',
    ambiguity_score: 82,
    affected_drafts_count: 11
  }
];
