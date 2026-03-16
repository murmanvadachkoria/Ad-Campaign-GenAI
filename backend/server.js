import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import campaignRouter from './routes/campaign.js';
import assetsRouter from './routes/assets.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

// Serve generated output images statically
app.use('/output', express.static(path.join(__dirname, 'output')));
// Serve input assets statically
app.use('/assets', express.static(path.join(__dirname, 'assets/input')));

app.use('/api/campaign', campaignRouter);
app.use('/api/assets', assetsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n🚀 Campaign Pipeline API running on http://localhost:${PORT}`);
  console.log(`📁 Output folder: ${path.join(__dirname, 'output')}`);
  console.log(`🖼️  Assets folder: ${path.join(__dirname, 'assets/input')}\n`);
});
