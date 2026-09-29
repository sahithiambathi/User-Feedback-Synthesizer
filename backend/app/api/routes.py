import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.hindsight_service import (
    hindsight_service,
    HindsightConfigurationError,
    HindsightConnectionError,
)
from app.services.groq_service import (
    groq_service,
    GroqConfigurationError,
    GroqAPIError,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class MemoryTestRequest(BaseModel):
    content: Optional[str] = Field(
        default="User feedback verification note: Customers find the dashboard intuitive.",
        description="Sample memory content to retain in Hindsight",
    )
    query: Optional[str] = Field(
        default="dashboard intuitive",
        description="Search query to recall the retained memory",
    )
    bank_id: Optional[str] = Field(
        default=None,
        description="Optional custom bank_id override",
    )


class AITestRequest(BaseModel):
    prompt: Optional[str] = Field(
        default="Summarize the importance of user feedback synthesis in 1 concise sentence.",
        description="Prompt to send to Groq LLM",
    )
    model: Optional[str] = Field(
        default=None,
        description="Optional model override",
    )


class FeedbackRequest(BaseModel):
    text: str = Field(..., min_length=3)
    source: str = Field(default="customer")
    date: Optional[str] = Field(default=None)


class DecisionRequest(BaseModel):
    decision: str = Field(..., min_length=3)
    theme: str = Field(default="")
    reason: str = Field(default="")
    date: Optional[str] = Field(default=None)


class AskMemoryRequest(BaseModel):
    question: str = Field(..., min_length=3)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _today() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def _memory_text(result: Dict[str, Any]) -> str:
    return (
        result.get("text")
        or result.get("content")
        or result.get("context")
        or ""
    )


def _format_scores(scores: Any) -> Optional[Dict[str, Any]]:
    if scores is None:
        return None
    if isinstance(scores, dict):
        return scores
    return {
        "final": getattr(scores, "final", None),
        "reranker": getattr(scores, "reranker", None),
        "semantic": getattr(scores, "semantic", None),
        "keyword": getattr(scores, "keyword", None),
    }


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start : end + 1])
            except Exception:
                pass
    return None


def _clean_recalled_memories(
    recall_result: Dict[str, Any],
) -> List[Dict[str, Any]]:
    cleaned = []

    for item in recall_result.get("results", []):
        cleaned.append(
            {
                "id": item.get("id"),
                "text": _memory_text(item),
                "type": item.get("type"),
                "context": item.get("context"),
                "metadata": item.get("metadata") or {},
                "scores": _format_scores(item.get("scores")),
            }
        )

    return cleaned


def _require_services() -> None:
    hindsight_ok, hindsight_reason = hindsight_service.check_configuration()
    groq_ok, groq_reason = groq_service.check_configuration()

    if not hindsight_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hindsight is not configured: {hindsight_reason}",
        )

    if not groq_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Groq is not configured: {groq_reason}",
        )


def _recall_feedback(query: str, max_tokens: int = 6000) -> List[Dict[str, Any]]:
    result = hindsight_service.recall(
        query=query,
        bank_id=settings.HINDSIGHT_BANK_ID,
        max_tokens=max_tokens,
        tags=["feedback"],
    )
    return _clean_recalled_memories(result)


def _recall_decisions(query: str, max_tokens: int = 4000) -> List[Dict[str, Any]]:
    result = hindsight_service.recall(
        query=query,
        bank_id=settings.HINDSIGHT_BANK_ID,
        max_tokens=max_tokens,
        tags=["decision"],
    )
    return _clean_recalled_memories(result)


# ---------------------------------------------------------------------------
# Health / status
# ---------------------------------------------------------------------------

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/status")
def system_status():
    hindsight_configured, hindsight_reason = (
        hindsight_service.check_configuration()
    )
    groq_configured, groq_reason = groq_service.check_configuration()

    return {
        "groq_configured": groq_configured,
        "groq_status": groq_reason,
        "groq_model": settings.GROQ_MODEL,
        "hindsight_configured": hindsight_configured,
        "hindsight_status": hindsight_reason,
        "hindsight_endpoint": settings.HINDSIGHT_BASE_URL,
        "hindsight_bank_id": settings.HINDSIGHT_BANK_ID,
    }


# ---------------------------------------------------------------------------
# Hindsight verification
# ---------------------------------------------------------------------------

@router.post("/memory/test", status_code=status.HTTP_200_OK)
def test_hindsight_memory(payload: Optional[MemoryTestRequest] = None):
    req = payload or MemoryTestRequest()
    test_content = req.content
    query = req.query
    bank_id = req.bank_id or settings.HINDSIGHT_BANK_ID

    is_configured, reason = hindsight_service.check_configuration()

    if not is_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "HindsightNotConfigured",
                "message": reason,
            },
        )

    try:
        retain_result = hindsight_service.retain(
            content=test_content,
            bank_id=bank_id,
            metadata={"source": "backend_test_endpoint"},
            tags=["test", "verification"],
        )

        recall_result = hindsight_service.recall(
            query=query,
            bank_id=bank_id,
            max_tokens=4096,
        )

        return {
            "status": "success",
            "message": "Hindsight retain and recall executed successfully",
            "bank_id": bank_id,
            "retained": retain_result,
            "recalled": recall_result,
        }

    except HindsightConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "HindsightConfigurationError", "message": str(e)},
        )

    except HindsightConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "HindsightConnectionError", "message": str(e)},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalError",
                "message": f"Unexpected Hindsight error: {str(e)}",
            },
        )


# ---------------------------------------------------------------------------
# Groq verification
# ---------------------------------------------------------------------------

@router.post("/ai/test", status_code=status.HTTP_200_OK)
def test_groq_ai(payload: Optional[AITestRequest] = None):
    req = payload or AITestRequest()

    prompt = (
        req.prompt
        or "Summarize the importance of user feedback synthesis in 1 concise sentence."
    )

    is_configured, reason = groq_service.check_configuration()

    if not is_configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "GroqNotConfigured",
                "message": reason,
            },
        )

    try:
        result = groq_service.complete(
            prompt=prompt,
            model=req.model,
            system_prompt=(
                "You are a precise AI text analyst for user feedback synthesis."
            ),
            temperature=0.2,
            max_tokens=256,
        )

        return {
            "status": "success",
            "model": result["model"],
            "response": result["content"],
            "usage": result["usage"],
        }

    except GroqConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "GroqConfigurationError", "message": str(e)},
        )

    except GroqAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "GroqAPIError", "message": str(e)},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalError",
                "message": f"Unexpected Groq error: {str(e)}",
            },
        )


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

@router.post("/feedback")
def create_feedback(payload: FeedbackRequest):
    _require_services()

    feedback_date = payload.date or _today()

    try:
        # 1. Store the raw feedback in Hindsight first.
        retain_result = hindsight_service.retain(
            bank_id=settings.HINDSIGHT_BANK_ID,
            content=(
                f"User feedback received on {feedback_date} "
                f"from {payload.source}: {payload.text}"
            ),
            metadata={
                "source": payload.source,
                "date": feedback_date,
                "type": "feedback",
            },
            tags=["feedback"],
        )

        # 2. Analyze the feedback using Groq.
        analysis_prompt = f"""
Analyze this user feedback for a product team.

Feedback:
{payload.text}

Return ONLY valid JSON with these fields:
{{
  "theme": "short theme name",
  "sentiment": "positive|neutral|negative",
  "severity": "low|medium|high",
  "summary": "one concise sentence"
}}

Do not include markdown fences.
"""

        ai_result = groq_service.complete(
            prompt=analysis_prompt,
            system_prompt=(
                "You analyze product feedback. Return concise, valid JSON only."
            ),
            temperature=0.1,
            max_tokens=300,
        )

        raw_analysis = ai_result["content"].strip()
        analysis = _extract_json(raw_analysis)
        if not analysis:
            analysis = {
                "theme": "General feedback",
                "sentiment": "neutral",
                "severity": "medium",
                "summary": raw_analysis[:300],
            }

        # 3. Store the enriched analysis in Hindsight too.
        hindsight_service.retain(
            bank_id=settings.HINDSIGHT_BANK_ID,
            content=(
                f"Feedback analysis for '{payload.text}': "
                f"Theme: {analysis.get('theme', 'General feedback')}. "
                f"Sentiment: {analysis.get('sentiment', 'neutral')}. "
                f"Severity: {analysis.get('severity', 'medium')}. "
                f"Summary: {analysis.get('summary', '')}"
            ),
            metadata={
                "source": payload.source,
                "date": feedback_date,
                "type": "feedback_analysis",
                "theme": str(analysis.get("theme", "General feedback")),
            },
            tags=["feedback", "analysis"],
        )

        return {
            "status": "success",
            "feedback": {
                "text": payload.text,
                "source": payload.source,
                "date": feedback_date,
            },
            "analysis": analysis,
            "memory": retain_result,
        }

    except (HindsightConfigurationError, GroqConfigurationError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except (HindsightConnectionError, GroqAPIError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process feedback: {str(e)}",
        )


@router.get("/feedback")
def get_feedback(query: Optional[str] = None):
    _require_services()

    try:
        memories: List[Dict[str, Any]] = []
        seen_ids = set()

        if query and query.strip():
            # Query-directed semantic recall
            memories = _recall_feedback(query.strip(), max_tokens=7000)
        else:
            # First, fetch latest items directly from bank
            try:
                listed = hindsight_service.list_memories(
                    bank_id=settings.HINDSIGHT_BANK_ID,
                    limit=50,
                )
                for item in listed:
                    tags = item.get("tags") or []
                    meta = item.get("metadata") or {}
                    m_type = item.get("type") or meta.get("type") or ""
                    # Filter out purely test items unless they contain feedback
                    if "test" in tags and "feedback" not in tags:
                        continue
                    if "feedback" in tags or m_type in ("feedback", "feedback_analysis") or "feedback" in item.get("text", "").lower():
                        item_id = item.get("id")
                        if item_id and item_id not in seen_ids:
                            seen_ids.add(item_id)
                            memories.append({
                                "id": item_id,
                                "text": item.get("text", ""),
                                "type": m_type or "feedback",
                                "context": item.get("context"),
                                "metadata": meta,
                                "scores": None,
                                "date": meta.get("date") or item.get("date"),
                                "tags": tags,
                            })
            except Exception:
                pass

            # Also recall using comprehensive semantic query and merge
            recalled = _recall_feedback(
                "user feedback complaints requests praise problems product experience checkout navigation bug",
                max_tokens=7000,
            )
            for item in recalled:
                item_id = item.get("id")
                if item_id and item_id not in seen_ids:
                    seen_ids.add(item_id)
                    memories.append(item)
                elif not item_id and item not in memories:
                    memories.append(item)

        return {
            "status": "success",
            "count": len(memories),
            "feedback": memories,
        }

    except (HindsightConfigurationError, HindsightConnectionError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------

@router.get("/insights")
def get_insights():
    _require_services()

    try:
        feedback_memories = _recall_feedback(
            (
                "recurring themes complaints problems requests improvements "
                "positive feedback negative feedback emerging issues "
                "persistent issues resolved issues"
            ),
            max_tokens=9000,
        )

        if not feedback_memories:
            return {
                "status": "success",
                "message": "No feedback memories found yet.",
                "insights": {
                    "recurring_themes": [],
                    "persistent_issues": [],
                    "emerging_issues": [],
                    "improving_issues": [],
                    "summary": "Add feedback to generate insights.",
                },
            }

        memory_text = "\n\n".join(
            f"- {item['text']}" for item in feedback_memories
        )

        prompt = f"""
You are synthesizing product feedback from persistent historical memory.

Historical feedback memories:
{memory_text}

Identify meaningful patterns across the feedback.

Return ONLY valid JSON:
{{
  "summary": "2-3 sentence overall synthesis",
  "recurring_themes": [
    {{
      "theme": "theme",
      "description": "what users are saying",
      "evidence": ["short example", "short example"]
    }}
  ],
  "persistent_issues": [
    {{
      "issue": "issue",
      "evidence": "supporting feedback"
    }}
  ],
  "emerging_issues": [
    {{
      "issue": "issue",
      "evidence": "supporting feedback"
    }}
  ],
  "improving_issues": [
    {{
      "issue": "issue",
      "evidence": "supporting feedback"
    }}
  ]
}}

Only identify patterns supported by the provided memories.
Do not invent feedback.
"""

        ai_result = groq_service.complete(
            prompt=prompt,
            system_prompt=(
                "You are a product insights analyst. "
                "Ground every conclusion in the supplied feedback memories."
            ),
            temperature=0.2,
            max_tokens=1500,
        )

        raw = ai_result["content"].strip()
        insights = _extract_json(raw)
        if not insights:
            insights = {
                "summary": raw,
                "recurring_themes": [],
                "persistent_issues": [],
                "emerging_issues": [],
                "improving_issues": [],
            }

        return {
            "status": "success",
            "insights": insights,
            "memory_count": len(feedback_memories),
        }

    except (HindsightConfigurationError, GroqConfigurationError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except (HindsightConnectionError, GroqAPIError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


# ---------------------------------------------------------------------------
# Decisions
# ---------------------------------------------------------------------------

@router.post("/decisions")
def create_decision(payload: DecisionRequest):
    _require_services()

    decision_date = payload.date or _today()

    content = (
        f"Product decision recorded on {decision_date}: "
        f"{payload.decision}. "
        f"Related theme: {payload.theme or 'Not specified'}. "
        f"Reason: {payload.reason or 'Not specified'}."
    )

    try:
        result = hindsight_service.retain(
            bank_id=settings.HINDSIGHT_BANK_ID,
            content=content,
            metadata={
                "date": decision_date,
                "theme": payload.theme,
                "type": "decision",
                "reason": payload.reason,
            },
            tags=["decision"],
        )

        return {
            "status": "success",
            "decision": {
                "decision": payload.decision,
                "theme": payload.theme,
                "reason": payload.reason,
                "date": decision_date,
            },
            "memory": result,
        }

    except (HindsightConfigurationError,) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except HindsightConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


@router.get("/decisions")
def get_decisions(query: Optional[str] = None):
    _require_services()

    try:
        memories: List[Dict[str, Any]] = []
        seen_ids = set()

        if query and query.strip():
            memories = _recall_decisions(query.strip(), max_tokens=5000)
        else:
            # First list recent decisions directly from bank
            try:
                listed = hindsight_service.list_memories(
                    bank_id=settings.HINDSIGHT_BANK_ID,
                    limit=50,
                )
                for item in listed:
                    tags = item.get("tags") or []
                    meta = item.get("metadata") or {}
                    m_type = item.get("type") or meta.get("type") or ""
                    if "decision" in tags or m_type == "decision" or "decision" in item.get("text", "").lower():
                        item_id = item.get("id")
                        if item_id and item_id not in seen_ids:
                            seen_ids.add(item_id)
                            memories.append({
                                "id": item_id,
                                "text": item.get("text", ""),
                                "type": "decision",
                                "context": item.get("context"),
                                "metadata": meta,
                                "scores": None,
                                "date": meta.get("date") or item.get("date"),
                                "tags": tags,
                            })
            except Exception:
                pass

            # Also recall and merge
            recalled = _recall_decisions(
                "product decisions actions changes roadmap implementations resolved feedback",
                max_tokens=5000,
            )
            for item in recalled:
                item_id = item.get("id")
                if item_id and item_id not in seen_ids:
                    seen_ids.add(item_id)
                    memories.append(item)
                elif not item_id and item not in memories:
                    memories.append(item)

        return {
            "status": "success",
            "count": len(memories),
            "decisions": memories,
        }

    except (HindsightConfigurationError, HindsightConnectionError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


# ---------------------------------------------------------------------------
# Ask Memory
# ---------------------------------------------------------------------------

@router.post("/ask")
def ask_memory(payload: AskMemoryRequest):
    _require_services()

    try:
        # Recall both feedback and decisions so answers have historical context.
        feedback_memories = _recall_feedback(payload.question, max_tokens=6000)
        decision_memories = _recall_decisions(payload.question, max_tokens=4000)

        memories = feedback_memories + decision_memories
        existing_ids = {m.get("id") for m in memories if m.get("id")}

        # Fallback / supplement: if recall with tags is sparse, do general semantic recall
        if len(memories) < 2:
            try:
                general_recall = hindsight_service.recall(
                    query=payload.question,
                    bank_id=settings.HINDSIGHT_BANK_ID,
                    max_tokens=6000,
                )
                general_cleaned = _clean_recalled_memories(general_recall)
                for gm in general_cleaned:
                    gm_id = gm.get("id")
                    if gm_id and gm_id not in existing_ids:
                        existing_ids.add(gm_id)
                        memories.append(gm)
                    elif not gm_id and gm not in memories:
                        memories.append(gm)
            except Exception:
                pass

        if not memories:
            return {
                "status": "success",
                "answer": (
                    "I couldn't find relevant remembered feedback or product "
                    "decisions for that question yet."
                ),
                "memories_used": [],
            }

        memory_text = "\n\n".join(
            f"[{item.get('type', 'memory')}] {item['text']}"
            for item in memories
        )

        prompt = f"""
Answer the product team's question using ONLY the remembered information below.

Question:
{payload.question}

Remembered information:
{memory_text}

Instructions:
- Connect older and newer feedback when relevant.
- Consider recorded product decisions.
- Explain whether the evidence supports the conclusion.
- If the evidence is incomplete, say so.
- Do not invent facts.
- Be concise and useful to a product team.
"""

        ai_result = groq_service.complete(
            prompt=prompt,
            system_prompt=(
                "You are a product feedback assistant with persistent memory. "
                "Ground answers strictly in recalled memories."
            ),
            temperature=0.2,
            max_tokens=900,
        )

        return {
            "status": "success",
            "answer": ai_result["content"].strip(),
            "memories_used": memories,
        }

    except (HindsightConfigurationError, GroqConfigurationError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    except (HindsightConnectionError, GroqAPIError) as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to answer from memory: {str(e)}",
        )


# ---------------------------------------------------------------------------
# Dashboard Overview
# ---------------------------------------------------------------------------

@router.get("/dashboard")
def get_dashboard():
    _require_services()

    try:
        all_memories = []
        try:
            all_memories = hindsight_service.list_memories(
                bank_id=settings.HINDSIGHT_BANK_ID,
                limit=100,
            )
        except Exception:
            rec = hindsight_service.recall(query="feedback decisions customer", max_tokens=6000)
            all_memories = _clean_recalled_memories(rec)

        feedback_items = []
        decision_items = []
        themes = set()

        for item in all_memories:
            tags = item.get("tags") or []
            meta = item.get("metadata") or {}
            m_type = item.get("type") or meta.get("type") or ""

            if "decision" in tags or m_type == "decision":
                decision_items.append({
                    "id": item.get("id"),
                    "text": item.get("text", ""),
                    "theme": meta.get("theme", ""),
                    "reason": meta.get("reason", ""),
                    "date": meta.get("date") or item.get("date"),
                })
            elif "feedback" in tags or m_type in ("feedback", "feedback_analysis") or ("test" not in tags):
                feedback_items.append({
                    "id": item.get("id"),
                    "text": item.get("text", ""),
                    "source": meta.get("source", "customer"),
                    "date": meta.get("date") or item.get("date"),
                    "theme": meta.get("theme", ""),
                })
                t = meta.get("theme")
                if t and t != "General feedback":
                    themes.add(t)

        return {
            "status": "success",
            "metrics": {
                "total_memories": len(all_memories),
                "total_feedback": len(feedback_items),
                "total_decisions": len(decision_items),
                "active_themes_count": len(themes),
            },
            "active_themes": sorted(list(themes)),
            "recent_feedback": feedback_items[:5],
            "recent_decisions": decision_items[:5],
            "bank_id": settings.HINDSIGHT_BANK_ID,
            "ai_model": settings.GROQ_MODEL,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard overview: {str(e)}",
        )