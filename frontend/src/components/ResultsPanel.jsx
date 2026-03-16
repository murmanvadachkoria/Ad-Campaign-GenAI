import { useState } from 'react'
import CompliancePanel from './CompliancePanel.jsx'
import './ResultsPanel.css'

const RATIO_ICONS = {
  '1:1':  '◻',
  '9:16': '▯',
  '16:9': '▭',
}

function ImageCard({ item }) {
  const [loaded, setLoaded] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <div className={`image-card ${loaded ? 'loaded' : ''}`}>
        <div
          className="image-wrap"
          style={{ aspectRatio: item.ratio.replace(':', '/') }}
          onClick={() => setLightbox(true)}
        >
          {!loaded && <div className="img-skeleton" />}
          <img
            src={item.url}
            alt={`${item.product} — ${item.ratio}`}
            onLoad={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0 }}
          />
          <div className="image-overlay">
            <span className="overlay-zoom">⤢ View</span>
          </div>
        </div>
        <div className="image-meta">
          <div className="image-meta-left">
            <span className="ratio-badge">
              {RATIO_ICONS[item.ratio]} {item.ratio}
            </span>
            <span className="image-dims">{item.width}×{item.height}</span>
          </div>
          <div className="image-meta-right">
            {item.reusedAsset && (
              <span className="badge badge-blue" title="Reused existing asset">↩ Reused</span>
            )}
            <a
              href={item.url}
              download={item.filename}
              className="btn-ghost download-btn"
              onClick={e => e.stopPropagation()}
            >
              ↓ Save
            </a>
          </div>
        </div>
        <div className="image-message">
          <span className="message-locale">{item.locale}</span>
          <p>"{item.localizedMessage}"</p>
        </div>
      </div>

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(false)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(false)}>✕</button>
            <img src={item.url} alt={item.filename} />
            <div className="lightbox-footer">
              <span>{item.product} — {item.ratio} — {item.width}×{item.height}px</span>
              <a href={item.url} download={item.filename} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                ↓ Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function ResultsPanel({ report }) {
  const [selectedProduct, setSelectedProduct] = useState('all')

  if (!report) {
    return (
      <div className="results-empty">
        <div className="empty-icon">◈</div>
        <h3>No results yet</h3>
        <p>Run the campaign pipeline from the Builder tab to see generated creatives here.</p>
      </div>
    )
  }

  const { results = [], summary, compliance, sessionId, duration, brief, errors = [] } = report

  const products = [...new Set(results.map(r => r.product))]

  const filtered = selectedProduct === 'all'
    ? results
    : results.filter(r => r.product === selectedProduct)

  // Group filtered results by product
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.product]) acc[item.product] = []
    acc[item.product].push(item)
    return acc
  }, {})

  return (
    <div className="results-panel fade-up">

      {/* Summary bar */}
      <div className="results-summary-bar">
        <div className="summary-stats">
          <div className="stat-pill">
            <span className="stat-num">{summary.totalImages}</span>
            <span className="stat-label">Images</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">{summary.products}</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">{summary.aspectRatios.length}</span>
            <span className="stat-label">Ratios</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">{duration}</span>
            <span className="stat-label">Duration</span>
          </div>
        </div>
        <div className="summary-meta">
          <span className="badge badge-green">Session {sessionId}</span>
          <span className="summary-locale">
            🌍 {brief?.locale?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Compliance */}
      <CompliancePanel compliance={compliance} />

      {/* Errors */}
      {errors.length > 0 && (
        <div className="pipeline-errors">
          {errors.map((e, i) => (
            <div key={i} className="pipeline-error-row">
              <span className="badge badge-red">Error</span>
              <span>{e.product}: {e.error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Product filter tabs */}
      <div className="product-tabs">
        <button
          className={`product-tab ${selectedProduct === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedProduct('all')}
        >
          All Products
        </button>
        {products.map(p => (
          <button
            key={p}
            className={`product-tab ${selectedProduct === p ? 'active' : ''}`}
            onClick={() => setSelectedProduct(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Image grid grouped by product */}
      {Object.entries(grouped).map(([product, items]) => (
        <div key={product} className="product-group">
          <div className="product-group-header">
            <h3 className="product-group-name">{product}</h3>
            <span className="product-group-count">{items.length} creatives</span>
          </div>
          <div className="images-grid">
            {items.map((item, i) => (
              <ImageCard key={i} item={item} />
            ))}
          </div>
        </div>
      ))}

      {/* Output path info */}
      <div className="output-path-info card">
        <div className="output-path-title">Output Directory</div>
        <code className="output-path-code">backend/output/{sessionId}/</code>
        <p className="output-path-hint">Images organized by product name and aspect ratio. A full <code>report.json</code> is also saved alongside.</p>
      </div>

    </div>
  )
}
