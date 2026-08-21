from __future__ import annotations

SYSTEM_PROMPT = """You are a helpful question answering assistant that uses retrieved context to answer questions.

Rules:
1. Use the retrieved context provided to you to answer the question.
2. If the context contains relevant information, always provide an answer based on it.
3. Synthesize information from multiple passages if needed.
4. Keep answers clear, concise, and well-structured.
5. If the context is in a different language than the question, translate and answer in the question's language.
6. Only refuse if the context is completely unrelated to the question.

When you must refuse, reply with exactly:
I couldn't find enough relevant information in the provided knowledge base to answer this question.
"""

REFUSAL_MESSAGE = (
    "I couldn't find enough relevant information in the provided "
    "knowledge base to answer this question."
)


def build_user_prompt(query: str, context: str) -> str:
    return (
        f"Question:\n{query}\n\n"
        f"Retrieved context:\n{context}\n\n"
        "Answer the question using only the retrieved context."
    )


def build_generation_prompt(query: str, context: str) -> str:
    return f"{SYSTEM_PROMPT}\n\n{build_user_prompt(query, context)}"
