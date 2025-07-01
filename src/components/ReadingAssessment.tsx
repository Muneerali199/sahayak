import React, { useState, useRef } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, FileText, TrendingUp } from 'lucide-react';
import { assessmentService } from '../services/geminiService';

interface AssessmentResult {
  id: string;
  studentName: string;
  grade: string;
  text: string;
  duration: number;
  wordsPerMinute: number;
  accuracy: number;
  fluency: number;
  feedback: string[];
  timestamp: Date;
}

export function ReadingAssessment() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedText, setSelectedText] = useState('passage1');
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);

  const intervalRef = useRef<NodeJS.Timeout>();

  const readingTexts = {
    passage1: {
      title: 'The Cat and the Mouse',
      grade: 'Grade 2-3',
      text: `Once upon a time, there lived a clever mouse in a small house. The mouse was very quick and smart. Every day, a big cat would try to catch the mouse, but the mouse always found a way to escape.

One day, the mouse had an idea. "I will tie a bell around the cat's neck," thought the mouse. "Then I will hear the cat coming and can run away quickly."

The mouse was very happy with this plan. But then the mouse realized something important. "Who will tie the bell on the cat?" the mouse wondered. This was not going to be easy after all.

The story teaches us that it is easier to suggest a plan than to carry it out.`,
    },
    passage2: {
      title: 'The Magic Garden',
      grade: 'Grade 3-4',
      text: `In a small village, there was a special garden that bloomed all year round. The flowers in this garden were of every color imaginable - red roses, yellow sunflowers, purple lavender, and white jasmine.

Maya, a young girl from the village, loved to visit this garden every morning. She would water the plants and talk to them softly. The villagers believed that Maya had a magic touch because wherever she went, flowers seemed to grow brighter.

One day, Maya discovered the real secret of the garden. It wasn't magic at all - it was love, care, and patience. She realized that when we take care of something with love, it grows beautifully.

From that day onwards, Maya taught other children in the village how to care for plants, and soon the whole village was full of beautiful gardens.`,
    },
    passage3: {
      title: 'The Honest Woodcutter',
      grade: 'Grade 4-5',
      text: `Deep in the forest lived an honest woodcutter named Ram. Every day, he would go to the forest to cut wood and sell it in the market to support his family. Though he worked hard, he was always content with what he had.

One morning, while cutting wood near a deep pond, Ram's axe slipped from his hands and fell into the water. The pond was so deep that Ram could not see the bottom. He sat by the pond feeling very sad because the axe was his only tool for earning money.

Suddenly, a beautiful fairy appeared from the water holding a golden axe. "Is this your axe?" she asked kindly. Ram looked at the shiny golden axe and shook his head. "No, that is not mine. My axe was made of iron and wood."

The fairy smiled and disappeared. She came back with a silver axe. "Is this yours then?" she asked. Again, Ram said, "No, my axe was not made of silver either."

Finally, the fairy brought his old iron axe. Ram's face lit up with joy. "Yes! That is my axe!" he exclaimed. The fairy was impressed by Ram's honesty. "Because you told the truth, you may keep all three axes," she said.

Ram thanked the fairy and returned home with the three axes. His honesty had been rewarded, and he never had to worry about money again.`,
    },
  };

  const startRecording = () => {
    if (!studentName || !studentGrade) {
      alert('Please enter student name and grade first.');
      return;
    }
    
    setIsRecording(true);
    setRecordingTime(0);
    
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    analyzeRecording();
  };

  const analyzeRecording = async () => {
    setIsAnalyzing(true);
    
    try {
      const currentText = readingTexts[selectedText as keyof typeof readingTexts];
      const wordCount = currentText.text.split(' ').length;
      
      const assessmentData = await assessmentService.generateAssessmentFeedback(
        studentName,
        studentGrade,
        currentText.title,
        recordingTime,
        wordCount
      );
      
      const result: AssessmentResult = {
        id: Date.now().toString(),
        studentName,
        grade: studentGrade,
        text: currentText.title,
        duration: recordingTime,
        wordsPerMinute: assessmentData.wordsPerMinute,
        accuracy: assessmentData.accuracy,
        fluency: assessmentData.fluency,
        feedback: assessmentData.feedback,
        timestamp: new Date(),
      };
      
      setAssessmentResults([result, ...assessmentResults]);
    } catch (error) {
      console.error('Assessment analysis failed:', error);
      alert('Failed to analyze recording. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Reading Fluency Assessment
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered assessment tool with Gemini to evaluate student reading skills
        </p>
      </div>

      {/* Assessment Setup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">New Assessment</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Setup */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <select
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Grade</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reading Passage
              </label>
              <div className="space-y-2">
                {Object.entries(readingTexts).map(([key, passage]) => (
                  <label key={key} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="passage"
                      value={key}
                      checked={selectedText === key}
                      onChange={(e) => setSelectedText(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{passage.title}</div>
                      <div className="text-sm text-gray-600">{passage.grade}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Recording Controls */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!studentName || !studentGrade || isAnalyzing}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <MicOff className="w-5 h-5" />
                    <span>Stop Recording</span>
                  </button>
                )}
                
                {recordingTime > 0 && (
                  <div className="flex items-center space-x-2 text-lg font-mono">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span>{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
              
              {isAnalyzing && (
                <div className="mt-4 text-center">
                  <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="mt-2 text-sm text-gray-600">Analyzing with Gemini AI...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Text Preview */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                {readingTexts[selectedText as keyof typeof readingTexts].title}
              </h3>
              <div className="text-sm text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
                {readingTexts[selectedText as keyof typeof readingTexts].text}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Results */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Assessment Results</h2>
        
        {assessmentResults.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No assessments completed yet. Start your first assessment above!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {assessmentResults.map((result) => (
              <div key={result.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{result.studentName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>{result.grade}</span>
                      <span>•</span>
                      <span>{result.text}</span>
                      <span>•</span>
                      <span>{result.timestamp.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="text-lg font-semibold text-gray-900">{formatTime(result.duration)}</div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{result.wordsPerMinute}</div>
                    <div className="text-sm text-gray-600">Words per Minute</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.accuracy}%</div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{result.fluency}%</div>
                    <div className="text-sm text-gray-600">Fluency</div>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Gemini AI Feedback</span>
                  </h4>
                  <div className="space-y-2">
                    {result.feedback.map((item, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{item}</p>
                      </div>
                    ))}
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