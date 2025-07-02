from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
import os
from datetime import datetime
import uuid
from typing import List

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load dataset
dataset = pd.read_csv("content_generator.csv")

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-pro')

# Pydantic models
class GenerateRequest(BaseModel):
    prompt: str
    content_type: str
    language: str
    grade: str

class GeneratedContent(BaseModel):
    id: str
    type: str
    language: str
    content: str
    timestamp: str

# In-memory storage for generated content
content_store = []

@app.post("/generate", response_model=GeneratedContent)
async def generate_content(request: GenerateRequest):
    try:
        # Check if similar content exists in dataset
        similar_content = dataset[
            (dataset['language'] == request.language) & 
            (dataset['grade'] == request.grade) &
            (dataset['content_type'] == request.content_type)
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
        response = model.generate_content(context_prompt)
        
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/content", response_model=List[GeneratedContent])
async def get_generated_content(limit: int = 10):
    return content_store[:limit]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)