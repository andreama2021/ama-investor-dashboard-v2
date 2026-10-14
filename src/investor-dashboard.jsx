import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const CONFIG = {
  GOOGLE_SHEETS_API_KEY: 'AIzaSyDIBaFUl9Ah07lz5xvOcBsMcaDnekM8EDM',
  SPREADSHEET_ID: '10Gmt0gVyqNhnRuRsoSPn20OnK6mbnYB3vulS9wWJkEs',
  SHEET_RANGE: 'Sheet1!A1:W1000',
  ACCESS_PIN: 'ama2026'
};

// ============================================
// LOGO COMPONENT
// ============================================
function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#logoGradient)" />
      <text
        x="20"
        y="28"
        fontSize="24"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="DM Sans, sans-serif"
      >
        A
      </text>
    </svg>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
export default function InvestorDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('90');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedQuarter, setSelectedQuarter] = useState('Q3');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    // Set favicon to Logo_A_icon.jpg
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = '/Logo_A_icon.jpg';

    // Check authentication
    const auth = sessionStorage.getItem('dashboard_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === CONFIG.ACCESS_PIN) {
      setIsAuthenticated(true);
      sessionStorage.setItem('dashboard_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('dashboard_auth');
    setPinInput('');
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.SHEET_RANGE}?key=${CONFIG.GOOGLE_SHEETS_API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data from Google Sheets');
      const result = await response.json();
      setData(parseSheetData(result.values));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseSheetData = (rows) => {
    if (!rows || rows.length < 2) return null;
    const headers = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map(row => ({
      date: row[0] || '',
      gmvTotal: parseFloat(row[1]) || 0,
      gmvRentals: parseFloat(row[2]) || 0,
      gmvServices: parseFloat(row[3]) || 0,
      revenueTotal: parseFloat(row[4]) || 0,
      revenueRentals: parseFloat(row[5]) || 0,
      revenueServices: parseFloat(row[6]) || 0,
      bookings: parseInt(row[7]) || 0,
      nights: parseInt(row[8]) || 0,
      avgBookingValue: parseFloat(row[9]) || 0,
      users: parseInt(row[10]) || 0,
      nps: parseFloat(row[11]) || 0,
      marketingSpend: parseFloat(row[12]) || 0,
      cashPosition: parseFloat(row[13]) || 0,
      ttmRevenue: parseFloat(row[14]) || 0
    })).filter(item => item.date);
  };

  const getFilteredData = () => {
    if (!data) return { current: [], previous: [] };

    const now = new Date();
    let startDate, endDate, prevStartDate, prevEndDate;

    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      prevEndDate = new Date(startDate);
      prevStartDate = new Date(prevEndDate.getTime() - daysDiff * 24 * 60 * 60 * 1000);
    } else {
      const days = parseInt(period);
      endDate = now;
      startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate);
      prevStartDate = new Date(prevEndDate.getTime() - days * 24 * 60 * 60 * 1000);
    }

    const current = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    const previous = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= prevStartDate && itemDate < prevEndDate;
    });

    return { current, previous };
  };

  const calculateMetrics = () => {
    const { current, previous } = getFilteredData();

    if (current.length === 0) {
      return {
        totalGMV: 0, totalRevenue: 0, totalBookings: 0, totalNights: 0,
        avgBookingValue: 0, currentUsers: 0, avgNPS: 0, totalMarketingSpend: 0,
        marketingEfficiency: 0, currentCash: 0, latestTTM: 0, runway: 0,
        gmvEU: 0, gmvOutsideEU: 0, liveProperties: 0,
        rentalRevenuePerBooking: 0, servicesRevenuePerBooking: 0,
        rentalTakeRate: 0, servicesTakeRate: 0,
        cac: 0, ltv: 0, ltvCacRatio: 0, paybackPeriod: 0,
        growth: {}
      };
    }

    const totalGMV = current.reduce((sum, item) => sum + item.gmvTotal, 0);
    const totalRevenue = current.reduce((sum, item) => sum + item.revenueTotal, 0);
    const totalBookings = current.reduce((sum, item) => sum + item.bookings, 0);
    const totalNights = current.reduce((sum, item) => sum + item.nights, 0);
    const avgBookingValue = current.reduce((sum, item) => sum + item.avgBookingValue, 0) / current.length;
    const currentUsers = current[current.length - 1]?.users || 0;
    const avgNPS = current.reduce((sum, item) => sum + item.nps, 0) / current.length;
    const totalMarketingSpend = current.reduce((sum, item) => sum + item.marketingSpend, 0);
    const marketingEfficiency = totalMarketingSpend > 0 ? (totalRevenue / totalMarketingSpend) * 100 : 0;
    const currentCash = current[current.length - 1]?.cashPosition || 0;
    const latestTTM = current[current.length - 1]?.ttmRevenue || 0;

    // Runway calculation (hard-coded to March 31, 2028)
    const endOfRunway = new Date(2028, 2, 31);
    const now = new Date(current[current.length - 1]?.date || new Date());
    const monthsDiff = (endOfRunway - now) / (1000 * 60 * 60 * 24 * 30.44);
    const runway = Math.max(0, monthsDiff);

    // Geographic and operational metrics (calculated from available data)
    const gmvRentals = current.reduce((sum, item) => sum + item.gmvRentals, 0);
    const gmvServices = current.reduce((sum, item) => sum + item.gmvServices, 0);
    const gmvEU = gmvRentals * 0.9; // Approximation: 90% from EU
    const gmvOutsideEU = gmvRentals * 0.1; // Approximation: 10% outside EU
    const liveProperties = Math.round(totalBookings / 15); // Approximation: ~15 bookings per property

    // Revenue breakdown
    const revenueRentals = current.reduce((sum, item) => sum + item.revenueRentals, 0);
    const revenueServices = current.reduce((sum, item) => sum + item.revenueServices, 0);
    const rentalBookings = totalBookings * 0.85;
    const servicesBookings = totalBookings * 0.15;
    const rentalRevenuePerBooking = rentalBookings > 0 ? revenueRentals / rentalBookings : 0;
    const servicesRevenuePerBooking = servicesBookings > 0 ? revenueServices / servicesBookings : 0;
    const rentalTakeRate = gmvRentals > 0 ? (revenueRentals / gmvRentals) * 100 : 0;
    const servicesTakeRate = gmvServices > 0 ? (revenueServices / gmvServices) * 100 : 0;

    // CAC & LTV metrics
    const newUsers = currentUsers > (previous[previous.length - 1]?.users || 0) ? currentUsers - (previous[previous.length - 1]?.users || 0) : 1;
    const cac = newUsers > 0 ? totalMarketingSpend / newUsers : 0;
    const ltv = currentUsers > 0 ? totalRevenue / currentUsers : 0;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const monthlyRevenuePerUser = currentUsers > 0 ? totalRevenue / currentUsers / (current.length / 30) : 0;
    const paybackPeriod = monthlyRevenuePerUser > 0 ? cac / monthlyRevenuePerUser : 0;

    // Previous period calculations
    const prevTotalGMV = previous.reduce((sum, item) => sum + item.gmvTotal, 0);
    const prevTotalRevenue = previous.reduce((sum, item) => sum + item.revenueTotal, 0);
    const prevTotalBookings = previous.reduce((sum, item) => sum + item.bookings, 0);
    const prevTotalNights = previous.reduce((sum, item) => sum + item.nights, 0);
    const prevAvgBookingValue = previous.length > 0 ? previous.reduce((sum, item) => sum + item.avgBookingValue, 0) / previous.length : 0;
    const prevUsers = previous[previous.length - 1]?.users || 0;
    const prevAvgNPS = previous.length > 0 ? previous.reduce((sum, item) => sum + item.nps, 0) / previous.length : 0;
    const prevMarketingEfficiency = previous.reduce((sum, item) => sum + item.marketingSpend, 0) > 0 ? (prevTotalRevenue / previous.reduce((sum, item) => sum + item.marketingSpend, 0)) * 100 : 0;
    const prevLatestTTM = previous[previous.length - 1]?.ttmRevenue || 0;
    const prevLTV = prevUsers > 0 ? prevTotalRevenue / prevUsers : 0;

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalGMV, totalRevenue, totalBookings, totalNights, avgBookingValue,
      currentUsers, avgNPS, totalMarketingSpend, marketingEfficiency,
      currentCash, latestTTM, runway,
      gmvEU, gmvOutsideEU, liveProperties,
      rentalRevenuePerBooking, servicesRevenuePerBooking,
      rentalTakeRate, servicesTakeRate,
      cac, ltv, ltvCacRatio, paybackPeriod,
      growth: {
        gmv: calculateGrowth(totalGMV, prevTotalGMV),
        revenue: calculateGrowth(totalRevenue, prevTotalRevenue),
        bookings: calculateGrowth(totalBookings, prevTotalBookings),
        nights: calculateGrowth(totalNights, prevTotalNights),
        avgBookingValue: calculateGrowth(avgBookingValue, prevAvgBookingValue),
        users: calculateGrowth(currentUsers, prevUsers),
        nps: calculateGrowth(avgNPS, prevAvgNPS),
        marketingEfficiency: calculateGrowth(marketingEfficiency, prevMarketingEfficiency),
        ttm: calculateGrowth(latestTTM, prevLatestTTM),
        ltv: calculateGrowth(ltv, prevLTV)
      }
    };
  };

  // CUSTOM TOOLTIP COMPONENT
  const CustomTooltip = ({ active, payload, dataKey, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = payload[0].value;
      const label_text = dataKey === 'gmvTotal' ? `GMV : $${value.toLocaleString()}` : `Revenue : $${value.toLocaleString()}`;

      return (
        <div style={{
          background: 'white',
          border: '1px solid #e5e5e0',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#6b6b6b',
            margin: '0 0 4px 0'
          }}>
            {data.date}
          </p>
          <p style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#2563eb',
            margin: 0
          }}>
            {label_text}
          </p>
        </div>
      );
    }
    return null;
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f9f9f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        `}</style>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.06)',
          padding: '48px 40px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <Logo size={56} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px', margin: 0 }}>
              A.M.A Selections
            </h1>
            <p style={{ fontSize: '14px', color: '#6b6b6b', margin: 0 }}>
              Investor Dashboard
            </p>
          </div>

          <form onSubmit={handlePinSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '500',
                color: '#2d2d2d',
                marginBottom: '8px'
              }}>
                PIN Code
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••"
                maxLength="6"
                autoFocus
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  fontSize: '20px',
                  border: '1px solid #d9d7ce',
                  borderRadius: '8px',
                  background: '#fafaf8',
                  color: '#1a1a1a',
                  textAlign: 'center',
                  letterSpacing: '0.1em',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#2563eb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#fafaf8';
                  e.target.style.borderColor = '#d9d7ce';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {pinError && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                border: '1px solid #fecaca'
              }}>
                Incorrect PIN. Please try again.
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#A28D50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '24px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#8f7844';
                e.target.style.boxShadow = '0 4px 16px rgba(162, 141, 80, 0.3)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#A28D50';
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Access Dashboard
            </button>

            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#6b6b6b',
              marginTop: '24px',
              margin: 0
            }}>
              Enter the 4-digit PIN to access your investor dashboard
            </p>
          </form>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  const metrics = data ? calculateMetrics() : null;
  const { current: chartData } = data ? getFilteredData() : { current: [] };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .metric-value {
          font-variant-numeric: tabular-nums;
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e5e5e0',
        padding: '16px 48px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logo size={40} />
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                A.M.A Selections
              </h1>
              <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px', margin: 0 }}>
                Investor Dashboard
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '12px', color: '#6b6b6b' }}>
              2023 – 2026 · <strong>{selectedQuarter}</strong>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#6b6b6b',
                border: '1px solid #d9d7ce',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#1a1a1a';
                e.target.style.borderColor = '#c5c1b0';
                e.target.style.background = '#fafaf8';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#6b6b6b';
                e.target.style.borderColor = '#d9d7ce';
                e.target.style.background = 'transparent';
              }}
            >
              ➜ Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div style={{
        padding: '32px 48px 0',
        maxWidth: '1440px',
        margin: '0 auto'
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 32px 0' }}>
          Investor Dashboard
        </h2>
      </div>

      {/* Sticky Filter Section */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e5e0',
        position: 'sticky',
        top: '60px',
        zIndex: 40,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          padding: '20px 48px',
          maxWidth: '1440px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
            {/* Select Year */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' }}>
                Select Year
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['2023', '2024', '2025', '2026', 'Lifetime'].map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    style={{
                      padding: '8px 14px',
                      background: selectedYear === year ? '#A28D50' : 'transparent',
                      color: selectedYear === year ? 'white' : '#6b6b6b',
                      border: '1px solid #d9d7ce',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Period */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px' }}>
                Select Period
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { value: '30', label: 'Last Full Month' },
                  { value: '90', label: 'Q1', quarter: 'Q1' },
                  { value: '90', label: 'Q2', quarter: 'Q2' },
                  { value: '90', label: 'Q3', quarter: 'Q3' },
                  { value: '90', label: 'Q4', quarter: 'Q4' },
                  { value: '365', label: 'Full Year' },
                  { value: 'custom', label: 'Custom Range' }
                ].map(btn => (
                  <button
                    key={btn.label}
                    onClick={() => {
                      setPeriod(btn.value);
                      if (btn.quarter) setSelectedQuarter(btn.quarter);
                    }}
                    style={{
                      padding: '8px 14px',
                      background: (period === btn.value || (btn.quarter && selectedQuarter === btn.quarter)) ? '#A28D50' : 'transparent',
                      color: (period === btn.value || (btn.quarter && selectedQuarter === btn.quarter)) ? 'white' : '#6b6b6b',
                      border: '1px solid #d9d7ce',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {period === 'custom' && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d7ce',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#1a1a1a'
                }}
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d7ce',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#1a1a1a'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '32px 48px'
      }}>
        {loading && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '48px',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '4px solid #2563eb',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <p style={{ color: '#6b6b6b' }}>Loading data...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px'
          }}>
            <h3 style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px' }}>Error Loading Data</h3>
            <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '8px' }}>{error}</p>
            <p style={{ color: '#ef4444', fontSize: '14px' }}>Please check your Google Sheets configuration in the code.</p>
          </div>
        )}

        {!loading && !error && metrics && (
          <>
            {/* Financial Performance */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Financial Performance
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <KPICard
                title="Total GMV"
                value={`$${(metrics.totalGMV / 1000000).toFixed(2)}M`}
                growth={metrics.growth.gmv}
              />
              <KPICard
                title="Total Revenue"
                value={`$${(metrics.totalRevenue / 1000).toFixed(0)}K`}
                growth={metrics.growth.revenue}
              />
              <KPICard
                title="TTM Revenue"
                value={`$${(metrics.latestTTM / 1000000).toFixed(2)}M`}
                growth={metrics.growth.ttm}
              />
            </div>

            {/* Revenue Breakdown */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Revenue Breakdown
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <KPICard
                title="Avg Booking Value"
                value={`$${metrics.avgBookingValue.toFixed(0)}`}
                growth={metrics.growth.avgBookingValue}
              />
              <KPICard
                title="Rental Revenue/Booking"
                value={`$${metrics.rentalRevenuePerBooking.toFixed(0)}`}
                growth={0}
              />
              <KPICard
                title="Services Revenue/Booking"
                value={`$${metrics.servicesRevenuePerBooking.toFixed(0)}`}
                growth={0}
              />
              <KPICard
                title="Rental Take Rate"
                value={`${metrics.rentalTakeRate.toFixed(1)}%`}
                growth={0}
              />
              <KPICard
                title="Services Take Rate"
                value={`${metrics.servicesTakeRate.toFixed(1)}%`}
                growth={0}
              />
            </div>

            {/* Geographic Split */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Geographic Split
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <KPICard
                title="GMV EU"
                value={`${((metrics.gmvEU / metrics.totalGMV) * 100).toFixed(1)}%`}
                growth={0}
              />
              <KPICard
                title="GMV Outside EU"
                value={`${((metrics.gmvOutsideEU / metrics.totalGMV) * 100).toFixed(1)}%`}
                growth={0}
              />
              <KPICard
                title="Live Properties"
                value={metrics.liveProperties.toLocaleString()}
                growth={0}
              />
            </div>

            {/* Operations Section */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Operations
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <KPICard
                title="Total Bookings"
                value={metrics.totalBookings.toLocaleString()}
                growth={metrics.growth.bookings}
              />
              <KPICard
                title="Nights Booked"
                value={metrics.totalNights.toLocaleString()}
                growth={metrics.growth.nights}
              />
              <KPICard
                title="Total Users"
                value={metrics.currentUsers.toLocaleString()}
                growth={metrics.growth.users}
              />
              <KPICard
                title="NPS Score"
                value={metrics.avgNPS.toFixed(0)}
                growth={metrics.growth.nps}
              />
            </div>

            {/* CAC & LTV */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              CAC & LTV
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <KPICard
                title="Customer Acquisition Cost"
                value={`$${metrics.cac.toFixed(0)}`}
                growth={0}
              />
              <KPICard
                title="Lifetime Value"
                value={`$${metrics.ltv.toFixed(0)}`}
                growth={metrics.growth.ltv}
              />
              <KPICard
                title="LTV / CAC Ratio"
                value={metrics.ltvCacRatio.toFixed(2)}
                growth={0}
              />
              <KPICard
                title="Payback Period"
                value={`${metrics.paybackPeriod.toFixed(2)} months`}
                growth={0}
              />
            </div>

            {/* Marketing & Runway */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Marketing & Runway
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <KPICard
                title="Marketing Spend"
                value={`$${(metrics.totalMarketingSpend / 1000).toFixed(0)}K`}
                growth={0}
              />
              <KPICard
                title="Marketing Efficiency"
                value={`${metrics.marketingEfficiency.toFixed(0)}%`}
                growth={metrics.growth.marketingEfficiency}
              />
              <KPICard
                title="Cash Position"
                value={`$${(metrics.currentCash / 1000000).toFixed(2)}M`}
                growth={0}
              />
              <KPICard
                title="Runway"
                value={`${metrics.runway.toFixed(1)}m`}
                growth={0}
                subtitle="Until end of March 2028"
              />
            </div>

            {/* Charts */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
              Analytics
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
              gap: '16px'
            }}>
              {/* GMV Trend */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e5e0',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
                  GMV Trend
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#9a9a9a" />
                    <YAxis stroke="#9a9a9a" />
                    <Tooltip content={<CustomTooltip dataKey="gmvTotal" />} />
                    <Area type="monotone" dataKey="gmvTotal" stroke="#2563eb" fillOpacity={1} fill="url(#colorGMV)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Trend */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e5e0',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>
                  Revenue Trend
                </h4>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#9a9a9a" />
                    <YAxis stroke="#9a9a9a" />
                    <Tooltip content={<CustomTooltip dataKey="revenueTotal" />} />
                    <Area type="monotone" dataKey="revenueTotal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// KPI CARD COMPONENT
// ============================================
const ICON_MAP = {
  'Total GMV': 'fa-dollar-sign',
  'Total Revenue': 'fa-dollar-sign',
  'TTM Revenue': 'fa-dollar-sign',
  'Avg Booking Value': 'fa-bullseye',
  'Rental Revenue/Booking': 'fa-dollar-sign',
  'Services Revenue/Booking': 'fa-dollar-sign',
  'Rental Take Rate': 'fa-percent',
  'Services Take Rate': 'fa-percent',
  'GMV EU': 'fa-dollar-sign',
  'GMV Outside EU': 'fa-dollar-sign',
  'Live Properties': 'fa-home',
  'Total Bookings': 'fa-shopping-cart',
  'Nights Booked': 'fa-calendar',
  'Total Users': 'fa-users',
  'NPS Score': 'fa-star',
  'Customer Acquisition Cost': 'fa-dollar-sign',
  'Lifetime Value': 'fa-dollar-sign',
  'LTV / CAC Ratio': 'fa-bullseye',
  'Payback Period': 'fa-calendar',
  'Marketing Spend': 'fa-dollar-sign',
  'Marketing Efficiency': 'fa-chart-line',
  'Cash Position': 'fa-dollar-sign',
  'Runway': 'fa-calendar'
};

function KPICard({ title, value, growth, subtitle }) {
  const isPositive = growth > 0;
  const showGrowth = growth !== null && growth !== undefined;
  const icon = ICON_MAP[title] || '◆';

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e5e0',
        borderRadius: '8px',
        padding: '22px',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#d0ccc0';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e5e0';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <i style={{ fontSize: '16px', color: '#A28D50', opacity: 0.8 }} className={`fas ${icon}`}></i>
        {showGrowth && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: '600',
            color: isPositive ? '#059669' : '#dc2626',
            background: isPositive ? '#f0fdf4' : '#fef2f2',
            padding: '4px 8px',
            borderRadius: '6px',
            border: isPositive ? '1px solid #dcfce7' : '1px solid #fee2e2'
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <h4 style={{
        fontSize: '12px',
        color: '#6b6b6b',
        marginBottom: '6px',
        margin: 0,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        fontWeight: '500'
      }}>
        {title}
      </h4>
      <p className="metric-value" style={{
        fontSize: '27px',
        fontWeight: '700',
        color: '#1a1a1a',
        margin: 0,
        marginTop: '4px'
      }}>
        {value}
      </p>
      {!showGrowth && subtitle && (
        <p style={{
          fontSize: '12px',
          color: '#9a9a9a',
          margin: 0,
          marginTop: '4px'
        }}>
          {subtitle}
        </p>
      )}
      {showGrowth && (
        <p style={{
          fontSize: '12px',
          color: '#9a9a9a',
          margin: 0,
          marginTop: '4px'
        }}>
          vs previous period
        </p>
      )}
    </div>
  );
}
