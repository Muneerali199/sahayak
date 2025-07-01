import React, { useState } from 'react';
import { Wand2, Download, Palette, Lightbulb, Image } from 'lucide-react';
import { visualAidService } from '../services/geminiService';

interface GeneratedAid {
  id: string;
  prompt: string;
  type: string;
  imageUrl: string;
  description: string;
  timestamp: Date;
}

export function VisualAidDesigner() {
  const [prompt, setPrompt] = useState('');
  const [aidType, setAidType] = useState('diagram');
  const [subject, setSubject] = useState('science');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAids, setGeneratedAids] = useState<GeneratedAid[]>([]);

  const aidTypes = [
    { value: 'diagram', label: 'Scientific Diagram', icon: '🔬' },
    { value: 'illustration', label: 'Educational Illustration', icon: '🎨' },
    { value: 'chart', label: 'Chart/Graph', icon: '📊' },
    { value: 'map', label: 'Concept Map', icon: '🗺️' },
    { value: 'timeline', label: 'Timeline', icon: '⏰' },
    { value: 'flowchart', label: 'Process Flow', icon: '🔄' },
  ];

  const subjects = [
    { value: 'science', label: 'Science', color: 'bg-green-100 text-green-800' },
    { value: 'math', label: 'Mathematics', color: 'bg-blue-100 text-blue-800' },
    { value: 'social', label: 'Social Studies', color: 'bg-purple-100 text-purple-800' },
    { value: 'language', label: 'Language Arts', color: 'bg-orange-100 text-orange-800' },
  ];

  const promptSuggestions = {
    science: [
      'Human digestive system for grade 4',
      'Plant parts and functions diagram',
      'Food chain in forest ecosystem',
      'Water cycle with simple labels',
      'Types of weather conditions',
    ],
    math: [
      'Fraction comparison chart',
      'Multiplication table visual',
      'Geometric shapes and properties',
      'Number line for addition',
      'Clock reading practice chart',
    ],
    social: [
      'Indian map with states',
      'Timeline of Indian freedom struggle',
      'Community helpers chart',
      'Types of transportation',
      'Family tree template',
    ],
    language: [
      'Parts of speech chart',
      'Vowels and consonants diagram',
      'Story sequence template',
      'Rhyming words visualization',
      'Sentence structure diagram',
    ],
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const description = await visualAidService.generateVisualAidDescription(
        prompt,
        aidType,
        subject
      );
      
      const newAid: GeneratedAid = {
        id: Date.now().toString(),
        prompt: prompt,
        type: aidType,
        imageUrl: getRandomImage(),
        description: description,
        timestamp: new Date(),
      };
      
      setGeneratedAids([newAid, ...generatedAids]);
      setPrompt('');
    } catch (error) {
      console.error('Visual aid generation failed:', error);
      alert('Failed to generate visual aid. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getRandomImage = () => {
    const images = [
      'https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg',
      'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg',
      'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg',
      'https://images.pexels.com/photos/301926/pexels-photo-301926.jpeg',
      'https://images.pexels.com/photos/8500457/pexels-photo-8500457.jpeg',
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Visual Aid Designer
        </h1>
        <p className="text-lg text-gray-600">
          Create educational diagrams and visual materials with Gemini AI
        </p>
      </div>

      {/* Generation Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Palette className="w-4 h-4 inline mr-2" />
                Subject Area
              </label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.map((subj) => (
                  <button
                    key={subj.value}
                    onClick={() => setSubject(subj.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      subject === subj.value
                        ? `${subj.color} border-current`
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {subj.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Image className="w-4 h-4 inline mr-2" />
                Visual Aid Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {aidTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setAidType(type.value)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      aidType === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create... (e.g., 'Water cycle diagram for grade 3 students')"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Wand2 className="w-5 h-5" />
              <span>{isGenerating ? 'Generating with Gemini...' : 'Generate Visual Aid'}</span>
            </button>
          </div>

          {/* Right Column - Suggestions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Lightbulb className="w-4 h-4" />
              <span>Suggested Ideas for {subjects.find(s => s.value === subject)?.label}</span>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {promptSuggestions[subject as keyof typeof promptSuggestions]?.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(suggestion)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Aids Gallery */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Generated Visual Aids</h2>
        
        {isGenerating && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <p className="text-gray-600">Creating your visual aid with Gemini AI...</p>
            </div>
          </div>
        )}
        
        {generatedAids.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No visual aids generated yet. Create your first one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedAids.map((aid) => (
              <div key={aid.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow duration-200">
                <div className="aspect-w-16 aspect-h-12 bg-gray-100">
                  <img
                    src={aid.imageUrl}
                    alt={aid.description}
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                      {aid.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {aid.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {aid.prompt}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {aid.description}
                  </p>
                  
                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </button>
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