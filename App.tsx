import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseView from './components/CourseView';
import { User, Course, AppScreen, FileData } from './types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<FileData | null>(null);
  const [defaultDashboardView, setDefaultDashboardView] = useState<'grid' | 'map'>('grid');

  const handleLogin = (name: string) => {
    setUser({ name, xp: 0 });
    setCurrentScreen(AppScreen.DASHBOARD);
  };

  const handleNavigate = (screen: AppScreen, moduleId?: string) => {
    if (moduleId) setActiveModuleId(moduleId);
    setCurrentScreen(screen);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourse(updatedCourse);
  };

  const handleLevelUp = () => {
    if (user) {
        setUser({ ...user, xp: user.xp + 500 });
    }
    setDefaultDashboardView('map');
    setCurrentScreen(AppScreen.DASHBOARD);
  };

  if (currentScreen === AppScreen.LOGIN) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentScreen === AppScreen.DASHBOARD) {
    if (!user) return null; 
    return (
      <Dashboard 
        user={user} 
        course={course} 
        setCourse={setCourse}
        onNavigate={handleNavigate}
        setPdfFile={setPdfFile}
        pdfFile={pdfFile}
        defaultView={defaultDashboardView}
      />
    );
  }

  if (currentScreen === AppScreen.COURSE_VIEW && course) {
    return (
      <CourseView
        course={course}
        moduleId={activeModuleId}
        pdfFile={pdfFile}
        onUpdateCourse={handleUpdateCourse}
        onBack={() => {
            setDefaultDashboardView('grid');
            setCurrentScreen(AppScreen.DASHBOARD);
        }}
        onLevelUp={handleLevelUp}
      />
    );
  }

  return <div>Error: Unknown State</div>;
}

export default App;