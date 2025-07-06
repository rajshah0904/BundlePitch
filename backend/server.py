from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Claude API configuration
CLAUDE_API_KEY = os.environ.get('CLAUDE_API_KEY')
if not CLAUDE_API_KEY:
    raise ValueError("CLAUDE_API_KEY environment variable is required")

# Define Models
class BundleItem(BaseModel):
    title: str
    description: str = ""
    price: str = ""

class BundleRequest(BaseModel):
    bundle_name: str
    tone: str
    items: List[BundleItem]

class GeneratedCopy(BaseModel):
    title: str
    pitch: str
    bullets: List[str]
    instagram: str

class CopyHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bundle_name: str
    tone: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    copy: GeneratedCopy

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

def create_copy_prompt(bundle_name: str, tone: str, items: List[BundleItem]) -> str:
    """Create a structured prompt for Claude to generate bundle copy"""
    
    tone_descriptions = {
        "warm": "Warm & heartfelt - nurturing, cozy, comforting, like a loving embrace",
        "playful": "Playful & fun - energetic, exciting, joyful, full of personality",
        "minimal": "Minimal & modern - clean, streamlined, sophisticated, less is more",
        "luxury": "Luxury & elegant - premium, sophisticated, high-end, exclusive",
        "casual": "Casual & friendly - relaxed, approachable, easy-going, conversational",
        "professional": "Professional & trustworthy - reliable, competent, efficient, business-like"
    }
    
    items_text = ""
    for i, item in enumerate(items, 1):
        items_text += f"{i}. {item.title}"
        if item.description:
            items_text += f" - {item.description}"
        if item.price:
            items_text += f" (${item.price})"
        items_text += "\n"
    
    prompt = f"""You are an expert Etsy copywriter specializing in bundle listings. Create high-converting, emotionally engaging sales copy for the following bundle:

Bundle Details:
- Bundle Name/Goal: {bundle_name}
- Tone: {tone_descriptions.get(tone, tone)}
- Items Included:
{items_text}

Generate exactly 4 pieces of copy in this specific format:

**TITLE:**
[Create a short, SEO-friendly product name for the entire bundle - max 140 characters]

**PITCH:**
[Write a warm, story-driven paragraph explaining why the bundle is thoughtful, valuable, and better together - max 500 characters]

**BULLETS:**
[Create 3-5 feature bullets that list each item and highlight its role in the bundle - max 300 characters total]

**INSTAGRAM:**
[Write a short caption with light emojis that sellers can use for social media - max 280 characters]

Make sure each section captures the {tone} tone and emphasizes the cohesive value of the bundle. Focus on storytelling, emotional connection, and how the items work together."""

    return prompt

async def generate_copy_with_claude(bundle_name: str, tone: str, items: List[BundleItem]) -> GeneratedCopy:
    """Generate copy using Claude AI"""
    try:
        # Create unique session ID for this request
        session_id = f"bundle_copy_{uuid.uuid4().hex[:8]}"
        
        # Initialize Claude chat
        chat = LlmChat(
            api_key=CLAUDE_API_KEY,
            session_id=session_id,
            system_message="You are an expert Etsy copywriter specializing in creating high-converting bundle listings. Focus on emotional engagement, storytelling, and value proposition."
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        # Generate the prompt
        prompt = create_copy_prompt(bundle_name, tone, items)
        
        # Create user message
        user_message = UserMessage(text=prompt)
        
        # Get response from Claude
        response = await chat.send_message(user_message)
        
        # Parse the response
        return parse_claude_response(response, items)
        
    except Exception as e:
        logging.error(f"Error generating copy with Claude: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate copy: {str(e)}")

def parse_claude_response(response: str, items: List[BundleItem]) -> GeneratedCopy:
    """Parse Claude's response into structured copy"""
    try:
        # Split response into sections
        sections = {}
        current_section = None
        current_content = []
        
        for line in response.split('\n'):
            line = line.strip()
            if line.startswith('**TITLE:**'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'title'
                current_content = []
            elif line.startswith('**PITCH:**'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'pitch'
                current_content = []
            elif line.startswith('**BULLETS:**'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'bullets'
                current_content = []
            elif line.startswith('**INSTAGRAM:**'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'instagram'
                current_content = []
            elif line and not line.startswith('**'):
                current_content.append(line)
        
        # Add last section
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        # Extract bullets from bullets section
        bullets_text = sections.get('bullets', '')
        bullets = []
        for line in bullets_text.split('\n'):
            line = line.strip()
            if line and (line.startswith('•') or line.startswith('-') or line.startswith('*')):
                bullets.append(line.lstrip('•-* '))
            elif line and not any(line.startswith(prefix) for prefix in ['•', '-', '*']):
                bullets.append(line)
        
        # If no bullets were parsed, create fallback bullets
        if not bullets:
            bullets = [f"{item.title} - {item.description or 'Perfect addition to your bundle'}" for item in items[:3]]
        
        return GeneratedCopy(
            title=sections.get('title', f"Amazing {len(items)}-Piece Bundle Collection"),
            pitch=sections.get('pitch', "This carefully curated bundle brings together the perfect combination of items for an amazing value!"),
            bullets=bullets[:5],  # Limit to 5 bullets
            instagram=sections.get('instagram', "New bundle alert! 🎉 Check out this amazing collection! #bundle #handmade #shopsmall")
        )
        
    except Exception as e:
        logging.error(f"Error parsing Claude response: {str(e)}")
        # Return fallback copy if parsing fails
        return GeneratedCopy(
            title=f"Complete Bundle Collection - {len(items)} Premium Items",
            pitch="This thoughtfully curated bundle combines the perfect selection of items to create an exceptional value package that's greater than the sum of its parts.",
            bullets=[f"{item.title} - {item.description or 'Premium quality item'}" for item in items[:5]],
            instagram="New bundle available! ✨ Perfect combination of quality items in one amazing package! #bundle #quality #value"
        )

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "BundlePitch.ai API is running"}

@api_router.post("/generate-copy", response_model=GeneratedCopy)
async def generate_copy(request: BundleRequest):
    """Generate copy for a bundle using Claude AI"""
    if not request.bundle_name or not request.tone or not request.items:
        raise HTTPException(status_code=400, detail="Bundle name, tone, and items are required")
    
    # Filter out items without titles
    valid_items = [item for item in request.items if item.title.strip()]
    if not valid_items:
        raise HTTPException(status_code=400, detail="At least one item with a title is required")
    
    # Generate copy using Claude
    copy = await generate_copy_with_claude(request.bundle_name, request.tone, valid_items)
    
    # Automatically save to history
    try:
        tone_label = {
            "warm": "Warm & Heartfelt",
            "playful": "Playful & Fun", 
            "minimal": "Minimal & Modern",
            "luxury": "Luxury & Elegant",
            "casual": "Casual & Friendly",
            "professional": "Professional & Trustworthy"
        }.get(request.tone, request.tone)
        
        history_item = CopyHistory(
            bundle_name=request.bundle_name,
            tone=tone_label,
            copy=copy
        )
        
        # Save to database
        await db.copy_history.insert_one(history_item.dict())
        logging.info(f"Saved copy history for bundle: {request.bundle_name}")
        
    except Exception as e:
        logging.error(f"Error saving copy history: {str(e)}")
        # Don't fail the main request if history saving fails
    
    return copy

@api_router.post("/save-copy", response_model=CopyHistory)
async def save_copy(request: BundleRequest, copy: GeneratedCopy):
    """Save generated copy to history"""
    try:
        history_item = CopyHistory(
            bundle_name=request.bundle_name,
            tone=request.tone,
            copy=copy
        )
        
        # Save to database
        result = await db.copy_history.insert_one(history_item.dict())
        
        return history_item
        
    except Exception as e:
        logging.error(f"Error saving copy history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save copy history")

@api_router.get("/copy-history", response_model=List[CopyHistory])
async def get_copy_history(limit: int = 10):
    """Get copy history"""
    try:
        history = await db.copy_history.find().sort("timestamp", -1).limit(limit).to_list(limit)
        return [CopyHistory(**item) for item in history]
        
    except Exception as e:
        logging.error(f"Error retrieving copy history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve copy history")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()