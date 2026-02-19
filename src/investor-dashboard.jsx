import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, ShoppingCart, Star, Target } from 'lucide-react';
 
// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const CONFIG = {
  GOOGLE_SHEETS_API_KEY: 'AIzaSyDIBaFUl9Ah07lz5xvOcBsMcaDnekM8EDM',
  SPREADSHEET_ID: '10Gmt0gVyqNhnRuRsoSPn20OnK6mbnYB3vulS9wWJkEs',
  SHEET_RANGE: 'Sheet1!A1:O1000',
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
  const [period, setPeriod] = useState('lastMonth');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
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
      ttmRevenue: parseFloat(row[14]) || 0
    })).filter(item => item.date);
  };

  const getFilteredData = () => {
    if (!data) return { current: [], previous: [] };
    
    let startDate, endDate, prevStartDate, prevEndDate;
    
    if (period === 'lastMonth') {
      const today = new Date();
      const isCurrentYear = selectedYear === today.getFullYear();
      
      if (isCurrentYear) {
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(firstDayThisMonth.getTime() - 1);
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      } else {
        // December of selected year
        startDate = new Date(selectedYear, 11, 1);
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      }
      
      prevStartDate = new Date(startDate.getFullYear() - 1, startDate.getMonth(), 1);
      prevEndDate = new Date(prevStartDate.getFullYear(), prevStartDate.getMonth() + 1, 0, 23, 59, 59);
      
    } else if (period === 'Q1') {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 2, 31, 23, 59, 59);
      prevStartDate = new Date(selectedYear - 1, 0, 1);
      prevEndDate = new Date(selectedYear - 1, 2, 31, 23, 59, 59);
      
    } else if (period === 'Q2') {
      startDate = new Date(selectedYear, 3, 1);
      endDate = new Date(selectedYear, 5, 30, 23, 59, 59);
      prevStartDate = new Date(selectedYear - 1, 3, 1);
      prevEndDate = new Date(selectedYear - 1, 5, 30, 23, 59, 59);
      
    } else if (period === 'Q3') {
      startDate = new Date(selectedYear, 6, 1);
      endDate = new Date(selectedYear, 8, 30, 23, 59, 59);
      prevStartDate = new Date(selectedYear - 1, 6, 1);
      prevEndDate = new Date(selectedYear - 1, 8, 30, 23, 59, 59);
      
    } else if (period === 'Q4') {
      startDate = new Date(selectedYear, 9, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      prevStartDate = new Date(selectedYear - 1, 9, 1);
      prevEndDate = new Date(selectedYear - 1, 11, 31, 23, 59, 59);
      
    } else if (period === 'fullYear') {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      prevStartDate = new Date(selectedYear - 1, 0, 1);
      prevEndDate = new Date(selectedYear - 1, 11, 31, 23, 59, 59);
      
    } else if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(startDate.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
      prevEndDate = new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    } else {
      startDate = new Date();
      endDate = new Date();
      prevStartDate = new Date();
      prevEndDate = new Date();
    }
    
    const current = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
    
    const previous = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= prevStartDate && itemDate <= prevEndDate;
    });
    
    // Debug logging
    console.log('Filter Debug:', {
      period,
      selectedYear,
      currentRange: { 
        start: startDate.toISOString().split('T')[0], 
        end: endDate.toISOString().split('T')[0] 
      },
      previousRange: { 
        start: prevStartDate.toISOString().split('T')[0], 
        end: prevEndDate.toISOString().split('T')[0] 
      },
      currentCount: current.length,
      previousCount: previous.length,
      currentDates: current.map(d => d.date),
      previousDates: previous.map(d => d.date)
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
    
    const avgMonthlyRevenue = totalRevenue / current.length;
    const avgMonthlyMarketing = totalMarketingSpend / current.length;
    const netBurn = avgMonthlyMarketing - avgMonthlyRevenue;
    const runway = netBurn > 0 ? currentCash / netBurn : 999;
    
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
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-white">
              <img 
                src="/Logo_A_icon.jpg" 
                alt="A.M.A Selections" 
                className="w-14 h-14 object-contain"
              />
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
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-amber-600 focus:outline-none text-center text-2xl tracking-widest mb-4"
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
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-colors"
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
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/Logo_A_icon.jpg" 
                alt="A.M.A Selections" 
                className="w-10 h-10 object-contain"
              />
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
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Time Period</h2>
          </div>
          
          <div className="mb-3">
            <p className="text-sm text-slate-600 mb-2">Select Year</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedYear(2024)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedYear === 2024 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2024
              </button>
              <button
                onClick={() => setSelectedYear(2025)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedYear === 2025 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2025
              </button>
              <button
                onClick={() => setSelectedYear(2026)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedYear === 2026 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2026
              </button>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-slate-600 mb-2">Select Period</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPeriod('lastMonth')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'lastMonth' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Last Full Month
              </button>
              <button
                onClick={() => setPeriod('Q1')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'Q1' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Q1
              </button>
              <button
                onClick={() => setPeriod('Q2')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'Q2' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Q2
              </button>
              <button
                onClick={() => setPeriod('Q3')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'Q3' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Q3
              </button>
              <button
                onClick={() => setPeriod('Q4')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'Q4' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Q4
              </button>
              <button
                onClick={() => setPeriod('fullYear')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'fullYear' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Full Year
              </button>
              <button
                onClick={() => setPeriod('custom')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === 'custom' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>
          
          {period === 'custom' && (
            <div className="flex gap-4 mt-4">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:border-amber-600 focus:outline-none"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:border-amber-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
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
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Financial Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Total GMV"
                  value={`$${metrics.totalGMV.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  growth={metrics.growth.gmv}
                  icon={<DollarSign className="w-6 h-6" />}
                  color="blue"
                />
                
                <KPICard
                  title="Total Revenue"
                  value={`$${metrics.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  growth={metrics.growth.revenue}
                  icon={<DollarSign className="w-6 h-6" />}
                  color="green"
                />
                
                <KPICard
                  title="TTM Revenue"
                  value={`$${metrics.latestTTM.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  growth={null}
                  icon={<TrendingUp className="w-6 h-6" />}
                  color="purple"
                />
                
                <KPICard
                  title="Avg Booking Value"
                  value={`$${metrics.avgBookingValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                  growth={metrics.growth.avgBookingValue}
                  icon={<Target className="w-6 h-6" />}
                  color="indigo"
                />
              </div>
            </div>

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

            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Marketing & Runway</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                  title="Marketing Spend"
                  value={`$${metrics.totalMarketingSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
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
                  value={`$${metrics.currentCash.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                      formatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    />
                    <Area type="monotone" dataKey="gmvTotal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGMV)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

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
                      formatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    />
                    <Area type="monotone" dataKey="revenueTotal" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

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
                      formatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    />
                    <Area type="monotone" dataKey="ttmRevenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorTTM)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Marketing Spend vs Revenue</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      formatter={(value) => `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    />
                    <Legend />
                    <Bar dataKey="marketingSpend" fill="#ef4444" radius={[8, 8, 0, 0]} name="Marketing Spend" />
                    <Bar dataKey="revenueTotal" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

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
        <p className="text-xs text-slate-500 mt-2">vs same period last year</p>
      )}
      {subtitle && !showGrowth && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}
