from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
import os
from datetime import datetime
import uuid
from typing import List, Dict, Any
import base64
import json

app = FastAPI(title="EduAI Backend", 
              description="API for AI-powered educational content generation",
              version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load datasets
try:
    content_dataset = pd.read_csv("content_generator.csv")
    lesson_plans_dataset = pd.read_csv("lesson_plans_dataset.csv")
    worksheets_dataset = pd.read_csv("worksheets.csv")
except FileNotFoundError as e:
    print(f"Warning: Dataset file not found - {e}")
    # Create empty DataFrames if files don't exist
    content_dataset = pd.DataFrame(columns=['content_type', 'language', 'grade', 'prompt', 'response'])
    lesson_plans_dataset = pd.DataFrame(columns=['subject', 'grade', 'topic', 'duration', 'curriculum_context', 
                                               'objectives', 'activities', 'materials', 'assessment', 'homework'])
    worksheets_dataset = pd.DataFrame(columns=['content_type', 'grade', 'difficulty', 'example_questions', 'topic'])

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')
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

class HealthCheck(BaseModel):
    status: str
    gemini_ready: bool
    datasets_loaded: bool

# ======================
# In-memory Storage
# ======================
content_store = []
lesson_plans_store = []
worksheet_sets_store = []

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

def generate_gemini_response(prompt: str, model_type: str = 'text'):
    """Generate response from Gemini with error handling"""
    try:
        if model_type == 'vision':
            return vision_model.generate_content(prompt)
        return model.generate_content(prompt)
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
            "worksheets": not worksheets_dataset.empty
        }
    }

# ======================
# Content Generator Endpoints
# ======================
@app.post("/content/generate", response_model=GeneratedContent)
async def generate_content(request: GenerateRequest):
    """Generate educational content based on parameters"""
    try:
        # Find similar content in dataset
        similar_content = content_dataset[
            (content_dataset['language'] == request.language) & 
            (content_dataset['grade'] == request.grade) &
            (content_dataset['content_type'] == request.content_type)
        ]
        
        # Create context prompt
        context_prompt = f"""
        You are an educational content generator specializing in {request.language} for grade {request.grade}.
        Generate a {request.content_type} on the topic: {request.prompt}
        
        Here are some examples of good content:
        {similar_content.to_dict('records') if not similar_content.empty else 'No examples found'}
        
        The content should be:
        - Culturally appropriate for {request.language} speakers
        - At grade {request.grade} comprehension level
        - Engaging and educational
        - In proper {request.language} with correct grammar
        """
        
        # Generate with Gemini
        response = generate_gemini_response(context_prompt)
        
        # Store the generated content
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
        # Find similar lesson plans in dataset
        similar_plans = lesson_plans_dataset[
            (lesson_plans_dataset['grade'] == request.grade) &
            (lesson_plans_dataset['subject'] == request.subject)
        ]
        
        # Create context prompt
        context_prompt = f"""
        Generate a comprehensive lesson plan with these specifications:
        - Subject: {request.subject}
        - Grade: {request.grade}
        - Topic: {request.topic}
        - Duration: {request.duration} minutes
        - Curriculum Context: {request.curriculum or 'Not specified'}
        
        Here are some examples of good lesson plans:
        {similar_plans.to_dict('records') if not similar_plans.empty else 'No examples found'}
        
        The lesson plan should include:
        1. Clear learning objectives (3-5 bullet points)
        2. Engaging activities (3-5 items)
        3. Required materials list
        4. Assessment method
        5. Appropriate homework assignment
        
        Return the response as a JSON object with these keys:
        objectives, activities, materials, assessment, homework
        """
        
        # Generate with Gemini
        response = generate_gemini_response(context_prompt)
        
        # Parse the response
        plan_data = safe_json_parse(response.text, {
            "objectives": ["Objective 1", "Objective 2"],
            "activities": ["Activity 1", "Activity 2"],
            "materials": ["Material 1", "Material 2"],
            "assessment": "Oral questions and observation",
            "homework": "Worksheet or reflection"
        })
        
        # Create the lesson plan
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
        
        # Read image file
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        
        # Extract text using Gemini Vision
        image_parts = [{
            "mime_type": file.content_type,
            "data": base64_image
        }]
        
        prompt = """Extract all text from this educational material image.
        Return ONLY the extracted text with no additional commentary or formatting."""
        
        response = generate_gemini_response([prompt, *image_parts], 'vision')
        extracted_text = response.text
        
        # Generate worksheets
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
    # Find similar worksheets in dataset
    similar_worksheets = worksheets_dataset[
        (worksheets_dataset['content_type'] == request.subject)
    ]
    
    # Create context prompt
    context_prompt = f"""
    Generate 3 worksheet variations (Easy, Medium, Hard) based on this content:
    {request.text_content}
    
    Here are some examples of good worksheets:
    {similar_worksheets.to_dict('records') if not similar_worksheets.empty else 'No examples found'}
    
    For each worksheet, include:
    - Grade level (Grade 1-5)
    - Difficulty level (Easy, Medium, Hard)
    - 5-10 questions appropriate for that level
    
    Return the response as a JSON array with this structure:
    [
        {{
            "grade": "Grade X",
            "difficulty": "Easy/Medium/Hard",
            "questions": ["q1", "q2", ...]
        }},
        ...
    ]
    """
    
    # Generate with Gemini
    response = generate_gemini_response(context_prompt)
    
    # Parse the response
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
    
    # Create worksheet set
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
# Main Application
# ======================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)