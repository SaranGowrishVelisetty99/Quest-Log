import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Clock, Award, FileText, Sparkles, BookOpen, 
  Map as MapIcon, LayoutGrid, Loader2, PlayCircle, CheckCircle
} from 'lucide-react';
import { Course, CourseSettings, Pace, FileData, AppScreen } from '../types';
import { generateCourseSyllabus } from '../services/geminiService';
import { Logo } from './Logo';
import { LevelMap } from './LevelMap';

interface DashboardProps {
  user: { name: string; xp: number };
  course: Course | null;
  setCourse: (course: Course) => void;
  onNavigate: (screen: AppScreen, moduleId?: string) => void;
  setPdfFile: (file: FileData) => void;
  pdfFile: FileData | null;
  defaultView?: 'map' | 'grid';
}

const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  course, 
  setCourse, 
  onNavigate,
  setPdfFile,
  pdfFile,
  defaultView = 'grid'
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(defaultView);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<CourseSettings>({
    durationWeeks: 4,
    pace: Pace.MEDIUM,
    dailyHours: 1
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultView) setViewMode(defaultView);
  }, [defaultView]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        setPdfFile({
          base64: base64Data,
          mimeType: file.type || 'application/octet-stream',
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCourse = async () => {
    if (!pdfFile) return;
    
    setIsGenerating(true);
    try {
      const syllabus = await generateCourseSyllabus(pdfFile, settings);
      const newCourse: Course = {
        title: syllabus.title || 'Generated Course',
        overview: syllabus.overview || 'No description available.',
        modules: syllabus.modules || []
      };
      setCourse(newCourse);
      setViewMode('map');
    } catch (err) {
      alert("Failed to generate course. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getProgress = () => {
    if (!course || course.modules.length === 0) return 0;
    const completed = course.modules.filter(m => m.isCompleted).length;
    return Math.round((completed / course.modules.length) * 100);
  };

  const isFinalAssessmentUnlocked = () => {
    if (!course) return false;
    return course.modules.every(m => m.isCompleted);
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-brand-600/5 -skew-y-3 z-0 origin-top-left" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
          <header className="flex justify-between items-center mb-12">
             <Logo className="h-8" />
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                 {user.name.charAt(0)}
               </div>
               <span className="font-medium text-slate-700 hidden sm:block">{user.name}</span>
             </div>
          </header>

          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Let's create your <span className="text-brand-600">Quest</span>.
            </h1>
            <p className="text-lg text-slate-500">
              Upload any file (PDF, Notes, Code) and we'll craft a personalized learning journey just for you.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
            <div className="grid md:grid-cols-12 min-h-[500px]">
              <div className="md:col-span-7 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold shadow-sm">1</div>
                  <h2 className="text-xl font-bold text-slate-800">Source Material</h2>
                </div>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${
                    pdfFile 
                    ? 'border-brand-500 bg-brand-50/50' 
                    : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50 hover:shadow-inner'
                  }`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  {pdfFile ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-brand-100">
                         <FileText className="w-8 h-8 text-brand-600" />
                      </div>
                      <p className="font-bold text-slate-800 text-lg mb-1">{pdfFile.name}</p>
                      <p className="text-sm text-brand-600 font-medium group-hover:underline">Replace File</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-500" />
                      </div>
                      <p className="font-bold text-slate-700 text-lg mb-2">Click to upload file</p>
                      <p className="text-sm text-slate-400">PDFs, Docs, Images, Code...</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-5 bg-slate-50/50 p-8 md:p-12 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold shadow-sm">2</div>
                  <h2 className="text-xl font-bold text-slate-800">Preferences</h2>
                </div>
                <div className="space-y-6 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration</label>
                    <select 
                      value={settings.durationWeeks}
                      onChange={(e) => setSettings({...settings, durationWeeks: Number(e.target.value)})}
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 font-medium"
                    >
                      {[1, 2, 4, 8, 12].map(w => <option key={w} value={w}>{w} Weeks</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pace</label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.values(Pace).map((p) => (
                        <button
                          key={p}
                          onClick={() => setSettings({...settings, pace: p})}
                          className={`px-4 py-3 rounded-xl text-left text-sm font-semibold border transition-all flex items-center justify-between ${
                            settings.pace === p 
                              ? 'bg-white border-brand-500 ring-1 ring-brand-500 text-brand-700 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-brand-300'
                          }`}
                        >
                          {p}
                          {settings.pace === p && <CheckCircle className="w-4 h-4 text-brand-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Study</label>
                    <select 
                       value={settings.dailyHours}
                       onChange={(e) => setSettings({...settings, dailyHours: Number(e.target.value)})}
                       className="w-full p-3.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 font-medium"
                    >
                      {[0.5, 1, 1.5, 2, 3].map(h => <option key={h} value={h}>{h} Hours / Day</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-8">
                  <button
                    onClick={handleCreateCourse}
                    disabled={!pdfFile || isGenerating}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      !pdfFile || isGenerating
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-xl'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Quest
                        <Sparkles className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo className="h-8" />
          <div className="flex items-center gap-4">
             <div className="flex bg-slate-100 rounded-lg p-1 mr-4">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('map')} className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow text-brand-600' : 'text-slate-500'}`}><MapIcon className="w-4 h-4" /></button>
             </div>
             <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
             <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-brand-600 hidden sm:block">{user.xp} XP</span>
               <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                 {user.name.charAt(0)}
               </div>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-600 mb-2 uppercase tracking-wide">
              <BookOpen className="w-4 h-4" /> Current Quest
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{course.title}</h1>
            <p className="text-slate-500 mt-2 max-w-2xl text-lg truncate">{course.overview}</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 min-w-[200px]">
             <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-brand-600 transition-all duration-1000 ease-out" strokeDasharray={`${getProgress()}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-slate-800">{getProgress()}%</div>
             </div>
             <div>
               <p className="text-xs font-bold text-slate-500 uppercase">Total Progress</p>
               <p className="font-semibold text-slate-900">{course.modules.filter(m => m.isCompleted).length} / {course.modules.length} Modules</p>
             </div>
          </div>
        </div>

        {viewMode === 'map' && (
           <LevelMap 
              modules={course.modules} 
              onNavigate={onNavigate} 
              showFinalExam={isFinalAssessmentUnlocked()}
           />
        )}

        {viewMode === 'grid' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.modules.map((module, index) => (
                <div 
                key={module.id}
                onClick={() => onNavigate(AppScreen.COURSE_VIEW, module.id)}
                className={`group relative bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden ${
                    module.isCompleted 
                    ? 'border-emerald-200 shadow-emerald-100/50' 
                    : 'border-slate-200 hover:border-brand-200 shadow-slate-200/50'
                }`}
                >
                {module.isCompleted && (
                    <div className="absolute top-0 right-0 p-3">
                    <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                    </div>
                )}
                
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${module.isCompleted ? 'bg-emerald-500' : 'bg-brand-500'}`} />
                    Module {index + 1}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-brand-600 transition-colors">
                    {module.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">{module.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5" /> {module.estimatedMinutes}m
                    </span>
                    
                    {module.score !== undefined ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Award className="w-4 h-4" /> {module.score}/5
                    </span>
                    ) : (
                    <span className="text-brand-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Start <PlayCircle className="w-4 h-4" />
                    </span>
                    )}
                </div>
                </div>
            ))}

            <div 
                onClick={() => isFinalAssessmentUnlocked() && onNavigate(AppScreen.COURSE_VIEW, 'final-assessment')}
                className={`rounded-2xl p-6 border-2 border-dashed flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden ${
                isFinalAssessmentUnlocked()
                    ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 cursor-pointer hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1'
                    : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
            >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${
                isFinalAssessmentUnlocked() ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-400'
                }`}>
                <Award className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Final Exam</h3>
                <p className="text-slate-500 text-sm mb-4">Prove your mastery</p>
                
                {course.finalAssessment?.isCompleted && (
                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-indigo-100">
                    <span className="font-bold text-indigo-600">{course.finalAssessment.score}/15 Score</span>
                    </div>
                )}
                
                {!isFinalAssessmentUnlocked() && (
                <div className="absolute inset-0 bg-slate-100/10 backdrop-blur-[1px]" />
                )}
            </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;