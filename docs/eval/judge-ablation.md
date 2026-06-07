# Judge Ablation (discrimination) — Qwen vs Gemma

Summarizer: `qwen3-14b` · 8 papers, each judged on a real summary AND a deliberately-flawed (hallucinated) summary.

| Judge | Good pass↑ | Bad pass↓ | Detection acc.↑ | Score gap↑ | mean good | mean bad |
|---|---|---|---|---|---|---|
| `qwen3-14b` | 63% | 0% | 81% | 2.78 | 4.03 | 1.25 |
| `gemma-4-e4b` | 100% | 0% | 100% | 2.75 | 4.28 | 1.53 |

Arrows show the desired direction. **Bad pass↓** = flawed summaries that slipped through (lower is better); **Score gap** = how far the judge separates good from bad (higher = sharper).

_Small fixture set (8 papers); expand once a Semantic Scholar key enables live search._
