import React from 'react';
import { 
  Home, 
  FileText, 
  Image, 
  MessageCircle, 
  PenTool, 
  Calendar, 
  Mic,
  Brain
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'content' | 'worksheet' | 'chat' | 'visual' | 'planner' | 'assessment';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: Home },
    { id: 'content' as ActiveTab, label: 'Content Generator', icon: FileText },
    { id: 'worksheet' as ActiveTab, label: 'Worksheets', icon: Image },
    { id: 'chat' as ActiveTab, label: 'Ask Anything', icon: MessageCircle },
    { id: 'visual' as ActiveTab, label: 'Visual Aids', icon: PenTool },
    { id: 'planner' as ActiveTab, label: 'Lesson Planner', icon: Calendar },
    { id: 'assessment' as ActiveTab, label: 'Assessment', icon: Mic },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sahayak</h1>
              <p className="text-xs text-gray-500">AI Teaching Assistant</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={(e) => onTabChange(e.target.value as ActiveTab)}
              className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}