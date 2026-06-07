import { PaperSchema, type Paper } from "../schemas/paper";
import type { SummaryDraft } from "../schemas/summary";

/**
 * Evaluation set — real papers (with real Semantic Scholar abstracts) plus a
 * deliberately FLAWED summary for each (hallucinated / contradictory claims not
 * supported by the abstract). The judge-ablation benchmark checks whether each
 * judge passes the real summary and REJECTS the flawed one. No live search
 * needed, so it runs without a Semantic Scholar key. Expand once the key lands.
 */
export interface EvalCase {
  paper: Paper;
  /** A bad summary a competent, faithful judge should fail. */
  bad: SummaryDraft;
}

const RAW: Array<{
  paperId: string;
  title: string;
  year: number;
  doi: string | null;
  abstract: string;
  bad: SummaryDraft;
}> = [
  {
    paperId: "659bf9ce7175e1ec266ff54359e2bd76e0b7ff31",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    year: 2020,
    doi: null,
    abstract:
      "Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited, and hence on knowledge-intensive tasks, their performance lags behind task-specific architectures. Additionally, providing provenance for their decisions and updating their world knowledge remain open research problems. Pre-trained models with a differentiable access mechanism to explicit non-parametric memory can overcome this issue, but have so far been only investigated for extractive downstream tasks. We explore a general-purpose fine-tuning recipe for retrieval-augmented generation (RAG) -- models which combine pre-trained parametric and non-parametric memory for language generation. We introduce RAG models where the parametric memory is a pre-trained seq2seq model and the non-parametric memory is a dense vector index of Wikipedia, accessed with a pre-trained neural retriever. We compare two RAG formulations, one which conditions on the same retrieved passages across the whole generated sequence, the other can use different passages per token. We fine-tune and evaluate our models on a wide range of knowledge-intensive NLP tasks and set the state-of-the-art on three open domain QA tasks, outperforming parametric seq2seq models and task-specific retrieve-and-extract architectures. For language generation tasks, we find that RAG models generate more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq baseline.",
    bad: {
      methodology:
        "RAG trains a convolutional neural network end-to-end with reinforcement learning from human feedback (RLHF) on the ImageNet dataset, without using any retrieval component.",
      contribution:
        "It reports 99.7% accuracy on medical image diagnosis and completely eliminates hallucination, proving that retrieval is unnecessary for language models.",
    },
  },
  {
    paperId: "7e9717e111ee23ab26cf26bf4969ea9da48cf91e",
    title:
      "Topic-FlipRAG: Topic-Orientated Adversarial Opinion Manipulation Attacks to Retrieval-Augmented Generation Models",
    year: 2025,
    doi: "10.48550/arXiv.2502.01386",
    abstract:
      "Retrieval-Augmented Generation (RAG) systems based on Large Language Models (LLMs) have become essential for tasks such as question answering and content generation. However, their increasing impact on public opinion and information dissemination has made them a critical focus for security research due to inherent vulnerabilities. Previous studies have predominantly addressed attacks targeting factual or single-query manipulations. In this paper, we address a more practical scenario: topic-oriented adversarial opinion manipulation attacks on RAG models, where LLMs are required to reason and synthesize multiple perspectives, rendering them particularly susceptible to systematic knowledge poisoning. Specifically, we propose Topic-FlipRAG, a two-stage manipulation attack pipeline that strategically crafts adversarial perturbations to influence opinions across related queries. This approach combines traditional adversarial ranking attack techniques and leverages the extensive internal relevant knowledge and reasoning capabilities of LLMs to execute semantic-level perturbations. Experiments show that the proposed attacks effectively shift the opinion of the model's outputs on specific topics, significantly impacting user information perception. Current mitigation methods cannot effectively defend against such attacks, highlighting the necessity for enhanced safeguards for RAG systems, and offering crucial insights for LLM security research.",
    bad: {
      methodology:
        "The authors deploy a blockchain-based consensus protocol that cryptographically verifies every retrieved passage before generation.",
      contribution:
        "The paper proves that existing defenses fully neutralize all opinion-manipulation attacks, so no further safeguards are needed for RAG systems.",
    },
  },
  {
    paperId: "46f9f7b8f88f72e12cbdb21e3311f995eb6e65c5",
    title: "Retrieval-Augmented Generation for Large Language Models: A Survey",
    year: 2023,
    doi: null,
    abstract:
      "Large Language Models (LLMs) showcase impressive capabilities but encounter challenges like hallucination, outdated knowledge, and non-transparent, untraceable reasoning processes. Retrieval-Augmented Generation (RAG) has emerged as a promising solution by incorporating knowledge from external databases. This enhances the accuracy and credibility of the generation, particularly for knowledge-intensive tasks, and allows for continuous knowledge updates and integration of domain-specific information. RAG synergistically merges LLMs' intrinsic knowledge with the vast, dynamic repositories of external databases. This comprehensive review paper offers a detailed examination of the progression of RAG paradigms, encompassing the Naive RAG, the Advanced RAG, and the Modular RAG. It meticulously scrutinizes the tripartite foundation of RAG frameworks, which includes the retrieval, the generation and the augmentation techniques. The paper highlights the state-of-the-art technologies embedded in each of these critical components, providing a profound understanding of the advancements in RAG systems. Furthermore, this paper introduces up-to-date evaluation framework and benchmark. At the end, this article delineates the challenges currently faced and points out prospective avenues for research and development.",
    bad: {
      methodology:
        "The authors pre-train a new 175-billion-parameter language model from scratch on 10 trillion tokens and run controlled human trials with 500 participants.",
      contribution:
        "Their experiments show the new model surpasses GPT-4 on coding benchmarks by 30 points and removes the need for retrieval entirely.",
    },
  },
];

export const EVAL_CASES: EvalCase[] = RAW.map((r) => ({
  paper: PaperSchema.parse({
    paperId: r.paperId,
    title: r.title,
    year: r.year,
    doi: r.doi,
    abstract: r.abstract,
  }),
  bad: r.bad,
}));

export const FIXTURES: Paper[] = EVAL_CASES.map((c) => c.paper);
