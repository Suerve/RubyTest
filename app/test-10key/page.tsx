
'use client';

import { useState } from 'react';
import PracticeTypingTest from '../tests/practice/practice-typing-test';

export default function Test10KeyPage() {
  const [results, setResults] = useState<any>(null);

  const handleComplete = (testResults: any) => {
    console.log('Test completed:', testResults);
    setResults(testResults);
  };

  const handleCancel = () => {
    console.log('Test cancelled');
    window.location.reload();
  };

  if (results) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Test Results</h1>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(results, null, 2)}
          </pre>
          <button 
            onClick={() => setResults(null)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-center">10-Key Practice Test - Development Testing</h1>
        <PracticeTypingTest
          testType="10-key"
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
