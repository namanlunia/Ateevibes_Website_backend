import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@ateevibes.com');
  const [password, setPassword] = useState('AteevibesAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-4 sm:p-6 text-ivory relative overflow-hidden">
      {/* Background atmospheric ambient gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-graphite border border-sandstone/20 rounded-2xl p-8 sm:p-10 shadow-luxury relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img src="/brand/logo.png" alt="Ateevibes" className="h-10 mx-auto mb-3 brightness-110" />
          <h2 className="font-serif text-2xl font-normal text-ivory">Ateevibes Operations Platform</h2>
          <p className="text-xs text-sandstone/70 mt-1 font-sans">
            Authoritative commerce, inventory & fulfilment management
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sandstone mb-1.5">
              Staff Email
            </label>
            <div className="relative flex items-center bg-obsidian border border-sandstone/30 focus-within:border-gold rounded-lg px-3.5 py-2.5 transition-colors">
              <Mail className="w-4 h-4 text-gold mr-2.5 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-sm text-ivory placeholder:text-sandstone/40 focus:outline-none"
                placeholder="staff@ateevibes.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sandstone mb-1.5">
              Password
            </label>
            <div className="relative flex items-center bg-obsidian border border-sandstone/30 focus-within:border-gold rounded-lg px-3.5 py-2.5 transition-colors">
              <Lock className="w-4 h-4 text-gold mr-2.5 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-sm text-ivory placeholder:text-sandstone/40 focus:outline-none"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-sandstone hover:text-gold transition-colors shrink-0 ml-2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-gold py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mt-2 shadow-luxury active:scale-[0.99]"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Operations'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Helper Box */}
        <div className="mt-8 pt-6 border-t border-sandstone/15 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-sandstone/80 bg-obsidian border border-sandstone/20 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>Role-Based Access Control Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
