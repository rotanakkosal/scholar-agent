# Judge Ablation (discrimination) — Qwen vs Gemma

Summarizer: `qwen3-14b` · 3 papers, each judged on a real summary AND a deliberately-flawed (hallucinated) summary.

| Judge | Good pass↑ | Bad pass↓ | Detection acc.↑ | Score gap↑ | mean good | mean bad |
|---|---|---|---|---|---|---|
| `qwen3-14b` | 0% | 0% | 50% | 2.92 | 4.25 | 1.33 |
| `gemma-4-e4b` | 100% | 0% | 100% | 3.50 | 5.00 | 1.50 |

Arrows show the desired direction. **Bad pass↓** = flawed summaries that slipped through (lower is better); **Score gap** = how far the judge separates good from bad (higher = sharper).

_Small fixture set (3 papers); expand once a Semantic Scholar key enables live search._
