import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Gamepad2, LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      loginUser(res.data.data.user, res.data.data.tokens.accessToken);
      navigate('/profile');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 my-12">
        <div className="w-full max-w-md p-8 glass-panel rounded-3xl border border-cyan-500/30 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500 flex items-center justify-center text-black font-black">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">Sign In to KIYO TOPUP</h1>
            <p className="text-xs text-gray-400">Access saved accounts, wallet balance & order history</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block text-gray-300 font-bold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
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
                className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-purple-600 hover:from-cyan-300 hover:to-purple-500 text-black font-extrabold uppercase text-xs rounded-xl shadow-lg glow-cyan transition-all"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-xs text-gray-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-cyan-400 font-bold hover:underline">
              Create Account
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
