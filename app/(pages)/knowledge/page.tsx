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
} from "@/app/components/handlers/knowledge";
import { useUser } from "@/app/components/provider/UserProvider";
import { Button, Input, Select, Surface, Textarea } from "@/app/UI";

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

      {message && <Surface as="p" opacity={0.3} borderOpacity={0.1} radius="0.5rem" padding="0.75rem" className="mt-5 text-sm" aria-live="polite">{message}</Surface>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Surface as="form" onSubmit={createBase} opacity={0.35} borderOpacity={0.1} radius="0.75rem" padding="1.25rem" className="space-y-3">
          <h2 className="text-lg font-semibold">Create a knowledge base</h2>
          <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" />
          <Textarea required maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short description of this material" />
          <Input required value={form.embedding_model_id} onChange={(event) => setForm({ ...form, embedding_model_id: event.target.value })} placeholder="Embedding model ID" />
          <Select required tone="neutral" opacity={1} value={form.hf_token_name} onChange={(event) => setForm({ ...form, hf_token_name: event.target.value })}>
            <option value="">Select Hugging Face token</option>
            {user?.hf_token_names.map((name) => <option key={name} value={name}>{name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-white/60">Chunk size<Input type="number" min={1} value={form.chunk_size_runes} onChange={(event) => setForm({ ...form, chunk_size_runes: Number(event.target.value) })} className="mt-1" /></label>
            <label className="text-xs text-white/60">Overlap<Input type="number" min={0} value={form.chunk_overlap_runes} onChange={(event) => setForm({ ...form, chunk_overlap_runes: Number(event.target.value) })} className="mt-1" /></label>
          </div>
          <Button type="submit" variant="primary" hover={false} disabled={busy} fullWidth padding="0.75rem" className="font-semibold">Create</Button>
        </Surface>

        <Surface as="section" opacity={0.35} borderOpacity={0.1} radius="0.75rem" padding="1.25rem" className="space-y-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <Select tone="neutral" opacity={1} value={selectedID} onChange={(event) => setSelectedID(event.target.value)}>
            <option value="">Select a knowledge base</option>
            {bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
          </Select>
          <input type="file" accept=".pdf,.md,.markdown,.txt,text/plain,text/markdown,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="block w-full text-sm text-white/70" />
          <Button onClick={upload} variant="primary" hover={false} disabled={busy || !selectedID || !file} fullWidth padding="0.75rem" className="font-semibold">Upload and embed</Button>
          <div className="space-y-2">
            {documents.map((document) => (
              <Surface key={document.id} tone="light" opacity={0.05} radius="0.5rem" padding="0.75rem" className="text-sm">
                <div className="flex justify-between gap-3"><span className="truncate">{document.filename}</span><span className="text-white/50">{document.status}</span></div>
                {document.failure_reason && <p className="mt-1 text-red-300">{document.failure_reason}</p>}
              </Surface>
            ))}
          </div>
        </Surface>
      </div>

      <Surface as="section" opacity={0.35} borderOpacity={0.1} radius="0.75rem" padding="1.25rem" className="mt-6">
        <h2 className="text-lg font-semibold">Test retrieval</h2>
        <form onSubmit={search} className="mt-3 flex gap-3">
          <Input fullWidth={false} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask what these documents contain" className="min-w-0 flex-1" />
          <Button type="submit" variant="primary" hover={false} disabled={busy || !selectedID} padding="0 1.25rem" className="font-semibold">Search</Button>
        </form>
        <div className="mt-4 space-y-3">
          {results.map((result) => (
            <Surface as="article" key={result.citation_id} tone="light" opacity={0.05} radius="0.5rem" padding="1rem">
              <p className="text-xs text-teal-200">{result.filename}{result.page ? ` · page ${result.page}` : ""} · score {result.score.toFixed(3)}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{result.content}</p>
            </Surface>
          ))}
        </div>
      </Surface>
    </main>
  );
}
