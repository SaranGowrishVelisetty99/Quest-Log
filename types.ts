
export enum AppScreen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  COURSE_VIEW = 'COURSE_VIEW'
}

export interface User {
  name: string;
  xp: number;
}

export enum Pace {
  SLOW = 'Relaxed',
  MEDIUM = 'Moderate',
  FAST = 'Intense'
}

export interface CourseSettings {
  durationWeeks: number;
  pace: Pace;
  dailyHours: number;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ModuleContent {
  pages: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  isCompleted: boolean;
  score?: number;
  content?: ModuleContent;
}

export interface Course {
  title: string;
  overview: string;
  modules: CourseModule[];
  finalAssessment?: {
    questions: QuizQuestion[];
    isCompleted: boolean;
    score?: number;
  };
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
}


export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}