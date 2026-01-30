import { GoogleGenAI, Type } from "@google/genai";
import { Course, CourseSettings, ModuleContent, QuizQuestion, FileData, ChatMessage } from "../types";

// Ensure API key is present
const apiKey = "AIzaSyCL0g_2GLiSgUrQMc2iFpgDXtIJ6BoK0K4";
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-ts-check' });

const MODEL_NAME = 'gemini-flash-latest'; // High context window for large files

const QUESTLOG_CONTEXT = `
  SYSTEM CONTEXT - APP KNOWLEDGE BASE:
  You are the AI Assistant for "QuestLog", an AI-powered learning platform.
  
  APP OVERVIEW:
  QuestLog converts PDF textbooks, notes, or code files into structured, gamified courses.
  
  KEY FEATURES:
  1. **Dashboard**: 
     - Displays courses in two views: Grid View (cards) and Map View (game-like progression path).
     - Shows XP (Experience Points) and overall progress.
     - Users can upload new files here to generate new "Quests" (courses).
  
  2. **Course Structure**:
     - **Modules**: The course is divided into logical modules based on the uploaded content.
     - **Locking System**: Modules are locked. You must pass the previous module's quiz to unlock the next one.
     - **Final Exam**: A comprehensive 15-question exam unlocked only after completing all modules.
  
  3. **Module Interaction**:
     - **Learn Tab**: Contains AI-generated reading material split into pages.
     - **Flashcards Tab**: 5 active recall cards per module.
     - **Quiz Tab**: 5 multiple-choice questions. 
     - **Passing Criteria**: User needs 60% (3/5) to pass a quiz and unlock the next module.
  
  4. **XP System**:
     - Users earn 500 XP for leveling up (completing a module or exam).
  
  5. **Settings**:
     - Users can define Course Duration (Weeks), Pace (Relaxed/Moderate/Intense), and Daily Study Hours during creation.
  
  YOUR ROLE (GEMINI):
  - You are the primary helper. 
  - Answer questions about the specific course material provided in the context.
  - ALSO answer questions about how to use the app based on the info above.
  - Be helpful, clear, and intelligent.
`;

export const generateCourseSyllabus = async (
  file: FileData,
  settings: CourseSettings
): Promise<Partial<Course>> => {
  try {
    const prompt = `
      You are an expert curriculum designer. 
      Create a structured course syllabus based on the attached file (textbook, notes, or code).
      
      Parameters:
      - Duration: ${settings.durationWeeks} weeks
      - Pace: ${settings.pace}
      - Daily Study Time: ${settings.dailyHours} hours/day
      
      Generate a course title, a brief overview, and a list of modules.
      The modules should logically divide the content to fit the duration and pace.
      Each module MUST have a unique title, a short description, and an estimated completion time in minutes.
      Ensure the module descriptions are detailed enough to delineate specific topics for content generation.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: file.base64,
              mimeType: file.mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            courseTitle: { type: Type.STRING },
            overview: { type: Type.STRING },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedMinutes: { type: Type.NUMBER }
                },
                required: ["title", "description", "estimatedMinutes"]
              }
            }
          },
          required: ["courseTitle", "overview", "modules"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    return {
      title: data.courseTitle,
      overview: data.overview,
      modules: data.modules.map((m: any, index: number) => ({
        ...m,
        id: `module-${index + 1}`,
        isCompleted: false
      }))
    };
  } catch (error) {
    console.error("Error generating syllabus:", error);
    throw error;
  }
};

export const generateModuleContent = async (
  file: FileData,
  moduleTitle: string,
  moduleDescription: string
): Promise<ModuleContent> => {
  try {
    const prompt = `
      You are an expert tutor. Based on the attached file, generate detailed learning content for the module: "${moduleTitle}".
      
      Module Description: ${moduleDescription}
      
      1. **Content Pages**: Split the lesson into 3 to 5 distinct "pages" of content. 
         - **IMPORTANT**: Ensure every page has roughly the **SAME AMOUNT** of text. Balance the content appropriately.
         - Page 1 should be an Introduction/Hook.
         - Middle pages should cover core concepts with examples.
         - Last page should be a Summary/Key Takeaways.
         - **FORMATTING RULES**:
           - Write content in **small, digestible paragraphs**.
           - **STRICTLY NO LISTS**: Do NOT use bullet points or numbered lists. Explain concepts in full sentences/paragraphs.
           - **KEYWORDS**: You MUST **bold** important key words and concepts within the paragraphs (e.g., "**KeyWord**").
           - **ALIGNMENT**: Write suitable content for justified alignment (avoid short choppy lines).
         - **STRICT CLEAN TEXT RULE**: Do NOT use the "*" symbol for lists (only for bolding). Do NOT use "<br>" tags. 
         - **STRICT NO-HEADER RULE**: Do NOT use markdown headers like #, ##, or ###.
         - **STRICT NO-LATEX RULE**: Do NOT use LaTeX formatting (e.g., avoid $d_{nodal}$, \\frac, etc.). 
         - **MATH FORMATTING**: Write equations using standard plain text or Unicode characters (e.g., use "x²" instead of "x^2", "pi" or "π").
         - **STRICT DECORATION RULE**: Do NOT use decorative unicode symbols (like ✨, 🚀, 📚) in the text.
      
      2. **Flashcards**: Generate exactly 5 flashcards designed for active recall.
         - **Front**: Must be a specific, self-contained question or key term.
         - **Back**: Must be the direct, factual answer. 
         - **IMPORTANT**: The answer must contain **ONLY the most important points**. Be concise and dense with information.
         - **NO MARKDOWN IN FLASHCARDS**: Do NOT use "**" or "*" or any markdown formatting in the flashcard front or back text. Keep it plain text.
         
      3. **Quiz**: Generate exactly 5 multiple-choice questions to test understanding.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: file.base64,
              mimeType: file.mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pages: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of text strings, where each string is a page of the lesson."
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING }
                },
                required: ["front", "back"]
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctIndex: { type: Type.INTEGER }
                },
                required: ["question", "options", "correctIndex"]
              }
            }
          },
          required: ["pages", "flashcards", "quiz"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as ModuleContent;
  } catch (error) {
    console.error("Error generating module content:", error);
    throw error;
  }
};

export const generateFinalAssessment = async (
  file: FileData,
  courseTitle: string
): Promise<QuizQuestion[]> => {
  try {
    const prompt = `
      Create a comprehensive final assessment for the course "${courseTitle}" based on the attached file.
      Generate 15 challenging multiple-choice questions that cover the key concepts of the entire material.
      Use plain text for all questions and options. Do not use LaTeX.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: file.base64,
              mimeType: file.mimeType
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctIndex: { type: Type.INTEGER }
                },
                required: ["question", "options", "correctIndex"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    return data.questions;
  } catch (error) {
    console.error("Error generating final assessment:", error);
    throw error;
  }
};

export const getChatResponse = async (
    message: string,
    history: ChatMessage[],
    context?: string
  ): Promise<string> => {
    try {
      // Gemini: Helpful, Intelligent, Q&A focused
      
      const model = 'gemini-3-flash-preview';
      
      const systemInstruction = `
          You are Gemini. A helpful, intelligent, and knowledgeable AI assistant. 
          You answer questions about the course material directly. 
          Keep answers concise and accurate.
          
          ${QUESTLOG_CONTEXT}
          
          Context of current study material:
          ${context || "No specific context provided."}
        `;
  
      const response = await ai.models.generateContent({
        model: model,
        contents: [
            ...history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            })),
            { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });
  
      return response.text || "I couldn't generate a response.";
    } catch (error) {
      console.error("Error in chat:", error);
      return "Sorry, I encountered an error while processing your request.";
    }
  };