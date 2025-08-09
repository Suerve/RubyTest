
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
  Target
} from 'lucide-react';
import TypingTest from './typing-test';
import TypingResults from './typing-results';

interface TypingTestClientProps {
  testType: 'keyboarding' | '10-key';
  testTypeRecord: any;
  user: any;
  hasAccess: boolean;
  access: any;
  activeTest: any;
  isPractice: boolean;
}

type TestState = 'setup' | 'testing' | 'results';

export default function TypingTestClient({ 
  testType, 
  testTypeRecord, 
  user, 
  hasAccess, 
  access, 
  activeTest,
  isPractice 
}: TypingTestClientProps) {
  const [testState, setTestState] = useState<TestState>('setup');
  const [results, setResults] = useState<any>(null);
  const router = useRouter();

  const handleStartTest = () => {
    setTestState('testing');
  };

  const handleTestComplete = (testResults: any) => {
    setResults(testResults);
    setTestState('results');
  };

  const handleReturnToTests = () => {
    router.push('/tests');
  };

  const handleRetakeTest = () => {
    setTestState('setup');
    setResults(null);
  };

  const getAccessBadge = () => {
    if (!access) return <Badge variant="secondary">No Access</Badge>;
    
    switch (access.accessType) {
      case 'UNLIMITED':
        return <Badge className="bg-green-500">Unlimited Access</Badge>;
      case 'ONE_TIME':
        return <Badge className="bg-orange-500">One-Time Access</Badge>;
      case 'PRACTICE_ONLY':
        return <Badge className="bg-blue-500">Practice Only</Badge>;
      default:
        return <Badge variant="secondary">No Access</Badge>;
    }
  };

  const canTakePractice = () => {
    return hasAccess && (access?.accessType === 'UNLIMITED' || access?.accessType === 'PRACTICE_ONLY' || access?.accessType === 'ONE_TIME');
  };

  const canTakeActualTest = () => {
    return hasAccess && (access?.accessType === 'UNLIMITED' || access?.accessType === 'ONE_TIME');
  };

  // Show test interface
  if (testState === 'testing') {
    return (
      <TypingTest
        testType={testType}
        isPractice={isPractice}
        onComplete={handleTestComplete}
        onCancel={() => setTestState('setup')}
      />
    );
  }

  // Show results
  if (testState === 'results' && results) {
    return (
      <TypingResults
        results={results}
        onReturnToTests={handleReturnToTests}
        onRetakeTest={isPractice ? handleRetakeTest : undefined}
      />
    );
  }

  // Show setup/intro page
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            {testType === 'keyboarding' ? 
              <Keyboard className="w-8 h-8 text-white" /> : 
              <Hash className="w-8 h-8 text-white" />
            }
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {testType === 'keyboarding' ? 'Keyboard Typing Test' : '10-Key Typing Test'}
        </h1>
        <p className="text-gray-600 mb-4">
          {testTypeRecord.description}
        </p>
        {getAccessBadge()}
      </div>

      {/* Test Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Test Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Practice Test:</span>
                <Badge variant="outline">30 seconds</Badge>
              </div>
              <div className="flex justify-between">
                <span>Official Test:</span>
                <Badge variant="outline">60 seconds</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              What's Measured
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• {testType === '10-key' ? 'Keystrokes Per Hour (KPH)' : 'Words Per Minute (WPM)'}</li>
              <li>• Typing Accuracy (%)</li>
              <li>• Weighted Speed (Accuracy-Adjusted)</li>
              <li>• {testType === '10-key' ? 'Keystroke-level Precision' : 'Character-level Precision'}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Test Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Requirements & Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testType === '10-key' && (
              <Alert>
                <Hash className="w-4 h-4" />
                <AlertDescription>
                  <strong>10-Key Test:</strong> Num Lock must be enabled on your keyboard. Use the numeric keypad on the right side of your keyboard.
                </AlertDescription>
              </Alert>
            )}
            
            <Alert>
              <Keyboard className="w-4 h-4" />
              <AlertDescription>
                <strong>Desktop/Laptop Required:</strong> This test is not available on mobile devices. A physical keyboard is required.
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">How to Take the Test:</h4>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>Click "Start Test" below to begin</li>
                <li>You'll see the text to type on screen</li>
                <li>Press SPACEBAR or ENTER to start the timer</li>
                <li>Type the text as accurately and quickly as possible</li>
                <li>The test will automatically end when time expires</li>
                <li>Results will be shown immediately after completion</li>
              </ol>
            </div>

            {testType === 'keyboarding' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Keyboard Test Content:</h4>
                <p className="text-sm text-green-800">
                  You'll be tested on typing passages containing uppercase and lowercase letters, 
                  numbers, punctuation marks, and special characters. Words with errors will be 
                  highlighted in red, correct words in green.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Test Warning */}
      {activeTest && !isPractice && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Active Test Found:</strong> You have an incomplete test. Please complete or cancel it before starting a new one.
          </AlertDescription>
        </Alert>
      )}

      {/* Access Control */}
      {!hasAccess && (
        <Alert>
          <Lock className="w-4 h-4" />
          <AlertDescription>
            You don't have access to this test. Please request access from your administrator or enter a one-time access code.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {canTakePractice() && !activeTest && (
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => {
              // Set practice mode and start
              window.location.href = `/tests/${testTypeRecord.name}?practice=true`;
            }}
            className="px-8"
          >
            <Play className="w-4 h-4 mr-2" />
            Practice Test (30s)
          </Button>
        )}

        {canTakeActualTest() && !activeTest && (
          <Button 
            size="lg"
            onClick={() => {
              // Set actual test mode and start
              window.location.href = `/tests/${testTypeRecord.name}?practice=false`;
            }}
            className="px-8"
            disabled={!isPractice && activeTest}
          >
            <Clock className="w-4 h-4 mr-2" />
            Official Test (60s)
          </Button>
        )}

        {isPractice && hasAccess && (
          <Button 
            size="lg"
            onClick={handleStartTest}
            className="px-8"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Practice Test
          </Button>
        )}

        {!isPractice && hasAccess && !activeTest && (
          <Button 
            size="lg"
            onClick={handleStartTest}
            className="px-8"
          >
            <Clock className="w-4 h-4 mr-2" />
            Start Official Test
          </Button>
        )}

        <Button variant="outline" onClick={handleReturnToTests}>
          Back to Tests
        </Button>
      </div>

      {/* User Info */}
      <Card className="bg-gray-50">
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
