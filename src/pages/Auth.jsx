import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, signup, resetPassword, clearError } from '../store/slices/authSlice';
import { Zap, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    setResetSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [mode, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    if (mode === 'login') {
      if (!password) return;
      dispatch(login({ email, password }));
    } else if (mode === 'signup') {
      if (!password) return;
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      dispatch(signup({ email, password }));
    } else if (mode === 'forgot') {
      if (!password) return; // password serves as newPassword
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      const res = await dispatch(resetPassword({ email, newPassword: password }));
      if (!res.error) {
        setResetSuccess(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-gray-100 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Decorative Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]"></div>

      <div className="w-full max-w-md p-8 rounded-3xl glass shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-accent rounded-2xl shadow-lg shadow-accent/30 mb-3 transform hover:scale-105 transition-transform duration-300">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black font-display tracking-tighter italic text-slate-900 dark:text-white">AthleteOS</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1.5 font-medium">
            {mode === 'login' && 'Welcome back, Athlete'}
            {mode === 'signup' && 'Begin your athletic journey'}
            {mode === 'forgot' && 'Reset your athlete credentials'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-50 dark:bg-danger/10 border border-red-200 dark:border-danger/20 text-red-600 dark:text-danger text-sm font-medium animate-in fade-in">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Reset Notification */}
        {resetSuccess && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/20 text-green-600 dark:text-success text-sm font-medium animate-in fade-in">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span>Password reset successfully. You can now log in.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@domain.com"
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/60 rounded-2xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Inputs */}
          {mode !== 'forgot' || !resetSuccess ? (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">
                {mode === 'forgot' ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/60 rounded-2xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ) : null}

          {/* Confirm Password (for Signup/Forgot Mode) */}
          {(mode === 'signup' || (mode === 'forgot' && !resetSuccess)) && (
            <div className="space-y-2 animate-in slide-up duration-200">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider pl-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/60 rounded-2xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Link (Only in login mode) */}
          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs font-bold text-accent hover:text-accent/80 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (mode === 'forgot' && resetSuccess)}
            className="w-full py-4 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-98 transition-all"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && (resetSuccess ? 'Complete' : 'Reset Password')}
                </span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Auth Mode Toggle Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800/60 text-center text-sm font-medium">
          {mode === 'login' && (
            <p className="text-slate-500 dark:text-gray-400">
              New to AthleteOS?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-accent hover:underline font-bold"
              >
                Create an account
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-slate-500 dark:text-gray-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-accent hover:underline font-bold"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p className="text-slate-500 dark:text-gray-400">
              Back to{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-accent hover:underline font-bold"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
