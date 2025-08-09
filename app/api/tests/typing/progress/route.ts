
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';

interface ProgressUpdate {
  testId: string;
  typedText: string;
  currentPosition: number;
  currentWordIndex: number;
  testType?: string;
  keystroke?: {
    key: string;
    timestamp: number;
    correct: boolean;
  };
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

    const { testId, typedText, currentPosition, currentWordIndex, testType, keystroke }: ProgressUpdate = await request.json();

    // Get test with typing session data from additionalData
    const test = await prisma.tests.findUnique({
      where: { id: testId },
      include: { test_types: true }
    });

    if (!test || test.userId !== user.id) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.status !== 'STARTED') {
      return NextResponse.json({ error: 'Test is not active' }, { status: 400 });
    }

    const additionalData = test.additionalData as any;
    const expectedText = additionalData?.expectedText || '';
    
    // Calculate real-time statistics
    const correctCharacters = calculateCorrectCharacters(typedText, expectedText);
    const totalCharacters = typedText.length;
    const accuracy = totalCharacters > 0 ? (correctCharacters / totalCharacters) * 100 : 100;
    
    // Calculate elapsed time
    const startTime = new Date(additionalData?.startedAt || test.startedAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    
    // Determine if this is a 10-key test
    const is10KeyTest = testType === '10-key' || additionalData?.testType === '10-key';
    
    let primarySpeed, weightedSpeed;
    
    if (is10KeyTest) {
      // Calculate KPH (Keystrokes Per Hour) for 10-key tests
      const elapsedHours = elapsedSeconds / 3600;
      const kph = elapsedHours > 0 ? Math.round(totalCharacters / elapsedHours) : 0;
      const weightedKph = Math.round(kph * (accuracy / 100));
      
      primarySpeed = kph;
      weightedSpeed = weightedKph;
    } else {
      // Calculate WPM (Words Per Minute) for keyboard tests
      const elapsedMinutes = elapsedSeconds / 60;
      const wordsTyped = Math.floor(totalCharacters / 5); // Standard: 5 characters = 1 word
      const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;
      const weightedWpm = Math.round(wpm * (accuracy / 100));
      
      primarySpeed = wpm;
      weightedSpeed = weightedWpm;
    }

    // Update keystroke log
    const keystrokeLog = additionalData?.keystrokeLog ? [...additionalData.keystrokeLog] : [];
    if (keystroke) {
      keystrokeLog.push(keystroke);
    }

    // Update test with new progress data
    const updatedTest = await prisma.tests.update({
      where: { id: testId },
      data: {
        additionalData: {
          ...additionalData,
          currentPosition,
          currentWordIndex,
          typedText,
          keystrokeLog,
          statistics: {
            wpm: primarySpeed, // For compatibility, but will be KPH for 10-key
            accuracy,
            weightedWpm: weightedSpeed, // For compatibility, but will be weighted KPH for 10-key
            correctCharacters,
            totalCharacters,
            timeElapsed: elapsedSeconds,
            kph: is10KeyTest ? primarySpeed : Math.round(primarySpeed * 12), // Convert WPM to approximate KPH for display
            weightedKph: is10KeyTest ? weightedSpeed : Math.round(weightedSpeed * 12),
            testType: is10KeyTest ? '10-key' : 'keyboarding'
          }
        }
      }
    });

    const updatedSession = {
      id: testId,
      testId,
      userId: user.id,
      currentPosition,
      currentWordIndex,
      typedText,
      keystrokeLog,
      totalCharacters,
      correctCharacters,
      incorrectCharacters: totalCharacters - correctCharacters,
      accuracy,
      wpm: primarySpeed,
      weightedWpm: weightedSpeed,
      timeElapsed: elapsedSeconds
    };

    return NextResponse.json({
      session: updatedSession,
      statistics: {
        wpm: primarySpeed, // For compatibility, but will be KPH for 10-key
        accuracy: Math.round(accuracy * 100) / 100,
        weightedWpm: weightedSpeed, // For compatibility, but will be weighted KPH for 10-key
        correctCharacters,
        totalCharacters,
        timeElapsed: elapsedSeconds,
        kph: is10KeyTest ? primarySpeed : Math.round(primarySpeed * 12),
        weightedKph: is10KeyTest ? weightedSpeed : Math.round(weightedSpeed * 12),
        testType: is10KeyTest ? '10-key' : 'keyboarding'
      }
    });

  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
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
