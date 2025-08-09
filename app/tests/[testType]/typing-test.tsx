
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Target, TrendingUp, Keyboard, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Enhanced10KeyTest from './enhanced-10key-test';

interface TypingTestProps {
  testType: 'keyboarding' | '10-key';
  isPractice: boolean;
  onComplete: (results: any) => void;
  onCancel: () => void;
}

interface TestSession {
  test: any;
  session: any;
  question: any;
  timeLimit: number;
}

interface Statistics {
  wpm: number;
  accuracy: number;
  weightedWpm: number;
  correctCharacters: number;
  totalCharacters: number;
  timeElapsed: number;
}

export default function TypingTest({ testType, isPractice, onComplete, onCancel }: TypingTestProps) {
  // Use Enhanced 10-Key Test for 10-key tests
  if (testType === '10-key') {
    return (
      <Enhanced10KeyTest
        testType={testType}
        isPractice={isPractice}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );
  }
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [statistics, setStatistics] = useState<Statistics>({
    wpm: 0,
    accuracy: 100,
    weightedWpm: 0,
    correctCharacters: 0,
    totalCharacters: 0,
    timeElapsed: 0
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [numLockEnabled, setNumLockEnabled] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Mobile device detection
  useEffect(() => {
    const checkMobileDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                       window.innerWidth <= 768;
      setIsMobileDevice(isMobile);
    };

    checkMobileDevice();
    window.addEventListener('resize', checkMobileDevice);
    return () => window.removeEventListener('resize', checkMobileDevice);
  }, []);

  // Note: Num lock detection is handled in Enhanced10KeyTest for 10-key tests

  // Initialize test
  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/tests/typing/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType, isPractice })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start test');
      }

      const data = await response.json();
      setTestSession(data);
      setTimeRemaining(data.timeLimit);

    } catch (error) {
      console.error('Initialize test error:', error);
      toast.error(`Failed to start test: ${error}`);
      onCancel();
    } finally {
      setIsLoading(false);
    }
  };

  // Start test timer and progress tracking
  const startTest = useCallback(() => {
    if (!testSession || hasStarted) return;

    setHasStarted(true);
    inputRef.current?.focus();

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          completeTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start progress tracking
    progressIntervalRef.current = setInterval(() => {
      updateProgress();
    }, 1000);

  }, [testSession, hasStarted]);

  // Update progress
  const updateProgress = async () => {
    if (!testSession || !hasStarted || isCompleting) return;

    try {
      const response = await fetch('/api/tests/typing/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testSession.test.id,
          typedText,
          currentPosition,
          currentWordIndex
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }

    } catch (error) {
      console.error('Update progress error:', error);
    }
  };

  // Complete test
  const completeTest = async () => {
    if (!testSession || isCompleting) return;

    setIsCompleting(true);
    
    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    try {
      const response = await fetch('/api/tests/typing/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testSession.test.id,
          finalTypedText: typedText,
          timeElapsed: testSession.timeLimit - timeRemaining
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete test');
      }

      const data = await response.json();
      onComplete(data);

    } catch (error) {
      console.error('Complete test error:', error);
      toast.error('Failed to complete test');
    }
  };

  // Handle text input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!hasStarted || isCompleting) return;

    const newText = e.target.value;
    setTypedText(newText);
    setCurrentPosition(newText.length);

    // Calculate current word index
    const words = testSession?.question?.passageText?.split(' ') || [];
    let charCount = 0;
    let wordIndex = 0;

    for (let i = 0; i < words.length; i++) {
      if (charCount + words[i].length >= newText.length) {
        wordIndex = i;
        break;
      }
      charCount += words[i].length + 1; // +1 for space
    }

    setCurrentWordIndex(wordIndex);
  };

  // Handle key press for start trigger
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasStarted && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      startTest();
    }
  };

  // Prevent clicking outside text area
  const preventClick = (e: React.MouseEvent) => {
    if (hasStarted && e.target !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  // Render word with highlighting
  const renderWords = () => {
    if (!testSession?.question?.passageText) return null;

    const words = testSession.question.passageText.split(' ');
    const typedWords = typedText.split(' ');

    return (
      <div className="text-lg leading-relaxed font-mono">
        {words.map((word: string, index: number) => {
          const isCurrentWord = index === currentWordIndex;
          const typedWord = typedWords[index] || '';
          const isCorrect = typedWord === word;
          const isTyped = index < typedWords.length;

          let className = 'inline-block mx-1 px-1 ';
          
          if (isCurrentWord && hasStarted) {
            className += isCorrect || typedWord === '' 
              ? 'border-b-2 border-green-500' 
              : 'border-b-2 border-red-500';
          } else if (isTyped) {
            className += isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
          } else {
            className += 'text-gray-700';
          }

          return (
            <span key={index} className={className}>
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  // Show mobile device warning
  if (isMobileDevice) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Mobile Device Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Typing tests are not available on mobile devices. Please use a desktop or laptop computer with a physical keyboard.
          </p>
          <Button onClick={onCancel} variant="outline">
            Return to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Note: Num lock warnings are handled in Enhanced10KeyTest for 10-key tests

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading typing test...</div>
        </CardContent>
      </Card>
    );
  }

  if (!testSession) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Failed to load typing test</p>
          <Button onClick={onCancel} className="mt-4" variant="outline">
            Return to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" onClick={preventClick}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">{timeRemaining}s</div>
            <div className="text-sm text-gray-500">Time Left</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{statistics.wpm}</div>
            <div className="text-sm text-gray-500">WPM</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{statistics.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Keyboard className="w-5 h-5 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{statistics.weightedWpm}</div>
            <div className="text-sm text-gray-500">Weighted WPM</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statistics.correctCharacters}/{statistics.totalCharacters}</div>
            <div className="text-sm text-gray-500">Characters</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Type Badge */}
      <div className="flex justify-center">
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {testType === 'keyboarding' ? 'Keyboard' : '10-Key'} Typing Test
          {isPractice && ' (Practice)'}
        </Badge>
      </div>

      {/* Text Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {!hasStarted ? 'Press SPACEBAR or ENTER to begin' : 'Type the following text:'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg mb-4 min-h-[120px] flex items-center justify-center">
            {renderWords()}
          </div>
          
          {/* Input Area */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={!testSession || isCompleting}
            className="w-full h-32 p-4 border rounded-lg font-mono text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={!hasStarted ? "Press SPACEBAR or ENTER to start typing..." : "Start typing here..."}
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {!hasStarted && (
          <Button onClick={startTest} size="lg" className="px-8">
            Start Test
          </Button>
        )}
        
        {hasStarted && !isCompleting && (
          <Button onClick={completeTest} size="lg" className="px-8">
            Complete Test
          </Button>
        )}
        
        <Button onClick={onCancel} variant="outline" size="lg">
          Cancel Test
        </Button>
      </div>

      {isCompleting && (
        <div className="text-center text-gray-600">
          <div className="animate-pulse">Calculating results...</div>
        </div>
      )}
    </div>
  );
}
