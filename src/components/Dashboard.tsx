import React, { useState } from 'react';
import { Plus, BookOpen, Users, Target, TrendingUp, ChevronRight, Search } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  grade: string;
  students: number;
  progress: number;
}

export function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Mathematics', grade: 'Grade 5', students: 28, progress: 75 },
    { id: '2', name: 'Science', grade: 'Grade 4', students: 24, progress: 60 },
    { id: '3', name: 'Hindi Literature', grade: 'Grade 3', students: 22, progress: 85 },
    { id: '4', name: 'English', grade: 'Grade 6', students: 30, progress: 45 },
    { id: '5', name: 'Social Studies', grade: 'Grade 5', students: 25, progress: 70 },
  ]);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', grade: '', students: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSubject = () => {
    if (newSubject.name && newSubject.grade && newSubject.students) {
      const subject: Subject = {
        id: Date.now().toString(),
        name: newSubject.name,
        grade: newSubject.grade,
        students: parseInt(newSubject.students),
        progress: 0,
      };
      setSubjects([...subjects, subject]);
      setNewSubject({ name: '', grade: '', students: '' });
      setShowAddSubject(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Navigation */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-indigo-800">Sahayak</h1>
          <p className="text-gray-500">AI Teaching Assistant Dashboard</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-800 font-semibold">JD</span>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome back, Teacher!</h2>
        <p className="max-w-2xl mb-4 opacity-90">
          Your AI-powered teaching assistant is ready to help you create localized, differentiated, and engaging content for your students.
        </p>
        <button className="flex items-center space-x-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition">
          <span>Explore Resources</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100 text-blue-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100 text-green-600">
              <Users className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {subjects.reduce((acc, subject) => acc + subject.students, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100 text-purple-600">
              <Target className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {`${Math.round((subjects.reduce((acc, subject) => acc + subject.progress, 0) / subjects.length) || 0)}%`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-orange-100 text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Weekly Goals</p>
              <p className="text-2xl font-bold text-gray-900">12/15</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your Subjects</h2>
            <p className="text-sm text-gray-500">Manage and track your teaching subjects</p>
          </div>
          <button
            onClick={() => setShowAddSubject(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Subject</span>
          </button>
        </div>
        
        <div className="p-6">
          {showAddSubject && (
            <div className="mb-6 p-6 border border-gray-200 rounded-xl bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Subject</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                  <select
                    value={newSubject.grade}
                    onChange={(e) => setNewSubject({ ...newSubject, grade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Grade</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Students</label>
                  <input
                    type="number"
                    placeholder="e.g. 25"
                    value={newSubject.students}
                    onChange={(e) => setNewSubject({ ...newSubject, students: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddSubject}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex-1"
                >
                  Add Subject
                </button>
                <button
                  onClick={() => setShowAddSubject(false)}
                  className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No subjects found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or add a new subject.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Subject
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <div key={subject.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                      {subject.name}
                    </h3>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                      {subject.grade}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium text-gray-900">{subject.students}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-medium text-gray-900">{subject.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            subject.progress > 75 ? 'bg-green-500' : 
                            subject.progress > 50 ? 'bg-blue-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${subject.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <button className="w-full mt-4 py-2 border border-gray-300 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 transition-colors duration-200 flex items-center justify-center space-x-2">
                      <span>View Details</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { id: 1, action: 'Created lesson plan for Mathematics', time: '2 hours ago' },
              { id: 2, action: 'Assigned homework to Grade 5', time: '5 hours ago' },
              { id: 3, action: 'Generated assessment for Science', time: '1 day ago' },
              { id: 4, action: 'Updated progress for Hindi Literature', time: '2 days ago' },
            ].map((activity) => (
              <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}