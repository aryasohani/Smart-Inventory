from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.ai import ChatRequest, ChatResponse
from app.ai.chat_service import AIService
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    AI chat endpoint with real tool/function calling against live DB.
    
    The AI can:
    - Check low stock products
    - Get product details  
    - View PO history
    - Find expiring products
    - Create draft purchase orders
    
    All responses are grounded in real database data - no hallucination.
    """
    service = AIService(db)
    return await service.chat(request)