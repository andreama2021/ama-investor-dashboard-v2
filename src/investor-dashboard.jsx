import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';

const CONFIG = {
  GOOGLE_SHEETS_API_KEY: 'AIzaSyDIBaFUl9Ah07lz5xvOcBsMcaDnekM8EDM',
  SPREADSHEET_ID: '10Gmt0gVyqNhnRuRsoSPn20OnK6mbnYB3vulS9wWJkEs',
  SHEET_RANGE: 'Sheet1!A1:V1000',
  ACCESS_PIN: '2026'
};

const calculateTrendline = (data, dataKey) => {
  if (!data || data.length === 0) return [];

  const validData = data.filter(item => item[dataKey] !== null && item[dataKey] !== undefined && !isNaN(item[dataKey]));
  const n = validData.length;

  if (n === 0) return data;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  validData.forEach((item, index) => {
    const x = index;
    const y = item[dataKey];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return data.map((item, index) => ({
    ...item,
    [`${dataKey}_trend`]: slope * index + intercept
  }));
};

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
  const [showTrendlines, setShowTrendlines] = useState({
    gmv: false,
    revenue: false,
    properties: false,
    bookings: false,
    ttm: false,
    nps: false,
    cac: false,
    ltv: false
  });

  const toggleTrendline = (chartName) => {
    setShowTrendlines(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = '/Logo_A_icon.jpg';

    if (!document.getElementById('fa-css')) {
      const fa = document.createElement('link');
      fa.id = 'fa-css';
      fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fa);
      const f = document.createElement('link');
      f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(f);
    }

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
      ttmRevenue: parseFloat(row[14]) || 0,
      gmvEU: parseFloat(row[15]) || 0,
      gmvOutsideEU: parseFloat(row[16]) || 0,
      properties: parseInt(row[17]) || 0,
      cac: parseFloat(row[18]) || 0,
      avgBookingsPerCustomer: parseFloat(row[19]) || 0,
      grossMargin: parseFloat(row[20]) || 0,
      npsCount: parseInt(row[21]) || 0
    })).filter(item => item.date);
  };

  const getFilteredData = () => {
    if (!data) return { current: [], previous: [] };

    let startDateStr, endDateStr, prevStartDateStr, prevEndDateStr;

    if (selectedYear === 'lifetime') {
      startDateStr = '2023-01-01';
      endDateStr = '2099-12-31';
      prevStartDateStr = '2022-01-01';
      prevEndDateStr = '2022-12-31';

    } else if (period === 'lastMonth') {
      const yearStr = String(selectedYear);
      const yearData = data.filter(item => item.date.startsWith(yearStr));

      if (yearData.length > 0) {
        const lastDataDate = yearData[yearData.length - 1].date;
        const [year, month] = lastDataDate.split('-');
        startDateStr = `${year}-${month}-01`;
        endDateStr = `${year}-${month}-31`;

        const prevYear = parseInt(year) - 1;
        prevStartDateStr = `${prevYear}-${month}-01`;
        prevEndDateStr = `${prevYear}-${month}-31`;
      }

    } else if (period === 'Q1') {
      startDateStr = `${selectedYear}-01-01`;
      endDateStr = `${selectedYear}-03-31`;
      prevStartDateStr = `${selectedYear - 1}-01-01`;
      prevEndDateStr = `${selectedYear - 1}-03-31`;

    } else if (period === 'Q2') {
      startDateStr = `${selectedYear}-04-01`;
      endDateStr = `${selectedYear}-06-30`;
      prevStartDateStr = `${selectedYear - 1}-04-01`;
      prevEndDateStr = `${selectedYear - 1}-06-30`;

    } else if (period === 'Q3') {
      startDateStr = `${selectedYear}-07-01`;
      endDateStr = `${selectedYear}-09-30`;
      prevStartDateStr = `${selectedYear - 1}-07-01`;
      prevEndDateStr = `${selectedYear - 1}-09-30`;

    } else if (period === 'Q4') {
      startDateStr = `${selectedYear}-10-01`;
      endDateStr = `${selectedYear}-12-31`;
      prevStartDateStr = `${selectedYear - 1}-10-01`;
      prevEndDateStr = `${selectedYear - 1}-12-31`;

    } else if (period === 'fullYear') {
      startDateStr = `${selectedYear}-01-01`;
      endDateStr = `${selectedYear}-12-31`;
      prevStartDateStr = `${selectedYear - 1}-01-01`;
      prevEndDateStr = `${selectedYear - 1}-12-31`;

    } else if (period === 'custom' && customStartDate && customEndDate) {
      startDateStr = customStartDate;
      endDateStr = customEndDate;

      const [cyear, cmonth, cday] = customStartDate.split('-');
      const [eyear, emonth, eday] = customEndDate.split('-');

      const pyear = parseInt(cyear) - 1;
      const peyear = parseInt(eyear) - 1;

      prevStartDateStr = `${pyear}-${cmonth}-${cday}`;
      prevEndDateStr = `${peyear}-${emonth}-${eday}`;
    } else {
      startDateStr = `${selectedYear}-01-01`;
      endDateStr = `${selectedYear}-12-31`;
      prevStartDateStr = `${selectedYear - 1}-01-01`;
      prevEndDateStr = `${selectedYear - 1}-12-31`;
    }

    const current = data.filter(item => item.date >= startDateStr && item.date <= endDateStr);

    // Year-to-date / partial period: if the current range has data only up to a given month
    // (e.g. Jan-Sep 2026), compare against the same months a year earlier (Jan-Sep 2025),
    // not the whole prior range (Jan-Dec 2025).
    if (current.length > 0 && selectedYear !== 'lifetime' && period !== 'custom' && period !== 'lastMonth') {
      const lastMonthWithData = current[current.length - 1].date.slice(5, 7);
      const prevYearOfRange = prevEndDateStr.slice(0, 4);
      const cappedPrevEnd = `${prevYearOfRange}-${lastMonthWithData}-31`;
      if (cappedPrevEnd < prevEndDateStr) prevEndDateStr = cappedPrevEnd;
    }

    const previous = data.filter(item => item.date >= prevStartDateStr && item.date <= prevEndDateStr);

    const currentRevenue = current.reduce((s, i) => s + i.revenueTotal, 0);
    const previousRevenue = previous.reduce((s, i) => s + i.revenueTotal, 0);
    const growthCalc = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    console.log(`\n✅ PERIOD: ${period.toUpperCase()} | YEAR: ${selectedYear}`, {
      current_range: `${startDateStr} → ${endDateStr}`,
      current_count: `${current.length} items`,
      current_revenue: `$${currentRevenue.toLocaleString()}`,
      previous_range: `${prevStartDateStr} → ${prevEndDateStr}`,
      previous_count: `${previous.length} items`,
      previous_revenue: `$${previousRevenue.toLocaleString()}`,
      growth_pct: `${growthCalc.toFixed(2)}%`
    });

    return { current, previous };
  };

  const calculateMetrics = () => {
    const { current, previous } = getFilteredData();

    if (current.length === 0) {
      return {
        totalGMV: 0, totalRevenue: 0, totalBookings: 0, avgBookingValue: 0,
        rentalRevenuePerBooking: 0, servicesRevenuePerBooking: 0, rentalTakeRate: 0,
        servicesTakeRate: 0, currentUsers: 0, avgNPS: 0, totalMarketingSpend: 0,
        marketingEfficiency: 0, currentCash: 0, latestTTM: 0, runway: 0,
        avgGmvEU: 0, avgGmvOutsideEU: 0, currentProperties: 0, avgCAC: 0,
        avgLTV: 0, ltvCacRatio: 0, paybackPeriod: 0, totalNights: 0,
        growth: {}
      };
    }

    const totalGMV = current.reduce((sum, item) => sum + item.gmvTotal, 0);
    const totalGMVRentals = current.reduce((sum, item) => sum + item.gmvRentals, 0);
    const totalGMVServices = current.reduce((sum, item) => sum + item.gmvServices, 0);
    const totalRevenue = current.reduce((sum, item) => sum + item.revenueTotal, 0);
    const totalRevenueRentals = current.reduce((sum, item) => sum + item.revenueRentals, 0);
    const totalRevenueServices = current.reduce((sum, item) => sum + item.revenueServices, 0);
    const totalBookings = current.reduce((sum, item) => sum + item.bookings, 0);
    const totalNights = current.reduce((sum, item) => sum + item.nights, 0);

    const avgBookingValue = totalBookings > 0 ? totalGMV / totalBookings : 0;
    const rentalRevenuePerBooking = totalBookings > 0 ? totalRevenueRentals / totalBookings : 0;
    const servicesRevenuePerBooking = totalBookings > 0 ? totalRevenueServices / totalBookings : 0;
    const rentalTakeRate = totalGMVRentals > 0 ? (totalRevenueRentals / totalGMVRentals) * 100 : 0;
    const servicesTakeRate = totalGMVServices > 0 ? (totalRevenueServices / totalGMVServices) * 100 : 0;

    const currentUsers = current[current.length - 1]?.users || 0;
    const totalNPSResponses = current.reduce((sum, item) => sum + item.npsCount, 0);
    const weightedNPSSum = current.reduce((sum, item) => sum + (item.nps * item.npsCount), 0);
    const avgNPS = totalNPSResponses > 0 ? weightedNPSSum / totalNPSResponses : 0;

    const totalMarketingSpend = current.reduce((sum, item) => sum + item.marketingSpend, 0);
    const marketingEfficiency = totalMarketingSpend > 0 ? (totalRevenue / totalMarketingSpend) * 100 : 0;
    const currentCash = current[current.length - 1]?.cashPosition || 0;
    const latestTTM = current[current.length - 1]?.ttmRevenue || 0;

    const totalGMVEU = current.reduce((sum, item) => sum + (item.gmvTotal * item.gmvEU / 100), 0);
    const avgGmvEU = totalGMV > 0 ? (totalGMVEU / totalGMV) * 100 : 0;
    const avgGmvOutsideEU = 100 - avgGmvEU;

    const currentProperties = current[current.length - 1]?.properties || 0;
    const avgCAC = current.reduce((sum, item) => sum + item.cac, 0) / current.length;
    const avgBookingsPerCustomer = current[current.length - 1]?.avgBookingsPerCustomer || 0;
    const avgGrossMargin = totalRevenue > 0
      ? current.reduce((sum, item) => sum + (item.revenueTotal * item.grossMargin), 0) / totalRevenue
      : 0;

    const avgLTV = avgBookingValue * avgGrossMargin * avgBookingsPerCustomer;
    const ltvCacRatio = avgCAC > 0 ? avgLTV / avgCAC : 0;
    const grossProfitPerBooking = avgBookingValue * avgGrossMargin;
    const paybackPeriod = grossProfitPerBooking > 0 ? avgCAC / grossProfitPerBooking : 0;

    let runway;
    if (current.length > 0) {
      const lastDate = new Date(current[current.length - 1].date);
      const endOfRunway = new Date(2028, 2, 31);
      const monthsDiff = (endOfRunway.getFullYear() - lastDate.getFullYear()) * 12 +
                         (endOfRunway.getMonth() - lastDate.getMonth()) + 1;
      runway = monthsDiff > 0 ? monthsDiff : 0;
    } else {
      runway = 0;
    }

    const prevTotalGMV = previous.reduce((sum, item) => sum + item.gmvTotal, 0);
    const prevTotalRevenue = previous.reduce((sum, item) => sum + item.revenueTotal, 0);
    const prevTotalBookings = previous.reduce((sum, item) => sum + item.bookings, 0);
    const prevTotalNights = previous.reduce((sum, item) => sum + item.nights, 0);
    const prevTotalGMVRentals = previous.reduce((sum, item) => sum + item.gmvRentals, 0);
    const prevTotalGMVServices = previous.reduce((sum, item) => sum + item.gmvServices, 0);
    const prevTotalRevenueRentals = previous.reduce((sum, item) => sum + item.revenueRentals, 0);
    const prevTotalRevenueServices = previous.reduce((sum, item) => sum + item.revenueServices, 0);

    const prevAvgBookingValue = prevTotalBookings > 0 ? prevTotalGMV / prevTotalBookings : 0;
    const prevRentalRevenuePerBooking = prevTotalBookings > 0 ? prevTotalRevenueRentals / prevTotalBookings : 0;
    const prevServicesRevenuePerBooking = prevTotalBookings > 0 ? prevTotalRevenueServices / prevTotalBookings : 0;
    const prevRentalTakeRate = prevTotalGMVRentals > 0 ? (prevTotalRevenueRentals / prevTotalGMVRentals) * 100 : 0;
    const prevServicesTakeRate = prevTotalGMVServices > 0 ? (prevTotalRevenueServices / prevTotalGMVServices) * 100 : 0;

    const prevUsers = previous[previous.length - 1]?.users || 0;
    const prevTotalNPSResponses = previous.reduce((sum, item) => sum + item.npsCount, 0);
    const prevWeightedNPSSum = previous.reduce((sum, item) => sum + (item.nps * item.npsCount), 0);
    const prevAvgNPS = prevTotalNPSResponses > 0 ? prevWeightedNPSSum / prevTotalNPSResponses : 0;

    const prevTotalMarketingSpend = previous.reduce((sum, item) => sum + item.marketingSpend, 0);
    const prevMarketingEfficiency = prevTotalMarketingSpend > 0 ? (prevTotalRevenue / prevTotalMarketingSpend) * 100 : 0;

    const prevTotalGMVEU = previous.length > 0 ? previous.reduce((sum, item) => sum + (item.gmvTotal * item.gmvEU / 100), 0) : 0;
    const prevAvgGmvEU = prevTotalGMV > 0 ? (prevTotalGMVEU / prevTotalGMV) * 100 : 0;
    const prevAvgGmvOutsideEU = 100 - prevAvgGmvEU;

    const prevProperties = previous[previous.length - 1]?.properties || 0;
    const prevAvgCAC = previous.length > 0 ? previous.reduce((sum, item) => sum + item.cac, 0) / previous.length : 0;
    const prevAvgBookingsPerCustomer = previous[previous.length - 1]?.avgBookingsPerCustomer || 0;
    const prevAvgGrossMargin = prevTotalRevenue > 0
      ? previous.reduce((sum, item) => sum + (item.revenueTotal * item.grossMargin), 0) / prevTotalRevenue
      : 0;

    const prevAvgLTV = prevAvgBookingValue * prevAvgGrossMargin * prevAvgBookingsPerCustomer;
    const prevLtvCacRatio = prevAvgCAC > 0 ? prevAvgLTV / prevAvgCAC : 0;
    const prevLatestTTM = previous[previous.length - 1]?.ttmRevenue || 0;
    const prevGrossProfitPerBooking = prevAvgBookingValue * prevAvgGrossMargin;
    const prevPaybackPeriod = prevGrossProfitPerBooking > 0 ? prevAvgCAC / prevGrossProfitPerBooking : 0;

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalGMV, totalRevenue, totalBookings, totalNights, avgBookingValue,
      rentalRevenuePerBooking, servicesRevenuePerBooking, rentalTakeRate,
      servicesTakeRate, currentUsers, avgNPS, totalMarketingSpend, marketingEfficiency,
      currentCash, latestTTM, runway, avgGmvEU, avgGmvOutsideEU, currentProperties,
      avgCAC, avgLTV, ltvCacRatio, paybackPeriod,
      growth: previous.length === 0 ? {} : {
        gmv: calculateGrowth(totalGMV, prevTotalGMV),
        revenue: calculateGrowth(totalRevenue, prevTotalRevenue),
        bookings: calculateGrowth(totalBookings, prevTotalBookings),
        nights: calculateGrowth(totalNights, prevTotalNights),
        avgBookingValue: calculateGrowth(avgBookingValue, prevAvgBookingValue),
        rentalRevenuePerBooking: calculateGrowth(rentalRevenuePerBooking, prevRentalRevenuePerBooking),
        servicesRevenuePerBooking: calculateGrowth(servicesRevenuePerBooking, prevServicesRevenuePerBooking),
        rentalTakeRate: rentalTakeRate - prevRentalTakeRate,
        servicesTakeRate: servicesTakeRate - prevServicesTakeRate,
        users: calculateGrowth(currentUsers, prevUsers),
        nps: calculateGrowth(avgNPS, prevAvgNPS),
        marketingEfficiency: calculateGrowth(marketingEfficiency, prevMarketingEfficiency),
        gmvEU: avgGmvEU - prevAvgGmvEU,
        gmvOutsideEU: avgGmvOutsideEU - prevAvgGmvOutsideEU,
        properties: calculateGrowth(currentProperties, prevProperties),
        cac: calculateGrowth(avgCAC, prevAvgCAC),
        ltv: calculateGrowth(avgLTV, prevAvgLTV),
        ltvCacRatio: calculateGrowth(ltvCacRatio, prevLtvCacRatio),
        ttm: calculateGrowth(latestTTM, prevLatestTTM),
        paybackPeriod: calculateGrowth(paybackPeriod, prevPaybackPeriod)
      }
    };
  };

  const GOLD = '#A28D50';
  const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const card = { background: 'white', border: '1px solid #e5e5e0', borderRadius: 8, padding: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' };
  const tip = { backgroundColor: '#fff', border: '1px solid #e5e5e0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
  const tipLabel = { fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 };
  const tipItem = { fontSize: 12, padding: 0 };
  const money = (v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const compact = (v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: FONT }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e5e0', padding: 40, width: '100%', maxWidth: 448 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img src="/Logo_A_icon.jpg" alt="A.M.A Selections" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 16px', display: 'block' }} />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>A.M.A Selections</h1>
            <p style={{ color: '#6b6b6b', margin: '0 0 8px' }}>Investor Dashboard</p>
            <p style={{ fontSize: 13, color: '#9a9a9a', margin: 0 }}>Enter PIN to access</p>
          </div>
          <form onSubmit={handlePinSubmit}>
            <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Enter PIN" maxLength="6" autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: `2px solid ${GOLD}`, borderRadius: 8, fontSize: 22, textAlign: 'center', letterSpacing: 4, marginBottom: 16, outline: 'none', fontFamily: FONT }} />
            {pinError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, textAlign: 'center' }}>Incorrect PIN. Please try again.</div>}
            <button type="submit" style={{ width: '100%', background: GOLD, color: 'white', fontWeight: 600, padding: '12px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15, fontFamily: FONT }}>Access Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const metrics = data ? calculateMetrics() : null;
  const { current: filteredCurrent } = data ? getFilteredData() : { current: [] };
  // "Last Full Month" is a single row, so charts show every month of the selected year up to it for context
  const chartData = (data && period === 'lastMonth' && selectedYear !== 'lifetime')
    ? data.filter(item => item.date.startsWith(String(selectedYear)))
    : filteredCurrent;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const showDots = chartData.length <= 14;
  const dot = (color) => (showDots ? { r: 3, fill: color, strokeWidth: 0 } : false);
  const fmtAxis = (v) => Math.abs(v) >= 1000000 ? `${+(v / 1000000).toFixed(1)}M` : Math.abs(v) >= 10000 ? `${Math.round(v / 1000)}K` : v;
  const fmtDate = (d) => (d && d.length >= 7) ? `${MONTHS[parseInt(d.slice(5, 7), 10) - 1]} ${d.slice(2, 4)}` : d;
  const gmvTrendData = calculateTrendline(chartData, 'gmvTotal');
  const revenueTrendData = calculateTrendline(chartData, 'revenueTotal');
  const propertiesTrendData = calculateTrendline(chartData, 'properties');
  const bookingsTrendData = calculateTrendline(chartData, 'bookings');
  const ttmTrendData = calculateTrendline(chartData, 'ttmRevenue');
  const npsTrendData = calculateTrendline(chartData, 'nps');
  const cacTrendData = calculateTrendline(chartData, 'cac');
  const chartDataWithLTV = chartData.map(item => ({ ...item, ltv: item.avgBookingValue * item.grossMargin * item.avgBookingsPerCustomer }));
  const ltvTrendData = calculateTrendline(chartDataWithLTV, 'ltv');

  const filterBtn = (active, disabled) => ({
    padding: '8px 14px', background: active ? GOLD : 'transparent', color: active ? 'white' : '#6b6b6b',
    border: `1px solid ${active ? GOLD : '#d9d7ce'}`, borderRadius: 6, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, fontSize: 13, fontWeight: 500, fontFamily: FONT
  });
  const periods = [['lastMonth', 'Last Full Month'], ['Q1', 'Q1'], ['Q2', 'Q2'], ['Q3', 'Q3'], ['Q4', 'Q4'], ['fullYear', 'Full Year'], ['custom', 'Custom Range']];
  const sectionTitle = { fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 16px' };
  const grid = (min) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 16, marginBottom: 32 });

  const ChartCard = ({ title, trendKey, children }) => (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{title}</h4>
        {trendKey && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b6b6b', cursor: 'pointer' }}>
            <input type="checkbox" checked={showTrendlines[trendKey]} onChange={() => toggleTrendline(trendKey)} style={{ accentColor: GOLD }} /> Trendline
          </label>
        )}
      </div>
      <div style={{ height: 320 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT, background: '#f5f5f5', color: '#1a1a1a', minHeight: '100vh' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e5e0', padding: '16px 48px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/Logo_A_icon.jpg" alt="A.M.A Selections" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>A.M.A Selections</h1>
              <p style={{ fontSize: 11, color: '#9a9a9a', margin: '2px 0 0' }}>Investor Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'transparent', color: '#6b6b6b', border: '1px solid #d9d7ce', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: FONT }}>
            <i className="fas fa-arrow-right-from-bracket" style={{ marginRight: 6 }}></i>Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 48px 0' }}>
        <h2 style={{ fontSize: 32, fontWeight: 600, margin: '0 0 32px' }}>Investor Dashboard</h2>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid #e5e5e0', position: 'sticky', top: 73, zIndex: 40, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 48px', display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Select Year</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[2023, 2024, 2025, 2026, 'lifetime'].map(y => (
                <button key={y} onClick={() => setSelectedYear(y)} style={filterBtn(selectedYear === y, false)}>{y === 'lifetime' ? 'Lifetime' : y}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Select Period</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {periods.map(([key, label]) => (
                <button key={key} onClick={() => setPeriod(key)} disabled={selectedYear === 'lifetime'} style={filterBtn(period === key && selectedYear !== 'lifetime', selectedYear === 'lifetime')}>{label}</button>
              ))}
            </div>
            {period === 'custom' && selectedYear !== 'lifetime' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #d9d7ce', borderRadius: 6, fontFamily: FONT }} />
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #d9d7ce', borderRadius: 6, fontFamily: FONT }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 48px' }}>
        {loading && <p>Loading data...</p>}
        {error && <p style={{ color: '#dc2626' }}>Error: {error}</p>}

        {!loading && !error && metrics && (
          <>
            <h3 style={sectionTitle}>Financial Performance</h3>
            <div style={grid(350)}>
              <KPICard title="Total GMV" value={compact(metrics.totalGMV)} growth={metrics.growth.gmv} icon="fa-dollar-sign" />
              <KPICard title="Total Revenue" value={compact(metrics.totalRevenue)} growth={metrics.growth.revenue} icon="fa-dollar-sign" />
              <KPICard title="TTM Revenue" value={compact(metrics.latestTTM)} growth={metrics.growth.ttm} icon="fa-dollar-sign" />
            </div>

            <h3 style={sectionTitle}>Revenue Breakdown</h3>
            <div style={grid(220)}>
              <KPICard title="Avg Booking Value" value={money(metrics.avgBookingValue)} growth={metrics.growth.avgBookingValue} icon="fa-bullseye" />
              <KPICard title="Rental Revenue/Booking" value={money(metrics.rentalRevenuePerBooking)} growth={metrics.growth.rentalRevenuePerBooking} icon="fa-dollar-sign" subtitle="Basic villa bookings" />
              <KPICard title="Services Revenue/Booking" value={money(metrics.servicesRevenuePerBooking)} growth={metrics.growth.servicesRevenuePerBooking} icon="fa-dollar-sign" subtitle="Concierge & add-ons" />
              <KPICard title="Rental Take Rate" value={`${metrics.rentalTakeRate.toFixed(1)}%`} growth={metrics.growth.rentalTakeRate} icon="fa-percent" isPercentage />
              <KPICard title="Services Take Rate" value={`${metrics.servicesTakeRate.toFixed(1)}%`} growth={metrics.growth.servicesTakeRate} icon="fa-percent" isPercentage />
            </div>

            <h3 style={sectionTitle}>Geographic Split</h3>
            <div style={grid(280)}>
              <KPICard title="GMV EU" value={`${metrics.avgGmvEU.toFixed(0)}%`} growth={metrics.growth.gmvEU} icon="fa-dollar-sign" isPercentage />
              <KPICard title="GMV Outside EU" value={`${metrics.avgGmvOutsideEU.toFixed(0)}%`} growth={metrics.growth.gmvOutsideEU} icon="fa-dollar-sign" isPercentage />
              <KPICard title="Live Properties" value={metrics.currentProperties.toLocaleString()} growth={metrics.growth.properties} icon="fa-home" />
            </div>

            <h3 style={sectionTitle}>Operations</h3>
            <div style={grid(240)}>
              <KPICard title="Total Bookings" value={metrics.totalBookings.toLocaleString()} growth={metrics.growth.bookings} icon="fa-shopping-cart" />
              <KPICard title="Nights Booked" value={metrics.totalNights.toLocaleString()} growth={metrics.growth.nights} icon="fa-calendar" />
              <KPICard title="Total Users" value={metrics.currentUsers.toLocaleString()} growth={metrics.growth.users} icon="fa-users" />
              <KPICard title="NPS Score" value={metrics.avgNPS.toFixed(0)} growth={metrics.growth.nps} icon="fa-star" />
            </div>

            <h3 style={sectionTitle}>Marketing &amp; Runway</h3>
            <div style={grid(240)}>
              <KPICard title="Marketing Spend" value={money(metrics.totalMarketingSpend)} growth={null} icon="fa-dollar-sign" />
              <KPICard title="Marketing Efficiency" value={`${metrics.marketingEfficiency.toFixed(0)}%`} growth={metrics.growth.marketingEfficiency} icon="fa-chart-line" subtitle="Revenue / Marketing Spend" />
              <KPICard title="Cash Position" value={money(metrics.currentCash)} growth={null} icon="fa-dollar-sign" />
              <KPICard title="Runway" value={`${metrics.runway.toFixed(0)}m`} growth={null} icon="fa-calendar" subtitle="Until end of March 2028" />
            </div>

            <h3 style={sectionTitle}>CAC &amp; LTV</h3>
            <div style={grid(240)}>
              <KPICard title="Customer Acquisition Cost" value={money(metrics.avgCAC)} growth={metrics.growth.cac} icon="fa-dollar-sign" invertGrowth />
              <KPICard title="Lifetime Value" value={money(metrics.avgLTV)} growth={metrics.growth.ltv} icon="fa-dollar-sign" />
              <KPICard title="LTV / CAC Ratio" value={metrics.ltvCacRatio.toFixed(2)} growth={metrics.growth.ltvCacRatio} icon="fa-bullseye" subtitle="Target: >3.0" />
              <KPICard title="Payback Period" value={`${metrics.paybackPeriod.toFixed(2)} bookings`} growth={metrics.growth.paybackPeriod} icon="fa-calendar" invertGrowth subtitle="Bookings to recover CAC" />
            </div>

            <h3 style={sectionTitle}>Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 16 }}>
              <ChartCard title="GMV Trend" trendKey="gmv">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={gmvTrendData}>
                    <defs><linearGradient id="cGMV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GOLD} stopOpacity={0.3} /><stop offset="95%" stopColor={GOLD} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} formatter={(v) => money(v)} />
                    <Area type="monotone" dataKey="gmvTotal" stroke={GOLD} fill="url(#cGMV)" strokeWidth={2} name="GMV" />
                    {showTrendlines.gmv && <Line type="monotone" dataKey="gmvTotal_trend" stroke="#6f5f33" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Trend" />}
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Revenue Trend" trendKey="revenue">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueTrendData}>
                    <defs><linearGradient id="cRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} formatter={(v) => money(v)} />
                    <Area type="monotone" dataKey="revenueTotal" stroke="#10b981" fill="url(#cRev)" strokeWidth={2} name="Revenue" />
                    {showTrendlines.revenue && <Line type="monotone" dataKey="revenueTotal_trend" stroke="#047857" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Trend" />}
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="GMV: EU vs Outside EU">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} formatter={(v) => `${Number(v).toFixed(0)}%`} /><Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="gmvEU" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={2} name="GMV EU %" />
                    <Area type="monotone" dataKey="gmvOutsideEU" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2} name="GMV Outside EU %" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Properties Trend" trendKey="properties">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={propertiesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} /><Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} />
                    <Line type="monotone" dataKey="properties" stroke="#f97316" strokeWidth={2.5} dot={dot('#f97316')} activeDot={{ r: 5 }} name="Properties" />
                    {showTrendlines.properties && <Line type="monotone" dataKey="properties_trend" stroke="#c2410c" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Trend" />}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Bookings & Users" trendKey="bookings">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bookingsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} />
                    <YAxis yAxisId="left" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} /><YAxis yAxisId="right" orientation="right" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} dot={dot('#8b5cf6')} activeDot={{ r: 5 }} name="Bookings" />
                    {showTrendlines.bookings && <Line yAxisId="left" type="monotone" dataKey="bookings_trend" stroke="#6b21a8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Bookings Trend" />}
                    <Line yAxisId="right" type="monotone" dataKey="users" stroke={GOLD} strokeWidth={2} dot={dot(GOLD)} activeDot={{ r: 5 }} name="Users" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Trailing 12-Month Revenue" trendKey="ttm">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ttmTrendData}>
                    <defs><linearGradient id="cTTM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} formatter={(v) => money(v)} />
                    <Area type="monotone" dataKey="ttmRevenue" stroke="#6366f1" fill="url(#cTTM)" strokeWidth={2} name="TTM Revenue" />
                    {showTrendlines.ttm && <Line type="monotone" dataKey="ttmRevenue_trend" stroke="#4338ca" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Trend" />}
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Marketing Spend vs Revenue">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} formatter={(v) => money(v)} /><Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="marketingSpend" fill="#ef4444" radius={[6, 6, 0, 0]} name="Marketing Spend" />
                    <Bar dataKey="revenueTotal" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="NPS Score Trend" trendKey="nps">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={npsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} domain={[0, 100]} /><Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} />
                    <Line type="monotone" dataKey="nps" stroke="#eab308" strokeWidth={2.5} dot={dot('#eab308')} activeDot={{ r: 5 }} name="NPS Score" />
                    {showTrendlines.nps && <Line type="monotone" dataKey="nps_trend" stroke="#a16207" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Trend" />}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="CAC Trend" trendKey="cac">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cacTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} formatter={(v) => money(v)} />
                    <Line type="monotone" dataKey="cac" stroke="#ef4444" strokeWidth={2.5} dot={dot('#ef4444')} activeDot={{ r: 5 }} name="CAC" />
                    {showTrendlines.cac && <Line type="monotone" dataKey="cac_trend" stroke="#991b1b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Trend" />}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="LTV Trend" trendKey="ltv">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ltvTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eeeeea" /><XAxis dataKey="date" stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} tickFormatter={fmtDate} minTickGap={16} padding={{ left: 8, right: 8 }} /><YAxis stroke="#d9d7ce" tick={{ fontSize: 11, fill: '#9a9a9a' }} tickLine={false} width={52} tickFormatter={fmtAxis} />
                    <Tooltip labelFormatter={fmtDate} labelStyle={tipLabel} itemStyle={tipItem} contentStyle={tip} formatter={(v) => money(v)} />
                    <Line type="monotone" dataKey="ltv" stroke="#10b981" strokeWidth={2.5} dot={dot('#10b981')} activeDot={{ r: 5 }} name="LTV" />
                    {showTrendlines.ltv && <Line type="monotone" dataKey="ltv_trend" stroke="#047857" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Trend" />}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KPICard({ title, value, growth, icon, isPercentage = false, invertGrowth = false, subtitle }) {
  const showGrowth = growth !== null && growth !== undefined && !isNaN(growth);
  const positive = invertGrowth ? growth < 0 : growth >= 0;
  return (
    <div style={{ background: 'white', border: '1px solid #e5e5e0', borderRadius: 8, padding: 22, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, minHeight: 24 }}>
        <i className={`fas ${icon}`} style={{ fontSize: 16, color: '#A28D50', opacity: 0.8 }}></i>
        {showGrowth && (
          <div style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 6,
            color: positive ? '#059669' : '#dc2626', background: positive ? '#f0fdf4' : '#fef2f2', border: `1px solid ${positive ? '#dcfce7' : '#fee2e2'}` }}>
            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}{isPercentage ? 'pp' : '%'}
          </div>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 500, margin: 0 }}>{title}</p>
      <p style={{ fontSize: 27, fontWeight: 700, color: '#1a1a1a', margin: '4px 0 0', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {(showGrowth || subtitle) && <p style={{ fontSize: 12, color: '#9a9a9a', margin: '4px 0 0' }}>{showGrowth ? 'vs same period last year' : subtitle}</p>}
    </div>
  );
}
