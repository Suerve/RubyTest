
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

interface CompleteTypingTestRequest {
  testId: string;
  finalTypedText: string;
  timeElapsed: number;
  testType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { testId, finalTypedText, timeElapsed, testType }: CompleteTypingTestRequest = await request.json();

    // Get test with typing session data from additionalData
    const test = await prisma.tests.findUnique({
      where: { id: testId },
      include: { 
        test_types: true
      }
    });

    if (!test || test.userId !== user.id) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.status !== 'STARTED') {
      return NextResponse.json({ error: 'Test is not active' }, { status: 400 });
    }

    const additionalData = test.additionalData as any;
    const expectedText = additionalData?.expectedText || '';
    
    // Calculate final statistics
    const is10KeyTest = testType === '10-key' || additionalData?.testType === '10-key';
    const finalResults = calculateFinalResults(finalTypedText, expectedText, timeElapsed, is10KeyTest);

    // Complete the test and update with final results
    const completedTest = await prisma.tests.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score: finalResults.weightedWpm, // Use weighted WPM as primary score
        additionalData: {
          ...additionalData,
          completedAt: new Date().toISOString(),
          typedText: finalTypedText,
          timeElapsed,
          finalResults
        }
      }
    });

    const updatedSession = {
      id: testId,
      testId,
      userId: user.id,
      testType: additionalData?.testType || 'keyboarding',
      completedAt: new Date(),
      typedText: finalTypedText,
      timeElapsed,
      totalCharacters: finalResults.totalCharacters,
      correctCharacters: finalResults.correctCharacters,
      incorrectCharacters: finalResults.incorrectCharacters,
      totalWords: finalResults.totalWords,
      correctWords: finalResults.correctWords,
      wpm: finalResults.wpm,
      accuracy: finalResults.accuracy,
      weightedWpm: finalResults.weightedWpm
    };

    // Create test results record (if not practice)
    let testResult = null;
    if (!test.isPractice) {
      testResult = await prisma.test_results.create({
        data: {
          id: randomUUID(),
          testId: completedTest.id,
          userId: user.id,
          testTypeId: test.testTypeId,
          score: finalResults.weightedWpm,
          accuracy: finalResults.accuracy,
          rawSpeed: finalResults.wpm,
          weightedSpeed: finalResults.weightedWpm,
          timeToComplete: timeElapsed,
          questionsTotal: 1,
          questionsCorrect: finalResults.accuracy >= 90 ? 1 : 0, // Consider 90%+ accuracy as correct
          completedAt: new Date(),
          detailedResults: {
            totalCharacters: finalResults.totalCharacters,
            correctCharacters: finalResults.correctCharacters,
            incorrectCharacters: finalResults.incorrectCharacters,
            totalWords: finalResults.totalWords,
            correctWords: finalResults.correctWords,
            keystrokeAccuracy: finalResults.accuracy,
            testType: additionalData?.testType || 'keyboarding'
          }
        }
      });
    }

    return NextResponse.json({
      test: completedTest,
      session: updatedSession,
      results: finalResults,
      testResult
    });

  } catch (error) {
    console.error('Complete typing test error:', error);
    return NextResponse.json(
      { error: 'Failed to complete typing test' },
      { status: 500 }
    );
  }
}

function calculateFinalResults(typedText: string, expectedText: string, timeElapsed: number, is10KeyTest: boolean = false) {
  const totalCharacters = typedText.length;
  const correctCharacters = calculateCorrectCharacters(typedText, expectedText);
  const incorrectCharacters = totalCharacters - correctCharacters;
  
  // Calculate word-level accuracy
  const typedWords = typedText.trim().split(/\s+/);
  const expectedWords = expectedText.trim().split(/\s+/);
  const totalWords = typedWords.length;
  let correctWords = 0;
  
  for (let i = 0; i < Math.min(typedWords.length, expectedWords.length); i++) {
    if (typedWords[i] === expectedWords[i]) {
      correctWords++;
    }
  }
  
  // Calculate accuracy percentage
  const accuracy = totalCharacters > 0 ? (correctCharacters / totalCharacters) * 100 : 0;
  
  let primarySpeed, weightedSpeed, kph, weightedKph;
  
  if (is10KeyTest) {
    // Calculate KPH (Keystrokes Per Hour) for 10-key tests
    const elapsedHours = timeElapsed / 3600;
    kph = elapsedHours > 0 ? Math.round(totalCharacters / elapsedHours) : 0;
    weightedKph = Math.round(kph * (accuracy / 100));
    
    primarySpeed = kph;
    weightedSpeed = weightedKph;
  } else {
    // Calculate WPM (Words Per Minute) for keyboard tests
    const elapsedMinutes = timeElapsed / 60;
    const wordsTyped = Math.floor(totalCharacters / 5); // Standard: 5 characters = 1 word
    const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;
    const weightedWpm = Math.round(wpm * (accuracy / 100));
    
    primarySpeed = wpm;
    weightedSpeed = weightedWpm;
    
    // Convert to approximate KPH for consistency
    kph = Math.round(wpm * 12);
    weightedKph = Math.round(weightedWpm * 12);
  }
  
  return {
    totalCharacters,
    correctCharacters,
    incorrectCharacters,
    totalWords,
    correctWords,
    accuracy: Math.round(accuracy * 100) / 100,
    wpm: primarySpeed, // For compatibility, but will be KPH for 10-key
    weightedWpm: weightedSpeed, // For compatibility, but will be weighted KPH for 10-key
    kph,
    weightedKph,
    testType: is10KeyTest ? '10-key' : 'keyboarding'
  };
}

function calculateCorrectCharacters(typedText: string, expectedText: string): number {
  let correct = 0;
  const minLength = Math.min(typedText.length, expectedText.length);
  
  for (let i = 0; i < minLength; i++) {
    if (typedText[i] === expectedText[i]) {
      correct++;
    }
  }
  
  return correct;
}
