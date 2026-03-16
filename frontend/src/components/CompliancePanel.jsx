import './CompliancePanel.css'

const ICONS = {
  error:   '✕',
  warning: '△',
  passed:  '✓',
}

export default function CompliancePanel({ compliance }) {
  if (!compliance) return null

  const { status, issues = [], warnings = [], passed = [] } = compliance

  const statusConfig = {
    passed:   { label: 'Compliant',      cls: 'badge-green'  },
    warnings: { label: 'Needs Review',   cls: 'badge-yellow' },
    failed:   { label: 'Non-Compliant',  cls: 'badge-red'    },
  }

  const cfg = statusConfig[status] || statusConfig.warnings

  return (
    <div className={`compliance-panel compliance-${status}`}>
      <div className="compliance-header">
        <span className="compliance-title">Brand & Legal Check</span>
        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {issues.length > 0 && (
        <ul className="compliance-list compliance-errors">
          {issues.map((item, i) => (
            <li key={i}>
              <span className="c-icon error">{ICONS.error}</span>
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="compliance-list compliance-warnings">
          {warnings.map((item, i) => (
            <li key={i}>
              <span className="c-icon warning">{ICONS.warning}</span>
              <span>{item.message}</span>
            </li>
          ))}
        </ul>
      )}

      {passed.length > 0 && (
        <ul className="compliance-list compliance-passed">
          {passed.map((msg, i) => (
            <li key={i}>
              <span className="c-icon passed">{ICONS.passed}</span>
              <span>{msg}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
