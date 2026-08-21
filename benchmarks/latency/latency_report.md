# RAG Latency Report

- Timestamp (UTC): 2026-08-21T20:00:32.553297+00:00
- Requests: 100 (100 unique)
- Invalid indexed queries excluded: 1
- Index chunks: 11478
- Retrieval mode: parallel
- Response cache: disabled
- Request parsing: not applicable (direct in-process pipeline harness)
- Model initialization: 2257.48 ms (excluded from warm percentiles)
- Refused responses: 11

| Component | P50 (ms) | P70 (ms) | P90 (ms) | P95 (ms) | P100 (ms) | Mean (ms) |
|---|---:|---:|---:|---:|---:|---:|
| request_parsing_ms | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| query_processing_ms | 0.02 | 0.03 | 0.03 | 0.04 | 0.04 | 0.02 |
| embedding_ms | 155.72 | 156.90 | 158.99 | 159.84 | 291.85 | 158.72 |
| dense_retrieval_ms | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| bm25_ms | 1.63 | 1.96 | 2.33 | 2.55 | 2.86 | 1.51 |
| retrieval_wall_ms | 155.99 | 157.18 | 159.16 | 160.01 | 292.02 | 158.99 |
| fusion_ms | 0.10 | 0.13 | 0.16 | 0.19 | 0.25 | 0.11 |
| relevance_guard_ms | 0.01 | 0.01 | 0.01 | 0.01 | 0.02 | 0.01 |
| reranking_ms | 0.57 | 0.73 | 0.96 | 1.21 | 1.85 | 0.60 |
| context_building_ms | 0.06 | 0.07 | 0.11 | 0.14 | 0.17 | 0.06 |
| generation_ms | 0.31 | 0.38 | 0.51 | 0.54 | 0.95 | 0.33 |
| grounding_ms | 0.22 | 0.26 | 0.35 | 0.41 | 0.61 | 0.22 |
| rag_core_ms | 157.07 | 158.23 | 159.97 | 161.35 | 293.27 | 160.01 |
| component_sum_ms | 157.32 | 158.56 | 160.40 | 161.85 | 293.56 | 160.34 |
| unaccounted_ms | 0.26 | 0.35 | 0.49 | 0.57 | 0.74 | 0.31 |
| total_ms | 157.58 | 158.89 | 160.87 | 162.30 | 294.14 | 160.65 |

Primary measured bottleneck: **retrieval_wall_ms** (155.99 ms P50).
Secondary measured bottleneck: **embedding_ms** (155.72 ms P50).

RAG core P50: **157.07 ms**.
Full text-to-answer P50: **157.58 ms**.

The full total includes ElevenLabs generation. No values are estimated or fabricated.
