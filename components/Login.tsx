import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Logo } from './Logo';

interface LoginProps {
  onLogin: (name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-900 overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="url(#grad1)" />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'rgb(59, 130, 246)', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'rgb(30, 58, 138)', stopOpacity:1}} />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <div className="relative z-10">
          <Logo light className="h-10" />
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Transform PDFs into <span className="text-brand-300">Mastery</span>.
          </h2>
          <p className="text-brand-100 text-lg leading-relaxed mb-8">
            Upload any textbook and QuestLog will instantly generate a structured curriculum with quizzes, flashcards, and interactive lessons.
          </p>
          <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <Sparkles className="w-6 h-6 text-brand-300 mb-2" />
                <p className="font-semibold">AI Powered</p>
                <p className="text-xs text-brand-200">Gemini 2.5 Flash</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div className="font-bold text-xl text-brand-300 mb-1">10x</div>
                <p className="font-semibold">Faster Learning</p>
                <p className="text-xs text-brand-200">Personalized Pace</p>
             </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-brand-300">
          © {new Date().getFullYear()} QuestLog AI. All rights reserved.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="lg:hidden mb-8">
            <Logo className="h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500">Enter your details to access your learning hub.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="group w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-600/40 flex items-center justify-center gap-2"
            >
              Start Learning 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
