
'use client';

import { useState } from 'react';
import PracticeTypingTest from '@/app/tests/practice/practice-typing-test';

export default function TestPracticePage() {
  const [showTest, setShowTest] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleComplete = (results: any) => {
    setResults(results);
    setShowTest(false);
  };

  const handleCancel = () => {
    setShowTest(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {!showTest && !results && (
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-8">10-Key Practice Test</h1>
          <button 
            onClick={() => setShowTest(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start 10-Key Practice Test
          </button>
        </div>
      )}

      {showTest && (
        <PracticeTypingTest
          testType="10-key"
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}

      {results && (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Practice Test Results</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p>KPH: {results.statistics?.kph || 0}</p>
            <p>Accuracy: {results.statistics?.accuracy || 0}%</p>
            <p>Weighted KPH: {results.statistics?.weightedKph || 0}</p>
          </div>
          <button 
            onClick={() => {setResults(null); setShowTest(false);}}
            className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
