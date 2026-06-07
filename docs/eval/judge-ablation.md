# Judge Ablation (discrimination) — Qwen vs Gemma

Summarizer: `qwen3-14b` · 8 papers, each judged on a real summary AND a deliberately-flawed (hallucinated) summary.

| Judge | Good pass↑ | Bad pass↓ | Detection acc.↑ | Score gap↑ | mean good | mean bad |
|---|---|---|---|---|---|---|
| `qwen3-14b` | 0% | 0% | 50% | 2.94 | 4.38 | 1.44 |
| `gemma-4-e4b` | 88% | 0% | 94% | 3.38 | 4.88 | 1.50 |

Arrows show the desired direction. **Bad pass↓** = flawed summaries that slipped through (lower is better); **Score gap** = how far the judge separates good from bad (higher = sharper).

_Small fixture set (8 papers); expand once a Semantic Scholar key enables live search._
