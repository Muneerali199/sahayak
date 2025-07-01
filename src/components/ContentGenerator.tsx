import React, { useState } from 'react';
import { Wand2, Globe, BookOpen, Clock, Download } from 'lucide-react';
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
    { value: 'story', label: 'Short Story', icon: '📚' },
    { value: 'poem', label: 'Poem', icon: '✨' },
    { value: 'explanation', label: 'Concept Explanation', icon: '💡' },
    { value: 'activity', label: 'Activity Idea', icon: '🎯' },
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AI Content Generator
        </h1>
        <p className="text-lg text-gray-600">
          Create culturally relevant, localized educational content in multiple languages
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Select Language
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200 ${
                      selectedLanguage === lang.code
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-2" />
                Content Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {contentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setContentType(type.value)}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
                      contentType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl mb-1">{type.icon}</span>
                    <span className="text-xs font-medium text-center">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
              </select>
            </div>
          </div>

          {/* Right Column - Prompt */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a story about friendship and helping others, or explain how plants grow..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Wand2 className="w-5 h-5" />
              <span>{isGenerating ? 'Generating with Gemini AI...' : 'Generate Content'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Content History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Generated Content</h2>
        
        {generatedContent.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No content generated yet. Create your first piece above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {generatedContent.map((content) => (
              <div key={content.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                      {content.type}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {languages.find(l => l.code === content.language)?.name}
                    </span>
                    <span className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{content.timestamp.toLocaleTimeString()}</span>
                    </span>
                  </div>
                  <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export</span>
                  </button>
                </div>
                
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-900 leading-relaxed">
                    {content.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}