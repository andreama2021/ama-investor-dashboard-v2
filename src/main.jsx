import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import InvestorDashboard from './investor-dashboard'
import InvestorPitchDashboard from './investor-pitch-dashboard'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<InvestorDashboard />} />
        <Route path="/pitch" element={<InvestorPitchDashboard />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)
