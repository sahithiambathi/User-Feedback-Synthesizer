import logging
import asyncio
import concurrent.futures
from typing import Optional, Dict, Any, List, Tuple
from hindsight_client import Hindsight
import hindsight_client.hindsight_client as _hc
import hindsight_client_api.exceptions as hindsight_exceptions
from app.core.config import settings

logger = logging.getLogger(__name__)

# Ensure Python 3.13+ compatibility where asyncio.timeout requires an active Task
def _safe_run_async(coro):
    """Run an async coroutine synchronously, ensuring an active Task for Python 3.13+."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            return executor.submit(asyncio.run, coro).result()

    task = loop.create_task(coro)
    return loop.run_until_complete(task)

_hc._run_async = _safe_run_async

class HindsightConfigurationError(Exception):
    """Raised when required Hindsight configuration or credentials are missing."""
    pass

class HindsightConnectionError(Exception):
    """Raised when communication with the Hindsight service fails."""
    pass

class HindsightService:
    """
    Dedicated service for interacting with Hindsight persistent memory.
    Wraps real retain and recall operations with validation and structured error handling.
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        default_bank_id: Optional[str] = None
    ):
        self.base_url = (base_url or settings.HINDSIGHT_BASE_URL).rstrip("/")
        self.api_key = api_key if api_key is not None else settings.HINDSIGHT_API_KEY
        self.default_bank_id = default_bank_id or settings.HINDSIGHT_BANK_ID
        self._client: Optional[Hindsight] = None

    def check_configuration(self) -> Tuple[bool, str]:
        """
        Validates whether Hindsight credentials and endpoints are configured.
        Returns (is_valid, reason).
        """
        if not self.base_url:
            return False, "HINDSIGHT_BASE_URL is not set."

        is_cloud = "api.hindsight.vectorize.io" in self.base_url
        if is_cloud and not self.api_key.strip():
            return False, (
                "HINDSIGHT_API_KEY is not configured for Hindsight Cloud "
                f"({self.base_url}). A valid API key is required in .env."
            )

        return True, "Configuration present."

    def get_client(self) -> Hindsight:
        """
        Initializes and returns the official Hindsight client instance.
        Creates a fresh instance so aiohttp sessions are bound to the active loop/thread.
        """
        is_valid, reason = self.check_configuration()
        if not is_valid:
            raise HindsightConfigurationError(reason)

        key_param = self.api_key.strip() if self.api_key and self.api_key.strip() else None
        return Hindsight(
            base_url=self.base_url,
            api_key=key_param
        )

    def retain(
        self,
        content: str,
        bank_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        tags: Optional[List[str]] = None,
        context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retains content into Hindsight persistent memory.
        """
        target_bank = bank_id or self.default_bank_id
        if not target_bank:
            raise HindsightConfigurationError("Target bank_id is required for retain operation.")

        client = self.get_client()
        try:
            response = client.retain(
                bank_id=target_bank,
                content=content,
                metadata=metadata,
                tags=tags,
                context=context
            )
            return {
                "success": getattr(response, "success", True),
                "bank_id": getattr(response, "bank_id", target_bank),
                "operation_id": getattr(response, "operation_id", None),
                "items_count": getattr(response, "items_count", 1),
            }
        except hindsight_exceptions.UnauthorizedException as e:
            raise HindsightConnectionError(f"Hindsight authentication failed: Invalid or expired API key. Details: {e}") from e
        except hindsight_exceptions.NotFoundException as e:
            raise HindsightConnectionError(f"Hindsight resource not found: Bank or endpoint does not exist. Details: {e}") from e
        except hindsight_exceptions.ApiException as e:
            raise HindsightConnectionError(f"Hindsight API error (HTTP {e.status}): {e.reason or e}") from e
        except Exception as e:
            raise HindsightConnectionError(f"Failed to connect to Hindsight service at {self.base_url}: {str(e)}") from e

    def recall(
        self,
        query: str,
        bank_id: Optional[str] = None,
        max_tokens: int = 4096,
        types: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Recalls relevant memories from Hindsight given a search query.
        """
        target_bank = bank_id or self.default_bank_id
        if not target_bank:
            raise HindsightConfigurationError("Target bank_id is required for recall operation.")

        client = self.get_client()
        try:
            response = client.recall(
                bank_id=target_bank,
                query=query,
                max_tokens=max_tokens,
                types=types,
                tags=tags
            )
            raw_results = getattr(response, "results", []) or []
            parsed_results = []
            for item in raw_results:
                parsed_results.append({
                    "id": getattr(item, "id", None),
                    "text": getattr(item, "text", ""),
                    "type": getattr(item, "type", None),
                    "context": getattr(item, "context", None),
                    "scores": getattr(item, "scores", None),
                    "metadata": getattr(item, "metadata", None),
                })

            return {
                "query": query,
                "bank_id": target_bank,
                "total_results": len(parsed_results),
                "results": parsed_results
            }
        except hindsight_exceptions.UnauthorizedException as e:
            raise HindsightConnectionError(f"Hindsight authentication failed: Invalid or expired API key. Details: {e}") from e
        except hindsight_exceptions.NotFoundException as e:
            raise HindsightConnectionError(f"Hindsight resource not found: Bank or endpoint does not exist. Details: {e}") from e
        except hindsight_exceptions.ApiException as e:
            raise HindsightConnectionError(f"Hindsight API error (HTTP {e.status}): {e.reason or e}") from e
        except Exception as e:
            raise HindsightConnectionError(f"Failed to connect to Hindsight service at {self.base_url}: {str(e)}") from e

    def list_memories(
        self,
        bank_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Lists stored memories from Hindsight bank with pagination.
        """
        target_bank = bank_id or self.default_bank_id
        if not target_bank:
            raise HindsightConfigurationError("Target bank_id is required for list_memories operation.")

        client = self.get_client()
        try:
            response = client.list_memories(
                bank_id=target_bank,
                limit=limit,
                offset=offset
            )
            raw_items = getattr(response, "items", []) or []
            parsed_items = []
            for item in raw_items:
                parsed_items.append({
                    "id": getattr(item, "id", None),
                    "text": getattr(item, "text", ""),
                    "type": getattr(item, "fact_type", getattr(item, "type", None)),
                    "context": getattr(item, "context", None),
                    "tags": getattr(item, "tags", []) or [],
                    "metadata": getattr(item, "metadata", {}) or {},
                    "date": getattr(item, "var_date", None) or getattr(item, "mentioned_at", None),
                    "updated_at": getattr(item, "updated_at", None),
                })
            return parsed_items
        except hindsight_exceptions.UnauthorizedException as e:
            raise HindsightConnectionError(f"Hindsight authentication failed: Invalid or expired API key. Details: {e}") from e
        except hindsight_exceptions.NotFoundException as e:
            raise HindsightConnectionError(f"Hindsight resource not found: Bank or endpoint does not exist. Details: {e}") from e
        except hindsight_exceptions.ApiException as e:
            raise HindsightConnectionError(f"Hindsight API error (HTTP {e.status}): {e.reason or e}") from e
        except Exception as e:
            raise HindsightConnectionError(f"Failed to list memories from Hindsight service at {self.base_url}: {str(e)}") from e

    def close(self) -> None:
        """
        Closes the underlying client session if open.
        """
        if self._client is not None:
            try:
                self._client.close()
            except Exception as e:
                logger.warning(f"Error while closing Hindsight client: {e}")
            finally:
                self._client = None

hindsight_service = HindsightService()

