import React, { useState } from 'react';
import { Calendar, Plus, Clock, BookOpen, Target, Users, Wand2, ChevronLeft, ChevronRight, Download, ChevronDown } from 'lucide-react';
import { lessonPlanService } from '../services/geminiService';

interface LessonPlan {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  duration: number;
  objectives: string[];
  activities: string[];
  materials: string[];
  assessment: string;
  homework: string;
  date: Date;
}

export function LessonPlanner() {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);

  const [newPlan, setNewPlan] = useState({
    subject: '',
    grade: '',
    topic: '',
    duration: 45,
    curriculum: '',
  });

  const subjects = ['Mathematics', 'Science', 'Hindi', 'English', 'Social Studies'];
  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

  const generateLessonPlan = async () => {
    if (!newPlan.subject || !newPlan.grade || !newPlan.topic) return;
    
    setIsGenerating(true);
    
    try {
      const planData = await lessonPlanService.generateLessonPlan(
        newPlan.subject,
        newPlan.grade,
        newPlan.topic,
        newPlan.duration,
        newPlan.curriculum
      );
      
      const generatedPlan: LessonPlan = {
        id: Date.now().toString(),
        subject: newPlan.subject,
        grade: newPlan.grade,
        topic: newPlan.topic,
        duration: newPlan.duration,
        objectives: planData.objectives,
        activities: planData.activities,
        materials: planData.materials,
        assessment: planData.assessment,
        homework: planData.homework,
        date: new Date(),
      };
      
      setLessonPlans([generatedPlan, ...lessonPlans]);
      setShowCreateForm(false);
      setNewPlan({ subject: '', grade: '', topic: '', duration: 45, curriculum: '' });
    } catch (error) {
      console.error('Lesson plan generation failed:', error);
      alert('Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getDayLessons = (date: Date) => {
    return lessonPlans.filter(plan => 
      plan.date.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">
            AI Lesson Planner
          </h1>
          <p className="text-lg text-gray-600">
            Generate comprehensive lesson plans automatically with Gemini AI
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors duration-200 shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create Lesson Plan</span>
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Generate New Lesson Plan
                </h3>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <div className="relative">
                        <select
                          value={newPlan.subject}
                          onChange={(e) => setNewPlan({ ...newPlan, subject: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade
                      </label>
                      <div className="relative">
                        <select
                          value={newPlan.grade}
                          onChange={(e) => setNewPlan({ ...newPlan, grade: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                          <option value="">Select Grade</option>
                          {grades.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic/Chapter
                    </label>
                    <input
                      type="text"
                      value={newPlan.topic}
                      onChange={(e) => setNewPlan({ ...newPlan, topic: e.target.value })}
                      placeholder="e.g., Fractions, Water Cycle, Adjectives"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan({ ...newPlan, duration: parseInt(e.target.value) })}
                      min="30"
                      max="90"
                      step="15"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Curriculum Context (Optional)
                    </label>
                    <textarea
                      value={newPlan.curriculum}
                      onChange={(e) => setNewPlan({ ...newPlan, curriculum: e.target.value })}
                      placeholder="Additional context about curriculum requirements, learning standards, etc."
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={generateLessonPlan}
                  disabled={!newPlan.subject || !newPlan.grade || !newPlan.topic || isGenerating}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 shadow-md"
                >
                  <Wand2 className="w-5 h-5" />
                  <span className="font-medium">
                    {isGenerating ? 'Generating with Gemini...' : 'Generate Plan'}
                  </span>
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Calendar View */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Weekly Overview</h2>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <button
              onClick={() => {
                const prevWeek = new Date(selectedWeek);
                prevWeek.setDate(selectedWeek.getDate() - 7);
                setSelectedWeek(prevWeek);
              }}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-gray-900">
              {selectedWeek.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <button
              onClick={() => {
                const nextWeek = new Date(selectedWeek);
                nextWeek.setDate(selectedWeek.getDate() + 7);
                setSelectedWeek(nextWeek);
              }}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 px-3 py-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          
          {getWeekDays(selectedWeek).map((date) => {
            const dayLessons = getDayLessons(date);
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <div 
                key={date.toISOString()} 
                className={`bg-white min-h-32 p-3 ${isToday ? 'border-t-2 border-indigo-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'text-indigo-600 font-semibold' : 'text-gray-900'
                }`}>
                  {date.getDate()}
                </div>
                <div className="space-y-2">
                  {dayLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="text-xs p-2 bg-indigo-50 text-indigo-800 rounded-lg border-l-4 border-indigo-500 hover:bg-indigo-100 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="font-medium truncate">{lesson.subject}</div>
                      <div className="truncate">{lesson.topic}</div>
                      <div className="flex items-center space-x-1 mt-1 text-indigo-600">
                        <Clock className="w-3 h-3" />
                        <span>{lesson.duration}min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lesson Plans List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Recent Lesson Plans</h2>
          {lessonPlans.length > 0 && (
            <span className="text-sm text-gray-500">
              {lessonPlans.length} {lessonPlans.length === 1 ? 'plan' : 'plans'}
            </span>
          )}
        </div>
        
        {lessonPlans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="mx-auto h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
              <Calendar className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lesson plans created yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Generate your first lesson plan to get started with your weekly planning
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {lessonPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{plan.topic}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
                        <span className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                          <BookOpen className="w-4 h-4" />
                          <span>{plan.subject}</span>
                        </span>
                        <span className="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                          <Users className="w-4 h-4" />
                          <span>{plan.grade}</span>
                        </span>
                        <span className="flex items-center space-x-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full">
                          <Clock className="w-4 h-4" />
                          <span>{plan.duration} minutes</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                      {plan.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <button className="flex items-center space-x-2 px-4 py-1.5 bg-white text-indigo-600 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200">
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Export</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Learning Objectives</h4>
                      </div>
                      <ul className="space-y-2 pl-4">
                        {plan.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <span className="text-purple-500 mt-1">•</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Activities</h4>
                      </div>
                      <ul className="space-y-2 pl-4">
                        {plan.activities.map((activity, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Materials Needed</h4>
                      <div className="flex flex-wrap gap-2">
                        {plan.materials.map((material, index) => (
                          <span key={index} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Assessment</h4>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{plan.assessment}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Homework</h4>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{plan.homework}</p>
                    </div>
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