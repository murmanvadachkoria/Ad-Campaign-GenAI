import express from 'express';
import { runCampaignPipeline } from '../services/campaignService.js';
import { runBrandCompliance } from '../services/complianceService.js';

const router = express.Router();

/**
 * POST /api/campaign/generate
 * Body: CampaignBrief JSON
 * Triggers the full creative automation pipeline
 */
router.post('/generate', async (req, res) => {
  const brief = req.body;

  // Basic validation
  if (!brief || !brief.products || brief.products.length < 1) {
    return res.status(400).json({
      error: 'Invalid brief: at least one product is required',
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not configured. Please add it to your .env file.',
    });
  }

  try {
    const report = await runCampaignPipeline(brief);
    res.json({ success: true, report });
  } catch (err) {
    console.error('Pipeline error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Pipeline failed unexpectedly',
    });
  }
});

/**
 * POST /api/campaign/validate
 * Run compliance checks only (no image generation)
 */
router.post('/validate', (req, res) => {
  const brief = req.body;
  const compliance = runBrandCompliance(brief);
  res.json({ compliance });
});

export default router;
