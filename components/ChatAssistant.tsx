import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';
import { getChatResponse } from '../services/geminiService';

interface ChatAssistantProps {
  context?: string; // Markdown content of current page/module
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-10);
      const responseText = await getChatResponse(userMsg.text, history, context);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-slate-900 text-white rounded-full shadow-xl hover:bg-slate-800 transition-all hover:scale-110 z-50 flex items-center justify-center group"
      >
        <Bot className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Ask Gemini
        </span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed right-4 z-50 transition-all duration-300 ease-in-out bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden
        ${isMinimized ? 'bottom-4 w-72 h-14 cursor-pointer hover:bg-slate-50' : 'bottom-4 top-24 w-[90vw] md:w-[450px] md:max-h-[75vh]'}
      `}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-900 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
           <Bot className="w-5 h-5" />
           <span className="font-bold text-sm tracking-wide">Gemini Assistant</span>
        </div>
        <div className="flex items-center gap-1">
           <button 
             onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
             className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors"
           >
             {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
             className="p-1.5 hover:bg-red-500/80 rounded-full text-white/80 hover:text-white transition-colors"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-60">
                <Bot className="w-12 h-12" />
                <p className="text-sm font-medium">I'm Gemini. Ask me anything about the app or course!</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-br-sm' 
                      : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                    }
                  `}
                >
                  {msg.role === 'model' ? (
                     <div className="prose prose-sm max-w-none prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-code:text-xs">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span className="text-xs text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="relative flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Gemini a question..."
                className="w-full resize-none max-h-32 min-h-[44px] py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:border-transparent outline-none text-sm bg-slate-50 focus:bg-white custom-scrollbar focus:ring-slate-500"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl flex-shrink-0 transition-all ${
                  !input.trim() || isLoading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 hover:opacity-90 text-white shadow-lg'
                }`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-[10px] text-center mt-2 text-slate-400 flex items-center justify-center gap-1">
               <Sparkles className="w-3 h-3" />
               Powered by Gemini
            </div>
          </div>
        </>
      )}
    </div>
  );
};