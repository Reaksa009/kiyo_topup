import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    document.body.classList.add('admin-active');
    return () => {
      document.body.classList.remove('admin-active');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/admin/login', { email, password });
      loginAdmin(res.data.data.admin);
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070C] text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 glass-panel rounded-3xl border border-purple-500/30 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black glow-purple">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">ADMIN PORTAL LOGIN</h1>
          <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">KIYO TOPUP Architecture</p>
          <p className="text-[10px] text-gray-500">Protected 15-minute administrator session</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-gray-300 font-bold">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kiyotopup.com"
              className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-gray-300 font-bold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold uppercase text-xs rounded-xl shadow-lg glow-purple transition-all"
          >
            {loading ? 'Authenticating Admin...' : 'Authenticate Admin Session'}
          </button>
        </form>

      </div>
    </div>
  );
};
