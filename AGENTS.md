# Synapse collaboration contract

These instructions apply to the entire repository. The user is the final authority on product behavior, architecture, scope, and what is allowed to remain in the codebase.

## Work from the user's decisions

- Treat the user's explicit decisions, corrections, and accepted descriptions as binding requirements. Do not replace them with personal preferences, generic best practices, or assumptions about what would be more efficient.
- Reconstruct the relevant decisions from the conversation and repository before acting. The user must not be made to repeat context, maintain a decision ledger, invoke a special phrase, or supervise routine implementation work.
- Never describe an assistant-selected implementation detail as something that was agreed. Clearly distinguish requirements from implementation choices.
- Make routine, reversible coding decisions independently when they do not change behavior or architecture. If an unresolved choice would materially change data flow, architecture, storage, dependencies, cost, security, or user-visible behavior, ask one concise question before implementing that choice.
- Do not dump plans, checklists, or process artifacts on the user unless requested. Perform the necessary diligence internally and lead with the result.

## Control scope and complexity

- Implement only the requested scope. Do not add adjacent features or infrastructure because they might be useful later.
- Do not add files, dependencies, database objects, services, queues, retries, abstractions, algorithms, heuristics, or configuration unless the approved design requires them.
- Match the existing project's organization. Prefer a few cohesive files and substantial functions over collections of tiny files or one-purpose wrapper functions. File count is not a substitute for a clear design.
- Comments must explain important intent, invariants, trust boundaries, or failure handling. Do not narrate obvious syntax.
- Do not provide delivery-time estimates unless the user explicitly asks for them.

## Use established implementations faithfully

- When the user requires known open-source implementations, do not recreate their core behavior with novel glue code. Use the official client and documented workflow, and keep application-specific orchestration small.
- Validate current library behavior against primary documentation and runnable examples before implementation. Do not infer APIs or operational guarantees.
- Do not introduce custom ranking, chunk grouping, token estimation, leasing, retry, or distributed-state protocols without explicit approval and evidence that the project needs them.

## Review before handoff

- Review authored code as if it came from an unknown third party. Check correctness, naming, failure paths, concurrency, data integrity, security, operational behavior, test quality, and whether every abstraction earns its existence.
- Passing compilation or shallow unit tests is not proof of production readiness. Run proportional tests and state unverified integration or deployment behavior plainly.
- If the implementation diverges from an approved requirement, correct it before presenting the work. Do not defend the divergence or ask the user to accept it.

## Locked knowledge-base implementation

This section is the single authoritative specification for knowledge-base work. It survives conversation compaction. Existing incomplete code, generic RAG advice, and new libraries do not override it. Change it only when the user explicitly identifies the requirement being changed. Do not create a nested `AGENTS.md`. The staged generation design in `EXPERIMENTAL.md` has been promoted and is canonical.

### Ownership and established components

- The existing Go API authenticates the user, holds the selected Hugging Face token,
  enforces the final model-specific prompt budget, and makes the one user-paid answer
  call.
- A dedicated Go knowledge service owns its HTTP API, PostgreSQL product metadata,
  River jobs, original-file storage, TEI calls, Qdrant writes, and retrieval.
- A narrow Python processor owns the maintained Python-native work: Docling
  `HybridChunker` and Qdrant FastEmbed BM25. It does not
  own authentication, product state, storage, or Qdrant access.
- PostgreSQL stores only knowledge-base/document ownership and durable product state.
  Never store document bodies, chunks, or vectors there.
- Originals use local filesystem storage in development and S3-compatible object
  storage elsewhere.
- Qdrant is the only retrieval store and is accessed from Go with its official client.
- Dense inference is service-owned TEI. The English v1 default is
  `BAAI/bge-small-en-v1.5`: 384 dimensions and a 512-token input. Apply its documented
  retrieval prefix to queries only.
- Sparse inference is `Qdrant/bm25` through Qdrant's FastEmbed implementation with
  English stemming. Never implement BM25 hashing, tokenization, stemming, TF, or IDF.
- Apple Embedding Atlas has no runtime role. It may be used only for offline inspection.
- A model change creates a new index version and requires reindexing. Never mix vectors
  produced by incompatible models. Startup restores missing River work for incomplete
  documents in the service's current index version.

### Canonical ingestion

1. An authenticated user uploads PDF, Markdown, or plain text through the Go API. The
   API forwards only server-verified identity to the private knowledge service.
2. The knowledge service streams the original into object storage while calculating
   its hash and size. It does not read the entire upload into memory.
3. In one PostgreSQL transaction, create the document metadata and insert a typed
   River job. Duplicate hashes within one knowledge base return the existing document
   and remove the redundant stored object.
4. River exclusively owns claims, leases, crash recovery, automatic retries, and retry
   timing. Use River's `database/sql` driver and migration tooling. Never recreate a
   `knowledge_ingestion_jobs` table or a second lease/retry mechanism.
5. Each upload joins the knowledge base's open index generation. The dense River worker changes `queued` to `processing`, opens the stored original, and sends only that document to the Python processor; prior document context is never carried into the request.
6. Docling HybridChunker returns small contextual evidence regions from the actual
   document. Peer merging is disabled. Region size is token-based, capped below the
   dense model's 512-token input, and preserves headings, captions, page information,
   document order, and repeated table headers. Do not use character estimates or a
   generative model to classify, summarize, or extract entity routes.
7. Persist the ordered evidence regions as an object-storage manifest before sparse
   vectors are created. PostgreSQL stores the manifest's stage/count metadata, never
   its text.
8. TEI embeds every region's contextual source text in batches. Dense vectors represent
   real evidence regions, not document-level facets or generated metadata.
9. Use exactly two Qdrant collections: one dense point and one sparse point for each
   evidence region. Paired points use the same deterministic identity. Both have
   indexed `user_id`, `knowledge_base_id`, `document_id`, `region_id`, `index_version`,
   and `active`; sparse points also hold evidence and citations.
10. The dense stage replaces the prior document index with inactive dense regions,
    saves the region count, and marks the document `dense`; stale regions cannot
    survive a shorter retry.
11. Sparse work cannot begin until every document in that frozen generation is `dense`.
    The last dense completion locks and advances the open generation so later uploads
    join the next one, then inserts one sparse River job per document transactionally.
    Failed or pending dense work blocks this barrier.
12. Each sparse job reads the persisted region manifest and uses FastEmbed to create
    one BM25 vector per complete evidence region. It stages inactive sparse points and
    marks the document `sparse`.
13. The last sparse completion locks the generation's documents, activates both Qdrant
    collections for that complete generation, and marks every member `ready`. A partial
    generation never becomes evidence.
14. PostgreSQL readiness is authoritative and retrieval rechecks it, so a crash between
    Qdrant activation and the database commit cannot expose orphaned, failed,
    processing, stale, or deleted points. River retries deterministic missing-stage
    work; only exhausted work becomes `failed`.

### Canonical retrieval and cost boundary

1. The Go API verifies ownership and asks the knowledge service for one knowledge base.
2. A deterministic prompt pass copies the intact grammatical question for TEI, content
   terms for FastEmbed BM25, and strong exact anchors limited to numbers and multiword
   proper names. It does not generate, paraphrase, or infer entities. Both encoders use
   service resources.
3. Dense Qdrant search repeats user, knowledge-base, active, and index-version filters.
   Dense search is a relevance gate, never a fixed top-N selector: every evidence region
   at or above the calibrated threshold is eligible. Set the request limit from the
   ready-region count so it cannot silently become a top-five-style architecture. Union
   matching region IDs across every document in the permitted knowledge base.
4. Every exact anchor must occur somewhere inside the dense-matching region set. Anchors
   constrain the community, not each final chunk, because a later region may use a pronoun
   or shortened name. Sparse BM25 then searches only those dense-matching region IDs while
   repeating all ownership and lifecycle filters. Sparse results must clear their calibrated
   acceptance threshold; a weak non-empty response is not evidence.
5. There is no whole-knowledge-base sparse fallback. Empty dense or scoped sparse
   results return no evidence. Sparse score supplies the final ordering.
6. Do not add score weighting, RRF, fusion, or a query-time verifier. Reranking is
   reserved for later explicit work and is not part of this implementation.
7. Recheck result document IDs against PostgreSQL `ready` state, deduplicate stable
   region IDs, and return ranked region text plus citation metadata to the Go API.
8. The Go API uses the selected generation model's real Hugging Face tokenizer. It may
   use the existing decrypted token only to fetch that model's tokenizer artifact; the
   token is never forwarded to the knowledge service. If the tokenizer cannot be loaded,
   fail before paid generation. Never substitute characters-per-token or the embedding
   tokenizer.
9. Pack evidence in sparse-score order under exactly 1,000 selected-model tokens,
   including citation labels. If needed, cut only the final included chunk and only on
   an exact tokenizer boundary.
10. If no accepted evidence remains, return without calling the user's model. Otherwise
    make one final generation call: at most 400 instruction tokens, 1,000 stored-history
    tokens, the current request exactly once, 1,000 evidence tokens, and a 1,000-token
    answer allowance. Only this final call consumes the user's inference quota.

Dense and sparse score thresholds are explicit configuration produced from checked-in
labelled retrieval fixtures. They are not invented or silently tuned. Tie-break dense
evaluation toward recall and sparse evaluation toward precision.

### Data, state, and security

- Alembic owns only `knowledge_bases` and `knowledge_documents`. River owns its internal
  schema through River migrations.
- Document states are `queued`, `processing`, `ready`, and `failed`; indexing stages are `pending`, `dense`, `sparse`, and `ready`. Deletion removes product visibility first and performs idempotent Qdrant/original/manifest cleanup.
- Every Qdrant query and mutation scopes `user_id`, `knowledge_base_id`, and document
  identity where applicable. Payload ownership never replaces PostgreSQL authorization.
- Browser identity and service credentials are never accepted from client-controlled
  forwarding headers. The public API injects them after existing authentication.
- The incomplete knowledge README, migration, proxy, frontend, compose, and environment
  changes currently in the worktree are not authoritative. Reconcile them to this section.

### Knowledge code clarity

- A function name must describe its complete observable effect. A function that stores
  an object and inserts a River job is named like `StoreDocumentAndEnqueueIngestion`,
  not `CreateDocument`.
- `Get`, `List`, `Find`, `Validate`, `Parse`, and `Check` functions do not secretly write
  responses, enqueue jobs, or mutate state. Helpers with response/control-flow side
  effects expose that fact in their names.
- A function may own multiple steps when they form one cohesive use case, transaction,
  or state transition. Do not split readable workflows into one-line wrappers.
- HTTP handlers decode, use authenticated context, call a clearly named use case, and
  map typed outcomes. The use case owns storage, SQL transactions, River insertion,
  compensation, and cleanup.
- Avoid ambiguous boolean return tuples and long primitive argument lists. Use named
  result or command types when outcomes or values form one operation.
- Centralize state transitions. Preserve operation/resource context in errors. Do not
  silently discard cleanup failures.
- Add interfaces only at real replaceable boundaries: originals, document processing,
  dense inference, and Qdrant. Do not interface every struct.
- Comments explain invariants, ownership, idempotency, and failure handling, not syntax.
  Early returns are valid; indentation depth and line count are not quality metrics.
- Keep `backend/knowledge` cohesive and small: `service.go` for construction/routes and
  product use cases, `ingestion.go` for River/indexing, `retrieval.go` for the complete
  two-stage search, and `storage.go` for local/S3 originals. `types.go` is allowed only
  when genuinely shared types improve those files. Do not recreate `catalog.go`,
  `http.go`, generic `helpers.go`, or one client file per dependency.

### Acceptance requirements

- Tests cover transactional enqueueing, duplicate upload, dense and sparse generation barriers, River retry/exhaustion, partial Qdrant writes, retry with fewer regions, deletion during processing, and missing-stage retry.
- Retrieval tests prove tenant isolation and exclusion of unready, failed, deleted,
  stale-version, and orphaned points.
- Tests prove dense gating is threshold-based, sparse search receives exactly the dense
  region IDs, empty dense or sparse sets remain empty, and no whole-base
  fallback, query-time LLM loop, or reranker exists.
- Processor tests prove every Docling region is returned in order, independently fits
  the configured dense-region token budget, and is produced without a user credential
  or generative summarization call.
- Token tests use the real selected tokenizer and prove evidence never exceeds 1,000
  tokens. End-to-end tests prove at most one user-paid generation call.
- Before handoff, review the implementation as hostile third-party code and remove any
  unnecessary file, wrapper, concealed side effect, or divergence from this contract.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
