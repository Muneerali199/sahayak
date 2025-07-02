import { API_BASE_URL } from '../config';

// Content Generation Service
export class ContentGenerationService {
  async generateContent(prompt: string, contentType: string, language: string, grade: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          content_type: contentType,
          language,
          grade
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Content generation error:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }
}

// Worksheet Generation Service
export class WorksheetGenerationService {
  async extractTextFromImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/worksheets/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract text from image');
      }

      const data = await response.json();
      return data.extracted_text;
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error('Failed to extract text from image. Please try again.');
    }
  }

  async generateWorksheets(extractedText: string, subject: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/worksheets/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_content: extractedText,
          subject
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate worksheets');
      }

      const data = await response.json();
      return data.worksheets;
    } catch (error) {
      console.error('Worksheet generation error:', error);
      throw new Error('Failed to generate worksheets. Please try again.');
    }
  }
}

// Chat Service
export class ChatService {
  async generateResponse(message: string, language: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chat response');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Chat response error:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }
}

// Visual Aid Service
export class VisualAidService {
  async generateVisualAidDescription(prompt: string, aidType: string, subject: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/visual-aids/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aid_type: aidType,
          subject
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate visual aid');
      }

      const data = await response.json();
      return data.description;
    } catch (error) {
      console.error('Visual aid generation error:', error);
      throw new Error('Failed to generate visual aid description. Please try again.');
    }
  }
}

// Lesson Planning Service
export class LessonPlanningService {
  async generateLessonPlan(subject: string, grade: string, topic: string, duration: number, curriculum?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/lesson-plans/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          grade,
          topic,
          duration,
          curriculum
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      const data = await response.json();
      return {
        objectives: data.objectives,
        activities: data.activities,
        materials: data.materials,
        assessment: data.assessment,
        homework: data.homework
      };
    } catch (error) {
      console.error('Lesson plan generation error:', error);
      throw new Error('Failed to generate lesson plan. Please try again.');
    }
  }
}

// Reading Assessment Service
export class ReadingAssessmentService {
  async generateAssessmentFeedback(
    studentName: string, 
    grade: string, 
    passageTitle: string, 
    duration: number, 
    wordCount: number
  ): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          grade,
          passage_title: passageTitle,
          duration_seconds: duration,
          word_count: wordCount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate assessment');
      }

      const data = await response.json();
      return {
        wordsPerMinute: data.words_per_minute,
        accuracy: data.accuracy,
        fluency: data.fluency,
        feedback: data.feedback
      };
    } catch (error) {
      console.error('Assessment feedback error:', error);
      throw new Error('Failed to generate assessment. Please try again.');
    }
  }
}

// Export service instances
export const contentService = new ContentGenerationService();
export const worksheetService = new WorksheetGenerationService();
export const chatService = new ChatService();
export const visualAidService = new VisualAidService();
export const lessonPlanService = new LessonPlanningService();
export const assessmentService = new ReadingAssessmentService();