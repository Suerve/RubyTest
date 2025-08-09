
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Target, TrendingUp, Keyboard, Hash, Play, Pause, Calculator, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PracticeTypingTestProps {
  testType: 'keyboarding' | '10-key';
  onComplete: (results: any) => void;
  onCancel: () => void;
}

interface Statistics {
  wpm: number;
  accuracy: number;
  weightedWpm: number;
  kph: number; // Added for 10-key tests
  weightedKph: number; // Added for 10-key tests
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
  triggerAnimation: boolean;
  onAnimationComplete: () => void;
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

// Vertical Character Display Component for 10-key
function VerticalCharacterDisplay({ 
  rows, 
  currentRowIndex, 
  currentCharIndex, 
  inputText, 
  isTestRunning, 
  isNumLockEnabled, 
  onRowComplete,
  triggerAnimation,
  onAnimationComplete
}: VerticalDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle animation trigger
  useEffect(() => {
    if (triggerAnimation && !isAnimating) {
      setIsAnimating(true);
      
      // Don't change scrollOffset here - rows are managed by currentRowIndex
      
      setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete();
        onRowComplete();
      }, 300);
    }
  }, [triggerAnimation, isAnimating, onAnimationComplete, onRowComplete]);

  // Get the three visible rows - always show current row in middle
  const getVisibleRows = () => {
    const startRow = Math.max(0, currentRowIndex - 1);
    return [
      rows[startRow] || { content: '', characters: [] },     // Top row (previous)
      rows[startRow + 1] || { content: '', characters: [] }, // Middle row (current)
      rows[startRow + 2] || { content: '', characters: [] }  // Bottom row (next)
    ];
  };

  const visibleRows = getVisibleRows();
  const currentRow = rows[currentRowIndex];

  // Character validation logic
  const getCharacterStatus = (rowIndex: number, charIndex: number) => {
    const globalRowIndex = currentRowIndex - 1 + rowIndex;
    const row = rows[globalRowIndex];
    
    if (!row) return { status: 'pending', char: '' };
    
    const char = row.characters[charIndex];
    if (!char) return { status: 'pending', char: '' };

    // For completed rows (above current)
    if (globalRowIndex < currentRowIndex) {
      return { status: 'completed', char };
    } 
    // For the current active row (middle row)
    else if (globalRowIndex === currentRowIndex) {
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
    } 
    // For future rows (below current)
    else {
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
              key={`row-${currentRowIndex - 1 + rowIndex}`}
              className={`
                flex justify-center items-center gap-1 transition-all duration-300 ease-in-out transform
                ${isMiddleRow ? 'scale-125 z-10' : 'scale-90 opacity-50'}
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
                      ${isMiddleRow && charStatus.status === 'correct' ? 'bg-green-500/20' : ''}
                      ${isMiddleRow && charStatus.status === 'incorrect' ? 'bg-red-500/20 animate-pulse' : ''}
                      ${isMiddleRow && charStatus.status === 'current' ? 'bg-blue-500/20' : ''}
                    `} />
                    
                    {/* Character Display */}
                    <div className={`
                      relative z-10 transition-all duration-200
                      ${shouldObfuscate ? 'blur-sm opacity-30' : ''}
                      ${isMiddleRow && charStatus.status === 'correct' ? 'text-green-400' : ''}
                      ${isMiddleRow && charStatus.status === 'incorrect' ? 'text-red-400' : ''}
                      ${isMiddleRow && charStatus.status === 'current' ? 'text-white' : ''}
                      ${isMiddleRow && charStatus.status === 'completed' ? 'text-blue-300' : ''}
                      ${isMiddleRow && charStatus.status === 'pending' ? 'text-white' : ''}
                      ${!isMiddleRow ? 'text-gray-400' : ''}
                    `}>
                      {shouldObfuscate ? '?' : (charStatus.char || '')}
                    </div>
                    
                    {/* Current Position Indicator */}
                    {isMiddleRow && charStatus.status === 'current' && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-white animate-bounce" />
                      </div>
                    )}
                    
                    {/* End of Row Triangle - show when cursor is at the end of the middle row */}
                    {isMiddleRow && charIndex === row.characters.length && charStatus.status === 'pending' && inputText.length === row.characters.length && (
                      <div className="relative w-12 h-16 flex items-center justify-center">
                        <div className="text-white animate-pulse text-4xl">▶</div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-white animate-bounce" />
                        </div>
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
              Characters are unreadable when Num Lock is disabled!
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
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
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

// Practice content - no database calls
const practiceContent = {
  keyboarding: [
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
    "Practice makes perfect when learning to type efficiently and accurately on a computer keyboard.",
    "Technology advances rapidly in our modern world, requiring strong typing skills for success.",
    "Proper finger placement and technique are essential for developing fast and accurate typing abilities.",
    "Communication through digital media has become increasingly important in professional environments."
  ],
  '10-key': [
    "123 456 789 0 147 258 369 741 852 963",
    "111 222 333 444 555 666 777 888 999 000",
    "192 837 465 573 928 164 385 729 648 351",
    "456 123 789 321 654 987 147 258 369 741",
    "804 517 293 682 475 139 628 954 317 586"
  ]
};

export default function PracticeTypingTest({ testType, onComplete, onCancel }: PracticeTypingTestProps) {
  const [currentContent, setCurrentContent] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds for practice
  const [statistics, setStatistics] = useState<Statistics>({
    wpm: 0,
    accuracy: 0, // Start at 0% until first keystroke like enhanced version
    weightedWpm: 0,
    kph: 0,
    weightedKph: 0,
    correctCharacters: 0,
    totalCharacters: 0,
    timeElapsed: 0
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [numLockEnabled, setNumLockEnabled] = useState(true);
  const [numLockWarningShown, setNumLockWarningShown] = useState(false);

  // New state variables for row-based 10-key tests
  const [testRows, setTestRows] = useState<TestRow[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [allEntryLines, setAllEntryLines] = useState<string[]>(['']); // Track all entry lines for backspace handling
  const [currentEntryLineIndex, setCurrentEntryLineIndex] = useState(0);
  const [shouldTriggerAnimation, setShouldTriggerAnimation] = useState(false);
  
  // State for tracking input focus for dynamic text
  const [inputHasFocus, setInputHasFocus] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const statsIntervalRef = useRef<NodeJS.Timeout>();
  const numLockCheckRef = useRef<NodeJS.Timeout>();

  // Initialize practice content
  useEffect(() => {
    if (testType === '10-key') {
      // Generate test rows for 10-key practice
      const rows = generateTestRows(true, 50); // Always use practice mode for practice tests
      setTestRows(rows);
      setCurrentContent(''); // Not needed for row-based tests
    } else {
      const contentArray = practiceContent[testType];
      const randomContent = contentArray[Math.floor(Math.random() * contentArray.length)];
      setCurrentContent(randomContent);
    }
  }, [testType]);

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

  // Enhanced Num Lock Detection for 10-key tests
  useEffect(() => {
    if (testType !== '10-key') return;
    
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
              if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
              
              toast.error('Practice paused - Num Lock disabled!', {
                duration: 3000,
                icon: '⚠️'
              });
            } else if (numLockState && hasStarted && isPaused) {
              // Resume test when Num Lock is re-enabled
              resumeTest();
              toast.success('Practice resumed - Num Lock enabled!', {
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

  // Calculate statistics
  const calculateStatistics = useCallback(() => {
    let totalChars = 0;
    let correctChars = 0;
    
    if (testType === '10-key') {
      // Row-based 10-key calculation based on actual keystrokes in character input box
      if (!testRows.length) {
        // Initialize default statistics for safety
        setStatistics(prev => ({ ...prev, 
          correctCharacters: 0,
          totalCharacters: 0,
          timeElapsed: 30 - timeRemaining
        }));
        return;
      }
      
      // Count all keystrokes from all entry lines (excluding newlines)
      const allKeystrokes = allEntryLines.join('').replace(/\n/g, '');
      totalChars = allKeystrokes.length;
      
      // Calculate correct characters by comparing against expected text across all rows
      correctChars = 0;
      
      for (let rowIndex = 0; rowIndex <= Math.min(currentRowIndex, testRows.length - 1); rowIndex++) {
        const row = testRows[rowIndex];
        if (!row) continue;
        
        const lineContent = allEntryLines[rowIndex] || '';
        
        // Count correct characters in this line
        for (let charIndex = 0; charIndex < Math.min(lineContent.length, row.characters.length); charIndex++) {
          if (lineContent[charIndex] === row.characters[charIndex]) {
            correctChars++;
          }
        }
      }
    } else {
      // Traditional keyboard test calculation
      if (!currentContent || !typedText) {
        // Initialize default statistics for safety
        setStatistics(prev => ({ ...prev, 
          correctCharacters: 0,
          totalCharacters: 0,
          timeElapsed: 30 - timeRemaining
        }));
        return;
      }
      
      totalChars = typedText.length;
      correctChars = typedText.split('').filter((char, index) => char === currentContent[index]).length;
    }
    
    // Accuracy is 0% until at least one key is pressed (like enhanced version)
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    const timeElapsed = 30 - timeRemaining;
    
    let wpm, weightedWpm, kph, weightedKph;
    
    if (testType === '10-key') {
      // Calculate KPH (Keystrokes Per Hour) for 10-key practice
      const elapsedHours = timeElapsed / 3600;
      kph = (elapsedHours > 0 && totalChars > 0) ? Math.round(totalChars / elapsedHours) : 0;
      weightedKph = Math.round(kph * (accuracy / 100));
      
      // For compatibility, also calculate equivalent WPM (avoid division by zero)
      wpm = kph > 0 ? Math.round(kph / 12) : 0;
      weightedWpm = weightedKph > 0 ? Math.round(weightedKph / 12) : 0;
    } else {
      // Calculate WPM for keyboard practice
      const elapsedMinutes = timeElapsed / 60;
      wpm = (elapsedMinutes > 0 && totalChars > 0) ? Math.round((totalChars / 5) / elapsedMinutes) : 0;
      weightedWpm = Math.round(wpm * (accuracy / 100));
      
      // Convert to approximate KPH
      kph = Math.round(wpm * 12);
      weightedKph = Math.round(weightedWpm * 12);
    }

    setStatistics({
      wpm: wpm || 0,
      accuracy: accuracy || 0,
      weightedWpm: weightedWpm || 0,
      kph: kph || 0,
      weightedKph: weightedKph || 0,
      correctCharacters: correctChars || 0,
      totalCharacters: totalChars || 0,
      timeElapsed: timeElapsed || 0
    });
  }, [currentContent, typedText, timeRemaining, testType, testRows, currentRowIndex, allEntryLines]);

  // Complete test
  const completeTest = useCallback(async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    
    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);

    // Calculate final statistics directly (synchronously)
    let totalChars = 0;
    let correctChars = 0;
    
    if (testType === '10-key') {
      // Row-based 10-key calculation based on actual keystrokes in character input box
      if (testRows.length > 0) {
        // Count all keystrokes from all entry lines (excluding newlines)
        const allKeystrokes = allEntryLines.join('').replace(/\n/g, '');
        totalChars = allKeystrokes.length;
        
        // Calculate correct characters by comparing against expected text across all rows
        correctChars = 0;
        
        for (let rowIndex = 0; rowIndex <= Math.min(currentRowIndex, testRows.length - 1); rowIndex++) {
          const row = testRows[rowIndex];
          if (!row) continue;
          
          const lineContent = allEntryLines[rowIndex] || '';
          
          // Count correct characters in this line
          for (let charIndex = 0; charIndex < Math.min(lineContent.length, row.characters.length); charIndex++) {
            if (lineContent[charIndex] === row.characters[charIndex]) {
              correctChars++;
            }
          }
        }
      }
    } else {
      // Traditional keyboard test calculation
      if (currentContent && typedText) {
        totalChars = typedText.length;
        correctChars = typedText.split('').filter((char, index) => char === currentContent[index]).length;
      }
    }
    
    // Calculate final statistics
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    const timeElapsed = 30 - timeRemaining;
    
    let wpm, weightedWpm, kph, weightedKph;
    
    if (testType === '10-key') {
      // Calculate KPH (Keystrokes Per Hour) for 10-key practice
      const elapsedHours = timeElapsed / 3600;
      kph = (elapsedHours > 0 && totalChars > 0) ? Math.round(totalChars / elapsedHours) : 0;
      weightedKph = Math.round(kph * (accuracy / 100));
      
      // For compatibility, also calculate equivalent WPM (avoid division by zero)
      wpm = kph > 0 ? Math.round(kph / 12) : 0;
      weightedWpm = weightedKph > 0 ? Math.round(weightedKph / 12) : 0;
    } else {
      // Calculate WPM for keyboard practice
      const elapsedMinutes = timeElapsed / 60;
      wpm = (elapsedMinutes > 0 && totalChars > 0) ? Math.round((totalChars / 5) / elapsedMinutes) : 0;
      weightedWpm = Math.round(wpm * (accuracy / 100));
      
      // Convert to approximate KPH
      kph = Math.round(wpm * 12);
      weightedKph = Math.round(weightedWpm * 12);
    }

    const finalStatistics = {
      wpm: wpm || 0,
      accuracy: accuracy || 0,
      weightedWpm: weightedWpm || 0,
      kph: kph || 0,
      weightedKph: weightedKph || 0,
      correctCharacters: correctChars || 0,
      totalCharacters: totalChars || 0,
      timeElapsed: timeElapsed || 0
    };

    // Update statistics state as well
    setStatistics(finalStatistics);

    // Create practice results (no database storage)
    const practiceResults = {
      testType,
      statistics: finalStatistics,
      content: testType === '10-key' ? testRows.map(row => row.content).join('\n') : currentContent,
      typedText: testType === '10-key' ? inputText : typedText,
      isPractice: true,
      completedAt: new Date().toISOString(),
      // Additional 10-key specific data
      ...(testType === '10-key' && {
        currentRow: currentRowIndex,
        totalRows: testRows.length,
        rowCompletion: testRows.length > 0 ? currentRowIndex / testRows.length : 0
      })
    };

    // Return results after a brief delay
    setTimeout(() => {
      onComplete(practiceResults);
    }, 1000);
  }, [isCompleting, testType, timeRemaining, testRows, currentContent, inputText, typedText, currentRowIndex, allEntryLines, onComplete]);

  // Handle row completion for 10-key tests (called after animation completes)
  const handleRowComplete = useCallback(() => {
    // Row transition is now handled immediately in Enter key logic
    // This function is kept for animation completion callback
  }, []);

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    setShouldTriggerAnimation(false);
  }, []);

  // Enhanced keyboard handling for 10-key tests
  useEffect(() => {
    if (testType !== '10-key' || !hasStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isCompleting) return;

      const key = e.key;
      
      // Allow numbers, decimals, and math operations
      const isValidKey = /^[0-9+\-*/.=]$/.test(key);
      const isEnter = key === 'Enter';
      const isBackspace = key === 'Backspace';
      const isInvalidButEligible = /^[a-zA-Z!@#$%^&()_\-=+\[\]{}\\|;:'",<>\/?`~]$/.test(key); // Other keyboard chars
      
      if (isValidKey || isInvalidButEligible) {
        e.preventDefault();
        
        if (isValidKey) {
          // Add the key to current entry line (display all eligible characters)
          setAllEntryLines(prev => {
            const newLines = [...prev];
            newLines[currentEntryLineIndex] += key;
            return newLines;
          });
          
          // Update input text to track position against expected text
          const currentRow = testRows[currentRowIndex];
          if (currentRow) {
            const expectedChar = currentRow.characters[inputText.length];
            const nextChar1 = currentRow.characters[inputText.length + 1];
            const nextChar2 = currentRow.characters[inputText.length + 2];
            
            if (key === expectedChar) {
              // Correct character - advance position normally
              setInputText(prev => prev + key);
            } else if (key === nextChar1) {
              // Skip current character and match the next one
              setInputText(prev => prev + expectedChar + key);
            } else if (key === nextChar2) {
              // Skip two characters and match the third one
              setInputText(prev => prev + expectedChar + nextChar1 + key);
            } else {
              // Incorrect character - still advance position for tracking
              setInputText(prev => prev + key);
            }
          }
        } else {
          // Invalid character - embolden the "Use Number Pad Only" message
          const headerElement = document.querySelector('.text-orange-700') as HTMLElement;
          if (headerElement) {
            headerElement.style.fontWeight = 'bold';
            headerElement.style.animation = 'pulse 0.5s';
            setTimeout(() => {
              headerElement.style.fontWeight = '';
              headerElement.style.animation = '';
            }, 1000);
          }
        }
        
      } else if (isEnter) {
        e.preventDefault();
        
        // Move cursor to next line in character entry box
        setAllEntryLines(prev => {
          const newLines = [...prev, ''];
          return newLines;
        });
        setCurrentEntryLineIndex(prev => prev + 1);
        
        // Move to next row immediately
        if (currentRowIndex < testRows.length - 1) {
          setCurrentRowIndex(prev => prev + 1);
          setInputText(''); // Reset input text for new row
          setCurrentCharIndex(0); // Reset character index
          
          // Trigger scrolling animation
          setShouldTriggerAnimation(true);
        } else {
          // All rows complete
          completeTest();
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
            
            // Move back to previous row and restore character cursor position
            if (currentRowIndex > 0) {
              setCurrentRowIndex(prev => prev - 1);
              
              // Restore the input text for the previous row
              const prevRow = testRows[currentRowIndex - 1];
              if (prevRow) {
                const prevLineContent = newLines[currentEntryLineIndex - 1] || '';
                // Set input text to match what was correctly entered for this row
                let restoredText = '';
                for (let i = 0; i < Math.min(prevLineContent.length, prevRow.characters.length); i++) {
                  if (prevLineContent[i] === prevRow.characters[i]) {
                    restoredText += prevLineContent[i];
                  } else {
                    break; // Stop at first incorrect character
                  }
                }
                setInputText(restoredText);
              }
            }
          }
          // If at very beginning, do nothing (as required)
          
          return newLines;
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [testType, hasStarted, isPaused, isCompleting, testRows, currentRowIndex, inputText, currentEntryLineIndex, handleRowComplete, completeTest]);

  // Resume test after pause
  const resumeTest = useCallback(() => {
    if (!hasStarted || !isPaused) return;

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
    statsIntervalRef.current = setInterval(() => {
      calculateStatistics();
    }, 1000);

  }, [hasStarted, isPaused, calculateStatistics, completeTest]);

  // Start test timer and statistics tracking
  const startTest = useCallback(() => {
    if (hasStarted) return;

    setHasStarted(true);
    setIsPaused(false);
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
    statsIntervalRef.current = setInterval(() => {
      calculateStatistics();
    }, 1000);

  }, [hasStarted, calculateStatistics, completeTest]);



  // Handle text input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    if (testType === '10-key') {
      // For 10-key tests, prevent manual text changes as we handle input via keyboard events
      // This maintains the display but prevents conflicts
      return;
    } else {
      if (!hasStarted || isCompleting || isPaused) return;
      
      // Handle regular keyboard typing
      setTypedText(newValue);
      setCurrentPosition(newValue.length);

      // Calculate current word index
      const words = currentContent.split(' ');
      let charCount = 0;
      let wordIndex = 0;

      for (let i = 0; i < words.length; i++) {
        if (charCount + words[i].length >= newValue.length) {
          wordIndex = i;
          break;
        }
        charCount += words[i].length + 1; // +1 for space
      }

      setCurrentWordIndex(wordIndex);
    }
  };

  // Handle focus loss for 10-key tests
  const handleInputBlur = useCallback(() => {
    if (testType === '10-key' && hasStarted && !isPaused && !isCompleting) {
      // Pause test when focus is lost
      setIsPaused(true);
      setInputHasFocus(false);
      
      // Clear timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      
      toast('Practice paused - input lost focus', {
        duration: 2000,
        icon: '⏸️'
      });
    }
  }, [testType, hasStarted, isPaused, isCompleting]);

  // Handle focus gain for 10-key tests
  const handleInputFocus = useCallback(() => {
    setInputHasFocus(true);
    
    if (testType === '10-key' && hasStarted && isPaused && !isCompleting) {
      // Resume test when focus is regained
      resumeTest();
    }
    
    // For 10-key tests, always ensure cursor is at end
    if (testType === '10-key' && inputRef.current) {
      const textarea = inputRef.current;
      setTimeout(() => {
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }, 0);
    }
  }, [testType, hasStarted, isPaused, isCompleting, resumeTest]);

  // Prevent manual cursor repositioning for 10-key tests
  const handleTextareaClick = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (testType === '10-key' && inputRef.current) {
      e.preventDefault();
      const textarea = inputRef.current;
      setTimeout(() => {
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }, 0);
    }
  }, [testType]);

  // Handle key press for start trigger
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Start test when spacebar or enter is pressed
    if (!hasStarted && (e.key === ' ' || e.key === 'Enter') && (testType !== '10-key' || numLockEnabled)) {
      e.preventDefault();
      startTest();
      return;
    }
    
    // For 10-key tests, all keyboard handling is done through the global event listener
    // For regular typing tests, let the default behavior handle input
  };

  // Prevent arrow key cursor movement for 10-key tests
  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (testType === '10-key') {
      const isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key);
      if (isArrowKey) {
        e.preventDefault();
        // Keep cursor at end
        if (inputRef.current) {
          const textarea = inputRef.current;
          setTimeout(() => {
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
          }, 0);
        }
        return;
      }
    }
    
    // Also call the original keydown handler
    handleKeyDown(e);
  }, [testType]);

  // Prevent clicking outside text area
  const preventClick = (e: React.MouseEvent) => {
    if (hasStarted && e.target !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  // Render word with highlighting
  const renderWords = () => {
    if (!currentContent) return null;

    const words = currentContent.split(' ');
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

  // Show num lock warning for 10-key
  if (testType === '10-key' && !numLockEnabled && hasStarted) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <Hash className="w-5 h-5" />
            Num Lock Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-4">
            Please enable Num Lock on your keyboard to practice the 10-key typing test.
          </p>
          <Button onClick={onCancel} variant="outline">
            Return to Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Only show loading for keyboard tests that haven't loaded content, or 10-key tests that haven't loaded rows
  if ((testType === 'keyboarding' && !currentContent) || (testType === '10-key' && testRows.length === 0)) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading practice content...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" onClick={preventClick}>
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-blue-600">{timeRemaining}s</div>
            <div className="text-sm text-gray-500">Time Left</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{testType === '10-key' ? statistics.kph : statistics.wpm}</div>
            <div className="text-sm text-gray-500">{testType === '10-key' ? 'KPH' : 'WPM'}</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold">{statistics.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <Keyboard className="w-5 h-5 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{testType === '10-key' ? statistics.weightedKph : statistics.weightedWpm}</div>
            <div className="text-sm text-gray-500">{testType === '10-key' ? 'Weighted KPH' : 'Weighted WPM'}</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statistics.correctCharacters}/{statistics.totalCharacters}</div>
            <div className="text-sm text-gray-500">Characters</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Type Badge */}
      <div className="flex justify-center">
        <Badge className="text-lg px-6 py-3 bg-blue-500 text-white">
          <Play className="w-4 h-4 mr-2" />
          {testType === 'keyboarding' ? 'Keyboard' : '10-Key'} Practice Test
        </Badge>
      </div>

      {/* Text Display */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-center text-blue-700">
            {!hasStarted ? 
              (testType === '10-key' ? 
                (inputHasFocus ? 'Press SPACEBAR or ENTER to begin practice' : 'Click in green character entry area BELOW...') :
                'Press SPACEBAR or ENTER to begin practice'
              ) : 
              `Type the following ${testType === '10-key' ? 'numbers' : 'text'}:`
            }
          </CardTitle>
          {testType === '10-key' && (
            <div className="text-center">
              <Badge variant="secondary" className="text-orange-700 bg-orange-100">
                <Calculator className="w-4 h-4 mr-2" />
                Practice Mode - Use Number Pad Only
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {testType === '10-key' ? (
            // Use enhanced vertical display for 10-key tests
            <VerticalCharacterDisplay 
              rows={testRows}
              currentRowIndex={currentRowIndex}
              currentCharIndex={currentCharIndex}
              inputText={inputText}
              isTestRunning={hasStarted && !isPaused}
              isNumLockEnabled={numLockEnabled}
              onRowComplete={handleRowComplete}
              triggerAnimation={shouldTriggerAnimation}
              onAnimationComplete={handleAnimationComplete}
            />
          ) : (
            // Use horizontal display for keyboard tests
            <>
              <div className="bg-blue-50 p-6 rounded-lg mb-4 min-h-[120px] flex items-center justify-center border border-blue-200">
                {renderWords()}
              </div>
              
              {/* Input Area */}
              <textarea
                ref={inputRef}
                value={typedText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                disabled={isCompleting}
                className="w-full h-32 p-4 border-2 border-blue-300 rounded-lg font-mono text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={!hasStarted ? "Press SPACEBAR or ENTER to start practicing..." : "Start typing here..."}
              />
            </>
          )}
          
          {/* Input Area for 10-key (separate positioning) */}
          {testType === '10-key' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {inputHasFocus ? "Type here to enter characters:" : "Click here to start typing:"}
              </label>
              <textarea
                ref={inputRef}
                value={allEntryLines.join('\n')}
                onChange={handleTextChange}
                onKeyDown={handleTextareaKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onClick={handleTextareaClick}
                disabled={isCompleting || !numLockEnabled || isPaused}
                className={`w-full h-40 p-4 border-2 rounded-lg font-mono text-lg resize-none focus:outline-none focus:ring-2 transition-all cursor-text ${
                  numLockEnabled && !isPaused
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50 hover:bg-green-100' 
                    : 'border-red-300 bg-red-50 opacity-50'
                }`}
                placeholder={
                  !hasStarted 
                    ? (inputHasFocus ? "Press SPACEBAR or ENTER to start practicing..." : "Click HERE and start typing numbers")
                    : isPaused 
                    ? "Test paused - click to resume..."
                    : "Use number pad to type..."
                }
                autoComplete="off"
                spellCheck={false}
                autoFocus
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {!hasStarted && (
          <Button onClick={startTest} size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
            <Play className="w-4 h-4 mr-2" />
            Start Practice
          </Button>
        )}
        
        {hasStarted && isPaused && (
          <Button onClick={resumeTest} size="lg" className="px-8 bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            Resume Practice
          </Button>
        )}
        
        {hasStarted && !isPaused && !isCompleting && (
          <Button onClick={completeTest} size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
            Complete Practice
          </Button>
        )}
        
        <Button onClick={onCancel} variant="outline" size="lg">
          {isPaused ? 'Cancel Practice' : 'Cancel Practice'}
        </Button>
      </div>

      {isCompleting && (
        <div className="text-center text-blue-600">
          <div className="animate-pulse">Calculating practice results...</div>
        </div>
      )}
    </div>
  );
}
