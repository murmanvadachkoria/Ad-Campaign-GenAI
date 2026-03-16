import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { readLogs } from '../services/loggingService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'input');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, ASSETS_DIR),
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
  fileFilter: (req, file, cb) => {
    if (/\.(png|jpg|jpeg|webp)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/assets/upload
 * Upload one or more image files to assets/input/
 */
router.post('/upload', async (req, res, next) => {
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  next();
}, upload.array('assets'), (req, res) => {
  const uploaded = req.files.map(f => ({ filename: f.filename }));
  res.json({ uploaded });
});

/**
 * GET /api/assets/input
 * List all files currently in the assets/input folder
 */
router.get('/input', async (req, res) => {
  try {
    await fs.mkdir(ASSETS_DIR, { recursive: true });
    const files = await fs.readdir(ASSETS_DIR);
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    const assets = imageFiles.map(filename => ({
      filename,
      url: `/assets/${filename}`,
      slug: filename.replace(/\.(png|jpg|jpeg|webp)$/i, ''),
    }));
    res.json({ assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/assets/output/:sessionId
 * List all generated output files for a session
 */
router.get('/output/:sessionId', async (req, res) => {
  const sessionDir = path.join(OUTPUT_DIR, req.params.sessionId);
  try {
    const report = await fs.readFile(path.join(sessionDir, 'report.json'), 'utf-8');
    res.json(JSON.parse(report));
  } catch {
    res.status(404).json({ error: 'Session not found' });
  }
});

/**
 * GET /api/assets/logs
 * Return all pipeline run logs
 */
router.get('/logs', async (req, res) => {
  const logs = await readLogs();
  res.json({ logs });
});

export default router;
