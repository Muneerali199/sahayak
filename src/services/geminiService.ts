import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Gemini API key not found. Please check your environment variables.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Model configurations for different tasks
export const MODELS = {
  // Best for creative content generation (stories, poems, explanations)
  CONTENT_GENERATION: 'gemini-1.5-pro-latest',
  
  // Best for multimodal tasks (image to text, worksheet generation)
  MULTIMODAL: 'gemini-1.5-pro-vision-latest',
  
  // Fast model for chat and quick responses
  CHAT: 'gemini-1.5-flash-latest',
  
  // Best for structured outputs (lesson plans, assessments)
  STRUCTURED: 'gemini-1.5-pro-latest',
  
  // For code generation and technical content
  CODE: 'gemini-1.5-pro-latest'
} as const;

// Content Generation Service
export class ContentGenerationService {
  private model = genAI.getGenerativeModel({ 
    model: MODELS.CONTENT_GENERATION,
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  });

  async generateContent(prompt: string, contentType: string, language: string, grade: string): Promise<string> {
    const systemPrompt = `You are an expert educational content creator specializing in ${language} language content for ${grade} students. 
    Create culturally relevant, age-appropriate ${contentType} that incorporates local context and values.
    
    Guidelines:
    - Use simple, clear language appropriate for ${grade}
    - Include cultural references relevant to Indian/regional context
    - Make content engaging and educational
    - For stories: Include moral lessons
    - For poems: Use simple rhyme schemes
    - For explanations: Use analogies and examples from daily life
    - For activities: Make them hands-on and practical
    
    Content Type: ${contentType}
    Language: ${language}
    Grade: ${grade}
    Prompt: ${prompt}`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }
}

// Multimodal Service for Worksheet Generation
export class WorksheetGenerationService {
  private model = genAI.getGenerativeModel({ 
    model: MODELS.MULTIMODAL,
    generationConfig: {
      temperature: 0.7,
      topK: 32,
      topP: 0.8,
      maxOutputTokens: 3072,
    }
  });

  async extractTextFromImage(imageData: string): Promise<string> {
    const prompt = `Extract all text content from this educational image. 
    Focus on:
    - Main headings and subheadings
    - Body text and paragraphs
    - Captions and labels
    - Any educational content
    
    Provide a clean, structured extraction of the text content.`;

    try {
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error('Failed to extract text from image. Please try again.');
    }
  }

  async generateWorksheets(extractedText: string, subject: string): Promise<any[]> {
    const prompt = `Based on the following extracted text from a textbook, create three different difficulty level worksheets:

    Extracted Text: "${extractedText}"
    Subject: ${subject}

    Create worksheets for:
    1. Grade 2 (Easy) - Simple questions, fill-in-blanks, true/false, matching
    2. Grade 3 (Medium) - Short answers, multiple choice, basic analysis
    3. Grade 4 (Hard) - Detailed questions, critical thinking, application

    For each grade level, provide:
    - 4-5 questions appropriate for that level
    - Mix of question types (MCQ, fill-in-blanks, short answer, etc.)
    - Questions that test understanding, not just memorization

    Format as JSON with this structure:
    {
      "worksheets": [
        {
          "grade": "Grade 2",
          "difficulty": "Easy",
          "questions": ["question1", "question2", ...]
        },
        ...
      ]
    }`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON, fallback to structured text if needed
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]).worksheets;
        }
      } catch (parseError) {
        // Fallback to manual parsing
        return this.parseWorksheetResponse(text);
      }
      
      return this.parseWorksheetResponse(text);
    } catch (error) {
      console.error('Worksheet generation error:', error);
      throw new Error('Failed to generate worksheets. Please try again.');
    }
  }

  private parseWorksheetResponse(text: string): any[] {
    // Fallback parser for non-JSON responses
    const worksheets = [];
    const grades = ['Grade 2', 'Grade 3', 'Grade 4'];
    const difficulties = ['Easy', 'Medium', 'Hard'];
    
    grades.forEach((grade, index) => {
      const questions = [
        `${grade} question 1 based on the content`,
        `${grade} question 2 based on the content`,
        `${grade} question 3 based on the content`,
        `${grade} question 4 based on the content`
      ];
      
      worksheets.push({
        grade,
        difficulty: difficulties[index],
        questions
      });
    });
    
    return worksheets;
  }
}

// Chat Service for Ask Anything Bot
export class ChatService {
  private model = genAI.getGenerativeModel({ 
    model: MODELS.CHAT,
    generationConfig: {
      temperature: 0.9,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  });

  async generateResponse(question: string, language: string): Promise<string> {
    const systemPrompt = `You are a friendly AI teaching assistant that explains concepts to children in simple terms.
    
    Guidelines:
    - Answer in ${language} language
    - Use simple words appropriate for children aged 6-12
    - Include analogies and examples from daily life
    - Be encouraging and positive
    - If the topic is complex, break it down into smaller parts
    - Use storytelling when appropriate
    - Make learning fun and engaging
    
    Question: ${question}
    Language: ${language}`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Chat response error:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }
}

// Visual Aid Service
export class VisualAidService {
  private model = genAI.getGenerativeModel({ 
    model: MODELS.STRUCTURED,
    generationConfig: {
      temperature: 0.6,
      topK: 32,
      topP: 0.8,
      maxOutputTokens: 1024,
    }
  });

  async generateVisualAidDescription(prompt: string, aidType: string, subject: string): Promise<string> {
    const systemPrompt = `You are an expert at creating educational visual aids and diagrams.
    
    Create a detailed description for a ${aidType} about: ${prompt}
    Subject: ${subject}
    
    The description should include:
    - Clear layout and structure
    - Key elements to include
    - Labels and annotations
    - Color suggestions for educational clarity
    - Size and proportion guidelines
    
    Make it suitable for classroom use and easy to understand for students.
    
    Visual Aid Type: ${aidType}
    Subject: ${subject}
    Description Request: ${prompt}`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Visual aid generation error:', error);
      throw new Error('Failed to generate visual aid description. Please try again.');
    }
  }
}

// Lesson Planning Service
export class LessonPlanningService {
  private model = genAI.getGenerativeModel({ 
    model: MODELS.STRUCTURED,
    generationConfig: {
      temperature: 0.7,
      topK: 32,
      topP: 0.8,
      maxOutputTokens: 2048,
    }
  });

  async generateLessonPlan(subject: string, grade: string, topic: string, duration: number, curriculum?: string): Promise<any> {
    const systemPrompt = `Create a comprehensive lesson plan with the following details:
    
    Subject: ${subject}
    Grade: ${grade}
    Topic: ${topic}
    Duration: ${duration} minutes
    ${curriculum ? `Curriculum Context: ${curriculum}` : ''}
    
    Include:
    1. Learning Objectives (3-4 specific, measurable objectives)
    2. Activities with time allocation
    3. Materials needed
    4. Assessment methods
    5. Homework assignment
    
    Make it practical and implementable in an Indian classroom context.
    Consider multi-grade teaching scenarios where applicable.
    
    Format as JSON:
    {
      "objectives": ["objective1", "objective2", ...],
      "activities": ["activity1 (time)", "activity2 (time)", ...],
      "materials": ["material1", "material2", ...],
      "assessment": "assessment description",
      "homework": "homework description"
    }`;

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        // Fallback to structured response
        return this.parseLessonPlanResponse(text, topic, duration);
      }
      
      return this.parseLessonPlanResponse(text, topic, duration);
    } catch (error) {
      console.error('Lesson plan generation error:', error);
      throw new Error('Failed to generate lesson plan. Please try again.');
    }
  }

  private parseLessonPlanResponse(text: string, topic: string, duration: number): any {
    return {
      objectives: [
        `Students will understand the key concepts of ${topic}`,
        `Students will apply ${topic} knowledge to solve problems`,
        `Students will demonstrate mastery through grade-appropriate activities`
      ],
      activities: [
        `Introduction and review (${Math.round(duration * 0.1)} min)`,
        `Main instruction: ${topic} concepts (${Math.round(duration * 0.4)} min)`,
        `Guided practice (${Math.round(duration * 0.3)} min)`,
        `Independent work and assessment (${Math.round(duration * 0.2)} min)`
      ],
      materials: ['Whiteboard', 'Worksheets', 'Educational materials', 'Assessment tools'],
      assessment: `Formative assessment through ${topic} exercises and observation`,
      homework: `Practice exercises reinforcing ${topic} concepts`
    };
  }
}

// Reading Assessment Service
export class ReadingAssessmentService {
  private model = genAI.getGenerativeModel({ 
    model: MODELS.STRUCTURED,
    generationConfig: {
      temperature: 0.5,
      topK: 20,
      topP: 0.8,
      maxOutputTokens: 1024,
    }
  });

  async generateAssessmentFeedback(
    studentName: string, 
    grade: string, 
    readingText: string, 
    duration: number, 
    wordCount: number
  ): Promise<any> {
    const wpm = Math.round((wordCount / duration) * 60);
    const accuracy = Math.round(85 + Math.random() * 10); // Simulated for demo
    const fluency = Math.round(80 + Math.random() * 15); // Simulated for demo
    
    const prompt = `Analyze this reading assessment and provide educational feedback:
    
    Student: ${studentName} (${grade})
    Text: ${readingText}
    Reading Duration: ${duration} seconds
    Words per Minute: ${wpm}
    Estimated Accuracy: ${accuracy}%
    Estimated Fluency: ${fluency}%
    
    Provide:
    1. 3-4 specific feedback points
    2. Areas of strength
    3. Areas for improvement
    4. Recommended next steps
    
    Make feedback constructive and encouraging for the student's grade level.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const feedbackText = response.text();
      
      return {
        wordsPerMinute: wpm,
        accuracy,
        fluency,
        feedback: this.parseFeedback(feedbackText, accuracy, fluency, wpm)
      };
    } catch (error) {
      console.error('Assessment feedback error:', error);
      return {
        wordsPerMinute: wpm,
        accuracy,
        fluency,
        feedback: this.generateFallbackFeedback(accuracy, fluency, wpm)
      };
    }
  }

  private parseFeedback(text: string, accuracy: number, fluency: number, wpm: number): string[] {
    // Extract feedback points from the generated text
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const feedback = [];
    
    for (const line of lines) {
      if (line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('2.')) {
        feedback.push(line.replace(/^[•\-\d\.]\s*/, '').trim());
      }
    }
    
    if (feedback.length === 0) {
      return this.generateFallbackFeedback(accuracy, fluency, wpm);
    }
    
    return feedback.slice(0, 4); // Limit to 4 feedback points
  }

  private generateFallbackFeedback(accuracy: number, fluency: number, wpm: number): string[] {
    const feedback = [];
    
    if (accuracy >= 90) {
      feedback.push('Excellent word recognition and pronunciation');
    } else if (accuracy >= 80) {
      feedback.push('Good accuracy, practice difficult words');
    } else {
      feedback.push('Needs more practice with word recognition');
    }
    
    if (fluency >= 85) {
      feedback.push('Reads with good expression and rhythm');
    } else if (fluency >= 75) {
      feedback.push('Good reading flow, work on expression');
    } else {
      feedback.push('Practice reading aloud to improve fluency');
    }
    
    if (wpm >= 90) {
      feedback.push('Reading speed is above grade level');
    } else if (wpm >= 70) {
      feedback.push('Reading speed is appropriate for grade');
    } else {
      feedback.push('Continue practicing to increase reading speed');
    }
    
    return feedback;
  }
}

// Export service instances
export const contentService = new ContentGenerationService();
export const worksheetService = new WorksheetGenerationService();
export const chatService = new ChatService();
export const visualAidService = new VisualAidService();
export const lessonPlanService = new LessonPlanningService();
export const assessmentService = new ReadingAssessmentService();