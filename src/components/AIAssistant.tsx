import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage, UserProfile, Course, Grade, Payment } from '../types';
import { getChatResponse } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  user: UserProfile;
  courses: Course[];
  grades: Grade[];
  payments: Payment[];
  gpa: string;
  pendingFees: number;
}

export default function AIAssistant({ user, courses, grades, payments, gpa, pendingFees }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hello ${user.name.split(' ')[0]}! I'm your EduPortal AI Assistant. How can I help you with your academic journey today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context = `
    Student Name: ${user.name}
    Student ID: ${user.studentId || 'N/A'}
    GPA: ${gpa}
    Pending Fees: KES ${pendingFees.toLocaleString()}
    Enrolled Courses: ${courses.map(c => `${c.name} (${c.code})`).join(', ')}
    Grades: ${grades.map(g => `${courses.find(c => c.id === g.courseId)?.name || 'Unknown'}: ${g.grade}`).join(', ')}
    Recent Payments: ${payments.slice(0, 5).map(p => `${p.description}: KES ${p.amount.toLocaleString()} (${p.status})`).join(', ')}
  `;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await getChatResponse(messages, userMessage, context);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-surface rounded-[32px] sm:rounded-[40px] border border-border shadow-xl overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between bg-accent text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold">Academic Assistant</h3>
            <p className="text-xs opacity-60">Powered by Gemini AI</p>
          </div>
        </div>
        <Sparkles size={20} className="opacity-40" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg/30">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] sm:max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-accent text-white' : 'bg-surface border border-border text-accent'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-accent text-white rounded-tr-none' : 'bg-surface text-text rounded-tl-none border border-border'}`}>
                <div className="markdown-body">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%] flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-surface border border-border text-accent">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-3xl bg-surface border border-border shadow-sm rounded-tl-none">
                <Loader2 size={16} className="animate-spin opacity-40" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-border bg-surface">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask anything about your courses, grades, or campus life..."
            className="w-full pl-6 pr-16 py-4 rounded-full bg-bg border-none focus:ring-2 focus:ring-accent/20 text-sm"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 p-3 bg-accent text-white rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
