import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '..', 'output', 'pipeline.log.jsonl');

/**
 * Append a structured log entry to the JSONL log file.
 * Each line is a self-contained JSON object (JSON Lines format).
 */
export async function appendLog(report) {
  const entry = {
    timestamp: report.timestamp,
    sessionId: report.sessionId,
    duration: report.duration,
    products: report.brief?.products?.map(p => p.name),
    region: report.brief?.targetRegion,
    market: report.brief?.targetMarket,
    locale: report.brief?.locale,
    totalImages: report.summary?.totalImages,
    complianceStatus: report.compliance?.status,
    errors: report.errors?.length || 0,
  };

  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch (err) {
    console.error('⚠️  Failed to write log entry:', err.message);
  }
}

/**
 * Read all log entries from the JSONL log file.
 */
export async function readLogs() {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8');
    return content
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .reverse(); // newest first
  } catch {
    return [];
  }
}
