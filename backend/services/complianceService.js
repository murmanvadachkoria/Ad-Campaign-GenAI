/**
 * Brand Compliance & Legal Content Check Service
 * 
 * Checks campaign briefs for:
 * 1. Brand guideline compliance (message tone, required elements)
 * 2. Legal content issues (prohibited words/phrases)
 */

// Prohibited words / phrases for legal compliance
const PROHIBITED_PATTERNS = [
  /\bguaranteed?\b/i,
  /\b100%\s+safe\b/i,
  /\bcure[sd]?\b/i,
  /\bmiracl(e|ulous)\b/i,
  /\binstant(ly)?\s+results?\b/i,
  /\bno\s+side\s+effects?\b/i,
  /\bclinically\s+proven\b/i,
  /\bfda\s+approved\b/i,
  /\bbest\s+in\s+the\s+world\b/i,
  /\bnumber\s+one\s+in\s+the\s+world\b/i,
];

// Brand voice keywords that should be present or avoided
const BRAND_VOICE = {
  // Positive signals (optional checks)
  preferred: ['fresh', 'natural', 'energy', 'refresh', 'boost', 'vibrant', 'zing', 'pure', 'zero sugar', 'real'],
  // Words that conflict with brand positioning
  avoid: ['artificial', 'synthetic', 'chemical', 'fake', 'cheap', 'inferior'],
};

// Minimum message length check
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 280;

export function runBrandCompliance(brief) {
  const issues = [];
  const warnings = [];
  const passed = [];

  const allText = [
    brief.campaignMessage || '',
    ...brief.products.map(p => `${p.name} ${p.description} ${p.message || ''}`),
  ].join(' ');

  // --- Legal checks ---
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(allText)) {
      issues.push({
        type: 'legal',
        severity: 'error',
        message: `Prohibited language detected matching: ${pattern.source}`,
      });
    }
  }

  if (issues.filter(i => i.type === 'legal').length === 0) {
    passed.push('No prohibited legal language detected');
  }

  // --- Campaign message checks ---
  const msg = brief.campaignMessage || '';
  if (msg.length < MIN_MESSAGE_LENGTH) {
    issues.push({
      type: 'brand',
      severity: 'error',
      message: `Campaign message too short (${msg.length} chars, minimum ${MIN_MESSAGE_LENGTH})`,
    });
  } else if (msg.length > MAX_MESSAGE_LENGTH) {
    warnings.push({
      type: 'brand',
      severity: 'warning',
      message: `Campaign message may be too long for social ads (${msg.length} chars, recommended max ${MAX_MESSAGE_LENGTH})`,
    });
  } else {
    passed.push(`Campaign message length OK (${msg.length} chars)`);
  }

  // --- Brand voice checks ---
  const lowerText = allText.toLowerCase();

  for (const avoidWord of BRAND_VOICE.avoid) {
    if (lowerText.includes(avoidWord)) {
      warnings.push({
        type: 'brand_voice',
        severity: 'warning',
        message: `Word "${avoidWord}" conflicts with brand positioning`,
      });
    }
  }

  const preferredFound = BRAND_VOICE.preferred.filter(w => lowerText.includes(w));
  if (preferredFound.length > 0) {
    passed.push(`Brand voice keywords present: ${preferredFound.join(', ')}`);
  } else {
    warnings.push({
      type: 'brand_voice',
      severity: 'warning',
      message: 'No preferred brand voice keywords detected in messaging',
    });
  }

  // --- Product count check ---
  if (brief.products.length < 2) {
    issues.push({
      type: 'requirements',
      severity: 'error',
      message: 'At least two products are required per campaign brief',
    });
  } else {
    passed.push(`Product count OK (${brief.products.length} products)`);
  }

  // --- Region/market presence ---
  if (!brief.targetRegion || !brief.targetMarket) {
    warnings.push({
      type: 'targeting',
      severity: 'warning',
      message: 'Target region or market not fully specified',
    });
  } else {
    passed.push(`Targeting specified: ${brief.targetRegion} / ${brief.targetMarket}`);
  }

  const status = issues.length > 0 ? 'failed' : warnings.length > 0 ? 'warnings' : 'passed';

  return {
    status,
    issues,
    warnings,
    passed,
    checkedAt: new Date().toISOString(),
  };
}
