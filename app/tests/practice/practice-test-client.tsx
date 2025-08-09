
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Keyboard, 
  Hash,
  Clock,
  User,
  Lock,
  AlertTriangle,
  Play,
  Timer,
  Target,
  ArrowLeft,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import PracticeTypingTest from './practice-typing-test';
import PracticeTypingResults from './practice-typing-results';

interface PracticeTestClientProps {
  testType: 'keyboarding' | '10-key';
  testTypeRecord: any;
  user: any;
  canPractice: boolean;
  access: any;
}

type TestState = 'setup' | 'testing' | 'results';

export default function PracticeTestClient({ 
  testType, 
  testTypeRecord, 
  user, 
  canPractice, 
  access
}: PracticeTestClientProps) {
  const [testState, setTestState] = useState<TestState>('setup');
  const [results, setResults] = useState<any>(null);
  const router = useRouter();

  const handleStartPractice = () => {
    setTestState('testing');
  };

  const handlePracticeComplete = (practiceResults: any) => {
    setResults(practiceResults);
    setTestState('results');
  };

  const handleReturnToTests = () => {
    router.push('/tests');
  };

  const handleRestartPractice = () => {
    setTestState('setup');
    setResults(null);
  };

  const handleStartOfficialTest = () => {
    // Navigate to official test
    router.push(`/tests/${testTypeRecord.name}?practice=false`);
  };

  // Show practice test interface
  if (testState === 'testing') {
    return (
      <div className="relative">
        {/* Practice Mode Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
            <Play className="w-4 h-4" />
            PRACTICE MODE
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This is a practice session. Results will not be saved or stored.
          </p>
        </div>
        
        <PracticeTypingTest
          testType={testType}
          onComplete={handlePracticeComplete}
          onCancel={() => setTestState('setup')}
        />
      </div>
    );
  }

  // Show practice results
  if (testState === 'results' && results) {
    return (
      <PracticeTypingResults
        results={results}
        testType={testType}
        onReturnToTests={handleReturnToTests}
        onRestartPractice={handleRestartPractice}
        onStartOfficialTest={canPractice ? handleStartOfficialTest : undefined}
      />
    );
  }

  // Show setup/intro page
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Practice Mode Header */}
      <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            {testType === 'keyboarding' ? 
              <Keyboard className="w-8 h-8 text-white" /> : 
              <Hash className="w-8 h-8 text-white" />
            }
          </div>
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">
          Practice {testType === 'keyboarding' ? 'Keyboard' : '10-Key'} Typing
        </h1>
        <p className="text-blue-700 mb-4">
          {testTypeRecord.description}
        </p>
        <Badge className="bg-blue-500 text-white px-4 py-2 cursor-default">
          Practice Mode - No Data Saved
        </Badge>
      </div>

      {/* Practice Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Timer className="w-5 h-5" />
              Practice Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Duration:</span>
                <Badge variant="outline" className="border-blue-300">30 seconds</Badge>
              </div>
              <div className="flex justify-between">
                <span>Content:</span>
                <Badge variant="outline" className="border-blue-300">Random passage</Badge>
              </div>
              <div className="flex justify-between">
                <span>Data Storage:</span>
                <Badge variant="outline" className="border-red-300 text-red-600">None</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Target className="w-5 h-5" />
              What You'll Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Typing speed ({testType === '10-key' ? 'KPM' : 'WPM'})
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Accuracy measurement
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Real-time feedback
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Performance analysis
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Practice Mode Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="border-amber-300 bg-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Practice Only:</strong> This session is for practice purposes only. Results will be watermarked and cannot be saved, printed, or shared.
              </AlertDescription>
            </Alert>
            
            {testType === '10-key' && (
              <Alert className="border-blue-300 bg-blue-100">
                <Hash className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>10-Key Practice:</strong> Ensure Num Lock is enabled. Use the numeric keypad on the right side of your keyboard.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-white p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">Practice Benefits:</h4>
              <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                <li>Familiarize yourself with the test interface</li>
                <li>Practice typing speed and accuracy</li>
                <li>Understand scoring methodology</li>
                <li>Build confidence before official testing</li>
                <li>No time pressure - practice as many times as needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Information */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Free Practice Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-800 text-sm">
            Practice mode is available to all users at no cost. Practice as much as you need to build your typing skills and confidence before taking official tests.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleReturnToTests} className="px-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tests
        </Button>

        <Button 
          size="lg"
          onClick={handleStartPractice}
          className="px-8 bg-blue-600 hover:bg-blue-700"
        >
          <Play className="w-4 h-4 mr-2" />
          Start Practice Session
        </Button>
      </div>

      {/* User Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {user.firstName} {user.lastName}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleDateString()}
            </div>
            {access && (
              <div className="flex items-center gap-2">
                Access: {access.accessType.replace('_', ' ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
