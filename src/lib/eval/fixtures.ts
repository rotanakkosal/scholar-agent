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
  {
    paperId: "204e3073870fae3d05bcbc2f6a8e263d9b72e776",
    title: "Attention is All you Need",
    year: 2017,
    doi: null,
    abstract:
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature.",
    bad: {
      methodology:
        "The Transformer relies on stacked convolutional and recurrent layers trained with reinforcement learning on the ImageNet image dataset.",
      contribution:
        "It achieves 99 BLEU on English-to-German translation and proves that attention mechanisms are unnecessary for sequence modeling.",
    },
  },
  {
    paperId: "2c03df8b48bf3fa39054345bafabfeff15bfd11d",
    title: "Deep Residual Learning for Image Recognition",
    year: 2015,
    doi: "10.1109/cvpr.2016.90",
    abstract:
      "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth. On the ImageNet dataset we evaluate residual nets with a depth of up to 152 layers, 8 times deeper than VGG nets but still having lower complexity. An ensemble of these residual nets achieves 3.57% error on the ImageNet test set. The depth of representations is of central importance for many visual recognition tasks.",
    bad: {
      methodology:
        "ResNet removes all skip connections and trains shallow 10-layer networks using genetic algorithms on text corpora.",
      contribution:
        "The paper concludes that network depth is irrelevant to accuracy and reports a 50% error rate on ImageNet.",
    },
  },
  {
    paperId: "df2b0e26d0599ce3e70df8a9da02e51594e0e992",
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    year: 2019,
    doi: "10.18653/v1/N19-1423",
    abstract:
      "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. As a result, the pre-trained BERT model can be fine-tuned with just one additional output layer to create state-of-the-art models for a wide range of tasks, such as question answering and language inference, without substantial task-specific architecture modifications. BERT is conceptually simple and empirically powerful. It obtains new state-of-the-art results on eleven natural language processing tasks, including pushing the GLUE score to 80.5 (7.7 point absolute improvement) and SQuAD v1.1 Test F1 to 93.2.",
    bad: {
      methodology:
        "BERT is a unidirectional left-to-right model pre-trained on labeled images using a reinforcement-learning objective.",
      contribution:
        "BERT must be fully retrained from scratch for every task and underperforms earlier models on the GLUE benchmark.",
    },
  },
  {
    paperId: "a6cb366736791bcccc5c8639de5a8f9636bf87e8",
    title: "Adam: A Method for Stochastic Optimization",
    year: 2014,
    doi: null,
    abstract:
      "We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments. The method is straightforward to implement, is computationally efficient, has little memory requirements, is invariant to diagonal rescaling of the gradients, and is well suited for problems that are large in terms of data and/or parameters. The method is also appropriate for non-stationary objectives and problems with very noisy and/or sparse gradients. The hyper-parameters have intuitive interpretations and typically require little tuning. Empirical results demonstrate that Adam works well in practice and compares favorably to other stochastic optimization methods.",
    bad: {
      methodology:
        "Adam is a second-order optimizer that computes the full Hessian matrix and therefore has very large memory requirements.",
      contribution:
        "The paper shows that Adam diverges on noisy gradients and performs worse than plain SGD across all experiments.",
    },
  },
  {
    paperId: "995c5f5e62614fcb4d2796ad2faab969da51713e",
    title:
      "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift",
    year: 2015,
    doi: null,
    abstract:
      "Training Deep Neural Networks is complicated by the fact that the distribution of each layer's inputs changes during training, as the parameters of the previous layers change. This slows down the training by requiring lower learning rates and careful parameter initialization. We refer to this phenomenon as internal covariate shift, and address the problem by normalizing layer inputs. Our method draws its strength from making normalization a part of the model architecture and performing the normalization for each training mini-batch. Batch Normalization allows us to use much higher learning rates and be less careful about initialization, and in some cases eliminates the need for Dropout. Applied to a state-of-the-art image classification model, Batch Normalization achieves the same accuracy with 14 times fewer training steps, and beats the original model by a significant margin.",
    bad: {
      methodology:
        "Batch Normalization normalizes the network's weights a single time before training, outside the model architecture, and only on the test set.",
      contribution:
        "It requires 14 times more training steps than the baseline and makes Dropout mandatory in all cases.",
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
