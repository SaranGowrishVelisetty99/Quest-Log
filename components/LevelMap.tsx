import React, { useEffect, useRef } from 'react';
import { CourseModule, AppScreen } from '../types';
import { Star, Lock, Award } from 'lucide-react';

interface LevelMapProps {
  modules: CourseModule[];
  onNavigate: (screen: AppScreen, moduleId?: string) => void;
  showFinalExam: boolean;
}

export const LevelMap: React.FC<LevelMapProps> = ({ modules, onNavigate, showFinalExam }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const NODE_SPACING = 160; 
  const AMPLITUDE = 100;

  useEffect(() => {
    if (containerRef.current) {
        const firstUnfinished = modules.findIndex(m => !m.isCompleted);
        const indexToScroll = firstUnfinished === -1 ? modules.length : firstUnfinished;
        const scrollPos = Math.max(0, (modules.length - indexToScroll) * NODE_SPACING - 300);
        containerRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }
  }, [modules]);

  const getCoordinates = (index: number, total: number) => {
    const totalHeight = (total + 1) * NODE_SPACING;
    const y = totalHeight - (index * NODE_SPACING) - 100;
    const x = (index % 2 === 0 ? -1 : 1) * AMPLITUDE;
    return { x, y };
  };

  const renderPathSegments = () => {
    if (modules.length === 0) return null;

    const segments = [];

    for (let i = 0; i < modules.length - 1; i++) {
        const start = getCoordinates(i, modules.length);
        const end = getCoordinates(i + 1, modules.length);
        
        const cp1y = start.y - (NODE_SPACING / 2);
        const cp2y = end.y + (NODE_SPACING / 2);

        segments.push({
            d: `M ${start.x} ${start.y} C ${start.x} ${cp1y}, ${end.x} ${cp2y}, ${end.x} ${end.y}`,
            isActive: modules[i].isCompleted
        });
    }

    const last = getCoordinates(modules.length - 1, modules.length);
    const finalCoords = { x: 0, y: 60 }; 
    const cp1y = last.y - (NODE_SPACING / 2);
    const cp2y = finalCoords.y + (NODE_SPACING / 2);

    segments.push({
        d: `M ${last.x} ${last.y} C ${last.x} ${cp1y}, ${finalCoords.x} ${cp2y}, ${finalCoords.x} ${finalCoords.y}`,
        isActive: modules[modules.length - 1].isCompleted
    });

    return (
        <svg className="absolute top-0 left-1/2 overflow-visible" style={{ height: (modules.length + 2) * NODE_SPACING, width: 0 }}>
            {segments.map((segment, index) => (
                <g key={index}>
                    <path 
                        d={segment.d} 
                        fill="none" 
                        stroke="#cbd5e1"
                        strokeWidth="6" 
                        strokeLinecap="round"
                        strokeDasharray="0 20"
                        className="opacity-50"
                    />

                    <path 
                        d={segment.d} 
                        fill="none" 
                        stroke="#2563eb"
                        strokeWidth="6" 
                        strokeLinecap="round"
                        strokeDasharray="0 20"
                        className={`transition-all duration-1000 ease-out ${segment.isActive ? 'opacity-100' : 'opacity-0'}`}
                    />
                </g>
            ))}
        </svg>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-[600px] overflow-y-auto overflow-x-hidden bg-brand-50/50 rounded-3xl border border-brand-100 shadow-inner hide-scrollbar p-10">
      <div className="relative flex flex-col items-center min-h-full" style={{ paddingBottom: '100px', height: (modules.length + 2) * NODE_SPACING }}>
        
        <div className="absolute inset-0 w-full pointer-events-none z-0">
           {renderPathSegments()}
        </div>

        {modules.map((module, index) => {
           const coords = getCoordinates(index, modules.length);
           
           const isLocked = index > 0 && !modules[index - 1].isCompleted;
           const isCurrent = !isLocked && !module.isCompleted;

           return (
             <div 
               key={module.id}
               className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-105 z-10"
               style={{ 
                   top: coords.y, 
                   left: `calc(50% + ${coords.x}px)`
               }}
             >
               <button
                 onClick={() => !isLocked && onNavigate(AppScreen.COURSE_VIEW, module.id)}
                 disabled={isLocked}
                 className={`
                    w-20 h-20 md:w-24 md:h-24 rounded-full border-[6px] shadow-[0_8px_0_rgb(0,0,0,0.15)] active:shadow-none active:translate-y-[4px] flex items-center justify-center relative transition-all
                    ${module.isCompleted ? 'bg-emerald-500 border-emerald-600' : isCurrent ? 'bg-brand-500 border-brand-600 animate-bounce-slow' : 'bg-slate-300 border-slate-400 cursor-not-allowed'}
                 `}
               >
                 {module.isCompleted ? (
                    <div className="text-white flex flex-col items-center">
                        <span className="font-bold text-xl leading-none mb-1">{module.score}/5</span>
                        <div className="flex gap-0.5">
                            {[...Array(3)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.round((module.score || 0)/1.7) ? 'fill-yellow-400 text-yellow-400' : 'text-emerald-700/50'}`} />
                            ))}
                        </div>
                    </div>
                 ) : isLocked ? (
                    <Lock className="w-8 h-8 text-slate-500" />
                 ) : (
                    <span className="text-3xl font-black text-white">{index + 1}</span>
                 )}
               </button>
               
               <div className={`absolute top-24 md:top-28 w-40 text-center left-1/2 -translate-x-1/2 text-sm font-bold bg-white/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-200 shadow-sm ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                 {module.title}
               </div>
             </div>
           );
        })}

        <div 
           className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
           style={{ top: 60, left: '50%' }}
        >
            <button
                onClick={() => showFinalExam && onNavigate(AppScreen.COURSE_VIEW, 'final-assessment')}
                disabled={!showFinalExam}
                className={`
                   w-24 h-24 md:w-28 md:h-28 rounded-3xl rotate-45 border-[6px] shadow-[0_10px_0_rgb(0,0,0,0.15)] active:shadow-none active:translate-y-[4px] flex items-center justify-center relative transition-colors
                   ${showFinalExam ? 'bg-purple-600 border-purple-700 hover:bg-purple-500' : 'bg-slate-300 border-slate-400 cursor-not-allowed'}
                `}
            >
                <div className="-rotate-45">
                    <Award className={`w-12 h-12 ${showFinalExam ? 'text-white' : 'text-slate-500'}`} />
                </div>
            </button>
             <div className="absolute top-36 md:top-40 w-48 text-center left-1/2 -translate-x-1/2 text-sm font-bold bg-purple-100 text-purple-900 px-4 py-2 rounded-xl shadow-sm border border-purple-200">
                 Final Assessment
             </div>
        </div>

      </div>
    </div>
  );
};