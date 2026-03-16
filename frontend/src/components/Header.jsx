import './Header.css'

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="logo">
          <div className="logo-mark">
            <span className="logo-diamond">◆</span>
          </div>
          <div className="logo-text">
            <span className="logo-title">Campaign Pipeline</span>
            <span className="logo-sub">Creative Automation Engine</span>
          </div>
        </div>
        <div className="header-right">
          <span className="badge badge-green">
            <span className="blink-dot" />
            Live
          </span>
          <span className="header-version">v1.0</span>
        </div>
      </div>
      <div className="header-stripe" />
    </header>
  )
}
