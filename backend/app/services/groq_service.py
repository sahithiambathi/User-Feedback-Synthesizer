import logging
from typing import Optional, Dict, Any, List, Tuple
from groq import (
    Groq,
    AuthenticationError,
    APIConnectionError,
    RateLimitError,
    APIStatusError,
    GroqError,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

class GroqConfigurationError(Exception):
    """Raised when required Groq configuration or credentials are missing."""
    pass

class GroqAPIError(Exception):
    """Raised when communication with Groq LLM API fails."""
    pass

class GroqService:
    """
    Dedicated service for interacting with Groq LLM models.
    Provides text generation, analysis, and synthesis without exposing credentials.
    """
    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: Optional[str] = None
    ):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        self.default_model = default_model or settings.GROQ_MODEL
        self._client: Optional[Groq] = None

    def check_configuration(self) -> Tuple[bool, str]:
        """
        Validates whether Groq API key is present.
        Returns (is_valid, reason).
        """
        key = self.api_key or settings.GROQ_API_KEY
        if not key or not key.strip():
            return False, (
                "GROQ_API_KEY is not configured in the environment. "
                "Set the GROQ_API_KEY environment variable or add it to backend/.env."
            )
        return True, "Groq configuration present."

    def get_client(self) -> Groq:
        """
        Initializes and returns the official Groq client instance.
        """
        is_valid, reason = self.check_configuration()
        if not is_valid:
            raise GroqConfigurationError(reason)

        if self._client is None:
            active_key = (self.api_key or settings.GROQ_API_KEY).strip()
            self._client = Groq(api_key=active_key)
        return self._client

    def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024
    ) -> Dict[str, Any]:
        """
        Sends a completion request to Groq LLM and returns the generated content and token usage.
        Never exposes the API key or raw authorization headers.
        """
        target_model = model or self.default_model
        client = self.get_client()

        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            completion = client.chat.completions.create(
                model=target_model,
                messages=messages, # type: ignore
                temperature=temperature,
                max_tokens=max_tokens,
            )

            choice = completion.choices[0]
            content = choice.message.content or ""
            usage = {}
            if completion.usage:
                usage = {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "completion_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens,
                }

            return {
                "content": content,
                "model": completion.model,
                "finish_reason": choice.finish_reason,
                "usage": usage,
            }

        except AuthenticationError as e:
            raise GroqAPIError("Groq authentication failed: Invalid or expired API key.") from e
        except RateLimitError as e:
            raise GroqAPIError("Groq API rate limit exceeded.") from e
        except APIConnectionError as e:
            raise GroqAPIError("Failed to connect to Groq API endpoint.") from e
        except APIStatusError as e:
            raise GroqAPIError(f"Groq API error (status {e.status_code}): {e.message}") from e
        except GroqError as e:
            raise GroqAPIError(f"Groq SDK error: {str(e)}") from e
        except Exception as e:
            raise GroqAPIError(f"Unexpected error communicating with Groq: {str(e)}") from e

groq_service = GroqService()
