
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Keyboard, 
  FileText, 
  Award,
  Printer
} from 'lucide-react';
import Enhanced10KeyResults from './enhanced-10key-results';

interface TypingResultsProps {
  results: {
    test: any;
    session: any;
    results: any;
    testResult?: any;
  };
  onReturnToTests: () => void;
  onRetakeTest?: () => void;
}

export default function TypingResults({ results, onReturnToTests, onRetakeTest }: TypingResultsProps) {
  const { test, session, results: finalResults, testResult } = results;
  const testType = session.testType;
  const isPractice = test.isPractice;

  // Use Enhanced 10-Key Results for 10-key tests
  if (testType === '10-key') {
    return (
      <Enhanced10KeyResults
        results={results}
        onReturnToTests={onReturnToTests}
        onRetakeTest={onRetakeTest}
      />
    );
  }

  const [showCertificate, setShowCertificate] = useState(false);
  const [showLetterhead, setShowLetterhead] = useState(false);

  // Performance level determination
  const getPerformanceLevel = (wpm: number, accuracy: number) => {
    if (accuracy < 70) return { level: 'Needs Improvement', color: 'bg-red-500', icon: '⚠️' };
    if (wpm < 20) return { level: 'Beginner', color: 'bg-orange-500', icon: '🌱' };
    if (wpm < 40) return { level: 'Intermediate', color: 'bg-blue-500', icon: '📈' };
    if (wpm < 60) return { level: 'Advanced', color: 'bg-green-500', icon: '⭐' };
    return { level: 'Expert', color: 'bg-purple-500', icon: '🏆' };
  };

  const performance = getPerformanceLevel(finalResults.wpm, finalResults.accuracy);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const generateCertificate = () => {
    const userName = `${session.users?.firstName || 'Test'} ${session.users?.lastName || 'User'}`;
    const testTypeName = testType === 'keyboarding' ? 'Keyboard Typing' : '10-Key Typing';
    const completionDate = new Date(session.completedAt).toLocaleDateString();

    return `
      <div class="certificate-container" style="
        width: 11in; 
        height: 8.5in; 
        padding: 1in; 
        margin: 0 auto;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border: 8px solid #004875;
        font-family: 'Georgia', serif;
        position: relative;
      ">
        <div style="text-align: center; height: 100%;">
          <div style="border: 4px solid #f8951d; padding: 40px; height: calc(100% - 80px); position: relative;">
            <h1 style="color: #004875; font-size: 48px; margin: 20px 0; font-weight: bold;">
              CERTIFICATE OF ACHIEVEMENT
            </h1>
            
            <div style="margin: 40px 0;">
              <div style="font-size: 24px; color: #8a8a8d; margin-bottom: 20px;">This certifies that</div>
              <div style="font-size: 36px; color: #004875; font-weight: bold; border-bottom: 2px solid #c4d600; display: inline-block; padding-bottom: 8px; margin-bottom: 30px;">
                ${userName}
              </div>
              <div style="font-size: 22px; color: #8a8a8d; margin-bottom: 30px;">
                has successfully completed the
              </div>
              <div style="font-size: 28px; color: #f8951d; font-weight: bold; margin-bottom: 40px;">
                ${testTypeName} Assessment
              </div>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 30px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>
                  <div style="font-size: 32px; color: #004875; font-weight: bold;">${finalResults.wpm}</div>
                  <div style="font-size: 14px; color: #8a8a8d;">Words Per Minute</div>
                </div>
                <div>
                  <div style="font-size: 32px; color: #c4d600; font-weight: bold;">${finalResults.accuracy.toFixed(1)}%</div>
                  <div style="font-size: 14px; color: #8a8a8d;">Accuracy</div>
                </div>
                <div>
                  <div style="font-size: 32px; color: #f8951d; font-weight: bold;">${finalResults.weightedWpm}</div>
                  <div style="font-size: 14px; color: #8a8a8d;">Weighted WPM</div>
                </div>
              </div>
            </div>

            <div style="margin-top: 40px;">
              <div style="font-size: 16px; color: #8a8a8d;">Completed on ${completionDate}</div>
            </div>

            <div style="position: absolute; bottom: 40px; left: 0; right: 0; text-align: center;">
              <div style="border-top: 1px solid #8a8a8d; width: 200px; margin: 0 auto 10px;">
                <div style="font-size: 16px; color: #004875; font-weight: bold; margin-top: 10px;">
                  Management, Rubicon Programs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generateLetterhead = () => {
    const userName = `${session.users?.firstName || 'Test'} ${session.users?.lastName || 'User'}`;
    const testTypeName = testType === 'keyboarding' ? 'Keyboard Typing' : '10-Key Typing';
    const completionDate = new Date(session.completedAt).toLocaleDateString();

    return `
      <div style="width: 8.5in; margin: 0 auto; padding: 1in; font-family: 'Arial', sans-serif;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #004875; padding-bottom: 20px;">
          <h1 style="color: #004875; font-size: 28px; margin: 0;">RUBICON PROGRAMS</h1>
          <div style="color: #8a8a8d; font-size: 14px; margin-top: 5px;">Professional Testing Services</div>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="color: #8a8a8d; font-size: 14px;">${completionDate}</div>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="font-size: 16px; line-height: 1.6;">
            <p>Dear ${userName},</p>
            
            <p>We are pleased to inform you that you have successfully completed the ${testTypeName} Assessment administered by Rubicon Programs. Your performance results are detailed below:</p>
            
            <div style="background: #f5f7fa; border-left: 4px solid #004875; padding: 20px; margin: 20px 0;">
              <h3 style="color: #004875; margin-top: 0;">Assessment Results</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>Typing Speed:</strong> ${finalResults.wpm} Words Per Minute</li>
                <li style="margin: 8px 0;"><strong>Accuracy Rate:</strong> ${finalResults.accuracy.toFixed(1)}%</li>
                <li style="margin: 8px 0;"><strong>Adjusted Speed:</strong> ${finalResults.weightedWpm} WPM (accuracy-weighted)</li>
                <li style="margin: 8px 0;"><strong>Time to Complete:</strong> ${formatTime(session.timeElapsed)}</li>
                <li style="margin: 8px 0;"><strong>Performance Level:</strong> ${performance.level}</li>
              </ul>
            </div>

            <p>This assessment provides an objective measure of your ${testType === 'keyboarding' ? 'keyboard typing' : 'numeric keypad'} proficiency. The weighted words-per-minute score takes into account both speed and accuracy, providing a comprehensive evaluation of your typing skills.</p>

            <p>Thank you for participating in our assessment program. Should you have any questions regarding these results, please don't hesitate to contact us.</p>

            <p>Sincerely,</p>
          </div>
        </div>

        <div style="margin-top: 60px;">
          <div style="border-top: 1px solid #000; width: 200px; padding-top: 10px;">
            <div style="font-weight: bold;">Management, Rubicon Programs</div>
          </div>
        </div>
      </div>
    `;
  };

  const printDocument = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Typing Test Results</title>
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                body { margin: 0; padding: 0; }
                .certificate-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const generatePlainTextResults = () => {
    const userName = `${session.users?.firstName || 'Test'} ${session.users?.lastName || 'User'}`;
    const testTypeName = testType === 'keyboarding' ? 'Keyboard Typing' : '10-Key Typing';
    const completionDate = new Date(session.completedAt).toLocaleDateString();

    return `
${testTypeName} Test Results

Student: ${userName}
Date: ${completionDate}
Test Type: ${isPractice ? 'Practice' : 'Official'} Assessment

RESULTS:
- Typing Speed: ${finalResults.wpm} Words Per Minute
- Accuracy: ${finalResults.accuracy.toFixed(1)}%
- Weighted Speed: ${finalResults.weightedWpm} WPM
- Time to Complete: ${formatTime(session.timeElapsed)}
- Performance Level: ${performance.level}

Characters Typed: ${finalResults.totalCharacters}
Correct Characters: ${finalResults.correctCharacters}
Errors: ${finalResults.incorrectCharacters}

Words Typed: ${finalResults.totalWords}
Correct Words: ${finalResults.correctWords}

Assessment completed through Rubicon Programs Testing System
    `.trim();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className={`w-20 h-20 rounded-full ${performance.color} flex items-center justify-center text-4xl`}>
            {performance.icon}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Complete!</h1>
        <Badge className={`text-lg px-4 py-2 ${performance.color}`}>
          {performance.level}
        </Badge>
      </div>

      {/* Main Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Typing Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{finalResults.wpm}</div>
            <div className="text-sm text-gray-500">Words Per Minute</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-blue-500" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{finalResults.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Character Accuracy</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Keyboard className="w-5 h-5 text-purple-500" />
              Weighted Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{finalResults.weightedWpm}</div>
            <div className="text-sm text-gray-500">Accuracy-Adjusted WPM</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{formatTime(session.timeElapsed)}</div>
            <div className="text-sm text-gray-500">Total Duration</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Detailed Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{finalResults.totalCharacters}</div>
              <div className="text-sm text-gray-500">Total Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{finalResults.correctCharacters}</div>
              <div className="text-sm text-gray-500">Correct Characters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{finalResults.incorrectCharacters}</div>
              <div className="text-sm text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{finalResults.correctWords}/{finalResults.totalWords}</div>
              <div className="text-sm text-gray-500">Correct Words</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Options */}
      {!isPractice && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Print Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => printDocument(generatePlainTextResults())}
              >
                <FileText className="w-4 h-4" />
                Scores Only
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => printDocument(generateLetterhead())}
              >
                <FileText className="w-4 h-4" />
                Official Letter
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => printDocument(generateCertificate())}
              >
                <Award className="w-4 h-4" />
                Certificate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {onRetakeTest && isPractice && (
          <Button onClick={onRetakeTest} size="lg">
            Take Another Practice Test
          </Button>
        )}
        
        <Button onClick={onReturnToTests} variant="outline" size="lg">
          Return to Tests
        </Button>
      </div>
    </div>
  );
}
