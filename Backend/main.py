from fastapi import FastAPI, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import google.generativeai as genai
import os
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional, Tuple
import base64
import json
from pathlib import Path
import logging
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="EduAI Backend",
    description="API for AI-powered educational content generation",
    version="1.0.0",
    docs_url="/api-docs",
    redoc_url=None
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# Load datasets
def load_dataset(filename: str, default_columns: List[str]) -> pd.DataFrame:
    try:
        return pd.read_csv(DATA_DIR / filename)
    except FileNotFoundError:
        logger.warning(f"Dataset {filename} not found, using empty DataFrame")
        return pd.DataFrame(columns=default_columns)

content_dataset = load_dataset("content_generator.csv", 
                             ['content_type', 'language', 'grade', 'prompt', 'response'])
lesson_plans_dataset = load_dataset("lesson_plans.csv",
                                  ['subject', 'grade', 'topic', 'duration', 'curriculum_context',
                                   'objectives', 'activities', 'materials', 'assessment', 'homework'])
worksheets_dataset = load_dataset("worksheets.csv",
                                ['content_type', 'grade', 'difficulty', 'example_questions', 'topic'])
chat_dataset = load_dataset("askanything.csv",
                          ['language', 'question', 'response'])
reading_assessments_dataset = load_dataset("assessments.csv",
                                         ['grade', 'passage_title', 'passage_text', 'duration_seconds',
                                          'word_count', 'words_per_minute', 'accuracy', 'fluency', 'feedback'])
visual_aids_dataset = load_dataset("visualaids.csv",
                                 ['subject', 'type', 'prompt', 'example_description', 'example_image_prompt'])

# Configure Gemini
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GOOGLE_API_KEY environment variable not set")
    raise ValueError("GOOGLE_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)
text_model = genai.GenerativeModel('gemini-2.0-flash')
vision_model = genai.GenerativeModel('gemini-pro-vision')

# ======================
# Pydantic Models
# ======================
class GenerateRequest(BaseModel):
    prompt: str
    content_type: str
    language: str
    grade: str

class LessonPlanRequest(BaseModel):
    subject: str
    grade: str
    topic: str
    duration: int = Field(..., gt=0, le=120)
    curriculum: str

class WorksheetRequest(BaseModel):
    text_content: str
    subject: str

class ChatRequest(BaseModel):
    message: str
    language: str
    context: Optional[str] = None

class ReadingAssessmentRequest(BaseModel):
    student_name: str
    grade: str
    passage_title: str
    duration_seconds: int = Field(..., gt=0)
    word_count: int = Field(..., gt=0)

class VisualAidRequest(BaseModel):
    prompt: str
    aid_type: str
    subject: str

class GeneratedContent(BaseModel):
    id: str
    type: str
    language: str
    content: str
    timestamp: str

class LessonPlan(BaseModel):
    id: str
    subject: str
    grade: str
    topic: str
    duration: int
    objectives: List[str]
    activities: List[str]
    materials: List[str]
    assessment: str
    homework: str
    date: str

class WorksheetSet(BaseModel):
    id: str
    original_image: str
    extracted_text: str
    worksheets: List[Dict[str, Any]]
    timestamp: str

class ChatMessage(BaseModel):
    id: str
    type: str  # 'user' or 'bot'
    content: str
    language: str
    timestamp: str

class ReadingAssessmentResult(BaseModel):
    id: str
    student_name: str
    grade: str
    passage_title: str
    duration_seconds: int
    words_per_minute: float
    accuracy: float
    fluency: float
    feedback: List[str]
    timestamp: str

class GeneratedVisualAid(BaseModel):
    id: str
    prompt: str
    type: str
    image_url: str
    description: str
    timestamp: str

class HealthCheck(BaseModel):
    status: str
    gemini_ready: bool
    datasets_loaded: Dict[str, bool]
    version: str

# ======================
# In-memory Storage
# ======================
content_store = []
lesson_plans_store = []
worksheet_sets_store = []
chat_history_store = []
reading_assessments_store = []
visual_aids_store = []

# ======================
# Helper Functions
# ======================
def parse_string_list(list_str: str) -> List[str]:
    """Parse string with newline-separated items into list"""
    if not isinstance(list_str, str):
        return []
    return [item.strip() for item in list_str.split('\n') if item.strip()]

def safe_json_parse(json_str: str, default: Any = None):
    """Safely parse JSON string with fallback"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default

def generate_gemini_response(prompt: Any, model_type: str = 'text') -> Any:
    """Generate response from Gemini with error handling"""
    try:
        if model_type == 'vision':
            return vision_model.generate_content(prompt)
        return text_model.generate_content(prompt)
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service currently unavailable"
        )

def calculate_reading_metrics(duration: int, word_count: int) -> Tuple[float, float, float]:
    """Calculate reading metrics based on duration and word count"""
    words_per_minute = (word_count / duration) * 60
    accuracy = min(100, max(70, 90 - (0.5 * max(0, words_per_minute - 45))))
    fluency = min(100, max(65, 85 - (0.3 * max(0, words_per_minute - 50))))
    return round(words_per_minute, 1), round(accuracy, 1), round(fluency, 1)

def get_placeholder_image(aid_type: str, subject: str) -> str:
    """Get placeholder image URL based on type and subject"""
    type_map = {
        "diagram": "diagram",
        "illustration": "illustration",
        "chart": "chart",
        "map": "map",
        "timeline": "timeline",
        "flowchart": "flowchart"
    }
    
    subject_map = {
        "science": "science",
        "math": "math",
        "social": "social+studies",
        "language": "language+arts"
    }
    
    base_url = "https://source.unsplash.com/random/600x400/?"
    query = f"{type_map.get(aid_type, 'education')},{subject_map.get(subject, 'school')}"
    
    try:
        # Get actual image URL from Unsplash (not just the redirect)
        response = requests.head(f"{base_url}{query}", allow_redirects=True)
        return response.url
    except:
        return f"{base_url}{query}"

# ======================
# API Endpoints
# ======================
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "gemini_ready": GEMINI_API_KEY is not None,
        "datasets_loaded": {
            "content": not content_dataset.empty,
            "lesson_plans": not lesson_plans_dataset.empty,
            "worksheets": not worksheets_dataset.empty,
            "chat": not chat_dataset.empty,
            "reading_assessments": not reading_assessments_dataset.empty,
            "visual_aids": not visual_aids_dataset.empty
        },
        "version": "1.0.0"
    }

# ======================
# Content Generator Endpoints
# ======================
@app.post("/content/generate", response_model=GeneratedContent)
async def generate_content(request: GenerateRequest):
    """Generate educational content based on parameters"""
    try:
        similar_content = content_dataset[
            (content_dataset['language'] == request.language) & 
            (content_dataset['grade'] == request.grade) &
            (content_dataset['content_type'] == request.content_type)
        ]
        
        context_prompt = f"""
        You are an educational content generator specializing in {request.language} for grade {request.grade}.
        Generate a {request.content_type} on the topic: {request.prompt}
        
        Examples of good content:
        {similar_content.to_dict('records') if not similar_content.empty else 'No examples found'}
        
        The content should be:
        - Culturally appropriate for {request.language} speakers
        - At grade {request.grade} comprehension level
        - Engaging and educational
        - In proper {request.language} with correct grammar
        """
        
        response = generate_gemini_response(context_prompt)
        
        content_item = {
            "id": str(uuid.uuid4()),
            "type": request.content_type,
            "language": request.language,
            "content": response.text,
            "timestamp": datetime.now().isoformat()
        }
        
        content_store.insert(0, content_item)
        return content_item
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Content generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Content generation failed"
        )

@app.get("/content", response_model=List[GeneratedContent])
async def get_generated_content(limit: int = 10):
    """Get generated content history"""
    return content_store[:limit]

# ======================
# Lesson Planner Endpoints
# ======================
@app.post("/lesson-plans/generate", response_model=LessonPlan)
async def generate_lesson_plan(request: LessonPlanRequest):
    """Generate a lesson plan based on parameters"""
    try:
        similar_plans = lesson_plans_dataset[
            (lesson_plans_dataset['grade'] == request.grade) &
            (lesson_plans_dataset['subject'] == request.subject)
        ]
        
        context_prompt = f"""
        Generate a comprehensive lesson plan with these specifications:
        - Subject: {request.subject}
        - Grade: {request.grade}
        - Topic: {request.topic}
        - Duration: {request.duration} minutes
        - Curriculum Context: {request.curriculum or 'Not specified'}
        
        Example lesson plans:
        {similar_plans.to_dict('records') if not similar_plans.empty else 'No examples found'}
        
        Include:
        1. Learning objectives (3-5 bullet points)
        2. Engaging activities (3-5 items)
        3. Required materials list
        4. Assessment method
        5. Appropriate homework assignment
        
        Return as JSON with keys: objectives, activities, materials, assessment, homework
        """
        
        response = generate_gemini_response(context_prompt)
        plan_data = safe_json_parse(response.text, {
            "objectives": ["Objective 1", "Objective 2"],
            "activities": ["Activity 1", "Activity 2"],
            "materials": ["Material 1", "Material 2"],
            "assessment": "Oral questions and observation",
            "homework": "Worksheet or reflection"
        })
        
        lesson_plan = {
            "id": str(uuid.uuid4()),
            "subject": request.subject,
            "grade": request.grade,
            "topic": request.topic,
            "duration": request.duration,
            "objectives": plan_data.get("objectives", []),
            "activities": plan_data.get("activities", []),
            "materials": plan_data.get("materials", []),
            "assessment": plan_data.get("assessment", ""),
            "homework": plan_data.get("homework", ""),
            "date": datetime.now().isoformat()
        }
        
        lesson_plans_store.insert(0, lesson_plan)
        return lesson_plan
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lesson plan generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lesson plan generation failed"
        )

@app.get("/lesson-plans", response_model=List[LessonPlan])
async def get_lesson_plans(limit: int = 10):
    """Get generated lesson plans"""
    return lesson_plans_store[:limit]

# ======================
# Worksheet Generator Endpoints
# ======================
@app.post("/worksheets/upload", response_model=WorksheetSet)
async def upload_and_process_image(file: UploadFile = File(...)):
    """Process uploaded image and generate worksheets"""
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only image files are allowed"
            )
        
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        image_parts = [{
            "mime_type": file.content_type,
            "data": base64_image
        }]
        
        prompt = """Extract all text from this educational material image.
        Return ONLY the extracted text with no additional commentary or formatting."""
        
        response = generate_gemini_response([prompt, *image_parts], 'vision')
        extracted_text = response.text
        
        worksheet_request = WorksheetRequest(
            text_content=extracted_text,
            subject="General"
        )
        
        return await generate_worksheets(worksheet_request, base64_image)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Worksheet generation failed"
        )

@app.post("/worksheets/generate", response_model=WorksheetSet)
async def generate_worksheets_from_text(request: WorksheetRequest):
    """Generate worksheets from text content"""
    try:
        return await generate_worksheets(request)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Worksheet generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Worksheet generation failed"
        )

async def generate_worksheets(request: WorksheetRequest, base64_image: str = None):
    """Core worksheet generation logic"""
    similar_worksheets = worksheets_dataset[
        (worksheets_dataset['content_type'] == request.subject)
    ]
    
    context_prompt = f"""
    Generate 3 worksheet variations (Easy, Medium, Hard) based on:
    {request.text_content}
    
    Example worksheets:
    {similar_worksheets.to_dict('records') if not similar_worksheets.empty else 'No examples found'}
    
    For each worksheet include:
    - Grade level (Grade 1-5)
    - Difficulty level (Easy, Medium, Hard)
    - 5-10 appropriate questions
    
    Return as JSON array with structure:
    [
        {{
            "grade": "Grade X",
            "difficulty": "Easy/Medium/Hard",
            "questions": ["q1", "q2", ...]
        }},
        ...
    ]
    """
    
    response = generate_gemini_response(context_prompt)
    worksheets = safe_json_parse(response.text, [
        {
            "grade": "Grade 3",
            "difficulty": "Easy",
            "questions": ["Sample question 1", "Sample question 2"]
        },
        {
            "grade": "Grade 4", 
            "difficulty": "Medium",
            "questions": ["Sample question 1", "Sample question 2"]
        },
        {
            "grade": "Grade 5",
            "difficulty": "Hard",
            "questions": ["Sample question 1", "Sample question 2"]
        }
    ])
    
    worksheet_set = {
        "id": str(uuid.uuid4()),
        "original_image": base64_image if base64_image else "",
        "extracted_text": request.text_content,
        "worksheets": worksheets,
        "timestamp": datetime.now().isoformat()
    }
    
    worksheet_sets_store.insert(0, worksheet_set)
    return worksheet_set

@app.get("/worksheets", response_model=List[WorksheetSet])
async def get_worksheet_sets(limit: int = 10):
    """Get generated worksheet sets"""
    return worksheet_sets_store[:limit]

# ======================
# Ask Anything Bot Endpoints
# ======================
@app.post("/chat/send", response_model=ChatMessage)
async def send_chat_message(request: ChatRequest):
    """Handle chat messages and generate responses"""
    try:
        user_message = {
            "id": str(uuid.uuid4()),
            "type": "user",
            "content": request.message,
            "language": request.language,
            "timestamp": datetime.now().isoformat()
        }
        chat_history_store.append(user_message)
        
        similar_chats = chat_dataset[
            (chat_dataset['language'] == request.language)
        ].sample(3) if not chat_dataset.empty else []
        
        context_prompt = f"""
        You are a friendly AI teaching assistant helping students in {request.language}.
        The student asked: {request.message}
        
        Respond with:
        - Simple, clear language for grade school students
        - Concise but informative explanations
        - Examples and analogies when helpful
        - Proper {request.language} grammar
        - Encouraging and positive tone
        
        Example good responses:
        {similar_chats.to_dict('records') if not similar_chats.empty else 'No examples found'}
        """
        
        response = generate_gemini_response(context_prompt)
        
        bot_message = {
            "id": str(uuid.uuid4()),
            "type": "bot",
            "content": response.text,
            "language": request.language,
            "timestamp": datetime.now().isoformat()
        }
        chat_history_store.append(bot_message)
        
        return bot_message
        
    except Exception as e:
        logger.error(f"Chat failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat service unavailable"
        )

@app.get("/chat/history", response_model=List[ChatMessage])
async def get_chat_history(limit: int = 20):
    """Get chat history"""
    return chat_history_store[-limit:] if chat_history_store else []

@app.post("/chat/clear")
async def clear_chat_history():
    """Clear chat history"""
    chat_history_store.clear()
    return {"status": "success", "message": "Chat history cleared"}

# ======================
# Reading Assessment Endpoints
# ======================
@app.post("/assessments/reading", response_model=ReadingAssessmentResult)
async def create_reading_assessment(request: ReadingAssessmentRequest):
    """Generate reading assessment results"""
    try:
        # Find similar assessments in dataset
        similar_assessments = reading_assessments_dataset[
            (reading_assessments_dataset['grade'] == request.grade)
        ].sample(2) if not reading_assessments_dataset.empty else []
        
        # Calculate metrics
        wpm, accuracy, fluency = calculate_reading_metrics(
            request.duration_seconds, 
            request.word_count
        )
        
        # Generate feedback with Gemini
        context_prompt = f"""
        Generate constructive feedback for a {request.grade} student's reading assessment:
        - Passage: {request.passage_title}
        - Words per minute: {wpm} (ideal range for grade: 40-60)
        - Accuracy: {accuracy}%
        - Fluency: {fluency}%
        
        Provide 3-5 specific feedback points to help the student improve.
        Focus on positive reinforcement and actionable suggestions.
        
        Example feedback from similar assessments:
        {similar_assessments['feedback'].tolist() if not similar_assessments.empty else 'No examples found'}
        """
        
        response = generate_gemini_response(context_prompt)
        feedback = parse_string_list(response.text)
        
        # Create assessment record
        assessment = {
            "id": str(uuid.uuid4()),
            "student_name": request.student_name,
            "grade": request.grade,
            "passage_title": request.passage_title,
            "duration_seconds": request.duration_seconds,
            "words_per_minute": wpm,
            "accuracy": accuracy,
            "fluency": fluency,
            "feedback": feedback,
            "timestamp": datetime.now().isoformat()
        }
        
        reading_assessments_store.insert(0, assessment)
        return assessment
        
    except Exception as e:
        logger.error(f"Reading assessment failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Reading assessment failed"
        )

@app.get("/assessments/reading", response_model=List[ReadingAssessmentResult])
async def get_reading_assessments(limit: int = 10):
    """Get reading assessment history"""
    return reading_assessments_store[:limit]

@app.get("/assessments/reading/passages", response_model=Dict[str, Any])
async def get_reading_passages():
    """Get available reading passages"""
    passages = {
        "passage1": {
            "title": "The Cat and the Mouse",
            "grade": "Grade 2-3",
            "text": "Once upon a time, there lived a clever mouse...",
            "word_count": 98
        },
        "passage2": {
            "title": "The Magic Garden",
            "grade": "Grade 3-4",
            "text": "In a small village, there was a special garden...",
            "word_count": 142
        },
        "passage3": {
            "title": "The Honest Woodcutter",
            "grade": "Grade 4-5",
            "text": "Deep in the forest lived an honest woodcutter...",
            "word_count": 198
        }
    }
    return passages

# ======================
# Visual Aid Designer Endpoints
# ======================
@app.post("/visual-aids/generate", response_model=GeneratedVisualAid)
async def generate_visual_aid(request: VisualAidRequest):
    """Generate educational visual aids"""
    try:
        # Find similar visual aids in dataset
        similar_aids = visual_aids_dataset[
            (visual_aids_dataset['subject'] == request.subject) &
            (visual_aids_dataset['type'] == request.aid_type)
        ].sample(2) if not visual_aids_dataset.empty else []
        
        # Generate description with Gemini
        context_prompt = f"""
        Create a detailed description for an educational {request.aid_type} about:
        {request.prompt}
        
        The visual aid should be appropriate for {request.subject} instruction.
        Provide clear instructions for creating this visual material.
        
        Examples of good descriptions:
        {similar_aids['example_description'].tolist() if not similar_aids.empty else 'No examples found'}
        """
        
        description_response = generate_gemini_response(context_prompt)
        description = description_response.text
        
        # Generate image prompt
        image_prompt_context = f"""
        Create a detailed prompt for generating an image of:
        {request.prompt}
        
        The image should be a {request.aid_type} for {request.subject} education.
        Make it visually appealing and educationally effective.
        
        Example image prompts:
        {similar_aids['example_image_prompt'].tolist() if not similar_aids.empty else 'No examples found'}
        """
        
        image_prompt_response = generate_gemini_response(image_prompt_context)
        image_prompt = image_prompt_response.text
        
        # Get placeholder image (in production, generate actual image)
        image_url = get_placeholder_image(request.aid_type, request.subject)
        
        # Create visual aid record
        visual_aid = {
            "id": str(uuid.uuid4()),
            "prompt": request.prompt,
            "type": request.aid_type,
            "image_url": image_url,
            "description": description,
            "timestamp": datetime.now().isoformat()
        }
        
        visual_aids_store.insert(0, visual_aid)
        return visual_aid
        
    except Exception as e:
        logger.error(f"Visual aid generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Visual aid generation failed"
        )

@app.get("/visual-aids", response_model=List[GeneratedVisualAid])
async def get_visual_aids(limit: int = 10):
    """Get generated visual aids"""
    return visual_aids_store[:limit]

@app.get("/visual-aids/suggestions", response_model=Dict[str, Any])
async def get_visual_aid_suggestions():
    """Get visual aid suggestions by subject"""
    suggestions = {
        "science": [
            "Human digestive system for grade 4",
            "Plant parts and functions diagram",
            "Food chain in forest ecosystem",
            "Water cycle with simple labels",
            "Types of weather conditions",
        ],
        "math": [
            "Fraction comparison chart",
            "Multiplication table visual",
            "Geometric shapes and properties",
            "Number line for addition",
            "Clock reading practice chart",
        ],
        "social": [
            "Indian map with states",
            "Timeline of Indian freedom struggle",
            "Community helpers chart",
            "Types of transportation",
            "Family tree template",
        ],
        "language": [
            "Parts of speech chart",
            "Vowels and consonants diagram",
            "Story sequence template",
            "Rhyming words visualization",
            "Sentence structure diagram",
        ]
    }
    return suggestions

# ======================
# Main Application
# ======================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)