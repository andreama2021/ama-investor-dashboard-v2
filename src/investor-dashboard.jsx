import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, ShoppingCart, Star, Target } from 'lucide-react';

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const CONFIG = {
  // Get your API key from: https://console.cloud.google.com/apis/credentials
  GOOGLE_SHEETS_API_KEY: AIzaSyDIBaFUl9Ah07lz5xvOcBsMcaDnekM8EDM,
  
  // Your Google Sheet ID (found in the URL)
  // Example: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
  SPREADSHEET_ID: 10Gmt0gVyqNhnRuRsoSPn20OnK6mbnYB3vulS9wWJkEs,
  
  // The range in your sheet (e.g., 'Sheet1!A1:O100')
  SHEET_RANGE: 'Sheet1!A1:O1000',
  
  // PIN code for access (change this!)
  ACCESS_PIN: '2026'
};

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
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Check if already authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem('dashboard_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data when authenticated
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
    
    // Expected columns: Date, GMV_Total, GMV_Rentals, GMV_Services, Revenue_Total, Revenue_Rentals, Revenue_Services, 
    // Bookings, Nights, Avg_Booking_Value, Users, NPS, Marketing_Spend, Cash_Position, TTM_Revenue
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
    })).filter(item => item.date); // Filter out empty rows
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
        totalGMV: 0,
        totalRevenue: 0,
        totalBookings: 0,
        totalNights: 0,
        avgBookingValue: 0,
        currentUsers: 0,
        avgNPS: 0,
        totalMarketingSpend: 0,
        marketingEfficiency: 0,
        currentCash: 0,
        latestTTM: 0,
        runway: 0,
        growth: {}
      };
    }
    
    // Current period metrics
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
    
    // Calculate runway (months)
    const avgMonthlyBurn = totalMarketingSpend / current.length;
    const avgMonthlyRevenue = totalRevenue / current.length;
    const netBurn = avgMonthlyBurn - avgMonthlyRevenue;
    const runway = netBurn > 0 ? currentCash / netBurn : 999;
    
    // Previous period metrics
    const prevTotalGMV = previous.reduce((sum, item) => sum + item.gmvTotal, 0);
    const prevTotalRevenue = previous.reduce((sum, item) => sum + item.revenueTotal, 0);
    const prevTotalBookings = previous.reduce((sum, item) => sum + item.bookings, 0);
    const prevTotalNights = previous.reduce((sum, item) => sum + item.nights, 0);
    const prevAvgBookingValue = previous.length > 0 ? previous.reduce((sum, item) => sum + item.avgBookingValue, 0) / previous.length : 0;
    const prevUsers = previous[previous.length - 1]?.users || 0;
    const prevAvgNPS = previous.length > 0 ? previous.reduce((sum, item) => sum + item.nps, 0) / previous.length : 0;
    const prevTotalMarketingSpend = previous.reduce((sum, item) => sum + item.marketingSpend, 0);
    const prevMarketingEfficiency = prevTotalMarketingSpend > 0 ? (prevTotalRevenue / prevTotalMarketingSpend) * 100 : 0;
    
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    return {
      totalGMV,
      totalRevenue,
      totalBookings,
      totalNights,
      avgBookingValue,
      currentUsers,
      avgNPS,
      totalMarketingSpend,
      marketingEfficiency,
      currentCash,
      latestTTM,
      runway,
      growth: {
        gmv: calculateGrowth(totalGMV, prevTotalGMV),
        revenue: calculateGrowth(totalRevenue, prevTotalRevenue),
        bookings: calculateGrowth(totalBookings, prevTotalBookings),
        nights: calculateGrowth(totalNights, prevTotalNights),
        avgBookingValue: calculateGrowth(avgBookingValue, prevAvgBookingValue),
        users: calculateGrowth(currentUsers, prevUsers),
        nps: calculateGrowth(avgNPS, prevAvgNPS),
        marketingEfficiency: calculateGrowth(marketingEfficiency, prevMarketingEfficiency)
      }
    };
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">A.M.A Selections</h1>
            <p className="text-slate-600">Investor Dashboard</p>
            <p className="text-slate-500 text-sm mt-2">Enter PIN to access</p>
          </div>
          
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none text-center text-2xl tracking-widest mb-4"
              maxLength="6"
              autoFocus
            />
            
            {pinError && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm text-center">
                Incorrect PIN. Please try again.
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  const metrics = data ? calculateMetrics() : null;
  const { current: chartData } = data ? getFilteredData() : { current: [] };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">A.M.A Selections</h1>
                <p className="text-xs text-slate-500">Investor Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Period Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Time Period</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPeriod('30')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '30' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setPeriod('90')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '90' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last Quarter
            </button>
            <button
              onClick={() => setPeriod('180')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '180' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => setPeriod('365')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === '365' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last Year
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Custom Range
            </button>
          </div>
          
          {period === 'custom' && (
            <div className="flex gap-4 mt-4">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600">Loading data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <p className="text-red-600 text-sm">Please check your Google Sheets configuration in the code.</p>
          </div>
        )}

        {!loading && !error && metrics && (
          <>
            {/* GMV & Revenue Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Financial Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Total GMV"
                  value={`€${(metrics.totalGMV / 1000).toFixed(0)}k`}
                  growth={metrics.growth.gmv}
                  icon={<DollarSign className="w-6 h-6" />}
                  color="blue"
                />
                
                <KPICard
                  title="Total Revenue"
                  value={`€${(metrics.totalRevenue / 1000).toFixed(0)}k`}
                  growth={metrics.growth.revenue}
                  icon={<DollarSign className="w-6 h-6" />}
                  color="green"
                />
                
                <KPICard
                  title="TTM Revenue"
                  value={`€${(metrics.latestTTM / 1000).toFixed(0)}k`}
                  growth={null}
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="purple"
                />
                
                <KPICard
                  title="Avg Booking Value"
                  value={`€${metrics.avgBookingValue.toFixed(0)}`}
                  growth={metrics.growth.avgBookingValue}
                  icon={<Target className="w-6 h-6" />}
                  color="indigo"
                />
              </div>
            </div>

            {/* Operations Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Operations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Total Bookings"
                  value={metrics.totalBookings.toLocaleString()}
                  growth={metrics.growth.bookings}
                  icon={<ShoppingCart className="w-6 h-6" />}
                  color="blue"
                />
                
                <KPICard
                  title="Nights Booked"
                  value={metrics.totalNights.toLocaleString()}
                  growth={metrics.growth.nights}
                  icon={<Calendar className="w-6 h-6" />}
                  color="orange"
                />
                
                <KPICard
                  title="Total Users"
                  value={metrics.currentUsers.toLocaleString()}
                  growth={metrics.growth.users}
                  icon={<Users className="w-6 h-6" />}
                  color="purple"
                />
                
                <KPICard
                  title="NPS Score"
                  value={metrics.avgNPS.toFixed(0)}
                  growth={metrics.growth.nps}
                  icon={<Star className="w-6 h-6" />}
                  color="yellow"
                />
              </div>
            </div>

            {/* Marketing & Finance Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Marketing & Runway</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Marketing Spend"
                  value={`€${(metrics.totalMarketingSpend / 1000).toFixed(0)}k`}
                  growth={null}
                  icon={<Target className="w-6 h-6" />}
                  color="red"
                />
                
                <KPICard
                  title="Marketing Efficiency"
                  value={`${metrics.marketingEfficiency.toFixed(0)}%`}
                  growth={metrics.growth.marketingEfficiency}
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="green"
                  subtitle="Revenue / Marketing Spend"
                />
                
                <KPICard
                  title="Cash Position"
                  value={`€${(metrics.currentCash / 1000).toFixed(0)}k`}
                  growth={null}
                  icon={<DollarSign className="w-6 h-6" />}
                  color="indigo"
                />
                
                <KPICard
                  title="Runway"
                  value={metrics.runway >= 999 ? '∞' : `${metrics.runway.toFixed(1)}m`}
                  growth={null}
                  icon={<Calendar className="w-6 h-6" />}
                  color="blue"
                  subtitle="Months of operation"
                />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* GMV Trend */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">GMV Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                    />
                    <Area type="monotone" dataKey="gmvTotal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGMV)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Trend */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                    />
                    <Area type="monotone" dataKey="revenueTotal" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bookings & Users */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Bookings & Users</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis yAxisId="left" stroke="#64748b" />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} name="Bookings" />
                    <Line yAxisId="right" type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} name="Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* TTM Revenue */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Trailing 12-Month Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTTM" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                    />
                    <Area type="monotone" dataKey="ttmRevenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorTTM)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Marketing vs Revenue */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Marketing Spend vs Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                    />
                    <Legend />
                    <Bar dataKey="marketingSpend" fill="#ef4444" radius={[8, 8, 0, 0]} name="Marketing Spend" />
                    <Bar dataKey="revenueTotal" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* NPS Score Trend */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">NPS Score Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="nps" stroke="#eab308" strokeWidth={3} dot={{ fill: '#eab308', r: 5 }} />
                  </LineChart>
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
function KPICard({ title, value, growth, icon, color, invertGrowth = false, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  const isPositive = invertGrowth ? growth < 0 : growth > 0;
  const showGrowth = growth !== null && growth !== undefined;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          {icon}
        </div>
        {showGrowth && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(growth).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {showGrowth && (
        <p className="text-xs text-slate-500 mt-2">vs previous period</p>
      )}
      {subtitle && !showGrowth && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
