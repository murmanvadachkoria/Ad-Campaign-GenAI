import { useState, useCallback } from 'react'
import CampaignForm from './components/CampaignForm.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import LogsPanel from './components/LogsPanel.jsx'
import Header from './components/Header.jsx'
import './styles/app.css'

const TABS = ['builder', 'results', 'logs']

export default function App() {
  const [activeTab, setActiveTab]   = useState('builder')
  const [report, setReport]         = useState(null)
  const [isGenerating, setGenerating] = useState(false)

  const handleReportReady = useCallback((r) => {
    setReport(r)
    setActiveTab('results')
  }, [])

  return (
    <div className="app-shell">
      <Header />

      {/* Tab bar */}
      <nav className="tab-bar">
        <div className="tab-bar-inner">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'builder'  && <span className="tab-icon">✦</span>}
              {tab === 'results'  && <span className="tab-icon">◈</span>}
              {tab === 'logs'     && <span className="tab-icon">≡</span>}
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              {tab === 'results' && report && (
                <span className="tab-badge">{report.results?.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        {activeTab === 'builder' && (
          <CampaignForm
            onReportReady={handleReportReady}
            isGenerating={isGenerating}
            setGenerating={setGenerating}
          />
        )}
        {activeTab === 'results' && (
          <ResultsPanel report={report} />
        )}
        {activeTab === 'logs' && (
          <LogsPanel />
        )}
      </main>
    </div>
  )
}
