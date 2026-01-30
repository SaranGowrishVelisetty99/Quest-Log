import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, BookOpen, Layers, CheckSquare, 
  ChevronRight, ChevronLeft, RefreshCw, Loader2, Award, XCircle, RefreshCcw, Sparkles, ArrowRight
} from 'lucide-react';
import { Course, FileData, ModuleContent, QuizQuestion, AppScreen } from '../types';
import { generateModuleContent, generateFinalAssessment } from '../services/geminiService';
import { Logo } from './Logo';

interface CourseViewProps {
  course: Course;
  moduleId: string;
  pdfFile: FileData | null;
  onUpdateCourse: (updatedCourse: Course) => void;
  onBack: () => void;
  onLevelUp: () => void;
}

type Tab = 'learn' | 'flashcards' | 'quiz';

const CourseView: React.FC<CourseViewProps> = ({ 
  course, 
  moduleId, 
  pdfFile, 
  onUpdateCourse, 
  onBack,
  onLevelUp
}) => {
  const isFinalExam = moduleId === 'final-assessment';
  
  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [content, setContent] = useState<ModuleContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(0);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [hasPassed, setHasPassed] = useState(false);

  const currentModule = course.modules.find(m => m.id === moduleId);

  useEffect(() => {
    const loadContent = async () => {
      if (!pdfFile) return;

      setActiveTab(isFinalExam ? 'quiz' : 'learn');
      setQuizAnswers([]);
      setQuizSubmitted(false);
      setHasPassed(false);
      setIsFlipped(false);
      setCurrentCardIndex(0);
      setCurrentPage(0);
      setShowConfetti(false);
      setIsLevelingUp(false);

      if (isFinalExam) {
        if (course.finalAssessment?.questions) return;
        setIsLoading(true);
        try {
          const questions = await generateFinalAssessment(pdfFile, course.title);
          const updatedCourse = { ...course, finalAssessment: { questions, isCompleted: false } };
          onUpdateCourse(updatedCourse);
        } catch (e) {
          console.error(e);
          alert("Failed to load assessment.");
          onBack();
        } finally {
          setIsLoading(false);
        }
        return;
      }

      if (!currentModule) return;
      if (currentModule.content) {
        setContent(currentModule.content);
        return;
      }

      setIsLoading(true);
      try {
        const generatedContent = await generateModuleContent(
          pdfFile, 
          currentModule.title, 
          currentModule.description
        );
        setContent(generatedContent);
        
        const updatedModules = course.modules.map(m => 
          m.id === moduleId ? { ...m, content: generatedContent } : m
        );
        onUpdateCourse({ ...course, modules: updatedModules });
        
      } catch (error) {
        console.error(error);
        alert("Failed to generate content. Please try again.");
        onBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [moduleId]);

  const handleQuizSubmit = () => {
    const questions = isFinalExam ? course.finalAssessment?.questions : content?.quiz;
    if (!questions) return;

    let score = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) score++;
    });

    const passed = score >= Math.ceil(questions.length * 0.6);
    setQuizScore(score);
    setQuizSubmitted(true);
    setHasPassed(passed);

    if (passed) {
      setShowConfetti(true);
      if (isFinalExam) {
        onUpdateCourse({
          ...course,
          finalAssessment: {
            ...course.finalAssessment!,
            isCompleted: true,
            score
          }
        });
      } else {
        const updatedModules = course.modules.map(m => 
          m.id === moduleId ? { ...m, isCompleted: true, score } : m
        );
        onUpdateCourse({ ...course, modules: updatedModules });
      }
    }
  };

  const handleRetryQuiz = () => {
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setHasPassed(false);
    setQuizScore(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLevelUpClick = () => {
    setIsLevelingUp(true);
    setTimeout(() => {
        onLevelUp();
    }, 2500);
  };


  const renderFlashcards = () => {
    if (!content?.flashcards) return null;
    const card = content.flashcards[currentCardIndex];
    
    return (
      <div className="flex flex-col items-center justify-center h-full py-6 md:py-10">
        <div className="w-full max-w-2xl h-96 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ease-in-out ${isFlipped ? 'rotate-y-180' : 'group-hover:scale-[1.02]'}`}>
             
             <div className="absolute w-full h-full bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center justify-between p-8 md:p-12 backface-hidden">
                <div className="w-full flex justify-between items-start">
                    <div className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-brand-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                        Question
                    </div>
                    <div className="text-slate-300">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center w-full my-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-800 text-center leading-snug overflow-y-auto max-h-[14rem] px-2 custom-scrollbar">
                        {card.front.replace(/\*\*/g, '')}
                    </h3>
                </div>
                
                <div className="text-slate-400 text-sm font-medium flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <RefreshCw className="w-4 h-4" /> 
                  <span>Click to reveal answer</span>
                </div>
             </div>
             
             <div className="absolute w-full h-full bg-gradient-to-br from-indigo-600 via-brand-600 to-brand-500 rounded-3xl shadow-2xl shadow-brand-500/30 border border-white/10 flex flex-col items-center justify-center p-8 md:p-12 backface-hidden rotate-y-180 text-white">
                <div className="flex items-center justify-center w-full h-full">
                    <p className="text-lg md:text-2xl text-center font-medium leading-relaxed overflow-y-auto max-h-[14rem] px-2 custom-scrollbar text-white/90">
                        {card.back.replace(/\*\*/g, '')}
                    </p>
                </div>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-8 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200">
          <button 
            disabled={currentCardIndex === 0}
            onClick={(e) => { 
                e.stopPropagation();
                setIsFlipped(false); 
                setTimeout(() => setCurrentCardIndex(p => p - 1), 150); 
            }}
            className="p-3.5 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="px-4 text-center min-w-[100px]">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Card</div>
              <div className="text-xl font-bold text-slate-800 tabular-nums">
                {currentCardIndex + 1} <span className="text-slate-300 mx-1">/</span> {content.flashcards.length}
              </div>
          </div>

          <button 
            disabled={currentCardIndex === content.flashcards.length - 1}
            onClick={(e) => { 
                e.stopPropagation();
                setIsFlipped(false); 
                setTimeout(() => setCurrentCardIndex(p => p + 1), 150); 
            }}
             className="p-3.5 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mt-8">
           <button 
             onClick={() => setActiveTab('quiz')}
             className="group flex items-center gap-2 text-brand-600 font-bold hover:text-brand-700 transition-colors bg-brand-50 px-6 py-3 rounded-xl hover:bg-brand-100"
           >
             Continue to Quiz
             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </div>
    );
  };

  const renderQuiz = (questions?: QuizQuestion[]) => {
    if (!questions) return (
        <div className="text-center py-20 text-slate-500">
            No quiz questions available.
        </div>
    );

    if (quizSubmitted) {
      return (
        <div className="max-w-4xl mx-auto py-10 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-12">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${hasPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {hasPassed ? <Award className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {hasPassed ? "Quiz Passed!" : "Keep Trying!"}
            </h2>
            <p className="text-slate-500 text-lg mb-8">
              You scored <span className="font-bold text-slate-900">{quizScore}/{questions.length}</span>
              {!hasPassed && " - You need 60% to pass."}
            </p>

            <div className="flex justify-center gap-4 flex-col sm:flex-row px-6">
              <button 
                onClick={handleRetryQuiz}
                className="px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCcw className="w-5 h-5" /> Retry Quiz
              </button>
              
              {hasPassed && !isFinalExam && (
                <button 
                  onClick={handleLevelUpClick}
                  className="px-6 py-3.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-500/20"
                >
                  Level Up & Continue <Sparkles className="w-5 h-5" />
                </button>
              )}

              {hasPassed && isFinalExam && (
                  <button 
                    onClick={handleLevelUpClick}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5" /> Claim Reward
                  </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 font-bold text-slate-700">Review Answers</div>
             <div className="divide-y divide-slate-100">
               {questions.map((q, i) => {
                 const isCorrect = quizAnswers[i] === q.correctIndex;
                 const userSelected = quizAnswers[i];
                 return (
                   <div key={i} className="p-6 md:p-8">
                      <div className="flex gap-4">
                        <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                           {i + 1}
                        </div>
                        <div className="flex-1">
                           <p className="font-bold text-slate-900 mb-4">{q.question}</p>
                           <div className="space-y-2 text-sm">
                              <div className={`p-3 rounded-lg border flex items-center justify-between ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                 <span className="font-semibold">Your Answer: {q.options[userSelected]}</span>
                                 {isCorrect ? <CheckSquare className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                              </div>
                              {!isCorrect && (
                                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center justify-between">
                                  <span className="font-semibold">Correct Answer: {q.options[q.correctIndex]}</span>
                                  <CheckSquare className="w-4 h-4"/>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8 pb-24">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="flex gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {qIdx + 1}
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-snug pt-1">
                {q.question}
              </h3>
            </div>

            <div className="space-y-3 pl-0 md:pl-12">
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => {
                    const newAnswers = [...quizAnswers];
                    newAnswers[qIdx] = oIdx;
                    setQuizAnswers(newAnswers);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                    quizAnswers[qIdx] === oIdx
                      ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500 text-brand-900'
                      : 'bg-white border-slate-200 hover:border-brand-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                     quizAnswers[qIdx] === oIdx ? 'border-brand-500' : 'border-slate-300'
                  }`}>
                    {quizAnswers[qIdx] === oIdx && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-slate-200 z-10 md:static md:bg-transparent md:border-0 md:p-0">
           <div className="max-w-3xl mx-auto">
             <button
                disabled={quizAnswers.filter(a => a !== undefined).length !== questions.length}
                onClick={handleQuizSubmit}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
             >
                {quizAnswers.filter(a => a !== undefined).length !== questions.length 
                    ? `Answer all questions (${quizAnswers.filter(a => a !== undefined).length}/${questions.length})` 
                    : "Submit Answers"
                }
             </button>
           </div>
        </div>
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 animate-bounce">
           <Logo className="h-8" />
        </div>
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">
          {isFinalExam ? "Generating Final Exam..." : "Crafting your lesson..."}
        </h2>
        <p className="text-slate-500 mt-2">Consulting the archives...</p>
      </div>
    );
  }

  if (isLevelingUp) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 text-white overflow-hidden animate-in fade-in duration-500">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-800 via-slate-900 to-black opacity-80" />
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500 rounded-full blur-[100px] opacity-40 animate-pulse" />

             <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="mb-6 animate-[bounce_2s_infinite]">
                     <Sparkles className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                 </div>
                 
                 <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-300 animate-[pulse_3s_ease-in-out_infinite] mb-4 drop-shadow-2xl">
                     LEVEL UP!
                 </h1>
                 
                 <div className="text-4xl font-bold text-emerald-400 flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-300">
                    <span>+500 XP</span>
                 </div>
                 
                 <p className="text-slate-400 mt-8 animate-in fade-in duration-1000 delay-700">Returning to Quest Map...</p>
             </div>
        </div>
    );
  }

  const activeQuestions = isFinalExam ? course.finalAssessment?.questions : content?.quiz;
  const pages = content?.pages || ((content as any)?.markdownContent ? [(content as any).markdownContent] : []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <h1 className="font-bold text-slate-800 truncate max-w-md text-lg">
              {isFinalExam ? "Final Course Assessment" : currentModule?.title}
            </h1>
          </div>
          
          {!isFinalExam && (
            <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
              <button 
                onClick={() => setActiveTab('learn')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'learn' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Learn</span>
              </button>
              <button 
                onClick={() => setActiveTab('flashcards')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'flashcards' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Cards</span>
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'quiz' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Quiz</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {activeTab === 'learn' && content && !isFinalExam && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200 prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-brand-600 prose-img:rounded-xl prose-p:text-justify prose-li:text-justify mb-8 min-h-[60vh] text-justify">
              <ReactMarkdown>{pages[currentPage]}</ReactMarkdown>
            </div>
            
            <div className="flex items-center justify-between mt-auto bg-white p-4 rounded-xl shadow-sm border border-slate-100">
               <button 
                 onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                 disabled={currentPage === 0}
                 className="flex items-center gap-2 text-slate-600 hover:text-brand-600 disabled:text-slate-300 font-bold px-4 py-2 rounded-lg hover:bg-slate-50 disabled:hover:bg-transparent transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" /> Previous
               </button>

               <div className="flex gap-2">
                 {pages.map((_, idx) => (
                    <div key={idx} className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentPage ? 'bg-brand-600' : 'bg-slate-200'}`} />
                 ))}
               </div>

               {currentPage < pages.length - 1 ? (
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                   className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-brand-700 transition-all hover:gap-3"
                 >
                   Next Page <ChevronRight className="w-5 h-5" />
                 </button>
               ) : (
                 <button 
                   onClick={() => setActiveTab('flashcards')}
                   className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-brand-700 transition-all hover:gap-3"
                 >
                   Review Cards <Layers className="w-5 h-5" />
                 </button>
               )}
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && !isFinalExam && (
           <div className="h-[600px] animate-in zoom-in-95 duration-300">
             {renderFlashcards()}
           </div>
        )}

        {activeTab === 'quiz' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {renderQuiz(activeQuestions)}
           </div>
        )}
      </main>
    </div>
  );
};

export default CourseView;