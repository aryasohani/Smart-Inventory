import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.tools import TOOLS
from app.ai.tool_executor import ToolExecutor
from app.schemas.ai import ChatRequest, ChatResponse
from app.core.config import settings
from app.core.logging import logger


SYSTEM_PROMPT = """You are SmartStore AI, an intelligent inventory management assistant.
You have access to real-time inventory data through function tools. Always use the tools to fetch actual data before answering inventory questions - never make up numbers or statuses.

Your capabilities:
- Check low stock and critical inventory levels
- Retrieve product details and status
- View purchase order history
- Identify expiring products
- Create draft purchase orders

Always be precise, data-driven, and actionable in your responses."""


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.executor = ToolExecutor(db)

    async def chat(self, request: ChatRequest) -> ChatResponse:
        provider = settings.AI_PROVIDER.lower()
        if provider == "openai" and not settings.OPENAI_API_KEY:
            return ChatResponse(
                response="AI provider is not configured. Add OPENAI_API_KEY to enable live model responses.",
                tool_calls_made=[],
            )
        if provider == "anthropic" and not settings.ANTHROPIC_API_KEY:
            return ChatResponse(
                response="AI provider is not configured. Add ANTHROPIC_API_KEY to enable live model responses.",
                tool_calls_made=[],
            )
        if provider == "gemini" and not settings.GEMINI_API_KEY:
            return ChatResponse(
                response="AI provider is not configured. Add GEMINI_API_KEY to enable live model responses.",
                tool_calls_made=[],
            )
        if provider == "openai":
            return await self._chat_openai(request)
        elif provider == "anthropic":
            return await self._chat_anthropic(request)
        elif provider == "gemini":
            return await self._chat_gemini(request)
        else:
            raise ValueError(f"Unknown AI provider: {provider}")

    async def _chat_openai(self, request: ChatRequest) -> ChatResponse:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages += [{"role": m.role, "content": m.content} for m in request.messages]

        tools_called = []
        # Agentic loop: allow multiple tool call rounds
        for _ in range(5):
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
            )
            msg = response.choices[0].message

            if not msg.tool_calls:
                return ChatResponse(response=msg.content or "", tool_calls_made=tools_called)

            # Execute all tool calls
            messages.append(msg.model_dump(exclude_unset=True))
            for tc in msg.tool_calls:
                tool_name = tc.function.name
                args = json.loads(tc.function.arguments)
                logger.info("Executing tool", tool=tool_name, args=args)
                result = await self.executor.execute(tool_name, args)
                tools_called.append(tool_name)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result,
                })

        return ChatResponse(response="I've processed your request.", tool_calls_made=tools_called)

    async def _chat_anthropic(self, request: ChatRequest) -> ChatResponse:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

        # Convert OpenAI tool format to Anthropic format
        anthropic_tools = [
            {
                "name": t["function"]["name"],
                "description": t["function"]["description"],
                "input_schema": t["function"]["parameters"],
            }
            for t in TOOLS
        ]

        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        tools_called = []

        for _ in range(5):
            response = await client.messages.create(
                model="claude-opus-4-5",
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                messages=messages,
                tools=anthropic_tools,
            )

            if response.stop_reason == "end_turn":
                text = " ".join(b.text for b in response.content if hasattr(b, "text"))
                return ChatResponse(response=text, tool_calls_made=tools_called)

            # Process tool use blocks
            assistant_content = []
            tool_results = []
            for block in response.content:
                assistant_content.append(block.model_dump())
                if block.type == "tool_use":
                    result = await self.executor.execute(block.name, block.input)
                    tools_called.append(block.name)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            messages.append({"role": "assistant", "content": assistant_content})
            messages.append({"role": "user", "content": tool_results})

        return ChatResponse(response="Request processed.", tool_calls_made=tools_called)

    async def _chat_gemini(self, request: ChatRequest) -> ChatResponse:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-pro")

        # Build conversation history
        history = []
        for m in request.messages[:-1]:
            role = "user" if m.role == "user" else "model"
            history.append({"role": role, "parts": [m.content]})

        chat = model.start_chat(history=history)
        last_msg = request.messages[-1].content
        response = await chat.send_message_async(last_msg)

        return ChatResponse(response=response.text, tool_calls_made=[])