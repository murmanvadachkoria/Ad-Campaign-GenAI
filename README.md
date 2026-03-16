# Campaign Pipeline — Creative Automation Engine

A full-stack proof-of-concept that automates creative asset generation for localized social ad campaigns using GenAI.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [How to Run](#how-to-run)
5. [Example Input & Output](#example-input--output)
6. [Project Structure](#project-structure)
7. [API Reference](#api-reference)

---

## Overview

**Campaign Pipeline** accepts a campaign brief (products, targeting, locale) and automatically:

1. Resolves existing product images from a local assets folder (no generation needed if found)
2. Generates new hero images via **GenAI** when assets are missing
3. Resizes and crops each image to **three aspect ratios**: 1:1 · 9:16 · 16:9
4. Overlays the **localized campaign message** onto each variant using SVG compositing
5. Runs **brand compliance and legal content checks** against the brief
6. Saves all outputs organized by product and aspect ratio
7. Logs every run to a persistent JSONL file

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite :5173)            │
│                                                                 │
│  CampaignForm ──► ProductCards ──► Targeting ──► Locale        │
│       │                                                         │
│       │  POST /api/campaign/generate  (JSON brief)              │
│       ▼                                                         │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND (Express :3001)                  │
│                                                                 │
│  campaignService                                                │
│    ├── resolveInputAsset()   ← checks assets/input/ first      │
│    ├── openai.images.generate()  ← gpt-image-1 if no asset     │
│    ├── openai.images.edit()      ← gpt-image-1 with asset      │
│    ├── sharp.resize()            ← 3× aspect ratio variants    │  │
│    └── save to output/<sessionId>/<product>/                   │
│                                                                 │
│  translationService  ← GPT-4o-mini (cached per locale+msg)    │
│  complianceService   ← prohibited words + brand voice checks  │
│  loggingService      ← JSONL append log                        │
└─────────────────────────────────────────────────────────────────┘
         │                              │
    assets/input/               output/<sessionId>/
    citrus_burst.png             citrus_burst/
    mango_glow.png                 citrus_burst_1x1.png
                                   citrus_burst_9x16.png
                                   citrus_burst_16x9.png
                                 mango_glow/
                                   ...
                                 report.json
```

---

## Quick Start

### Prerequisites

- **Node.js** v18 or later
- An **OpenAI API key** with access to `gpt-image-1`

### 1 — Install dependencies

```bash
# From the project root:
npm run setup
```

This installs dependencies for the root, backend, and frontend in one step.

### 2 — Configure environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set your key:

```env
OPENAI_API_KEY=sk-...your-key-here...
PORT=3001
```

### 3 — Start the app

```bash
npm start
```

This starts both servers concurrently:

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:3001  |

Open **http://localhost:5173** in your browser.

---

## How to Run

### Using the UI

1. **Products tab** — Edit the two pre-filled products (Citrus Burst, Mango Glow) or add more. Each product needs: Name, Category, Description, Ad Message.
2. **Campaign Targeting** — Set region, market, audience, and global campaign message.
3. **Locale** — Choose one of 5 languages. Product messages will be auto-translated.
5. **Input Assets** — Optionally drop `<product_slug>.png` files into `backend/assets/input/` or use UI to upload image (`<product_slug>.png`) to skip generation for that product.
6. **Generate** — Click **Generate Campaign Creatives**. The pipeline runs and you land on the Results tab automatically.
7. **Results** — Browse generated images, filter by product, click to enlarge, download individually.
8. **Logs** — Every pipeline run is logged in the Logs tab.

### Using the API directly

```bash
curl -X POST http://localhost:3001/api/campaign/generate \
  -H "Content-Type: application/json" \
  -d '{
    "products": [
      {
        "name": "Citrus Burst",
        "category": "beverage",
        "description": "A refreshing citrus energy drink with natural ingredients and zero sugar.",
        "message": "Zero sugar. All the zing. Citrus Burst — your daily refresh."
      },
      {
        "name": "Mango Glow",
        "category": "beverage",
        "description": "A tropical mango wellness drink packed with vitamins and antioxidants.",
        "message": "Taste the tropics. Mango Glow — glow from the inside out."
      }
    ],
    "targetRegion": "North America",
    "targetMarket": "United States",
    "targetAudience": "Health-conscious millennials aged 25-35",
    "campaignMessage": "Fuel your day with nature'\''s finest. No compromise.",
    "locale": "es"
  }'
```

### Reusing existing assets

Name your image files after the product name (lowercase, spaces → underscores):

```
backend/assets/input/
  citrus_burst.png     ← reused for "Citrus Burst"
  mango_glow.jpg       ← reused for "Mango Glow"
```

The pipeline checks this folder first. If found, it skips asset generation entirely and uses the existing image — saving API cost and time.

---

## Example Input & Output

### Input (campaign brief JSON)

```json
{
  "products": [
    {
      "name": "Citrus Burst",
      "category": "beverage",
      "description": "A refreshing citrus energy drink with natural ingredients and zero sugar.",
      "message": "Zero sugar. All the zing. Citrus Burst — your daily refresh."
    },
    {
      "name": "Mango Glow",
      "category": "beverage",
      "description": "A tropical mango wellness drink packed with vitamins and antioxidants.",
      "message": "Taste the tropics. Mango Glow — glow from the inside out."
    }
  ],
  "targetRegion": "EMEA",
  "targetMarket": "France",
  "targetAudience": "Health-conscious professionals aged 28-40",
  "campaignMessage": "Fuel your day with nature's finest. No compromise.",
  "locale": "fr"
}
```

### Output

```
backend/output/
  a3f21b9c/                       ← session ID (8-char UUID slice)
    citrus_burst/
      citrus_burst_1x1.png        ← 1024×1024 — Square (Instagram feed)
      citrus_burst_9x16.png       ← 576×1024  — Portrait (Stories/Reels)
      citrus_burst_16x9.png       ← 1024×576  — Landscape (YouTube/banner)
    mango_glow/
      mango_glow_1x1.png
      mango_glow_9x16.png
      mango_glow_16x9.png
    report.json                   ← full session metadata
  pipeline.log.jsonl              ← append-only run log
```

---

## Project Structure

```
campaign-pipeline/
├── package.json                  # Root: concurrently start script
│
├── backend/
│   ├── package.json
│   ├── .env.example              # → copy to .env, add OPENAI_API_KEY
│   ├── server.js                 # Express app, static serving, routes
│   ├── routes/
│   │   ├── campaign.js           # POST /generate, POST /validate
│   │   └── assets.js             # POST /upload, GET /input, /output/:id, /logs
│   ├── services/
│   │   ├── campaignService.js    # Core pipeline orchestration
│   │   ├── translationService.js # GPT locale translation + cache
│   │   ├── complianceService.js  # Brand & legal checks (pure fn)
│   │   └── loggingService.js     # JSONL append/read
│   ├── helpers/
│   │   ├── generateImageGenAI.js # OpenAI images.generate / images.edit wrapper
│   │   ├── generateInputAsset.js # Hero image generation + asset save
│   │   ├── generateOutputImage.js# Aspect ratio variants (resize or native)
│   │   └── helpers.js            # fetchImageBuffer, resolveInputAsset, writeImageToDir
│   ├── assets/
│   │   └── input/                # Place product images here for reuse
│   └── output/                   # Generated images saved here
│       └── pipeline.log.jsonl    # Append-only run log
│
└── frontend/
    ├── package.json
    ├── vite.config.js            # Vite + proxy to :3001
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx               # Tab routing + state
        ├── styles/
        │   ├── global.css        # Design tokens, resets, utilities
        │   └── app.css           # Layout
        └── components/
            ├── Header.jsx/css
            ├── CampaignForm.jsx/css   # Main input form
            ├── ProductCard.jsx/css    # Per-product field group
            ├── CompliancePanel.jsx/css
            ├── ResultsPanel.jsx/css   # Image grid + lightbox
            └── LogsPanel.jsx/css      # Run history table
```

---

## API Reference

### `POST /api/campaign/generate`

Run the full pipeline. Returns a session report with image URLs.

**Body**: Campaign brief JSON (see example above)

**Response**:
```json
{
  "success": true,
  "report": {
    "sessionId": "string",
    "duration": "string",
    "timestamp": "ISO8601",
    "results": [ ... ],
    "compliance": { ... },
    "summary": { ... }
  }
}
```

### `POST /api/campaign/validate`

Run compliance checks only — no image generation, no API cost.

**Body**: Campaign brief JSON

**Response**:
```json
{
  "compliance": {
    "status": "passed | warnings | failed",
    "issues": [ ... ],
    "warnings": [ ... ],
    "passed": [ ... ]
  }
}
```

### `POST /api/assets/upload`

Upload one or more image files to `assets/input/`. Files are saved using their original filename and will be automatically reused by the pipeline when their name matches a product slug.

### `GET /api/assets/input`

List files currently available in `assets/input/`.

### `GET /api/assets/output/:sessionId`

Retrieve the `report.json` for a previous session.

### `GET /api/assets/logs`

Return all pipeline run log entries (newest first).

### `GET /output/:sessionId/:product/:filename`

Serve a generated image file directly.
