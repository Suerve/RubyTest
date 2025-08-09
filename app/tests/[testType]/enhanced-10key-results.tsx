
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Calculator, 
  FileText, 
  Award,
  Printer,
  Zap
} from 'lucide-react';

interface Enhanced10KeyResultsProps {
  results: {
    test: any;
    session: any;
    results: any;
    testResult?: any;
  };
  onReturnToTests: () => void;
  onRetakeTest?: () => void;
}

// Watermark component for patterned background
const WatermarkPattern = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
    <div className="absolute inset-0" style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 20px,
        rgba(0, 72, 117, 0.05) 20px,
        rgba(0, 72, 117, 0.05) 40px
      ), repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 20px,
        rgba(248, 149, 29, 0.03) 20px,
        rgba(248, 149, 29, 0.03) 40px
      )`,
      backgroundSize: '60px 60px'
    }} />
  </div>
);

export default function Enhanced10KeyResults({ results, onReturnToTests, onRetakeTest }: Enhanced10KeyResultsProps) {
  const { test, session, results: finalResults, testResult } = results;
  const isPractice = test.isPractice;

  // Safely extract KPH values with proper fallbacks
  const kph = finalResults?.kph ?? (finalResults?.wpm ? Math.round(finalResults.wpm * 12) : 0);
  const weightedKph = finalResults?.weightedKph ?? (finalResults?.weightedWpm ? Math.round(finalResults.weightedWpm * 12) : 0);
  
  // Safely extract other stats with proper fallbacks
  const accuracy = finalResults?.accuracy ?? 0;
  const totalCharacters = finalResults?.totalCharacters ?? 0;
  const correctCharacters = finalResults?.correctCharacters ?? 0;
  const incorrectCharacters = finalResults?.incorrectCharacters ?? 0;
  const timeElapsed = session?.timeElapsed ?? 0;

  // Performance level determination for KPH (adjusted for 10-key)
  const getPerformanceLevel = (kph: number, accuracy: number) => {
    if (accuracy < 70) return { level: 'Needs Improvement', color: 'bg-red-500', icon: '⚠️' };
    if (kph < 500) return { level: 'Beginner', color: 'bg-orange-500', icon: '🌱' };
    if (kph < 1200) return { level: 'Intermediate', color: 'bg-blue-500', icon: '📈' };
    if (kph < 2000) return { level: 'Advanced', color: 'bg-green-500', icon: '⭐' };
    return { level: 'Expert', color: 'bg-purple-500', icon: '🏆' };
  };

  const performance = getPerformanceLevel(kph, accuracy);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const generateCertificate = () => {
    const userName = `${session.users?.firstName || 'Test'} ${session.users?.lastName || 'User'}`;
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
                Enhanced 10-Key Typing Assessment
              </div>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 30px 0; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-around; text-align: center;">
                <div>
                  <div style="font-size: 32px; color: #004875; font-weight: bold;">${kph}</div>
                  <div style="font-size: 14px; color: #8a8a8d;">Keystrokes Per Hour</div>
                </div>
                <div>
                  <div style="font-size: 32px; color: #c4d600; font-weight: bold;">${accuracy.toFixed(1)}%</div>
                  <div style="font-size: 14px; color: #8a8a8d;">Accuracy</div>
                </div>
                <div>
                  <div style="font-size: 32px; color: #f8951d; font-weight: bold;">${weightedKph}</div>
                  <div style="font-size: 14px; color: #8a8a8d;">Weighted KPH</div>
                </div>
              </div>
            </div>

            <div style="margin-top: 40px;">
              <div style="font-size: 16px; color: #8a8a8d;">Completed on ${completionDate}</div>
              <div style="font-size: 14px; color: #8a8a8d; margin-top: 10px;">Performance Level: ${performance.level}</div>
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
            
            <p>We are pleased to inform you that you have successfully completed the Enhanced 10-Key Typing Assessment administered by Rubicon Programs. Your performance results are detailed below:</p>
            
            <div style="background: #f5f7fa; border-left: 4px solid #004875; padding: 20px; margin: 20px 0;">
              <h3 style="color: #004875; margin-top: 0;">Assessment Results</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>Keystroke Speed:</strong> ${kph} Keystrokes Per Hour (KPH)</li>
                <li style="margin: 8px 0;"><strong>Accuracy Rate:</strong> ${accuracy.toFixed(1)}%</li>
                <li style="margin: 8px 0;"><strong>Adjusted Speed:</strong> ${weightedKph} KPH (accuracy-weighted)</li>
                <li style="margin: 8px 0;"><strong>Time to Complete:</strong> ${formatTime(timeElapsed)}</li>
                <li style="margin: 8px 0;"><strong>Performance Level:</strong> ${performance.level}</li>
              </ul>
            </div>

            <p>This enhanced assessment provides an objective measure of your numeric keypad proficiency using advanced keystrokes-per-hour (KPH) calculations. The vertical character display and real-time feedback system ensures accurate measurement of your 10-key data entry skills.</p>

            <p>The weighted KPH score takes into account both speed and accuracy, providing a comprehensive evaluation of your numeric typing capabilities essential for data entry and accounting positions.</p>

            <p>Thank you for participating in our enhanced assessment program. Should you have any questions regarding these results, please don't hesitate to contact us.</p>

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
            <title>Enhanced 10-Key Test Results</title>
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
    const userName = `${session?.users?.firstName || 'Test'} ${session?.users?.lastName || 'User'}`;
    const completionDate = new Date(session?.completedAt || new Date()).toLocaleDateString();

    return `
Enhanced 10-Key Typing Test Results

Student: ${userName}
Date: ${completionDate}
Test Type: ${isPractice ? 'Practice' : 'Official'} Assessment

RESULTS:
- Keystroke Speed: ${kph} KPH (Keystrokes Per Hour)
- Accuracy: ${accuracy.toFixed(1)}%
- Weighted Speed: ${weightedKph} KPH (accuracy-adjusted)
- Time to Complete: ${formatTime(timeElapsed)}
- Performance Level: ${performance.level}

Keystrokes Typed: ${totalCharacters}
Correct Keystrokes: ${correctCharacters}
Errors: ${incorrectCharacters}

Enhanced Features Used:
- Vertical character display with scrolling
- Real-time Num Lock detection and monitoring
- KPH-based scoring system optimized for 10-key input
- Accuracy-weighted performance calculations

Assessment completed through Rubicon Programs Enhanced Testing System
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced 10-Key Test Complete!</h1>
        <Badge className={`text-lg px-4 py-2 ${performance.color}`}>
          {performance.level}
        </Badge>
      </div>

      {/* Main Results with KPH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 relative overflow-hidden">
          <WatermarkPattern />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-green-500" />
              Keystroke Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-600">{kph}</div>
            <div className="text-sm text-gray-500">KPH (Keystrokes/Hour)</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 relative overflow-hidden">
          <WatermarkPattern />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-blue-500" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-600">{accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Keystroke Accuracy</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 relative overflow-hidden">
          <WatermarkPattern />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-purple-500" />
              Weighted Speed
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-600">{weightedKph}</div>
            <div className="text-sm text-gray-500">Accuracy-Adjusted KPH</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 relative overflow-hidden">
          <WatermarkPattern />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Time
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-600">{formatTime(timeElapsed)}</div>
            <div className="text-sm text-gray-500">Total Duration</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Features Used */}
      <Card className="border-blue-200 bg-blue-50 relative overflow-hidden">
        <WatermarkPattern />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Calculator className="w-5 h-5" />
            Enhanced 10-Key Features
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Vertical character display with scrolling animations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real-time Num Lock detection and monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>KPH-based scoring optimized for numeric input</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Automatic test pausing when Num Lock disabled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <Card className="relative overflow-hidden">
        <WatermarkPattern />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Detailed Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalCharacters}</div>
              <div className="text-sm text-gray-500">Total Keystrokes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{correctCharacters}</div>
              <div className="text-sm text-gray-500">Correct Keystrokes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{incorrectCharacters}</div>
              <div className="text-sm text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(kph / 60)}</div>
              <div className="text-sm text-gray-500">KPM (Per Minute)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Options */}
      {!isPractice && (
        <Card className="relative overflow-hidden">
          <WatermarkPattern />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Print Results
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => printDocument(generatePlainTextResults())}
              >
                <Calculator className="w-4 h-4" />
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
          <Button onClick={onRetakeTest} size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Calculator className="w-4 h-4 mr-2" />
            Take Another Enhanced Practice Test
          </Button>
        )}
        
        <Button onClick={onReturnToTests} variant="outline" size="lg">
          Return to Tests
        </Button>
      </div>
    </div>
  );
}
