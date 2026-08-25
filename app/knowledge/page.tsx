"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import DocumentStatus from "@/app/components/DocumentStatus";
import Popup from "@/app/components/errorpopup";
import {
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeSearchResult,
  createKnowledgeBase,
  deleteKnowledgeDocument,
  listKnowledgeBases,
  listKnowledgeDocuments,
  retryKnowledgeDocument,
  searchKnowledge,
  uploadKnowledgeDocument,
} from "@/app/handlers/knowledge";
import { useHfTokens } from "@/app/handlers/tokenhandler";

const DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

export default function KnowledgePage() {
  const { listHfTokens } = useHfTokens();
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [selectedID, setSelectedID] = useState("");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState(DEFAULT_EMBEDDING_MODEL);
  const [tokenName, setTokenName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshBases = useCallback(async () => {
    const items = await listKnowledgeBases();
    setBases(items);
    setSelectedID((current) => current || items[0]?.id || "");
  }, []);

  const refreshDocuments = useCallback(async (baseID: string) => {
    if (!baseID) {
      setDocuments([]);
      return;
    }
    setDocuments(await listKnowledgeDocuments(baseID));
  }, []);

  useEffect(() => {
    const tokens = listHfTokens();
    setTokenName((current) => current || tokens[0] || "");
    refreshBases().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load knowledge."));
  }, [listHfTokens, refreshBases]);

  useEffect(() => {
    refreshDocuments(selectedID).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load documents."));
  }, [selectedID, refreshDocuments]);

  useEffect(() => {
    if (!selectedID || !documents.some((document) => document.status === "queued" || document.status === "processing")) return;
    const timer = window.setInterval(() => {
      refreshDocuments(selectedID).then(refreshBases).catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [documents, refreshBases, refreshDocuments, selectedID]);

  const submitBase = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await createKnowledgeBase({
        name,
        description,
        embedding_model_id: embeddingModel,
        hf_token_name: tokenName,
        chunking: { size_runes: 1500, overlap_runes: 200 },
      });
      setName("");
      setDescription("");
      await refreshBases();
      setSelectedID(created.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create knowledge base.");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File | undefined) => {
    if (!selectedID || !file) return;
    setBusy(true);
    setError("");
    try {
      await uploadKnowledgeDocument(selectedID, file);
      await refreshDocuments(selectedID);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload document.");
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedID || !searchQuery.trim()) return;
    setBusy(true);
    setError("");
    try {
      setResults(await searchKnowledge(selectedID, searchQuery));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-teal-300/60";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 text-white">
      {error && <Popup message={error} onClose={() => setError("")} />}
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-teal-200/70">Knowledge network</p>
        <h1 className="mt-2 text-3xl font-semibold">Upload, index, and test your sources</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">Descriptions are the short manifest models see. Source passages enter context only after the model calls knowledge search.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <h2 className="font-medium">Create a knowledge base</h2>
          <form onSubmit={submitBase} className="mt-4 space-y-3">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" maxLength={100} required />
            <textarea className={`${inputClass} min-h-28`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Sharp description shown to models" maxLength={500} required />
            <input className={inputClass} value={embeddingModel} onChange={(event) => setEmbeddingModel(event.target.value)} placeholder="Embedding model ID" required />
            <select className={inputClass} value={tokenName} onChange={(event) => setTokenName(event.target.value)} required>
              <option value="">Select Hugging Face token</option>
              {listHfTokens().map((token) => <option key={token} value={token}>{token}</option>)}
            </select>
            <button disabled={busy} className="w-full rounded-xl bg-teal-200 px-4 py-2 text-sm text-black disabled:opacity-50">Create</button>
          </form>

          <h2 className="mt-8 font-medium">Knowledge bases</h2>
          <div className="mt-3 space-y-2">
            {bases.map((base) => (
              <button key={base.id} onClick={() => { setSelectedID(base.id); setResults([]); }} className={`w-full rounded-xl border p-3 text-left ${selectedID === base.id ? "border-teal-300/60 bg-teal-300/10" : "border-white/10 bg-white/5"}`}>
                <span className="block text-sm">{base.name}</span>
                <span className="mt-1 block text-xs text-white/45">{base.ready_documents} ready document{base.ready_documents === 1 ? "" : "s"}</span>
              </button>
            ))}
            {bases.length === 0 && <p className="text-xs text-white/40">Nothing indexed yet.</p>}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">Documents</h2>
                <p className="mt-1 text-xs text-white/45">PDF, Markdown, or text · 100 MiB maximum</p>
              </div>
              <label className={`cursor-pointer rounded-xl border border-white/15 px-4 py-2 text-sm ${!selectedID || busy ? "pointer-events-none opacity-40" : "hover:bg-white/10"}`}>
                Upload file
                <input type="file" accept=".pdf,.md,.markdown,.txt,application/pdf,text/plain,text/markdown" className="hidden" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
              </label>
            </div>
            <div className="mt-4 divide-y divide-white/10">
              {documents.map((document) => (
                <div key={document.id} className="flex items-start justify-between gap-4 py-3">
                  <DocumentStatus document={document} />
                  <div className="flex gap-2 text-xs">
                    {document.status === "failed" && <button onClick={() => retryKnowledgeDocument(selectedID, document.id).then(() => refreshDocuments(selectedID)).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Retry failed."))} className="text-teal-200">Retry</button>}
                    <button onClick={() => deleteKnowledgeDocument(selectedID, document.id).then(() => refreshDocuments(selectedID)).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Delete failed."))} className="text-red-300">Delete</button>
                  </div>
                </div>
              ))}
              {selectedID && documents.length === 0 && <p className="py-6 text-sm text-white/40">Upload a source to start the ingestion worker.</p>}
              {!selectedID && <p className="py-6 text-sm text-white/40">Select or create a knowledge base first.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h2 className="font-medium">Test vector search</h2>
            <form onSubmit={runSearch} className="mt-4 flex gap-2">
              <input className={inputClass} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="What evidence contradicts the notice?" />
              <button disabled={!selectedID || busy} className="rounded-xl bg-white px-4 py-2 text-sm text-black disabled:opacity-40">Search</button>
            </form>
            <div className="mt-4 space-y-3">
              {results.map((result) => (
                <article key={result.citation_id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex justify-between gap-3 text-xs text-white/45">
                    <span>{result.filename}{result.page ? ` · page ${result.page}` : ""}</span>
                    <span>{Math.round(result.score * 100)}%</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-white/75">{result.content}</p>
                  <p className="mt-3 font-mono text-[10px] text-white/35">{result.citation_id}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
