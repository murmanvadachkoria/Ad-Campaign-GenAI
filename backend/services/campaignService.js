import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { translateMessage } from './translationService.js';
import { runBrandCompliance } from './complianceService.js';
import { appendLog } from './loggingService.js';
import { generateInputAssetImage } from '../helpers/generateInputAsset.js'
import { generateOutputImage } from "../helpers/generateOutputImage.js";
import { ASPECT_RATIOS } from "../helpers/generateOutputImage.js";
import { resolveInputAsset } from "../helpers/helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'input');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
/**
 * Overlay campaign message text onto image using sharp + SVG composite
 */
async function overlayText(imageBuffer, text, width, height) {
  // Create an SVG text overlay
  const fontSize = Math.max(24, Math.round(width * 0.042));
  const padding = Math.round(width * 0.04);
  const badgeHeight = fontSize * 2.8;
  const maxCharsPerLine = Math.floor((width - padding * 2) / (fontSize * 0.52));

  // Word-wrap the text
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current.trim());

  const lineHeight = fontSize * 1.4;
  const totalTextHeight = lines.length * lineHeight;
  const svgBadgeHeight = totalTextHeight + padding * 2;
  const svgBadgeY = height - svgBadgeHeight - padding * 0.5;

  const svgLines = lines.map((line, i) =>
    `<text x="${width / 2}" y="${padding + (i + 1) * lineHeight - lineHeight * 0.2}"
       font-family="'Arial Black', 'Arial Bold', Arial, sans-serif"
       font-size="${fontSize}" font-weight="900"
       fill="white" text-anchor="middle"
       paint-order="stroke" stroke="rgba(0,0,0,0.8)" stroke-width="${fontSize * 0.08}"
       stroke-linejoin="round">${escapeXml(line)}</text>`
  ).join('\n');

  const svg = `<svg width="${width}" height="${svgBadgeHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:rgba(0,0,0,0.75);stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgba(0,0,0,0.92);stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${svgBadgeHeight}" fill="url(#grad)" rx="12" ry="12"/>
    ${svgLines}
  </svg>`;

  return sharp(imageBuffer)
    .composite([{
      input: Buffer.from(svg),
      top: Math.round(svgBadgeY),
      left: 0,
    }])
    .png()
    .toBuffer();
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Generate (or load) a hero image for a product, then produce all aspect ratio variants
 */
async function generateProductCreatives(product, brief, sessionId) {
  const productSlug = product.name.toLowerCase().replace(/\s+/g, '_');
  const productOutDir = path.join(OUTPUT_DIR, sessionId, productSlug);
  await fs.mkdir(productOutDir, { recursive: true });

  // Translate message for the given locale
  const localizedMessage = await translateMessage(
    product.message || brief.campaignMessage,
    brief.locale
  );

  console.log(`\n📦 Processing product: ${product.name}`);
  console.log(`  🌍 Locale: ${brief.locale} | Message: "${localizedMessage}"`);

  let outputImageData;
  let inputAssetsFile;
  const existingAsset = await resolveInputAsset(product.name, ASSETS_DIR);

  if (existingAsset) {
    console.log(`  🔄 Reusing existing asset: ${existingAsset}`);
    const buffer = await fs.readFile(existingAsset);
    inputAssetsFile = await toFile(buffer, `${productSlug}.png`, { type: 'image/png' });
  } else {
    console.log(`  🎨 Generating new input asset via GenAI for: ${product.name}`);
    inputAssetsFile = await generateInputAssetImage(openai, product, productSlug, ASSETS_DIR);
  }

  console.log(`  🎨 Generating output image via GenAI for: ${product.name}`);
  outputImageData = await generateOutputImage(openai, product, productSlug, brief, productOutDir, inputAssetsFile, sessionId, localizedMessage);

  return outputImageData;
}

/**
 * Main pipeline entry point
 */
export async function runCampaignPipeline(brief) {
  const sessionId = uuidv4().slice(0, 8);
  const startTime = Date.now();

  console.log('\n═══════════════════════════════════════');
  console.log(`🚀 Campaign Pipeline — Session: ${sessionId}`);
  console.log('═══════════════════════════════════════');
  console.log(`  Region: ${brief.targetRegion} | Market: ${brief.targetMarket}`);
  console.log(`  Audience: ${brief.targetAudience}`);
  console.log(`  Products: ${brief.products.map(p => p.name).join(', ')}`);

  const allResults = [];
  const errors = [];

  for (const product of brief.products) {
    try {
      const creatives = await generateProductCreatives(product, brief, sessionId);
      allResults.push(...creatives);
    } catch (err) {
      console.error(`  ❌ Error processing ${product.name}:`, err.message);
      errors.push({ product: product.name, error: err.message });
    }
  }

  // Run brand compliance check
  const compliance = runBrandCompliance(brief);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  const report = {
    sessionId,
    duration: `${duration}s`,
    timestamp: new Date().toISOString(),
    brief,
    results: allResults,
    errors,
    compliance,
    summary: {
      totalImages: allResults.length,
      products: brief.products.length,
      aspectRatios: Object.keys(ASPECT_RATIOS),
      locale: brief.locale,
    },
  };

  // Save report JSON
  const reportPath = path.join(OUTPUT_DIR, sessionId, 'report.json');
  await fs.mkdir(path.join(OUTPUT_DIR, sessionId), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Log run
  await appendLog(report);

  console.log(`\n✅ Pipeline complete in ${duration}s — ${allResults.length} images generated`);
  console.log('═══════════════════════════════════════\n');

  return report;
}
