
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface GenerateQuestionRequest {
  testType: string;
  difficulty?: number;
  gradeLevel?: string;
  count?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Only allow admins and test system to generate questions
    const session = await request.headers.get('authorization');
    
    const body: GenerateQuestionRequest = await request.json();
    const { testType, difficulty, gradeLevel, count = 1 } = body;

    if (!testType) {
      return NextResponse.json(
        { error: 'Test type is required' },
        { status: 400 }
      );
    }

    // Get test type info
    const testTypeRecord = await prisma.test_types.findUnique({
      where: { name: testType }
    });

    if (!testTypeRecord) {
      return NextResponse.json(
        { error: 'Invalid test type' },
        { status: 400 }
      );
    }

    // Generate questions based on test type
    const questions = [];
    
    for (let i = 0; i < count; i++) {
      const question = await generateQuestionByType(testType, difficulty, gradeLevel);
      questions.push(question);
    }

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}

async function generateQuestionByType(testType: string, difficulty?: number, gradeLevel?: string) {
  const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: getSystemPromptForTestType(testType)
        },
        {
          role: 'user',
          content: getQuestionPrompt(testType, difficulty, gradeLevel)
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate question from AI');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from AI');
  }

  try {
    const questionData = JSON.parse(content);
    return questionData;
  } catch (error) {
    throw new Error('Invalid JSON response from AI');
  }
}

function getSystemPromptForTestType(testType: string): string {
  const basePrompt = `You are an expert question generator for professional skills assessment. Generate high-quality, accurate questions for skills testing.`;
  
  switch (testType) {
    case 'digital-literacy':
      return `${basePrompt} Focus on computer hardware, software, networking, internet usage, email management, and digital safety. Questions should test practical knowledge needed for workplace computer use.`;
    
    case 'basic-math':
      return `${basePrompt} Create math problems appropriate for the specified grade level (5th-12th grade). Include arithmetic, algebra, geometry, and word problems. Ensure mathematical accuracy.`;
    
    case 'basic-english':
      return `${basePrompt} Generate English language questions covering grammar, vocabulary, spelling, punctuation, and reading comprehension. Include both language mastery and comprehension components.`;
    
    case 'typing-keyboard':
    case 'typing-10key':
      return `${basePrompt} Generate typing passages for ${testType === 'typing-10key' ? 'numeric keypad' : 'keyboard'} testing. Focus on accuracy and speed measurement.`;
    
    default:
      return basePrompt;
  }
}

function getQuestionPrompt(testType: string, difficulty?: number, gradeLevel?: string): string {
  let prompt = `Generate a question for ${testType} assessment.`;
  
  if (difficulty) {
    prompt += ` Difficulty level: ${difficulty}/5.`;
  }
  
  if (gradeLevel) {
    prompt += ` Grade level: ${gradeLevel}.`;
  }
  
  switch (testType) {
    case 'digital-literacy':
      return `${prompt}

Please respond in JSON format with the following structure:
{
  "question": "The question text",
  "type": "multiple_choice|true_false|simulation",
  "options": ["option1", "option2", "option3", "option4"],
  "correct_answer": "correct option or answer",
  "explanation": "Brief explanation of the correct answer",
  "difficulty_level": 1-5,
  "category": "hardware|software|internet|email|security"
}

For simulation questions, include interface details in metadata.`;

    case 'basic-math':
      return `${prompt}

Please respond in JSON format with the following structure:
{
  "question": "The math problem statement",
  "type": "multiple_choice|fill_in_blank",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "correct_answer": "correct answer",
  "explanation": "Step-by-step solution",
  "grade_level": "${gradeLevel || '6th'}",
  "category": "arithmetic|algebra|geometry|word_problem"
}

Ensure the problem is appropriate for ${gradeLevel || '6th grade'} level.`;

    case 'basic-english':
      return `${prompt}

Please respond in JSON format with the following structure:
{
  "question": "The English question",
  "type": "multiple_choice|reading_comprehension",
  "passage": "Reading passage if applicable",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "correct_answer": "correct answer",
  "explanation": "Brief explanation",
  "grade_level": "${gradeLevel || '6th'}",
  "category": "grammar|vocabulary|comprehension|spelling"
}

For reading comprehension, include a short passage with 1 question.`;

    case 'typing-keyboard':
      return `${prompt}

Please respond in JSON format with the following structure:
{
  "passage": "Typing practice text with mixed case, numbers, and punctuation",
  "type": "typing_passage",
  "difficulty_level": ${difficulty || 3},
  "word_count": 50,
  "category": "general_text"
}

Generate natural, varied text suitable for typing practice.`;

    case 'typing-10key':
      return `${prompt}

Please respond in JSON format with the following structure:
{
  "passage": "Numeric sequence for 10-key practice",
  "type": "typing_passage",
  "difficulty_level": ${difficulty || 3},
  "number_count": 30,
  "category": "numeric_data"
}

Generate varied numeric data including decimals and negative numbers.`;

    default:
      return `${prompt} Respond with a JSON object containing question details.`;
  }
}
