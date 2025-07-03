import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Volume2, Globe, ChevronDown } from 'lucide-react';
import { chatService } from '../services/geminiService';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  language: string;
  timestamp: Date;
}

export function AskAnythingBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'नमस्ते! मैं आपका AI शिक्षण सहायक हूँ। आप मुझसे कोई भी प्रश्न पूछ सकते हैं। मैं इसे सरल भाषा में समझाऊंगा।',
      language: 'hindi',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('hindi');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'hindi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'english', name: 'English', flag: '🇬🇧' },
    { code: 'marathi', name: 'मराठी', flag: '🇮🇳' },
    { code: 'tamil', name: 'தமிழ்', flag: '🇮🇳' },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      language: selectedLanguage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await chatService.generateResponse(inputMessage, selectedLanguage);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response,
        language: selectedLanguage,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat response failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        language: selectedLanguage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'hindi' ? 'hi-IN' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Ask Anything Bot</h1>
            <p className="text-indigo-100">Your AI teaching assistant powered by Gemini</p>
          </div>
          
          <div className="relative">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <Globe className="w-4 h-4 text-white" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="appearance-none bg-transparent text-white text-sm focus:outline-none pr-6"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-gray-900">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-white absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.type === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
              message.type === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            }`}>
              {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`max-w-[80%] ${
              message.type === 'user' ? 'text-right' : ''
            }`}>
              <div className={`inline-block p-4 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white shadow-indigo-100 shadow-md'
                  : 'bg-gray-50 text-gray-800 border border-gray-100 shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
              </div>
              
              <div className={`flex items-center mt-2 text-xs ${
                message.type === 'user' ? 'justify-end text-indigo-400' : 'justify-start text-gray-400'
              }`}>
                <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {message.type === 'bot' && (
                  <button
                    onClick={() => speakMessage(message.content)}
                    className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    title="Listen to message"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-6 rounded-b-2xl shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... (e.g., Why does it rain? How do plants grow?)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none pr-12"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!inputMessage.trim() || isTyping}
              className={`absolute right-3 bottom-3 p-2 rounded-full ${
                inputMessage.trim() 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-200 text-gray-400'
              } transition-colors duration-200`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Quick Questions */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">TRY THESE QUESTIONS:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Why does it rain?',
              'How do plants grow?',
              'What makes day and night?',
              'Why is the sky blue?'
            ].map((question) => (
              <button
                key={question}
                onClick={() => setInputMessage(question)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors duration-200"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}