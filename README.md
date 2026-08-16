# Synapse

Compare, converse, and experiment across Hugging Face models — simultaneously.

Synapse is a multi-model platform built for people who want to actually understand what different open-source models are doing. Stream responses side by side, track timing, maintain conversation context across sessions, and run web searches without needing a fine-tuned model to support it.

---

## Features

**Side-by-side model comparison**
Stream responses from multiple Hugging Face models at the same time. Response timing is tracked per model so you can see not just what each model says but how fast it gets there.

**Conversational memory**
Context is compressed via LLM-generated summarisation before being stored in PostgreSQL. Sessions persist across conversations without unbounded context growth — memory stays useful without eating your token budget.

**Web search tool**
Built from scratch. Gives open-source models agentic capabilities without relying on fine-tuned tool-use support. Works with any chat or text generation model.

**BYOK**
Bring your own Hugging Face API token. Tokens are stored against your profile and only accessed at inference time.

---

## Stack

`Go` `Next.js` `PostgreSQL` `AWS EC2`

Backend written in Go, deployed on EC2 via a self-built GitHub webhook CI/CD pipeline — push to main, the server pulls, installs deps, restarts, and fires a failure alert if anything goes wrong.

---

## Requirements
- Hugging Face account with API token

## Local RAG

Synapse can ground chat responses in a project-local knowledge corpus without a Python service or external vector database.

1. Put UTF-8 Markdown or text files in `backend/knowledge/`.
2. Start the Go backend from `backend/`. The folder is indexed at startup.
3. Call `POST /api/rag/reload` after changing files, or restart the backend.
4. Chat retrieval is enabled by default. Send `"useRag": false` in a chat request to disable it for that request.

The first-pass retriever is a bounded, in-memory BM25 index and the local-filesystem development adapter. It recursively reads only `.md` and `.txt` files below the configured root, skips symlinks, preserves file-and-line citations, and never performs web retrieval. Per-file, total-file, total-byte, retrieval-count, and generated-context limits keep each operation bounded. Local knowledge files are ignored by git by default. Production document and annotation storage is intended to use the R2-backed Worker described below.

Optional configuration:

```text
RAG_DOCUMENTS_DIR=knowledge
RAG_SOURCE=local
RAG_TOP_K=6
RAG_MAX_QUERY_CHARS=4000
RAG_CHUNK_SIZE=1800
RAG_CHUNK_OVERLAP=240
RAG_MAX_CONTEXT_CHARS=12000
RAG_MAX_FILE_BYTES=2097152
RAG_MAX_FILES=1000
RAG_MAX_TOTAL_BYTES=67108864
```

For the production R2 adapter, set:

```text
RAG_SOURCE=r2
RAG_R2_GATEWAY_URL=https://<your-worker-domain>
RAG_R2_GATEWAY_TOKEN=<same bearer secret configured on the Worker>
RAG_R2_PREFIX=
```

The R2 adapter lists and retrieves the Worker's `documents` namespace, applies the same corpus limits before indexing, requires HTTPS outside localhost, and never places the gateway token in retrieval results or status data.

Authenticated diagnostic endpoints:

```text
GET  /api/rag/status
POST /api/rag/query   {"query":"...", "top_k":6}
POST /api/rag/reload
```

## Cloudflare LLM gateway

`workers/llm-gateway/` is a separately deployable Cloudflare Worker with Workers AI and R2 bindings. It provides a bounded, bearer-authenticated model endpoint plus storage operations for documents and annotations. In normal local development Wrangler persists the R2 binding locally; deployment switches the same binding to the configured R2 bucket.

The Worker writes metadata-only invocation audit records to R2. It does not record prompt or response content. See [`workers/llm-gateway/README.md`](workers/llm-gateway/README.md) for setup, routes, limits, and deployment instructions.


---

## Supported Models

Anything available via the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) with chat or text generation support.

---

## License

MIT
