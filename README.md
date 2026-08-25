# Synapse

Compare and converse with Hugging Face models, attach private knowledge, and run bounded tool-using agents from one interface.

Synapse streams model responses side by side, stores conversation history, and lets users bring their own Hugging Face credentials.

---

## Features

**Side-by-side model comparison**
Stream responses from multiple Hugging Face models at the same time. Response timing is tracked per model so you can see not just what each model says but how fast it gets there.

**Conversational memory**
Recent conversation messages are loaded by the Go backend and stored as compressed JSON in PostgreSQL.

**BYOK**
Bring your own Hugging Face API token. Tokens are stored against your profile and only accessed at inference time.

**Knowledge network**
Upload PDF, Markdown, or text sources into a local private object store. A durable worker extracts PDF text with Poppler, chunks it with LangChainGo, creates Hugging Face embeddings, and persists exact cosine-searchable vectors in PostgreSQL with pgvector.

**Bounded agents**
Save a model, instructions, knowledge access, and step limits. Normal chat and saved agents share the same runtime and can call the approved `knowledge_search` tool.

---

## Stack

`Go` `LangChainGo` `Next.js` `PostgreSQL` `pgvector`

The Next.js interface communicates with the Go API for authentication, conversations, model requests, and token management.

---

## Requirements

- PostgreSQL with the [pgvector extension](https://github.com/pgvector/pgvector)
- Hugging Face account with an API token
- Poppler's `pdftotext` executable for text-based PDF extraction

Apply the database changes with `cd backend && alembic upgrade head` before starting the API. Local source files are written beneath `backend/knowledge/` by default and are ignored by Git. Set `RAG_OBJECT_ROOT` to move that private storage root.

Use `/knowledge` to create a knowledge base, upload a document, observe ingestion, and test retrieval. Use `/agents` to save a bounded configuration. A selected knowledge base is exposed to chat as a short name/description manifest; retrieved chunks enter model context only through `knowledge_search` and are displayed separately as evidence cards.

Image-only PDFs fail with an explicit OCR-required status. OCR, R2 storage, approximate vector indexes, classifiers, and additional tools are intentionally outside this version.


---

## Supported Models

Anything available via the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) with chat or text generation support.

---

## License

GNU Affero General Public License v3.0. See [`LICENSE`](LICENSE).
