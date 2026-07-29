import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Gamepad2, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refParam = searchParams.get('ref') || '';

  const { loginUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, phone, referralCode: refParam });
      loginUser(res.data.data.user, res.data.data.tokens.accessToken);
      navigate('/profile');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed.');
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
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-black font-black">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white">Create KIYO Account</h1>
            <p className="text-xs text-gray-400">Join Cambodia's premier automated game top-up platform</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block text-gray-300 font-bold">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Gamer"
                className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-300 font-bold">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-[#111625] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-gray-300 font-bold">Phone Number (Optional)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="012345678"
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
              {loading ? 'Creating Account...' : 'Sign Up & Get Started'}
            </button>
          </form>

          <div className="text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
