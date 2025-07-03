import React, { useState } from 'react';
import { Wand2, Globe, BookOpen, Clock, Download, ChevronDown } from 'lucide-react';
import { contentService } from '../services/geminiService';

interface GeneratedContent {
  id: string;
  type: string;
  language: string;
  content: string;
  timestamp: Date;
}

export function ContentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('hindi');
  const [contentType, setContentType] = useState('story');
  const [grade, setGrade] = useState('3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);

  const languages = [
    { code: 'hindi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
    { code: 'marathi', name: 'मराठी (Marathi)', flag: '🇮🇳' },
    { code: 'tamil', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'bengali', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
    { code: 'english', name: 'English', flag: '🇬🇧' },
  ];

  const contentTypes = [
    { value: 'story', label: 'Short Story', icon: '📖' },
    { value: 'poem', label: 'Poem', icon: '✍️' },
    { value: 'explanation', label: 'Concept Explanation', icon: '💡' },
    { value: 'activity', label: 'Activity Idea', icon: '🎨' },
    { value: 'quiz', label: 'Quiz Questions', icon: '❓' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const content = await contentService.generateContent(
        prompt,
        contentType,
        selectedLanguage,
        `Grade ${grade}`
      );
      
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: contentType,
        language: selectedLanguage,
        content: content,
        timestamp: new Date(),
      };
      
      setGeneratedContent([newContent, ...generatedContent]);
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-800 mb-4">
          AI Content Generator
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Create culturally relevant, localized educational content in multiple languages
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Globe className="w-5 h-5 inline mr-2 text-indigo-600" />
                Select Language
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 ${
                      selectedLanguage === lang.code
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <BookOpen className="w-5 h-5 inline mr-2 text-indigo-600" />
                Content Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {contentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setContentType(type.value)}
                    className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-200 ${
                      contentType === type.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl mb-2">{type.icon}</span>
                    <span className="text-xs font-medium text-center">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Grade Level
              </label>
              <div className="relative">
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Right Column - Prompt */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a story about friendship and helping others, or explain how plants grow..."
                className="w-full h-40 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
            >
              <Wand2 className="w-6 h-6" />
              <span className="font-medium">
                {isGenerating ? 'Generating with Gemini AI...' : 'Generate Content'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Content History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Generated Content</h2>
          {generatedContent.length > 0 && (
            <span className="text-sm text-gray-500">
              {generatedContent.length} {generatedContent.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        
        {generatedContent.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="mx-auto h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content generated yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter a prompt and select your preferences to create your first educational content
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {generatedContent.map((content) => (
              <div key={content.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                  <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-1.5 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full capitalize">
                      {content.type}
                    </span>
                    <span className="px-4 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {languages.find(l => l.code === content.language)?.name}
                    </span>
                    <span className="flex items-center space-x-2 px-4 py-1.5 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                      <Clock className="w-4 h-4" />
                      <span>{content.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-1.5 bg-white text-indigo-600 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200">
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Export</span>
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-sm md:text-base">
                      {content.content}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}