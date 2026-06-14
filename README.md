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


---

## Supported Models

Anything available via the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) with chat or text generation support.

---

## License

MIT
