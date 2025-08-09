
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Keyboard, 
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Play,
  Ban
} from 'lucide-react';

interface PracticeTypingResultsProps {
  results: {
    testType: 'keyboarding' | '10-key';
    statistics: {
      wpm: number;
      accuracy: number;
      weightedWpm: number;
      kph: number; // Added for 10-key tests
      weightedKph: number; // Added for 10-key tests
      correctCharacters: number;
      totalCharacters: number;
      timeElapsed: number;
    };
    content: string;
    typedText: string;
    isPractice: boolean;
    completedAt: string;
  };
  testType: 'keyboarding' | '10-key';
  onReturnToTests: () => void;
  onRestartPractice: () => void;
  onStartOfficialTest?: () => void;
}

export default function PracticeTypingResults({ 
  results, 
  testType, 
  onReturnToTests, 
  onRestartPractice, 
  onStartOfficialTest 
}: PracticeTypingResultsProps) {
  const { statistics } = results;

  // Performance level determination
  const getPerformanceLevel = (wpm: number, accuracy: number) => {
    if (accuracy < 70) return { level: 'Needs Improvement', color: 'bg-red-500', icon: '⚠️' };
    if (wpm < 20) return { level: 'Beginner', color: 'bg-orange-500', icon: '🌱' };
    if (wpm < 40) return { level: 'Intermediate', color: 'bg-blue-500', icon: '📈' };
    if (wpm < 60) return { level: 'Advanced', color: 'bg-green-500', icon: '⭐' };
    return { level: 'Expert', color: 'bg-purple-500', icon: '🏆' };
  };

  const performance = getPerformanceLevel(statistics.wpm, statistics.accuracy);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative">
      {/* Diagonal Watermark */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="text-red-500 text-8xl font-bold opacity-20 select-none"
            style={{
              transform: 'rotate(-45deg)',
              fontSize: 'clamp(4rem, 12vw, 8rem)',
              whiteSpace: 'nowrap'
            }}
          >
            PRACTICE
          </div>
        </div>
      </div>

      {/* Practice Mode Header */}
      <div className="text-center bg-red-50 border-2 border-red-200 rounded-lg p-6 relative z-20">
        <div className="flex justify-center mb-4">
          <div className={`w-20 h-20 rounded-full ${performance.color} flex items-center justify-center text-4xl relative`}>
            {performance.icon}
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              PRACTICE
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-red-700 mb-2">Practice Session Complete!</h1>
        <Badge className="text-lg px-4 py-2 bg-red-500 text-white">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Practice Results - Not for Official Use
        </Badge>
      </div>

      {/* Warning Alert */}
      <Alert className="border-red-300 bg-red-50 relative z-20">
        <Ban className="w-4 h-4 text-red-500" />
        <AlertDescription className="text-red-800">
          <strong>Practice Mode:</strong> These results are for practice only and cannot be saved, printed, shared, or used for official purposes.
        </AlertDescription>
      </Alert>

      {/* Main Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-20">
        <Card className="border-red-200 relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Typing Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statistics.wpm}</div>
            <div className="text-sm text-gray-500">Words Per Minute</div>
            <div className="absolute top-2 right-2 text-xs text-red-500 font-bold opacity-70">
              PRACTICE
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-blue-500" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{statistics.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Character Accuracy</div>
            <div className="absolute top-2 right-2 text-xs text-red-500 font-bold opacity-70">
              PRACTICE
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Keyboard className="w-5 h-5 text-purple-500" />
              Weighted Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{statistics.weightedWpm}</div>
            <div className="text-sm text-gray-500">Accuracy-Adjusted WPM</div>
            <div className="absolute top-2 right-2 text-xs text-red-500 font-bold opacity-70">
              PRACTICE
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{formatTime(statistics.timeElapsed)}</div>
            <div className="text-sm text-gray-500">Total Duration</div>
            <div className="absolute top-2 right-2 text-xs text-red-500 font-bold opacity-70">
              PRACTICE
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card className="border-red-200 relative z-20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Practice Session Statistics
            <Badge variant="outline" className="ml-auto border-red-300 text-red-600">
              Not Official
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{statistics.totalCharacters}</div>
              <div className="text-sm text-gray-500">Total Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.correctCharacters}</div>
              <div className="text-sm text-gray-500">Correct Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{statistics.totalCharacters - statistics.correctCharacters}</div>
              <div className="text-sm text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{performance.level}</div>
              <div className="text-sm text-gray-500">Performance Level</div>
            </div>
          </div>
          
          {/* Watermark overlay on stats */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-red-300 text-4xl font-bold opacity-30 transform rotate-12">
              PRACTICE ONLY
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Tips */}
      <Card className="border-blue-200 bg-blue-50 relative z-20">
        <CardHeader>
          <CardTitle className="text-blue-700">Practice Session Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">To Improve Speed:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Focus on smooth, consistent rhythm</li>
                <li>• Practice common letter combinations</li>
                <li>• Use proper finger positioning</li>
                <li>• Don't look at the keyboard</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">To Improve Accuracy:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Slow down and focus on correctness</li>
                <li>• Practice difficult letter combinations</li>
                <li>• Take breaks to avoid fatigue</li>
                <li>• Review and correct common mistakes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 relative z-20">
        <Button onClick={onReturnToTests} variant="outline" size="lg" className="px-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Tests
        </Button>

        <Button onClick={onRestartPractice} size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
          <RotateCcw className="w-4 h-4 mr-2" />
          Practice Again
        </Button>

        {onStartOfficialTest && (
          <Button onClick={onStartOfficialTest} size="lg" className="px-8 bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            Start Official Test
          </Button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border relative z-20">
        <p>
          <strong>Disclaimer:</strong> This was a practice session. Results are not saved, stored, or available for official use. 
          No data from this session has been permanently recorded or transmitted to any database.
        </p>
      </div>
    </div>
  );
}
