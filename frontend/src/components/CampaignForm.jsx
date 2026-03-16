import { useState, useEffect } from 'react'
import ProductCard from './ProductCard.jsx'
import CompliancePanel from './CompliancePanel.jsx'
import './CampaignForm.css'

const DEFAULT_PRODUCTS = [
  {
    name: 'Citrus Burst',
    category: 'beverage',
    description: 'A refreshing citrus energy drink with natural ingredients and zero sugar.',
    message: 'Zero sugar. All the zing. Citrus Burst — your daily refresh.',
  },
  {
    name: 'Mango Glow',
    category: 'beverage',
    description: 'A tropical mango wellness drink packed with vitamins and antioxidants.',
    message: 'Taste the tropics. Mango Glow — glow from the inside out.',
  },
]

const LOCALES = [
  { value: 'en', label: '🇬🇧  English' },
  { value: 'es', label: '🇪🇸  Spanish — Español' },
  { value: 'fr', label: '🇫🇷  French — Français' },
  { value: 'de', label: '🇩🇪  German — Deutsch' },
  { value: 'ja', label: '🇯🇵  Japanese — 日本語' },
]

const ASPECT_RATIOS = ['1:1', '9:16', '16:9']

function useDebouncedValidation(brief, delay = 800) {
  const [compliance, setCompliance] = useState(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (!brief.products?.length) return
    setValidating(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/campaign/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brief),
        })
        const data = await res.json()
        setCompliance(data.compliance)
      } catch {
        // validation is best-effort
      } finally {
        setValidating(false)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [JSON.stringify(brief)])

  return { compliance, validating }
}

export default function CampaignForm({ onReportReady, isGenerating, setGenerating }) {
  const [products, setProducts]           = useState(DEFAULT_PRODUCTS)
  const [targetRegion, setTargetRegion]   = useState('North America')
  const [targetMarket, setTargetMarket]   = useState('United States')
  const [targetAudience, setAudience]     = useState('Health-conscious millennials aged 25–35')
  const [campaignMessage, setMessage]     = useState('Fuel your day with nature\'s finest. No compromise.')
  const [locale, setLocale]               = useState('en')
  const [inputAssets, setInputAssets]     = useState([])
  const [availableAssets, setAvailAssets] = useState([])
  const [error, setError]                 = useState(null)
  const [progress, setProgress]           = useState('')

  const brief = { products, targetRegion, targetMarket, targetAudience, campaignMessage, locale }
  const { compliance, validating } = useDebouncedValidation(brief)

  // Load available input assets on mount
  useEffect(() => {
    fetch('/api/assets/input')
      .then(r => r.json())
      .then(d => setAvailAssets(d.assets || []))
      .catch(() => {})
  }, [])

  const handleProductChange = (index, updated) => {
    setProducts(prev => prev.map((p, i) => i === index ? updated : p))
  }

  const handleAddProduct = () => {
    setProducts(prev => [...prev, { name: '', category: '', description: '', message: '' }])
  }

  const handleRemoveProduct = (index) => {
    setProducts(prev => prev.filter((_, i) => i !== index))
  }

  const handleAssetFiles = (e) => {
    const files = Array.from(e.target.files)
    setInputAssets(files)
  }

  const handleGenerate = async () => {
    setError(null)
    setGenerating(true)
    setProgress('Submitting campaign brief…')

    try {
      const steps = [
        'Resolving input assets…',
        'Generating hero images',
        'Compositing aspect ratio variants…',
        'Overlaying localized campaign messages…',
        'Running brand compliance checks…',
        'Saving outputs to disk…',
      ]
      let stepIndex = 0
      const progressInterval = setInterval(() => {
        stepIndex = (stepIndex + 1) % steps.length
        setProgress(steps[stepIndex])
      }, 2800)

      const res = await fetch('/api/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      })

      clearInterval(progressInterval)

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Pipeline failed')
      }

      setProgress('Complete!')
      onReportReady(data.report)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
      setProgress('')
    }
  }

  const isValid = products.length >= 1 &&
                  products.every(p => p.name && p.category) &&
                  targetRegion && campaignMessage

  return (
    <div className="campaign-form fade-up">
      {/* ── LEFT column ──────────────────────────────────────── */}
      <section className="form-left">

        {/* Products */}
        <div className="section-block">
          <div className="section-title-row">
            <h2 className="section-title">Products</h2>
            <span className="section-count">{products.length} product{products.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="section-hint">At least two products required. Each needs a name, category, and ad message.</p>

          <div className="products-list">
            {products.map((p, i) => (
              <ProductCard
                key={i}
                product={p}
                index={i}
                onChange={handleProductChange}
                onRemove={handleRemoveProduct}
                canRemove={products.length > 1}
              />
            ))}
          </div>

          <button className="btn-ghost add-product-btn" onClick={handleAddProduct}>
            <span>＋</span> Add Another Product
          </button>
        </div>

        {/* Targeting */}
        <div className="section-block">
          <h2 className="section-title">Campaign Targeting</h2>

          <div className="field-row">
            <div className="field-group">
              <label htmlFor="target-region">Target Region</label>
              <input
                id="target-region"
                type="text"
                value={targetRegion}
                onChange={e => setTargetRegion(e.target.value)}
                placeholder="e.g. North America, EMEA, APAC"
              />
            </div>
            <div className="field-group">
              <label htmlFor="target-market">Target Market</label>
              <input
                id="target-market"
                type="text"
                value={targetMarket}
                onChange={e => setTargetMarket(e.target.value)}
                placeholder="e.g. United States, UK, Japan"
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="target-audience">Target Audience</label>
            <input
              id="target-audience"
              type="text"
              value={targetAudience}
              onChange={e => setAudience(e.target.value)}
              placeholder="e.g. Health-conscious millennials aged 25–35"
            />
          </div>

          <div className="field-group">
            <label htmlFor="campaign-message">Campaign Message</label>
            <textarea
              id="campaign-message"
              rows={3}
              value={campaignMessage}
              onChange={e => setMessage(e.target.value)}
              placeholder="The global message for this campaign run…"
            />
            <span className="char-count">{campaignMessage.length} / 280</span>
          </div>

          <div className="field-group">
            <label htmlFor="locale">Output Locale</label>
            <div className="select-wrapper">
              <select
                id="locale"
                value={locale}
                onChange={e => setLocale(e.target.value)}
              >
                {LOCALES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <span className="select-arrow">▾</span>
            </div>
            <p className="field-hint">Product messages will be translated to the selected language via GPT.</p>
          </div>
        </div>

        {/* Input assets */}
        <div className="section-block">
          <h2 className="section-title">Input Assets</h2>
          <p className="section-hint">
            Drop existing product images into <code>backend/assets/input/</code> named after your product
            (e.g. <code>citrus_burst.png</code>). They'll be reused automatically — no new generation needed.
          </p>

          {availableAssets.length > 0 && (
            <div className="existing-assets">
              <span className="assets-label">Detected in assets/input/</span>
              <div className="asset-chips">
                {availableAssets.map(a => (
                  <span key={a.filename} className="asset-chip">
                    <span className="asset-chip-dot" />
                    {a.filename}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="field-group">
            <label htmlFor="asset-upload">Upload New Assets (optional)</label>
            <div className="file-drop-zone">
              <input
                id="asset-upload"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAssetFiles}
                className="file-input-hidden"
              />
              <label htmlFor="asset-upload" className="file-drop-label">
                <span className="file-drop-icon">⬆</span>
                {inputAssets.length > 0
                  ? `${inputAssets.length} file${inputAssets.length > 1 ? 's' : ''} selected`
                  : 'Click to browse or drag & drop images'}
              </label>
            </div>
          </div>
        </div>

      </section>

      {/* ── RIGHT column ─────────────────────────────────────── */}
      <aside className="form-right">

        {/* Output config summary */}
        <div className="card config-summary">
          <h3 className="config-title">Output Configuration</h3>
          <div className="config-rows">
            <div className="config-row">
              <span className="config-key">Aspect Ratios</span>
              <div className="ratio-chips">
                {ASPECT_RATIOS.map(r => (
                  <span key={r} className="ratio-chip">{r}</span>
                ))}
              </div>
            </div>
            <div className="config-row">
              <span className="config-key">Products</span>
              <span className="config-val">{products.filter(p => p.name).length}</span>
            </div>
            <div className="config-row">
              <span className="config-key">Images Total</span>
              <span className="config-val">{products.filter(p => p.name).length * ASPECT_RATIOS.length}</span>
            </div>
            <div className="config-row">
              <span className="config-key">Locale</span>
              <span className="config-val">{LOCALES.find(l => l.value === locale)?.label || locale}</span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="compliance-wrapper">
          {validating && (
            <div className="validating-row">
              <span className="spinner" style={{ width: 13, height: 13 }} />
              <span>Validating brief…</span>
            </div>
          )}
          <CompliancePanel compliance={compliance} />
        </div>

        {/* Generate button */}
        <div className="generate-section">
          {error && (
            <div className="error-banner">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {isGenerating && (
            <div className="progress-row">
              <span className="spinner" />
              <span className="progress-text">{progress}</span>
            </div>
          )}

          <button
            className="btn-primary generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating || !isValid}
          >
            {isGenerating ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#0a0a0f' }} />
                Generating…
              </>
            ) : (
              <>
                <span>◆</span>
                Generate Campaign Creatives
              </>
            )}
          </button>

          {!isValid && !isGenerating && (
            <p className="form-warning">
              Fill in all product names, categories, region, and campaign message to proceed.
            </p>
          )}
        </div>

        {/* JSON preview */}
        <details className="json-preview-details">
          <summary className="json-preview-summary">Preview Campaign Brief JSON</summary>
          <pre className="json-preview">{JSON.stringify(brief, null, 2)}</pre>
        </details>

      </aside>
    </div>
  )
}
