"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createKnowledgeBase,
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeResult,
  listKnowledgeBases,
  listKnowledgeDocuments,
  searchKnowledge,
  uploadKnowledgeDocument,
} from "../handlers/knowledge";
import { useUser } from "../provider/UserProvider";

export default function KnowledgePage() {
  const { user } = useUser();
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [selectedID, setSelectedID] = useState("");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [results, setResults] = useState<KnowledgeResult[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    embedding_model_id: "",
    hf_token_name: "",
    chunk_size_runes: 1500,
    chunk_overlap_runes: 200,
  });

  useEffect(() => {
    listKnowledgeBases()
      .then((loaded) => {
        setBases(loaded);
        setSelectedID((current) => current || loaded[0]?.id || "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load knowledge bases"));
  }, []);

  useEffect(() => {
    if (!selectedID) {
      setDocuments([]);
      return;
    }
    listKnowledgeDocuments(selectedID)
      .then(setDocuments)
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load documents"));
  }, [selectedID]);

  const createBase = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setBusy(true);
      setMessage("");
      const created = await createKnowledgeBase(form);
      setBases((current) => [created, ...current]);
      setSelectedID(created.id);
      setMessage("Knowledge base created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create knowledge base");
    } finally {
      setBusy(false);
    }
  };

  const upload = async () => {
    if (!selectedID || !file) return;
    try {
      setBusy(true);
      setMessage("Storing, chunking, and embedding document…");
      const document = await uploadKnowledgeDocument(selectedID, file);
      setDocuments((current) => [document, ...current]);
      setFile(null);
      setMessage("Document is ready for retrieval.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not ingest document");
      setDocuments(await listKnowledgeDocuments(selectedID).catch(() => documents));
    } finally {
      setBusy(false);
    }
  };

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedID || !query.trim()) return;
    try {
      setBusy(true);
      setMessage("");
      setResults(await searchKnowledge(selectedID, query));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not search knowledge base");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 pb-16 pt-32 text-white">
      <h1 className="text-3xl font-semibold">Knowledge</h1>
      <p className="mt-2 text-sm text-white/60">Store private documents locally, embed them, and test retrieval before connecting them to chat.</p>

      {message && <p className="mt-5 rounded-lg border border-white/10 bg-black/30 p-3 text-sm" aria-live="polite">{message}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={createBase} className="space-y-3 rounded-xl border border-white/10 bg-black/35 p-5">
          <h2 className="text-lg font-semibold">Create a knowledge base</h2>
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" className="w-full rounded-lg bg-white/5 p-3" />
          <textarea required maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short description of this material" className="w-full rounded-lg bg-white/5 p-3" />
          <input required value={form.embedding_model_id} onChange={(event) => setForm({ ...form, embedding_model_id: event.target.value })} placeholder="Embedding model ID" className="w-full rounded-lg bg-white/5 p-3" />
          <select required value={form.hf_token_name} onChange={(event) => setForm({ ...form, hf_token_name: event.target.value })} className="w-full rounded-lg bg-neutral-900 p-3">
            <option value="">Select Hugging Face token</option>
            {user?.hf_token_names.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-white/60">Chunk size<input type="number" min={1} value={form.chunk_size_runes} onChange={(event) => setForm({ ...form, chunk_size_runes: Number(event.target.value) })} className="mt-1 w-full rounded-lg bg-white/5 p-3 text-white" /></label>
            <label className="text-xs text-white/60">Overlap<input type="number" min={0} value={form.chunk_overlap_runes} onChange={(event) => setForm({ ...form, chunk_overlap_runes: Number(event.target.value) })} className="mt-1 w-full rounded-lg bg-white/5 p-3 text-white" /></label>
          </div>
          <button disabled={busy} className="w-full rounded-lg bg-teal-300 p-3 font-semibold text-black disabled:opacity-50">Create</button>
        </form>

        <section className="space-y-4 rounded-xl border border-white/10 bg-black/35 p-5">
          <h2 className="text-lg font-semibold">Documents</h2>
          <select value={selectedID} onChange={(event) => setSelectedID(event.target.value)} className="w-full rounded-lg bg-neutral-900 p-3">
            <option value="">Select a knowledge base</option>
            {bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
          </select>
          <input type="file" accept=".pdf,.md,.markdown,.txt,text/plain,text/markdown,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full text-sm text-white/70" />
          <button type="button" onClick={upload} disabled={busy || !selectedID || !file} className="w-full rounded-lg bg-teal-300 p-3 font-semibold text-black disabled:opacity-50">Upload and embed</button>
          <div className="space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="rounded-lg bg-white/5 p-3 text-sm">
                <div className="flex justify-between gap-3"><span className="truncate">{document.filename}</span><span className="text-white/50">{document.status}</span></div>
                {document.failure_reason && <p className="mt-1 text-red-300">{document.failure_reason}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-white/10 bg-black/35 p-5">
        <h2 className="text-lg font-semibold">Test retrieval</h2>
        <form onSubmit={search} className="mt-3 flex gap-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask what these documents contain" className="min-w-0 flex-1 rounded-lg bg-white/5 p-3" />
          <button disabled={busy || !selectedID} className="rounded-lg bg-teal-300 px-5 font-semibold text-black disabled:opacity-50">Search</button>
        </form>
        <div className="mt-4 space-y-3">
          {results.map((result) => (
            <article key={result.citation_id} className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-teal-200">{result.filename}{result.page ? ` · page ${result.page}` : ""} · score {result.score.toFixed(3)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{result.content}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
