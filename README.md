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

`Go` `Next.js` `PostgreSQL` `AWS EC2`

The Next.js interface communicates with the Go API for authentication, conversations, model requests, and token management.

---

## Requirements
- Hugging Face account with API token

## Document preparation status

`backend/rag` contains the first active backend foundation for document ingestion:

- LangChainGo recursive text chunking with explicit rune-based size settings.
- Batched Hugging Face feature-extraction requests.
- Source and embedding-model identity on prepared chunks.

This is not yet a complete RAG feature. There is currently no document parser, vector store, retrieval policy, chat grounding, or frontend document workflow.


---

## Supported Models

Anything available via the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) with chat or text generation support.

---

## License

GNU Affero General Public License v3.0. See [`LICENSE`](LICENSE).
