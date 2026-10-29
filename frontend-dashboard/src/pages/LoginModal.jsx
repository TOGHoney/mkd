import React, { useState } from 'react';
import { Sparkles, ArrowRight, Lock, Mail, Building, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginModal() {
  const { login, register, demoLogin, error } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      if (isRegister) {
        await register({ email, password, company_name: companyName, name: companyName });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setFormError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-surface-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-card">
        {/* Modal Top */}
        <div className="p-8 pb-6 text-center border-b border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 mx-auto flex items-center justify-center shadow-glow-brand mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isRegister ? 'Create your SuperMemory Account' : 'Welcome to SuperMemory AI'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            Turn your company's scattered knowledge into private, grounded AI memory.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
          {(formError || error) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {formError || error}
            </div>
          )}

          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Company Name</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="w-full glass-input pl-9 pr-3.5 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full glass-input pl-9 pr-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full glass-input pl-9 pr-3.5 py-2.5 rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center justify-center gap-2 transition-all"
          >
            <span>{loading ? 'Authenticating...' : (isRegister ? 'Register Workspace' : 'Sign In')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-surface-900 px-3 text-[11px] text-slate-400 uppercase tracking-wider">or</span>
          </div>

          {/* Quick Demo Access */}
          <button
            type="button"
            onClick={demoLogin}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Launch Instant Demo Workspace</span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;
