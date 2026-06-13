"""WorldState Centralized Rate-Limited Gemini Client.

Enforces strict request serialization, spacing, and exponential backoff retries.
"""

import asyncio
import time
import logging
import google.generativeai as genai
from worldstate_ai.config import settings

logger = logging.getLogger("gemini_client")

# Global variables for serialization & rate-limiting across all tasks
_gemini_lock = asyncio.Lock()
_last_call_time = 0.0
MIN_CALL_INTERVAL = 4.5  # Space requests by at least 4.5 seconds (staying under 15 RPM Free Tier limit)

async def call_gemini_with_retry(prompt: str, system_instruction: str = None) -> str:
    """Thread-safe, rate-limited, and retrying wrapper for Gemini API calls.

    Keeps calls serialized and spaced to strictly avoid 429s. Retries with
    exponential backoff on 429 or other API errors.
    """
    global _last_call_time

    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        raise ValueError("Gemini API key is not configured or is the default placeholder.")

    # Configure genai settings
    genai.configure(api_key=settings.gemini_api_key)
    
    # Use GenerativeModel with optional system instructions
    model = genai.GenerativeModel(
        settings.gemini_model,
        system_instruction=system_instruction
    )

    max_retries = 5
    backoff = 6.0  # Safe initial backoff duration

    for attempt in range(max_retries):
        async with _gemini_lock:
            # Enforce strict interval spacing
            now = time.time()
            elapsed = now - _last_call_time
            if elapsed < MIN_CALL_INTERVAL:
                sleep_needed = MIN_CALL_INTERVAL - elapsed
                logger.info(f"[Gemini Rate Limiter] Spacing API call. Sleeping for {sleep_needed:.2f}s...")
                await asyncio.sleep(sleep_needed)

            _last_call_time = time.time()

            try:
                logger.info(f"Calling Gemini API (Model: {settings.gemini_model}, Attempt {attempt + 1}/{max_retries})...")
                
                # Execute blocking SDK network call in thread executor to prevent event-loop blockages
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: model.generate_content(prompt)
                )
                text = response.text.strip()
                return text
                
            except Exception as e:
                err_str = str(e)
                logger.warning(f"Gemini call attempt {attempt + 1} failed: {err_str}")
                
                is_rate_limit = "429" in err_str or "quota" in err_str.lower() or "limit exceeded" in err_str.lower()
                
                if attempt == max_retries - 1:
                    logger.error(f"Gemini call permanently failed after {max_retries} attempts.")
                    raise e

                # Determine exponential sleep duration
                sleep_time = backoff * (2 ** attempt)
                if is_rate_limit:
                    logger.info(f"[Rate Limit Hit] Quota exceeded. Sleeping for {sleep_time:.2f}s before retrying...")
                else:
                    logger.info(f"Retrying in {sleep_time:.2f}s...")
                
                await asyncio.sleep(sleep_time)

    raise RuntimeError("Unexpected exit from retry loop in call_gemini_with_retry")


async def get_gemini_embedding(text: str) -> list[float]:
    """Generate a vector embedding for the given text using Gemini's text-embedding-004 model.

    Includes rate-limiting spacing to respect API quotas.
    """
    global _last_call_time

    if not settings.gemini_api_key or settings.gemini_api_key == "your_gemini_api_key_here":
        raise ValueError("Gemini API key is not configured or is the default placeholder.")

    # Configure genai settings
    genai.configure(api_key=settings.gemini_api_key)

    max_retries = 5
    backoff = 6.0

    for attempt in range(max_retries):
        async with _gemini_lock:
            # Enforce strict interval spacing
            now = time.time()
            elapsed = now - _last_call_time
            if elapsed < MIN_CALL_INTERVAL:
                sleep_needed = MIN_CALL_INTERVAL - elapsed
                logger.info(f"[Gemini Rate Limiter] Spacing API call. Sleeping for {sleep_needed:.2f}s...")
                await asyncio.sleep(sleep_needed)

            _last_call_time = time.time()

            try:
                logger.info(f"Calling Gemini Embedding API (Model: models/text-embedding-004, Attempt {attempt + 1}/{max_retries})...")

                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: genai.embed_content(
                        model="models/text-embedding-004",
                        content=text,
                        task_type="clustering"
                    )
                )
                # Ensure it's a list of floats
                emb = response.get('embedding', [])
                if not emb and isinstance(response, dict):
                    # Fallback check
                    emb = response.get('embeddings', [[]])[0]
                return emb

            except Exception as e:
                err_str = str(e)
                logger.warning(f"Gemini embedding call attempt {attempt + 1} failed: {err_str}")

                is_rate_limit = "429" in err_str or "quota" in err_str.lower() or "limit exceeded" in err_str.lower()

                if attempt == max_retries - 1:
                    logger.error(f"Gemini embedding call permanently failed after {max_retries} attempts.")
                    raise e

                sleep_time = backoff * (2 ** attempt)
                await asyncio.sleep(sleep_time)

    raise RuntimeError("Unexpected exit from retry loop in get_gemini_embedding")

