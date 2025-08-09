
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Target, TrendingUp, Hash, Pause, Play, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Enhanced10KeyTestProps {
  testType: '10-key';
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
  kph: number;
  accuracy: number;
  weightedKph: number;
  correctCharacters: number;
  totalCharacters: number;
  timeElapsed: number;
}

interface TestRow {
  content: string;
  characters: string[];
}

interface VerticalDisplayProps {
  rows: TestRow[];
  currentRowIndex: number;
  currentCharIndex: number;
  inputText: string;
  isTestRunning: boolean;
  isNumLockEnabled: boolean;
  onRowComplete: () => void;
}

// Generate test rows based on practice/official mode
function generateTestRows(isPractice: boolean, numRows: number = 50): TestRow[] {
  const rows: TestRow[] = [];
  
  for (let i = 0; i < numRows; i++) {
    let content = '';
    
    if (isPractice) {
      // Practice mode: BEGINNER LEVEL ONLY - single/double digit numbers, NO decimals or math signs
      const numCount = 1; // Only one number per row for beginner level
      
      // Generate 1-2 digit whole numbers only
      const num = Math.floor(Math.random() * 99) + 1;
      content = num.toString();
    } else {
      // Official mode: increasing difficulty with decimals and multi-digit numbers
      const difficulty = Math.min(Math.floor(i / 10), 4); // Increase difficulty every 10 rows
      const numCount = Math.floor(Math.random() * 2) + 1 + difficulty; // More numbers as difficulty increases
      const numbers = [];
      
      for (let j = 0; j < numCount; j++) {
        if (j > 0) {
          const operators = ['+', '-', '*', '/'];
          numbers.push(operators[Math.floor(Math.random() * operators.length)]);
        }
        
        let num: string;
        if (difficulty === 0) {
          // Single digit
          num = (Math.floor(Math.random() * 9) + 1).toString();
        } else if (difficulty === 1) {
          // 1-2 digits
          num = (Math.floor(Math.random() * 99) + 1).toString();
        } else if (difficulty === 2) {
          // 2-3 digits with occasional decimal
          const base = Math.floor(Math.random() * 999) + 10;
          num = Math.random() < 0.3 ? (base / 10).toString() : base.toString();
        } else {
          // Multi-digit with decimals
          const base = Math.floor(Math.random() * 9999) + 100;
          const decimals = Math.floor(Math.random() * 3);
          num = (base / Math.pow(10, decimals)).toString();
        }
        
        numbers.push(num);
      }
      content = numbers.join('');
    }
    
    // Convert content to character array (no spaces between numbers and operators)
    const characters = content.split('');
    rows.push({ content, characters });
  }
  
  return rows;
}

// Vertical Character Display Component
function VerticalCharacterDisplay({ 
  rows, 
  currentRowIndex, 
  currentCharIndex, 
  inputText, 
  isTestRunning, 
  isNumLockEnabled, 
  onRowComplete 
}: VerticalDisplayProps) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get the three visible rows
  const getVisibleRows = () => {
    const startRow = Math.max(0, currentRowIndex - 1 + scrollOffset);
    return [
      rows[startRow] || { content: '', characters: [] },     // Top row
      rows[startRow + 1] || { content: '', characters: [] }, // Middle row
      rows[startRow + 2] || { content: '', characters: [] }  // Bottom row
    ];
  };

  const visibleRows = getVisibleRows();
  const currentRow = rows[currentRowIndex];
  
  // Handle Enter key for row completion and scrolling
  useEffect(() => {
    if (currentRow && inputText.length === currentRow.characters.length) {
      // Row is complete, trigger scrolling animation
      setIsAnimating(true);
      
      setTimeout(() => {
        setScrollOffset(prev => prev + 1);
        setIsAnimating(false);
        onRowComplete();
      }, 300); // Animation duration
    }
  }, [inputText, currentRow, onRowComplete]);

  // Character validation logic
  const getCharacterStatus = (rowIndex: number, charIndex: number) => {
    const globalRowIndex = currentRowIndex - 1 + scrollOffset + rowIndex;
    const row = rows[globalRowIndex];
    
    if (!row) return { status: 'pending', char: '' };
    
    const char = row.characters[charIndex];
    if (!char) return { status: 'pending', char: '' };

    if (globalRowIndex < currentRowIndex) {
      return { status: 'completed', char };
    } else if (globalRowIndex === currentRowIndex) {
      if (charIndex < inputText.length) {
        const typedChar = inputText[charIndex];
        if (typedChar === char) {
          return { status: 'correct', char };
        } else {
          // Check if typed character matches one of the next two characters
          const nextChar1 = row.characters[charIndex + 1];
          const nextChar2 = row.characters[charIndex + 2];
          
          if (typedChar === nextChar1) {
            return { status: 'skip-to-next', char, skipTo: charIndex + 1 };
          } else if (typedChar === nextChar2) {
            return { status: 'skip-to-next', char, skipTo: charIndex + 2 };
          } else {
            return { status: 'incorrect', char };
          }
        }
      } else if (charIndex === inputText.length) {
        return { status: 'current', char };
      } else {
        return { status: 'pending', char };
      }
    } else {
      return { status: 'pending', char };
    }
  };

  return (
    <div className="relative">
      {/* 3-Row Viewing Area */}
      <div 
        className={`bg-gray-900 text-white p-8 rounded-lg border-4 min-h-[300px] flex flex-col justify-center items-center space-y-6 font-mono transition-all duration-300 ${
          isAnimating ? 'transform scale-105' : ''
        }`}
        style={{ 
          background: isNumLockEnabled 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' 
            : 'linear-gradient(135deg, #2d1b1b 0%, #3d2020 50%, #4d2525 100%)',
          borderColor: isNumLockEnabled ? '#3b82f6' : '#ef4444'
        }}
      >
        {/* Num Lock Status Indicator */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
          isNumLockEnabled 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white animate-pulse'
        }`}>
          {isNumLockEnabled ? 'NUM LOCK ON' : 'NUM LOCK OFF'}
        </div>

        {/* Character Display Rows */}
        {visibleRows.map((row, rowIndex) => {
          const isMiddleRow = rowIndex === 1;
          const maxCharsToShow = Math.max(8, Math.max(...visibleRows.map(r => r.characters.length)));
          
          return (
            <div
              key={`row-${currentRowIndex - 1 + scrollOffset + rowIndex}`}
              className={`
                flex justify-center items-center gap-1 transition-all duration-300 ease-in-out transform
                ${isMiddleRow ? 'scale-125 z-10' : 'scale-90 opacity-70'}
                ${isAnimating && rowIndex === 0 ? 'animate-fade-up-out' : ''}
                ${isAnimating && rowIndex === 2 ? 'animate-fade-down-in' : ''}
              `}
            >
              {Array.from({ length: maxCharsToShow }, (_, charIndex) => {
                const charStatus = getCharacterStatus(rowIndex, charIndex);
                const shouldObfuscate = !isTestRunning || !isNumLockEnabled;
                
                return (
                  <div
                    key={`char-${charIndex}`}
                    className={`
                      relative w-12 h-16 flex items-center justify-center text-4xl font-bold transition-all duration-200
                      ${isMiddleRow && charStatus.status === 'current' ? 'bg-blue-500/30 rounded border-2 border-white animate-pulse' : ''}
                    `}
                  >
                    {/* Character Background */}
                    <div className={`
                      absolute inset-0 rounded transition-all duration-200
                      ${charStatus.status === 'correct' ? 'bg-green-500/20' : ''}
                      ${charStatus.status === 'incorrect' ? 'bg-red-500/20 animate-pulse' : ''}
                      ${charStatus.status === 'current' ? 'bg-blue-500/20' : ''}
                    `} />
                    
                    {/* Character Display */}
                    <div className={`
                      relative z-10 transition-all duration-200
                      ${shouldObfuscate ? 'blur-sm opacity-30' : ''}
                      ${charStatus.status === 'correct' ? 'text-green-400' : ''}
                      ${charStatus.status === 'incorrect' ? 'text-red-400' : ''}
                      ${charStatus.status === 'current' ? 'text-white' : ''}
                      ${charStatus.status === 'completed' ? 'text-blue-300' : ''}
                      ${charStatus.status === 'pending' ? 'text-gray-400' : ''}
                      ${!isMiddleRow ? 'opacity-50' : ''}
                    `}>
                      {shouldObfuscate ? '?' : (charStatus.char || '')}
                    </div>
                    
                    {/* Current Position Indicator */}
                    {isMiddleRow && charStatus.status === 'current' && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-white animate-bounce" />
                      </div>
                    )}
                    
                    {/* End of Row Triangle */}
                    {isMiddleRow && charStatus.char && charIndex === row.characters.length - 1 && charStatus.status === 'current' && (
                      <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-white animate-pulse">
                        ▶
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Row Progress Indicator */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-400">
          Row: {currentRowIndex + 1} | Char: {inputText.length + 1} / {currentRow?.characters.length || 0}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-600">
        <p className="mb-2">
          <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Enter</kbd> completes row • 
          <kbd className="px-2 py-1 bg-gray-200 rounded text-xs ml-2">Backspace</kbd> to correct
        </p>
        {!isNumLockEnabled && (
          <Alert className="mt-2">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-600 font-semibold">
              Characters are hidden when Num Lock is disabled!
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-up-out {
          from { transform: translateY(0) scale(0.9); opacity: 0.7; }
          to { transform: translateY(-100px) scale(0.5); opacity: 0; }
        }
        
        @keyframes fade-down-in {
          from { transform: translateY(100px) scale(0.5); opacity: 0; }
          to { transform: translateY(0) scale(0.9); opacity: 0.7; }
        }
        
        .animate-fade-up-out {
          animation: fade-up-out 0.3s ease-in-out forwards;
        }
        
        .animate-fade-down-in {
          animation: fade-down-in 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function Enhanced10KeyTest({ testType, isPractice, onComplete, onCancel }: Enhanced10KeyTestProps) {
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [statistics, setStatistics] = useState<Statistics>({
    kph: 0,
    accuracy: 0, // Start at 0% until first keystroke
    weightedKph: 0,
    correctCharacters: 0,
    totalCharacters: 0,
    timeElapsed: 0
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [numLockEnabled, setNumLockEnabled] = useState(true);
  const [testRows, setTestRows] = useState<TestRow[]>([]);
  const [allEntryLines, setAllEntryLines] = useState<string[]>(['']); // Track all entry lines for backspace handling
  const [currentEntryLineIndex, setCurrentEntryLineIndex] = useState(0);
  
  // State for tracking input focus for dynamic text
  const [inputHasFocus, setInputHasFocus] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const numLockCheckRef = useRef<NodeJS.Timeout>();

  // Enhanced Num Lock Detection
  useEffect(() => {
    let numLockState = true;
    
    const checkNumLock = () => {
      // More comprehensive num lock detection
      const handleKeyDown = (e: KeyboardEvent) => {
        // Check if numpad keys are producing numbers
        if (e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
          if (e.key >= '0' && e.key <= '9') {
            numLockState = true;
          } else if (e.key === 'Clear' || e.key === 'Insert' || e.key === 'Delete') {
            numLockState = false;
          }
          
          if (numLockState !== numLockEnabled) {
            setNumLockEnabled(numLockState);
            
            if (!numLockState && hasStarted && !isPaused) {
              // Pause test when Num Lock is disabled
              setIsPaused(true);
              if (timerRef.current) clearInterval(timerRef.current);
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              
              toast.error('Test paused - Num Lock disabled!', {
                duration: 3000,
                icon: '⚠️'
              });
            } else if (numLockState && hasStarted && isPaused) {
              // Resume test when Num Lock is re-enabled
              resumeTest();
              toast.success('Test resumed - Num Lock enabled!', {
                duration: 2000,
                icon: '✅'
              });
            }
          }
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        // Additional check on key up for better detection
        if (e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
          if (e.code === 'Numpad0' && e.key !== '0') numLockState = false;
          else if (e.code === 'Numpad1' && e.key !== '1') numLockState = false;
          else if (e.code === 'Numpad2' && e.key !== '2') numLockState = false;
          else if (e.code === 'Numpad3' && e.key !== '3') numLockState = false;
          else if (e.code === 'Numpad4' && e.key !== '4') numLockState = false;
          else if (e.code === 'Numpad5' && e.key !== '5') numLockState = false;
          else if (e.code === 'Numpad6' && e.key !== '6') numLockState = false;
          else if (e.code === 'Numpad7' && e.key !== '7') numLockState = false;
          else if (e.code === 'Numpad8' && e.key !== '8') numLockState = false;
          else if (e.code === 'Numpad9' && e.key !== '9') numLockState = false;
          
          setNumLockEnabled(numLockState);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    };

    return checkNumLock();
  }, [hasStarted, isPaused, numLockEnabled]);

  // Periodic Num Lock Status Check (fallback)
  useEffect(() => {
    numLockCheckRef.current = setInterval(() => {
      // Fallback check - create a temporary input to test num lock
      const testInput = document.createElement('input');
      testInput.style.position = 'absolute';
      testInput.style.left = '-9999px';
      testInput.type = 'text';
      document.body.appendChild(testInput);
      
      testInput.focus();
      
      // Simulate numpad key press to test
      const testEvent = new KeyboardEvent('keydown', {
        key: '1',
        code: 'Numpad1',
        location: KeyboardEvent.DOM_KEY_LOCATION_NUMPAD
      });
      
      testInput.dispatchEvent(testEvent);
      
      setTimeout(() => {
        const hasNumber = testInput.value.includes('1');
        document.body.removeChild(testInput);
        
        if (!hasNumber && numLockEnabled) {
          setNumLockEnabled(false);
        }
      }, 50);
    }, 2000);

    return () => {
      if (numLockCheckRef.current) clearInterval(numLockCheckRef.current);
    };
  }, [numLockEnabled]);

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

  // Initialize test
  useEffect(() => {
    initializeTest();
  }, []);

  // Focus input field on mount and when numlock is enabled
  useEffect(() => {
    if (!isLoading && numLockEnabled) {
      setTimeout(() => {
        inputRef.current?.focus();
        setInputHasFocus(true);
      }, 100);
    }
  }, [isLoading, numLockEnabled]);

  const initializeTest = async () => {
    try {
      setIsLoading(true);
      
      // Generate test rows
      const rows = generateTestRows(isPractice, 100);
      setTestRows(rows);
      
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

  // Calculate KPH statistics with proper character-by-character validation
  const calculateStatistics = useCallback(() => {
    if (!testRows.length || currentRowIndex >= testRows.length) return;

    const currentRow = testRows[currentRowIndex];
    if (!currentRow) return;

    const totalChars = inputText.length;
    const expectedChars = currentRow.characters.slice(0, totalChars);
    const correctChars = inputText.split('').filter((char, index) => char === expectedChars[index]).length;
    
    // Accuracy is 0% until at least one key is pressed
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    const timeElapsed = testSession?.timeLimit ? testSession.timeLimit - timeRemaining : 0;
    
    // Calculate KPH (Keystrokes Per Hour)
    const kph = timeElapsed > 0 ? Math.round((totalChars / (timeElapsed / 3600))) : 0;
    const weightedKph = Math.round(kph * (accuracy / 100));

    setStatistics({
      kph,
      accuracy,
      weightedKph,
      correctCharacters: correctChars,
      totalCharacters: totalChars,
      timeElapsed
    });
  }, [testRows, currentRowIndex, inputText, timeRemaining, testSession]);

  // Update statistics periodically while test is running
  useEffect(() => {
    if (hasStarted && !isPaused && !isCompleting) {
      calculateStatistics();
    }
  }, [inputText, currentRowIndex, hasStarted, isPaused, isCompleting, calculateStatistics]);

  // Start test timer and statistics tracking
  const startTest = useCallback(() => {
    if (hasStarted || !numLockEnabled) return;

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

    // Start statistics calculation
    progressIntervalRef.current = setInterval(() => {
      calculateStatistics();
      updateProgress();
    }, 1000);

  }, [hasStarted, numLockEnabled, calculateStatistics]);

  // Resume test
  const resumeTest = useCallback(() => {
    if (!hasStarted || !numLockEnabled) return;

    setIsPaused(false);
    inputRef.current?.focus();

    // Resume countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          completeTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Resume statistics calculation
    progressIntervalRef.current = setInterval(() => {
      calculateStatistics();
      updateProgress();
    }, 1000);
  }, [hasStarted, numLockEnabled, calculateStatistics]);

  // Update progress with KPH calculations
  const updateProgress = async () => {
    if (!testSession || !hasStarted || isCompleting || isPaused) return;

    try {
      const response = await fetch('/api/tests/typing/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testSession.test.id,
          typedText: inputText,
          currentPosition: currentCharIndex,
          currentWordIndex: 0, // Not applicable for 10-key
          testType: '10-key' // Specify test type for KPH calculation
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Convert WPM from API to KPH for display
        const kphStats = {
          ...data.statistics,
          kph: Math.round(data.statistics.wpm * 12), // Approximate conversion
          weightedKph: Math.round(data.statistics.weightedWpm * 12)
        };
        setStatistics(kphStats);
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
          finalTypedText: inputText,
          timeElapsed: testSession.timeLimit - timeRemaining,
          testType: '10-key' // Specify for KPH calculation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete test');
      }

      const data = await response.json();
      
      // Convert results to KPH for 10-key tests
      const enhancedResults = {
        ...data,
        results: {
          ...data.results,
          kph: Math.round(data.results.wpm * 12), // Convert WPM to KPH
          weightedKph: Math.round(data.results.weightedWpm * 12)
        }
      };
      
      onComplete(enhancedResults);

    } catch (error) {
      console.error('Complete test error:', error);
      toast.error('Failed to complete test');
    }
  };

  // Handle row completion
  const handleRowComplete = useCallback(() => {
    if (currentRowIndex < testRows.length - 1) {
      setCurrentRowIndex(prev => prev + 1);
      setInputText('');
      setCurrentCharIndex(0);
    } else {
      // Test complete
      completeTest();
    }
  }, [currentRowIndex, testRows.length]);

  // Enhanced keyboard handling for character entry recording
  useEffect(() => {
    if (!hasStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isCompleting) return;

      const key = e.key;
      
      // Allow numbers, decimals, and math operations
      const isValidKey = /^[0-9+\-*/.=]$/.test(key);
      const isEnter = key === 'Enter';
      const isBackspace = key === 'Backspace';
      
      if (isValidKey) {
        e.preventDefault();
        
        // Add the key to current entry line (even if wrong)
        setAllEntryLines(prev => {
          const newLines = [...prev];
          newLines[currentEntryLineIndex] += key;
          return newLines;
        });
        
        // Update input text to track position against expected text
        const currentRow = testRows[currentRowIndex];
        if (currentRow && inputText.length < currentRow.characters.length) {
          const expectedChar = currentRow.characters[inputText.length];
          if (key === expectedChar) {
            setInputText(prev => prev + key);
          } else {
            // Check if this key matches a character ahead (skip ahead logic)
            const nextChar1 = currentRow.characters[inputText.length + 1];
            const nextChar2 = currentRow.characters[inputText.length + 2];
            
            if (key === nextChar1) {
              // Skip ahead by 1
              setInputText(prev => prev + currentRow.characters[inputText.length] + key);
            } else if (key === nextChar2) {
              // Skip ahead by 2
              setInputText(prev => prev + currentRow.characters[inputText.length] + currentRow.characters[inputText.length + 1] + key);
            } else {
              // Wrong key, but still advance position for tracking purposes
              setInputText(prev => prev + key);
            }
          }
        }
        
      } else if (isEnter) {
        e.preventDefault();
        
        // Add enter to current line and create new line
        setAllEntryLines(prev => {
          const newLines = [...prev, ''];
          return newLines;
        });
        setCurrentEntryLineIndex(prev => prev + 1);
        
        // Check if current row is complete
        const currentRow = testRows[currentRowIndex];
        if (currentRow && inputText.length >= currentRow.characters.length) {
          handleRowComplete();
        } else {
          // Move to next row even if not complete
          if (currentRowIndex < testRows.length - 1) {
            setCurrentRowIndex(prev => prev + 1);
            setInputText('');
            setCurrentCharIndex(0);
          }
        }
        
      } else if (isBackspace) {
        e.preventDefault();
        
        setAllEntryLines(prev => {
          const newLines = [...prev];
          const currentLine = newLines[currentEntryLineIndex];
          
          if (currentLine.length > 0) {
            // Remove last character from current line
            newLines[currentEntryLineIndex] = currentLine.slice(0, -1);
            
            // Update input text (move cursor back)
            if (inputText.length > 0) {
              const newInputText = inputText.slice(0, -1);
              setInputText(newInputText);
            }
            
          } else if (currentEntryLineIndex > 0) {
            // Current line is empty, move to previous line
            newLines.pop(); // Remove empty line
            setCurrentEntryLineIndex(prev => prev - 1);
            
            // Move back to previous row
            if (currentRowIndex > 0) {
              setCurrentRowIndex(prev => prev - 1);
              
              // Restore the input text for the previous row
              const prevRow = testRows[currentRowIndex - 1];
              if (prevRow) {
                const prevLineContent = newLines[currentEntryLineIndex - 1] || '';
                // Set input text to match what was entered for this row
                setInputText(prevLineContent.slice(0, prevRow.characters.length));
              }
            }
          }
          
          return newLines;
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isPaused, isCompleting, testRows, currentRowIndex, inputText, currentEntryLineIndex, handleRowComplete]);

  // Handle text input with character-by-character validation
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const lines = newValue.split('\n');
    
    // Update allEntryLines with the new content
    setAllEntryLines(lines);
    
    // Update current entry line index to the last line
    setCurrentEntryLineIndex(lines.length - 1);
    
    // If user hasn't started, start the test
    if (!hasStarted && newValue.length > 0 && numLockEnabled) {
      startTest();
      return;
    }
    
    if (!hasStarted || isCompleting || isPaused || !numLockEnabled || currentRowIndex >= testRows.length) return;

    const currentRow = testRows[currentRowIndex];
    if (!currentRow) return;
    
    // Get the current line (last line)
    const currentLineText = lines[lines.length - 1] || '';
    
    // Only allow characters that are valid for 10-key (numbers, operators, decimal points)
    const validText = currentLineText.replace(/[^0-9+\-*/\.]/g, '');
    
    // Update input text for position tracking
    setInputText(validText);
    setCurrentCharIndex(validText.length);
    
    // Update the current line in allEntryLines with valid text
    const updatedLines = [...lines];
    updatedLines[updatedLines.length - 1] = validText;
    setAllEntryLines(updatedLines);
  };

  // Handle key press for start trigger and special keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Start test when spacebar or enter is pressed
    if (!hasStarted && (e.key === ' ' || e.key === 'Enter') && numLockEnabled) {
      e.preventDefault();
      startTest();
      return;
    }
    
    if (!hasStarted || isCompleting || isPaused) return;
    
    const currentRow = testRows[currentRowIndex];
    if (!currentRow) return;
    
    // Handle Enter key - complete row regardless of position
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRowComplete();
      return;
    }
    
    // Handle Backspace with improved functionality
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (inputText.length > 0) {
        // Remove last character from current row
        const newText = inputText.slice(0, -1);
        setInputText(newText);
        setCurrentCharIndex(newText.length);
      } else if (currentRowIndex > 0) {
        // Go back to previous row if at beginning of current row
        const prevRow = testRows[currentRowIndex - 1];
        if (prevRow) {
          setCurrentRowIndex(prev => prev - 1);
          setInputText(prevRow.content); // Restore previous row's content
          setCurrentCharIndex(prevRow.characters.length);
        }
      }
      return;
    }
    
    // Handle numeric keypad input with enhanced validation
    if (e.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
      if (!numLockEnabled) {
        e.preventDefault();
        return;
      }
      
      const char = e.key;
      if (/[0-9+\-*/\.]/.test(char)) {
        // Let the normal input handling take care of character validation
        // This is handled in handleTextChange
      }
    }
  };

  // Prevent clicking outside text area
  const preventClick = (e: React.MouseEvent) => {
    if (hasStarted && !isPaused && e.target !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    }
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
            10-Key typing tests require a desktop computer with a numeric keypad.
          </p>
          <Button onClick={onCancel} variant="outline">
            Return to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading enhanced 10-key test...</div>
        </CardContent>
      </Card>
    );
  }

  if (!testSession) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Failed to load 10-key test</p>
          <Button onClick={onCancel} className="mt-4" variant="outline">
            Return to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Use stats to calculate remaining time and progress
  const currentRow = testRows[currentRowIndex];
  const progressPercent = testRows.length > 0 ? Math.round((currentRowIndex / testRows.length) * 100) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" onClick={preventClick}>
      {/* Header Stats with KPH */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className={isPaused ? 'border-amber-300 bg-amber-50' : ''}>
          <CardContent className="p-4 text-center">
            <Clock className={`w-5 h-5 mx-auto mb-2 ${isPaused ? 'text-amber-500' : 'text-blue-500'}`} />
            <div className={`text-2xl font-bold ${isPaused ? 'text-amber-600' : ''}`}>
              {isPaused ? <Pause className="w-6 h-6 mx-auto" /> : `${timeRemaining}s`}
            </div>
            <div className="text-sm text-gray-500">{isPaused ? 'Paused' : 'Time Left'}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{statistics.kph}</div>
            <div className="text-sm text-gray-500">KPH</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{statistics.accuracy}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Hash className="w-5 h-5 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{statistics.weightedKph}</div>
            <div className="text-sm text-gray-500">Weighted KPH</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statistics.correctCharacters}/{statistics.totalCharacters}</div>
            <div className="text-sm text-gray-500">Keystrokes</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Progress and Type Badge */}
      <div className="flex justify-center items-center gap-4">
        <Badge className={`text-lg px-6 py-3 ${isPaused ? 'bg-amber-500' : 'bg-blue-500'} text-white`}>
          <Hash className="w-4 h-4 mr-2" />
          Enhanced 10-Key Test {isPractice && '(Practice)'}
        </Badge>
        <div className="text-sm text-gray-600">
          Progress: {progressPercent}% ({currentRowIndex + 1} / {testRows.length} rows)
        </div>
      </div>

      {/* Enhanced Vertical Character Display */}
      {testRows.length > 0 && (
        <VerticalCharacterDisplay 
          rows={testRows}
          currentRowIndex={currentRowIndex}
          currentCharIndex={currentCharIndex}
          inputText={inputText}
          isTestRunning={hasStarted && !isPaused}
          isNumLockEnabled={numLockEnabled}
          onRowComplete={handleRowComplete}
        />
      )}

      {/* Enhanced Statistics Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Hash className="w-5 h-5" />
            Enhanced 10-Key Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{statistics.kph}</div>
              <div className="text-sm text-gray-600">Keystrokes Per Hour</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{Math.round(statistics.kph / 60)}</div>
              <div className="text-sm text-gray-600">Keystrokes Per Minute</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{statistics.accuracy}%</div>
              <div className="text-sm text-gray-600">Current Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">{statistics.weightedKph}</div>
              <div className="text-sm text-gray-600">Accuracy-Adjusted KPH</div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            Enhanced features: Vertical scrolling display • Real-time Num Lock detection • Character-by-character validation • KPH-based scoring
          </div>
        </CardContent>
      </Card>

      {/* Input Area - Functional Entry Box */}
      <div className="relative">
        <Card className="border-gray-300">
          <CardContent className="p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {inputHasFocus ? "Type here to enter characters:" : "Character Entry Box (Click to start typing):"}
              </label>
              <textarea
                ref={inputRef}
                value={allEntryLines.join('\n')}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputHasFocus(true)}
                onBlur={() => setInputHasFocus(false)}
                className={`w-full p-3 border rounded font-mono text-lg min-h-[8rem] cursor-text transition-all resize-none ${
                  numLockEnabled && !isPaused
                    ? 'bg-green-50 border-green-300 hover:bg-green-100 focus:bg-green-100 focus:border-green-400' 
                    : 'bg-red-50 border-red-300'
                }`}
                placeholder={
                  !hasStarted 
                    ? (inputHasFocus ? "Characters will appear here as you type..." : "Click HERE and start typing numbers")
                    : "Characters will appear here as you type..."
                }
                autoComplete="off"
                autoFocus
                disabled={isPaused || isCompleting || !numLockEnabled}
                spellCheck={false}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Start Instructions */}
        {!hasStarted && (
          <Card className="border-green-200 bg-green-50 mt-4">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="text-2xl font-bold text-green-700 mb-2">Ready to Begin Enhanced 10-Key Test</div>
                <p className="text-gray-600">
                  Features: Vertical character display • Character-by-character validation • Real-time accuracy feedback • KPH calculations
                </p>
              </div>
              
              {numLockEnabled ? (
                <div>
                  <p className="text-lg mb-4">
                    {inputHasFocus ? (
                      <>Press <kbd className="px-3 py-1 bg-white border rounded">Spacebar</kbd> or <kbd className="px-3 py-1 bg-white border rounded">Enter</kbd> to start</>
                    ) : (
                      <>Click in green character entry area ABOVE...</>
                    )}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">Num Lock is ON - Ready to start!</span>
                  </div>
                </div>
              ) : (
                <div>
                  <Alert className="mb-4">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="text-red-600 font-semibold">
                      Please enable Num Lock to start the enhanced 10-key test
                    </AlertDescription>
                  </Alert>
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">Num Lock is OFF - Cannot start test</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {hasStarted && !isCompleting && (
          <Button 
            onClick={isPaused ? resumeTest : () => setIsPaused(true)} 
            size="lg"
            className={isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
            disabled={!numLockEnabled}
          >
            {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
            {isPaused ? 'Resume Test' : 'Pause Test'}
          </Button>
        )}
        
        <Button onClick={onCancel} variant="outline" size="lg" disabled={isCompleting}>
          Cancel Test
        </Button>
      </div>

      {isCompleting && (
        <div className="text-center text-blue-600">
          <div className="animate-pulse">Calculating enhanced KPH results...</div>
        </div>
      )}
    </div>
  );
}
