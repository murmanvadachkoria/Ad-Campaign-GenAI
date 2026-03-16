import { useState, useEffect } from 'react'
import './LogsPanel.css'

export default function LogsPanel() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/assets/logs')
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="logs-loading">
        <span className="spinner" />
        <span>Loading run history…</span>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="logs-empty">
        <div className="empty-icon">≡</div>
        <h3>No runs logged yet</h3>
        <p>Each pipeline run is logged here automatically. Generate your first campaign to see logs.</p>
      </div>
    )
  }

  return (
    <div className="logs-panel fade-up">
      <div className="logs-header">
        <h2 className="section-title">Pipeline Run History</h2>
        <span className="section-count">{logs.length} run{logs.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="logs-table-wrap">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Timestamp</th>
              <th>Products</th>
              <th>Region / Market</th>
              <th>Locale</th>
              <th>Images</th>
              <th>Duration</th>
              <th>Compliance</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <td>
                  <code className="session-id">{log.sessionId}</code>
                </td>
                <td className="td-dim">
                  {new Date(log.timestamp).toLocaleString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td>
                  <div className="log-products">
                    {(log.products || []).map((p, j) => (
                      <span key={j} className="log-product-tag">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="td-dim">{log.region} / {log.market}</td>
                <td>
                  <span className="badge badge-blue">{(log.locale || 'en').toUpperCase()}</span>
                </td>
                <td>
                  <span className="log-stat">{log.totalImages}</span>
                </td>
                <td className="td-dim">{log.duration}</td>
                <td>
                  <ComplianceDot status={log.complianceStatus} />
                </td>
                <td>
                  {log.errors > 0
                    ? <span className="badge badge-red">{log.errors}</span>
                    : <span className="badge badge-green">0</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComplianceDot({ status }) {
  const map = {
    passed:   { cls: 'badge-green',  label: 'Passed'  },
    warnings: { cls: 'badge-yellow', label: 'Warnings'},
    failed:   { cls: 'badge-red',    label: 'Failed'  },
  }
  const cfg = map[status] || map.warnings
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}
