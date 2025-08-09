
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

interface TypingContentRequest {
  testType: 'keyboarding' | '10-key';
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
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

    const { testType, difficulty = 'medium', count = 1 }: TypingContentRequest = await request.json();

    // Get test type
    const testTypeName = testType === 'keyboarding' ? 'typing-keyboard' : 'typing-10key';
    const testTypeRecord = await prisma.test_types.findUnique({
      where: { name: testTypeName }
    });

    if (!testTypeRecord) {
      return NextResponse.json({ error: 'Test type not found' }, { status: 404 });
    }

    if (testType === 'keyboarding') {
      // Generate keyboarding content using LLM
      const prompt = `Generate ${count} typing test passage${count > 1 ? 's' : ''} for ${difficulty} difficulty level. Each passage should:
      - Be 20-35 words long for practice tests
      - Include uppercase and lowercase letters, numbers, and punctuation
      - Be engaging and varied in content
      - Test different typing skills
      
      Return only a JSON array with this structure:
      [{
        "content": "passage text here",
        "wordCount": number,
        "characterCount": number,
        "difficulty": "${difficulty}"
      }]`;

      const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 1000
        })
      });

      if (!llmResponse.ok) {
        throw new Error('Failed to generate content');
      }

      const llmData = await llmResponse.json();
      const generatedContent = JSON.parse(llmData.choices[0].message.content);
      
      // Save generated content to database
      const savedQuestions = [];
      for (const passage of generatedContent) {
        const question = await prisma.questions.create({
          data: {
            id: randomUUID(),
            testTypeId: testTypeRecord.id,
            content: passage.content,
            questionType: 'TYPING_PASSAGE',
            correctAnswer: { text: passage.content },
            metadata: {
              passageText: passage.content,
              wordCount: passage.wordCount,
              characterCount: passage.characterCount,
              testType: 'keyboarding',
              difficulty: difficulty,
              generatedBy: 'AI'
            },
            createdBy: 'AI',
            updatedAt: new Date()
          }
        });
        savedQuestions.push(question);
      }

      return NextResponse.json({ questions: savedQuestions });

    } else {
      // Generate 10-key content using LLM
      const prompt = `Generate ${count} 10-key typing test sequence${count > 1 ? 's' : ''} for ${difficulty} difficulty level. Each sequence should:
      - Be 60-80 characters long for practice tests
      - Use only numbers 0-9 and spaces
      - Include varied number patterns
      - Test numeric keypad skills
      
      Return only a JSON array with this structure:
      [{
        "sequence": "number sequence here",
        "characterCount": number,
        "difficulty": "${difficulty}",
        "description": "brief description of the pattern"
      }]`;

      const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 800
        })
      });

      if (!llmResponse.ok) {
        throw new Error('Failed to generate content');
      }

      const llmData = await llmResponse.json();
      const generatedContent = JSON.parse(llmData.choices[0].message.content);
      
      // Save generated content to database
      const savedQuestions = [];
      for (const seq of generatedContent) {
        const question = await prisma.questions.create({
          data: {
            id: randomUUID(),
            testTypeId: testTypeRecord.id,
            content: `Type the following number sequence: ${seq.sequence}`,
            questionType: 'TYPING_PASSAGE',
            correctAnswer: { sequence: seq.sequence },
            metadata: {
              expectedText: seq.sequence,
              characterCount: seq.characterCount,
              testType: '10-key',
              difficulty: difficulty,
              description: seq.description,
              generatedBy: 'AI'
            },
            createdBy: 'AI',
            updatedAt: new Date()
          }
        });
        savedQuestions.push(question);
      }

      return NextResponse.json({ questions: savedQuestions });
    }

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate typing test content' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('testType') as 'keyboarding' | '10-key';
    const count = parseInt(searchParams.get('count') || '1');

    if (!testType) {
      return NextResponse.json({ error: 'Test type is required' }, { status: 400 });
    }

    // Get test type
    const testTypeName = testType === 'keyboarding' ? 'typing-keyboard' : 'typing-10key';
    const testTypeRecord = await prisma.test_types.findUnique({
      where: { name: testTypeName }
    });

    if (!testTypeRecord) {
      return NextResponse.json({ error: 'Test type not found' }, { status: 404 });
    }

    // Get existing questions from bank
    const questions = await prisma.questions.findMany({
      where: {
        testTypeId: testTypeRecord.id,
        questionType: 'TYPING_PASSAGE',
        isActive: true
      },
      take: count,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve typing test content' },
      { status: 500 }
    );
  }
}
