import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", light = false }) => {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-auto aspect-square fill-current" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="100" height="100" rx="24" className={light ? "text-white" : "text-brand-600"} fill="currentColor" />
        <path d="M35 35 V65 H55 C65 65 65 55 65 50 C65 45 65 35 55 35 H35 Z" stroke={light ? "#2563eb" : "white"} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M55 58 L70 70" stroke={light ? "#2563eb" : "white"} strokeWidth="8" strokeLinecap="round" />
      </svg>
      <span className="font-bold tracking-tight text-xl">
        <span className={light ? "text-white" : "text-brand-600 dark:text-brand-400"}>Quest</span>
        <span className={light ? "text-brand-200" : "text-slate-500 dark:text-slate-400"}>Log</span>
      </span>
    </div>
  );
};

export const LogoIcon: React.FC<{ className?: string, light?: boolean }> = ({ className = "w-8 h-8", light = false }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="100" height="100" rx="24" className={light ? "text-white" : "text-brand-600"} fill="currentColor" />
    <path d="M35 35 V65 H55 C65 65 65 55 65 50 C65 45 65 35 55 35 H35 Z" stroke={light ? "#2563eb" : "white"} strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M55 58 L70 70" stroke={light ? "#2563eb" : "white"} strokeWidth="10" strokeLinecap="round" />
  </svg>
);