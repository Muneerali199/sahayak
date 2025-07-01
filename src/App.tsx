import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ContentGenerator } from './components/ContentGenerator';
import { WorksheetGenerator } from './components/WorksheetGenerator';
import { AskAnythingBot } from './components/AskAnythingBot';
import { VisualAidDesigner } from './components/VisualAidDesigner';
import { LessonPlanner } from './components/LessonPlanner';
import { ReadingAssessment } from './components/ReadingAssessment';

type ActiveTab = 'dashboard' | 'content' | 'worksheet' | 'chat' | 'visual' | 'planner' | 'assessment';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'content':
        return <ContentGenerator />;
      case 'worksheet':
        return <WorksheetGenerator />;
      case 'chat':
        return <AskAnythingBot />;
      case 'visual':
        return <VisualAidDesigner />;
      case 'planner':
        return <LessonPlanner />;
      case 'assessment':
        return <ReadingAssessment />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
}

export default App;