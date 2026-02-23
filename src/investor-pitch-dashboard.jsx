import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, ShoppingCart, Star, Target, Home, Percent, Zap } from 'lucide-react';
 
// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  GOOGLE_SHEETS_API_KEY: 'AIzaSyDIBaFUl9Ah07lz5xvOcBsMcaDnekM8EDM',
  SPREADSHEET_ID: '10Gmt0gVyqNhnRuRsoSPn20OnK6mbnYB3vulS9wWJkEs',
  SHEET_RANGE: 'Sheet1!A1:W1000',
  ACCESS_PIN: 'ama2026'
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function InvestorPitchDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('investor_pitch_auth');
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
      sessionStorage.setItem('investor_pitch_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('investor_pitch_auth');
    setPinInput('');
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.SHEET_RANGE}?key=${CONFIG.GOOGLE_SHEETS_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch data from Google Sheets');
      }
      
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
      ttmRevenue: parseFloat(row[14]) || 0,
      gmvEU: parseFloat(row[15]) || 0,
      gmvOutsideEU: parseFloat(row[16]) || 0,
      properties: parseInt(row[17]) || 0,
      cac: parseFloat(row[18]) || 0,
      returningRate: parseFloat(row[19]) || 0,
      returning3Plus: parseFloat(row[20]) || 0,
      avgBookingsPerCustomer: parseFloat(row[21]) || 0,
      grossMargin: parseFloat(row[22]) || 0
    })).filter(item => item.date);
  };

  const calculateMetrics = () => {
    if (!data || data.length === 0) return null;

    // Get TTM (last 12 months) data
    const today = new Date();
    const twelveMonthsAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    const ttmData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= twelveMonthsAgo && itemDate <= today;
    });

    // Get previous 12 months for YoY comparison
    const twentyFourMonthsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    const prevTTMData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= twentyFourMonthsAgo && itemDate < twelveMonthsAgo;
    });

    // Calculate yearly aggregates for growth charts
    const getYearData = (year) => {
      return data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === year;
      });
    };

    const data2023 = getYearData(2023);
    const data2024 = getYearData(2024);
    const data2025 = getYearData(2025);

    // TTM Metrics
    const ttmRevenue = ttmData.reduce((sum, item) => sum + item.revenueTotal, 0);
    const ttmBookings = ttmData.reduce((sum, item) => sum + item.bookings, 0);
    const ttmGMV = ttmData.reduce((sum, item) => sum + item.gmvTotal, 0);
    const ttmAOV = ttmData.reduce((sum, item) => sum + item.avgBookingValue, 0) / ttmData.length;
    const ttmCAC = ttmData.reduce((sum, item) => sum + item.cac, 0) / ttmData.length;
    const ttmGrossMargin = ttmData.reduce((sum, item) => sum + item.grossMargin, 0) / ttmData.length;
    const ttmAvgBookingsPerCustomer = ttmData.reduce((sum, item) => sum + item.avgBookingsPerCustomer, 0) / ttmData.length;
    const ttmLTV = ttmAOV * ttmGrossMargin * ttmAvgBookingsPerCustomer;
    const ttmLTVCAC = ttmCAC > 0 ? ttmLTV / ttmCAC : 0;
    const ttmPayback = (ttmAOV * ttmGrossMargin) > 0 ? ttmCAC / (ttmAOV * ttmGrossMargin) : 0;
    const ttmNPS = ttmData.reduce((sum, item) => sum + item.nps, 0) / ttmData.length;
    const ttmReturningRate = ttmData.reduce((sum, item) => sum + item.returningRate, 0) / ttmData.length;
    const ttmMarketingSpend = ttmData.reduce((sum, item) => sum + item.marketingSpend, 0);
    const ttmMarketingEfficiency = ttmMarketingSpend > 0 ? (ttmRevenue / ttmMarketingSpend) * 100 : 0;
    const ttmProperties = ttmData[ttmData.length - 1]?.properties || 0;
    const ttmGMVEU = ttmData.reduce((sum, item) => sum + item.gmvEU, 0) / ttmData.length;
    const ttmServicesRevenuePerBooking = ttmBookings > 0 ? ttmData.reduce((sum, item) => sum + item.revenueServices, 0) / ttmBookings : 0;

    // Previous TTM for YoY
    const prevTTMRevenue = prevTTMData.reduce((sum, item) => sum + item.revenueTotal, 0);
    const prevTTMBookings = prevTTMData.reduce((sum, item) => sum + item.bookings, 0);
    const prevTTMLTV = prevTTMData.length > 0 ? 
      (prevTTMData.reduce((sum, item) => sum + item.avgBookingValue, 0) / prevTTMData.length) *
      (prevTTMData.reduce((sum, item) => sum + item.grossMargin, 0) / prevTTMData.length) *
      (prevTTMData.reduce((sum, item) => sum + item.avgBookingsPerCustomer, 0) / prevTTMData.length) : 0;

    // YoY Growth
    const yoyRevenueGrowth = prevTTMRevenue > 0 ? ((ttmRevenue - prevTTMRevenue) / prevTTMRevenue) * 100 : 0;
    const yoyBookingsGrowth = prevTTMBookings > 0 ? ((ttmBookings - prevTTMBookings) / prevTTMBookings) * 100 : 0;
    const yoyLTVGrowth = prevTTMLTV > 0 ? ((ttmLTV - prevTTMLTV) / prevTTMLTV) * 100 : 0;

    // Yearly totals for charts
    const revenue2023 = data2023.reduce((sum, item) => sum + item.revenueTotal, 0);
    const revenue2024 = data2024.reduce((sum, item) => sum + item.revenueTotal, 0);
    const revenue2025 = data2025.reduce((sum, item) => sum + item.revenueTotal, 0);

    const bookings2023 = data2023.reduce((sum, item) => sum + item.bookings, 0);
    const bookings2024 = data2024.reduce((sum, item) => sum + item.bookings, 0);
    const bookings2025 = data2025.reduce((sum, item) => sum + item.bookings, 0);

    const properties2023 = data2023[data2023.length - 1]?.properties || 0;
    const properties2024 = data2024[data2024.length - 1]?.properties || 0;
    const properties2025 = data2025[data2025.length - 1]?.properties || 0;

    const yearlyGrowthData = [
      { year: '2023', revenue: revenue2023, bookings: bookings2023, properties: properties2023 },
      { year: '2024', revenue: revenue2024, bookings: bookings2024, properties: properties2024 },
      { year: '2025', revenue: revenue2025, bookings: bookings2025, properties: properties2025 },
      { year: 'TTM 2026', revenue: ttmRevenue, bookings: ttmBookings, properties: ttmProperties }
    ];

    return {
      ttmRevenue,
      ttmGMV,
      ttmBookings,
      ttmAOV,
      ttmCAC,
      ttmLTV,
      ttmLTVCAC,
      ttmGrossMargin,
      ttmPayback,
      ttmNPS,
      ttmReturningRate,
      ttmMarketingEfficiency,
      ttmProperties,
      ttmGMVEU,
      ttmServicesRevenuePerBooking,
      yoyRevenueGrowth,
      yoyBookingsGrowth,
      yoyLTVGrowth,
      yearlyGrowthData
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white">
              <img 
                src="/Logo_A_icon.jpg" 
                alt="A.M.A Selections" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">A.M.A Selections</h1>
            <p className="text-slate-600">Investor Pitch</p>
            <p className="text-slate-500 text-sm mt-2">Enter access code</p>
          </div>
          
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Code"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-amber-600 focus:outline-none text-center text-2xl tracking-widest mb-4"
              maxLength="10"
              autoFocus
            />
            
            {pinError && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm text-center">
                Incorrect code. Please try again.
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Access Pitch
            </button>
          </form>
        </div>
      </div>
    );
  }

  const metrics = data ? calculateMetrics() : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/Logo_A_icon.jpg" 
                alt="A.M.A Selections" 
                className="w-12 h-12 object-contain bg-white rounded-full p-1"
              />
              <div>
                <h1 className="text-3xl font-bold">A.M.A Selections</h1>
                <p className="text-amber-100 text-sm">Luxury Villa Rentals | French Riviera & Beyond</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white hover:text-amber-100 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && metrics && (
          <>
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-amber-200">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-slate-900 mb-4">
                  Growing {metrics.yoyRevenueGrowth.toFixed(0)}% YoY
                </h2>
                <div className="flex items-center justify-center gap-8 flex-wrap">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">TTM Revenue</p>
                    <p className="text-3xl font-bold text-amber-600">
                      ${metrics.ttmRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-4xl text-slate-300">•</div>
                  <div>
                    <p className="text-slate-600 text-sm mb-1">LTV/CAC Ratio</p>
                    <p className="text-3xl font-bold text-green-600">
                      {metrics.ttmLTVCAC.toFixed(1)}x
                    </p>
                  </div>
                  <div className="text-4xl text-slate-300">•</div>
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Gross Margin</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {(metrics.ttmGrossMargin * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unit Economics - THE MOST IMPORTANT SECTION */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-slate-900">Unit Economics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                  title="Lifetime Value (LTV)"
                  value={`$${metrics.ttmLTV.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  subtitle="Per customer"
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="green"
                  highlight={true}
                />
                
                <MetricCard
                  title="Customer Acquisition Cost"
                  value={`$${metrics.ttmCAC.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  subtitle="Blended CAC"
                  icon={<Users className="w-6 h-6" />}
                  color="blue"
                />
                
                <MetricCard
                  title="LTV / CAC Ratio"
                  value={`${metrics.ttmLTVCAC.toFixed(2)}x`}
                  subtitle={metrics.ttmLTVCAC >= 3 ? "✅ Excellent (>3.0)" : "Target: >3.0"}
                  icon={<Target className="w-6 h-6" />}
                  color="purple"
                  highlight={metrics.ttmLTVCAC >= 3}
                />
                
                <MetricCard
                  title="Gross Margin"
                  value={`${(metrics.ttmGrossMargin * 100).toFixed(1)}%`}
                  subtitle="Industry leading"
                  icon={<Percent className="w-6 h-6" />}
                  color="orange"
                  highlight={true}
                />
                
                <MetricCard
                  title="Payback Period"
                  value={`${metrics.ttmPayback.toFixed(2)}`}
                  subtitle="Bookings to recover CAC"
                  icon={<Calendar className="w-6 h-6" />}
                  color="indigo"
                />
                
                <MetricCard
                  title="Average Booking Value"
                  value={`$${metrics.ttmAOV.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  subtitle="Premium positioning"
                  icon={<DollarSign className="w-6 h-6" />}
                  color="green"
                />
              </div>
            </div>

            {/* Growth Trajectory */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Growth Trajectory</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Growth</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.yearlyGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                        formatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                      />
                      <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Bookings Growth</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics.yearlyGrowthData}>
                      <defs>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="bookings" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={2} name="Bookings" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Supply Network Growth</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics.yearlyGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="properties" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 6 }} name="Live Properties" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Growth Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-slate-600">Revenue YoY</p>
                        <p className="text-2xl font-bold text-green-600">+{metrics.yoyRevenueGrowth.toFixed(0)}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div>
                        <p className="text-sm text-slate-600">Bookings YoY</p>
                        <p className="text-2xl font-bold text-purple-600">+{metrics.yoyBookingsGrowth.toFixed(0)}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm text-slate-600">LTV YoY</p>
                        <p className="text-2xl font-bold text-blue-600">+{metrics.yoyLTVGrowth.toFixed(0)}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Fit & Traction */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Market Fit & Operational Excellence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="NPS Score"
                  value={metrics.ttmNPS.toFixed(0)}
                  subtitle={metrics.ttmNPS >= 70 ? "World-class (>70)" : "Strong customer love"}
                  icon={<Star className="w-6 h-6" />}
                  color="yellow"
                  highlight={metrics.ttmNPS >= 70}
                />
                
                <MetricCard
                  title="Returning Customer Rate"
                  value={`${(metrics.ttmReturningRate * 100).toFixed(0)}%`}
                  subtitle="Strong retention"
                  icon={<Users className="w-6 h-6" />}
                  color="green"
                />
                
                <MetricCard
                  title="Services Revenue/Booking"
                  value={`$${metrics.ttmServicesRevenuePerBooking.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  subtitle="Upsell/cross-sell success"
                  icon={<ShoppingCart className="w-6 h-6" />}
                  color="purple"
                />
                
                <MetricCard
                  title="Marketing Efficiency"
                  value={`${metrics.ttmMarketingEfficiency.toFixed(0)}%`}
                  subtitle="Revenue / Marketing Spend"
                  icon={<Target className="w-6 h-6" />}
                  color="green"
                  highlight={metrics.ttmMarketingEfficiency >= 200}
                />
              </div>
            </div>

            {/* Geographic & Operational */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Scale & Diversification</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Live Properties"
                  value={metrics.ttmProperties.toFixed(0)}
                  subtitle="Supplier network"
                  icon={<Home className="w-6 h-6" />}
                  color="orange"
                />
                
                <MetricCard
                  title="GMV EU"
                  value={`${metrics.ttmGMVEU.toFixed(0)}%`}
                  subtitle="Core market"
                  icon={<DollarSign className="w-6 h-6" />}
                  color="blue"
                />
                
                <MetricCard
                  title="GMV Outside EU"
                  value={`${(100 - metrics.ttmGMVEU).toFixed(0)}%`}
                  subtitle="Market diversification"
                  icon={<DollarSign className="w-6 h-6" />}
                  color="purple"
                />
              </div>
            </div>

            {/* Footer CTA */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl shadow-lg p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Ready to Join Our Journey?</h3>
              <p className="text-amber-100 mb-6">
                Growing {metrics.yoyRevenueGrowth.toFixed(0)}% YoY with {metrics.ttmLTVCAC.toFixed(1)}x LTV/CAC and {(metrics.ttmGrossMargin * 100).toFixed(0)}% gross margins
              </p>
              <div className="flex gap-4 justify-center flex-wrap text-sm">
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="font-semibold">${metrics.ttmRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-amber-100 text-xs">TTM Revenue</p>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="font-semibold">${metrics.ttmGMV.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                  <p className="text-amber-100 text-xs">TTM GMV</p>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="font-semibold">{metrics.ttmBookings.toLocaleString()}</p>
                  <p className="text-amber-100 text-xs">TTM Bookings</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color, highlight = false }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow ${highlight ? 'ring-2 ring-amber-400' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          {icon}
        </div>
        {highlight && (
          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded">
            Key Metric
          </span>
        )}
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
