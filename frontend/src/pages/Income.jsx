import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, ArrowDownRight } from 'lucide-react';

export default function Income() {
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'INCOME', paymentMethod: 'ONLINE' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.filter(tx => tx.type === 'INCOME'));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`http://localhost:5000/api/transactions/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/transactions', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'INCOME', paymentMethod: 'ONLINE' });
      setEditingId(null);
      setShowForm(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (tx) => {
    setFormData({ amount: tx.amount, description: tx.description, date: new Date(tx.date).toISOString().split('T')[0], type: 'INCOME', paymentMethod: tx.paymentMethod || 'CASH' });
    setEditingId(tx.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income entry?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const totalIncome = transactions.reduce((acc, tx) => acc + Number(tx.amount), 0);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading income data...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Income</h1>
          <p className="text-slate-500 mt-1">Add and track your daily income</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Income</p>
            <p className="text-3xl font-bold text-emerald-600">₹{totalIncome.toLocaleString()}</p>
          </div>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'INCOME' });
              setShowForm(!showForm);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} /> Add Income
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit' : 'New'} Income Entry</h2>
            <button onClick={() => {setShowForm(false); setEditingId(null);}} className="text-slate-400 hover:text-slate-600">Close</button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. 2000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source / Description</label>
              <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g. Salary, Sold Item" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
              <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-4 py-2 border rounded-lg bg-white">
                <option value="ONLINE">Online (Bank/UPI)</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end items-end">
              <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-indigo-700">Save Income</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search income..." 
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
            />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-sm font-bold text-slate-700 uppercase tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4">Mode</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transactions.length === 0 && (
              <tr><td colSpan="5" className="p-4 text-center text-slate-600 font-medium">No income records found</td></tr>
            )}
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-slate-100 transition-colors group">
                <td className="p-4 text-sm font-semibold text-slate-700">{new Date(tx.date).toLocaleDateString()}</td>
                <td className="p-4 text-sm font-bold text-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <ArrowDownRight className="text-emerald-600" size={18} strokeWidth={2.5} />
                    </div>
                    {tx.description}
                  </div>
                </td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${tx.paymentMethod === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {tx.paymentMethod === 'ONLINE' ? 'Online' : 'Cash'}
                  </span>
                </td>
                <td className="p-4 text-sm font-extrabold text-emerald-600">
                  +₹{Number(tx.amount).toLocaleString()}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 transition-opacity">
                    <button onClick={() => handleEdit(tx)} className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors">
                      <Edit2 size={18} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => handleDelete(tx.id)} className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors">
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
