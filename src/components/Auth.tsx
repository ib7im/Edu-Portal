import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, GraduationCap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 font-serif">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface rounded-[32px] p-8 shadow-xl border border-border"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent text-white rounded-full mb-4 shadow-lg shadow-accent/20">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">EduPortal University</h1>
          <p className="text-text/70 italic">Excellence in Education & Innovation</p>
        </div>

        <div className="space-y-6">
          <div className="bg-bg p-4 rounded-2xl border border-border">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-accent mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-text">Secure Access</h3>
                <p className="text-sm text-text/60">Login with your university Google account to access your dashboard.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm border border-red-500/20">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-accent hover:opacity-90 text-white font-bold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-text/40 uppercase tracking-widest">
            © 2026 EduPortal University Systems
          </p>
        </div>
      </motion.div>
    </div>
  );
}
