"""Answer generation via OpenAI ChatCompletion API (GPT-4o / GPT-4o-mini)."""

from __future__ import annotations

import logging
import time

from app.core.exceptions import GenerationError
from rag.generation.base import GenerationResult, LLMProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    """Direct OpenAI ChatCompletion provider for RAG answer generation."""

    def __init__(
        self,
        api_key: str,
        *,
        model: str = "gpt-4o-mini",
        timeout_s: float = 30.0,
        max_retries: int = 2,
        temperature: float = 0.1,
    ) -> None:
        if not api_key:
            raise GenerationError("OPENAI_API_KEY is not configured", status_code=500)
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise GenerationError(
                "openai package is not installed. Run: pip install openai"
            ) from exc

        self._client = OpenAI(api_key=api_key, timeout=timeout_s, max_retries=max_retries)
        self._model = model
        self._temperature = temperature

    def generate(self, prompt: str, *, system_prompt: str | None = None) -> GenerationResult:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        t0 = time.perf_counter()
        try:
            response = self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=self._temperature,
            )
        except Exception as exc:
            raise GenerationError(f"OpenAI API error: {exc}") from exc

        latency_ms = (time.perf_counter() - t0) * 1000
        text = response.choices[0].message.content or ""

        return GenerationResult(
            text=text.strip(),
            latency_ms=latency_ms,
            model=self._model,
            raw={"usage": response.usage.model_dump() if response.usage else None},
        )
