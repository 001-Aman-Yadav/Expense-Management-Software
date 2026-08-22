import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      if (!stats) setLoading(true);
      const token = localStorage.getItem('token');
      const [statsRes, txRes] = await Promise.all([
        api.get(`/analytics/dashboard?filter=${filter}`),
        api.get('/transactions')
      ]);
      setStats(statsRes.data);
      setTransactions(txRes.data); // Show all transactions
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'INCOME') return <ArrowDownRight className="text-emerald-500" size={20} />;
    if (type === 'EXPENSE') return <ArrowUpRight className="text-rose-500" size={20} />;
    return <Wallet className="text-slate-500" size={20} />;
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="relative inline-block">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block px-6 py-2.5 outline-none cursor-pointer hover:bg-slate-50 shadow-sm text-center min-w-[140px]"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="thisYear">This Year</option>
            <option value="all">All Time</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${(stats?.totalBalance || 0) < 0 ? 'text-rose-500' : (stats?.totalBalance || 0) > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>Total Balance</p>
            <p className={`text-2xl font-bold mt-1 ${(stats?.totalBalance || 0) < 0 ? 'text-rose-600' : (stats?.totalBalance || 0) > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>₹{Number(stats?.totalBalance || 0).toLocaleString()}</p>
          </div>
          <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
            <Wallet size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-emerald-500 text-sm font-medium uppercase tracking-wider mb-1">Total Income</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">₹{Number(stats?.periodIncome || 0).toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
            <ArrowDownRight size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-rose-500 text-sm font-medium uppercase tracking-wider mb-1">Total Expense</p>
            <p className="text-2xl font-bold mt-1 text-rose-600">₹{Number(stats?.periodExpense || 0).toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shadow-inner">
            <ArrowUpRight size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Income vs Expense ({filter})</h2>
          {(stats?.periodIncome > 0 || stats?.periodExpense > 0) ? (
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Income', value: stats.periodIncome || 0 },
                      { name: 'Expense', value: stats.periodExpense || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">
                  ₹{Number((stats.periodIncome || 0) - (stats.periodExpense || 0)).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Balance</span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No data for this period
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex-1">
            {transactions.length === 0 && <div className="text-slate-600 font-medium">No recent transactions</div>}
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      {tx.description}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.paymentMethod === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {tx.paymentMethod === 'ONLINE' ? 'Online' : 'Cash'}
                      </span>
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      {new Date(tx.createdAt || tx.date).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
                <p className={`font-extrabold ${tx.type === 'INCOME' ? 'text-emerald-600' : tx.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-700'}`}>
                  {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}₹{Number(tx.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
