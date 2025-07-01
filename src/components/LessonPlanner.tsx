import React, { useState } from 'react';
import { Calendar, Plus, Clock, BookOpen, Target, Users, Wand2 } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI Lesson Planner
          </h1>
          <p className="text-lg text-gray-600">
            Generate comprehensive lesson plans automatically with Gemini AI
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Create Lesson Plan</span>
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Generate New Lesson Plan with Gemini AI
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <select
                        value={newPlan.subject}
                        onChange={(e) => setNewPlan({ ...newPlan, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade
                      </label>
                      <select
                        value={newPlan.grade}
                        onChange={(e) => setNewPlan({ ...newPlan, grade: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Grade</option>
                        {grades.map(grade => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={generateLessonPlan}
                  disabled={!newPlan.subject || !newPlan.grade || !newPlan.topic || isGenerating}
                  className="w-full inline-flex justify-center items-center space-x-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{isGenerating ? 'Generating with Gemini...' : 'Generate Plan'}</span>
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Calendar View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Weekly Overview</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const prevWeek = new Date(selectedWeek);
                  prevWeek.setDate(selectedWeek.getDate() - 7);
                  setSelectedWeek(prevWeek);
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                ← Previous
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
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          
          {getWeekDays(selectedWeek).map((date) => {
            const dayLessons = getDayLessons(date);
            return (
              <div key={date.toISOString()} className="bg-white min-h-32 p-2">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="text-xs p-2 bg-blue-100 text-blue-800 rounded border-l-2 border-blue-400"
                    >
                      <div className="font-medium truncate">{lesson.subject}</div>
                      <div className="truncate">{lesson.topic}</div>
                      <div className="flex items-center space-x-1 mt-1">
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
        <h2 className="text-2xl font-semibold text-gray-900">Recent Lesson Plans</h2>
        
        {lessonPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No lesson plans created yet. Generate your first one above!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {lessonPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{plan.topic}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{plan.subject}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{plan.grade}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{plan.duration} minutes</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {plan.date.toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <h4 className="font-medium text-gray-900">Learning Objectives</h4>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {plan.objectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <h4 className="font-medium text-gray-900">Activities</h4>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {plan.activities.map((activity, index) => (
                          <li key={index}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Materials Needed</h4>
                      <div className="flex flex-wrap gap-2">
                        {plan.materials.map((material, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Assessment</h4>
                      <p className="text-sm text-gray-700">{plan.assessment}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Homework</h4>
                      <p className="text-sm text-gray-700">{plan.homework}</p>
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