# Evidence-region knowledge indexing

Status: promoted into the canonical implementation in `AGENTS.md`.

## Purpose

Represent retrieval as an intersection of grounded sets without adding a generative
query-time model:

- dense similarity chooses the semantic community;
- BM25 chooses lexical evidence only inside that community;
- an empty set at either stage means there is no accepted evidence.

The unit shared by both sets is a small, real evidence region from Docling—not a
generated document summary, classification, or generated entity facet.

## Index generation

1. Store the original and PostgreSQL ownership/state, then enqueue the dense River job.
2. Docling emits ordered contextual regions with peer merging disabled and a token cap
   below the dense model's input limit.
3. TEI embeds each region and Qdrant stages one inactive dense point per region.
4. Wait until every document in the frozen generation has completed its dense stage.
5. FastEmbed creates one BM25 vector for each persisted region. The sparse point uses
   the same deterministic region identity as its dense pair.
6. Activate both collections only when every document in the generation has completed
   both stages.

## Retrieval

Before retrieval, a deterministic prompt pass copies three views from the question:
the intact grammatical question for BGE, its content terms for BM25, and strong exact
anchors limited to numbers and multiword proper names. It does not generate, paraphrase,
or infer entities.

TEI returns every region above the dense threshold. Each exact anchor must occur
somewhere in that semantic region set; it is deliberately not required in the final
answer region because nearby text may use a pronoun or shortened name. FastEmbed then
encodes the lexical terms for BM25, which Qdrant searches only where `region_id` belongs
to the dense result set. BM25's threshold decides whether any candidate region contains
accepted lexical evidence, and its score orders the result.

There is no whole-knowledge-base fallback, score fusion, verifier, reranker, recursive
query loop, or user-paid ingestion call. A reranker is reserved for separately approved
future work and cannot be inserted into this path implicitly.

## Evaluation boundary

Thresholds come from checked-in labelled fixtures: dense tuning favors recall and
sparse tuning favors precision. Measure dense-region recall, scoped BM25 precision,
unanswerable rejection, end-to-end evidence accuracy, ingestion latency, and peak RAM
before changing region size, models, or thresholds. `V0.1-Metrics.md` records the
rejected automatic entity-routing experiment rather than treating it as architecture.
