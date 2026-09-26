# Synapse

Compare and converse with Hugging Face models from one interface.

Synapse streams model responses side by side, stores conversation history, and lets users bring their own Hugging Face credentials.

---

## Features

**Side-by-side model comparison**
Stream responses from multiple Hugging Face models at the same time. Response timing is tracked per model so you can see not just what each model says but how fast it gets there.

**Conversational memory**
Recent conversation messages are loaded by the Go backend and stored as compressed JSON in PostgreSQL.

**BYOK**
Bring your own Hugging Face API token. Tokens are stored against your profile and only accessed at inference time.

---

## Stack

`Go` `Next.js` `PostgreSQL` `Qdrant` `Docling` `Hugging Face TEI` `AWS EC2`

The Next.js interface communicates with the Go API for authentication, conversations, model requests, and token management.

---

## Requirements
- Hugging Face account with API token

## Knowledge service

Private PDF, Markdown, and text documents are ingested by a separate Go service.
Docling produces small layout-aware evidence regions and TEI embeds every region for
semantic community selection. Only after every document in a frozen indexing
generation has its dense regions does FastEmbed create a paired BM25 vector for each
region. Qdrant activates the generation once both stages are complete. PostgreSQL
stores only ownership and stage state; development originals and region manifests
remain under the gitignored `backend/var/knowledge` directory.

At retrieval time, dense search selects every region above its calibrated threshold.
BM25 searches only those region IDs and applies its own threshold. An empty dense or
sparse set returns no evidence; there is no whole-base fallback, verifier, score
fusion, query-time model loop, or reranker.

Indexing and retrieval use service-owned models rather than the user's Hugging
Face token. The main API uses the selected answer model's tokenizer to cap
evidence at 1,000 tokens before its single paid generation call. Start Qdrant,
TEI, and the processor with `compose.knowledge.yaml`, apply Alembic,
then run `go run ./cmd/knowledge-service` from `backend`.
Changing either retrieval model requires a new index version, new dense and
sparse collection names, and re-ingestion; incompatible vectors are not mixed.
See [`V0.1-Metrics.md`](V0.1-Metrics.md) for the smoke, expanded, and lexical-only comparisons.

The Go API links the real Hugging Face tokenizer runtime. Download the matching
`libtokenizers` v1.27.0 archive from the
[release page](https://github.com/daulet/tokenizers/releases/tag/v1.27.0) and point
`CGO_LDFLAGS` at the directory containing `libtokenizers.a` when building or
testing the API.


---

## Supported Models

Anything available via the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) with chat or text generation support.

---

## License

GNU Affero General Public License v3.0. See [`LICENSE`](LICENSE).
