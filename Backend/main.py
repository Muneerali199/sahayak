from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
import os
from datetime import datetime
import uuid
from typing import List, Dict, Any, Optional
import base64
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

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
try:
    content_dataset = pd.read_csv(DATA_DIR / "content_generator.csv")
except FileNotFoundError:
    content_dataset = pd.DataFrame(columns=['content_type', 'language', 'grade', 'prompt', 'response'])

try:
    lesson_plans_dataset = pd.read_csv(DATA_DIR / "lesson_plans.csv")
except FileNotFoundError:
    lesson_plans_dataset = pd.DataFrame(columns=['subject', 'grade', 'topic', 'duration', 'curriculum_context', 
                                               'objectives', 'activities', 'materials', 'assessment', 'homework'])

try:
    worksheets_dataset = pd.read_csv(DATA_DIR / "worksheets.csv")
except FileNotFoundError:
    worksheets_dataset = pd.DataFrame(columns=['content_type', 'grade', 'difficulty', 'example_questions', 'topic'])

try:
    chat_dataset = pd.read_csv(DATA_DIR / "askanything.csv")
except FileNotFoundError:
    chat_dataset = pd.DataFrame(columns=['language', 'question', 'response'])

# Configure Gemini
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
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
    duration: int
    curriculum: str

class WorksheetRequest(BaseModel):
    text_content: str
    subject: str

class ChatRequest(BaseModel):
    message: str
    language: str
    context: Optional[str] = None

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

class HealthCheck(BaseModel):
    status: str
    gemini_ready: bool
    datasets_loaded: Dict[str, bool]

# ======================
# In-memory Storage
# ======================
content_store = []
lesson_plans_store = []
worksheet_sets_store = []
chat_history_store = []

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

def generate_gemini_response(prompt: Any, model_type: str = 'text'):
    """Generate response from Gemini with error handling"""
    try:
        if model_type == 'vision':
            return vision_model.generate_content(prompt)
        return text_model.generate_content(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

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
            "chat": not chat_dataset.empty
        }
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
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Lesson plan generation failed: {str(e)}")

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
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
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
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.post("/worksheets/generate", response_model=WorksheetSet)
async def generate_worksheets_from_text(request: WorksheetRequest):
    """Generate worksheets from text content"""
    try:
        return await generate_worksheets(request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Worksheet generation failed: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

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
# Main Application
# ======================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)