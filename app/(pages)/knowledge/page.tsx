"use client";

import { DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  createKnowledgeBase,
  deleteKnowledgeDocument,
  KnowledgeBase,
  KnowledgeDocument,
  listKnowledgeBases,
  listKnowledgeDocuments,
  uploadKnowledgeDocument,
} from "@/app/components/handlers/knowledge";
import { Button, Input, Select, Surface, Textarea } from "@/app/UI";

const supportedDocument = /\.(pdf|md|markdown|txt)$/i;

export default function KnowledgePage() {
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [selectedID, setSelectedID] = useState("");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
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

  useEffect(() => {
    if (!selectedID || !documents.some((document) => document.status === "queued" || document.status === "processing")) return;
    const timer = window.setInterval(() => {
      listKnowledgeDocuments(selectedID).then(setDocuments).catch(() => undefined);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [documents, selectedID]);

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

  const chooseDocuments = (selected: File[]) => {
    const unsupported = selected.filter((file) => !supportedDocument.test(file.name));
    if (unsupported.length > 0) {
      setMessage("Only PDF, Markdown, and plain-text documents can be uploaded.");
      return;
    }
    setFiles((current) => {
      const combined = [...current, ...selected];
      return combined.filter((file, index) => combined.findIndex((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified) === index);
    });
    setMessage("");
  };

  const dropDocuments = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    const containsFolder = Array.from(event.dataTransfer.items).some((item) => item.kind === "file" && item.webkitGetAsEntry()?.isDirectory);
    if (containsFolder) {
      setMessage("Folders are not supported yet. Drop the documents themselves instead.");
      return;
    }
    chooseDocuments(Array.from(event.dataTransfer.files));
  };

  const upload = async () => {
    if (!selectedID || files.length === 0) return;
    try {
      setBusy(true);
      const uploaded: KnowledgeDocument[] = [];
      for (const [index, file] of files.entries()) {
        setMessage(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
        uploaded.push(await uploadKnowledgeDocument(selectedID, file));
      }
      setDocuments((current) => [...uploaded, ...current.filter((document) => !uploaded.some((item) => item.id === document.id))]);
      setFiles([]);
      if (fileInput.current) fileInput.current.value = "";
      setMessage(`${uploaded.length} document${uploaded.length === 1 ? "" : "s"} queued for indexing.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not ingest document");
      setDocuments(await listKnowledgeDocuments(selectedID).catch(() => documents));
    } finally {
      setBusy(false);
    }
  };

  const deleteDocument = async (documentID: string) => {
    if (!selectedID) return;
    try {
      setBusy(true);
      await deleteKnowledgeDocument(selectedID, documentID);
      setDocuments((current) => current.filter((document) => document.id !== documentID));
      setMessage("Document deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete document");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 pb-16 pt-32 text-white">
      <h1 className="text-3xl font-semibold">Knowledge</h1>
      <p className="mt-2 text-sm text-white/60">Store private documents and index them without using your model token.</p>

      {message && <Surface as="p" opacity={0.3} borderOpacity={0.1} blur="md" radius="0.5rem" padding="0.75rem" className="mt-5 text-sm" aria-live="polite">{message}</Surface>}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Surface as="form" onSubmit={createBase} opacity={0.35} borderOpacity={0.1} blur="md" radius="0.75rem" padding="1.25rem" className="space-y-3">
          <h2 className="text-lg font-semibold">Create a knowledge base</h2>
          <Input blur="sm" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" />
          <Textarea blur="sm" maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Short description of this material" />
          <p className="text-xs text-white/50">Embedding and chunking are managed by Synapse, so this does not use a personal Hugging Face token.</p>
          <Button type="submit" variant="primary" hover={false} disabled={busy} fullWidth padding="0.75rem" className="font-semibold">Create</Button>
        </Surface>

        <Surface as="section" opacity={0.35} borderOpacity={0.1} blur="md" radius="0.75rem" padding="1.25rem" className="space-y-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <Select tone="neutral" opacity={1} value={selectedID} onChange={(event) => setSelectedID(event.target.value)}>
            <option value="">Select a knowledge base</option>
            {bases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}
          </Select>
          <input
            ref={fileInput}
            id="knowledge-documents"
            type="file"
            multiple
            disabled={busy}
            accept=".pdf,.md,.markdown,.txt,text/plain,text/markdown,application/pdf"
            onChange={(event) => chooseDocuments(Array.from(event.target.files || []))}
            className="sr-only"
          />
          <label
            htmlFor="knowledge-documents"
            onDragEnter={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={dropDocuments}
            className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center backdrop-blur-sm transition ${dragging ? "border-teal-300 bg-teal-300/15" : "border-white/20 bg-black/15 hover:border-teal-300/60 hover:bg-teal-300/5"} ${busy ? "pointer-events-none opacity-50" : ""}`}
          >
            <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-teal-300/10 text-2xl text-teal-200">↑</span>
            <span className="font-semibold">Drop documents here</span>
            <span className="mt-1 text-sm text-white/60">or <span className="text-teal-200 underline underline-offset-2">choose files</span> from your device</span>
            <span className="mt-3 text-xs text-white/40">PDF, Markdown, or plain text · 100 MiB each</span>
            {files.length > 0 && (
              <span className="mt-4 max-w-full rounded-md bg-white/5 px-3 py-2 text-xs text-white/70">
                {files.length === 1 ? files[0].name : `${files.length} documents selected`}
              </span>
            )}
          </label>
          <Button onClick={upload} variant="primary" hover={false} disabled={busy || !selectedID || files.length === 0} fullWidth padding="0.75rem" className="font-semibold">Upload and index</Button>
          <div className="space-y-2">
            {documents.map((document) => (
              <Surface key={document.id} tone="light" opacity={0.05} blur="sm" radius="0.5rem" padding="0.75rem" className="text-sm">
                <div className="flex items-center justify-between gap-3"><span className="truncate">{document.filename}</span><span className="text-white/50">{document.status}{document.status === "ready" ? ` · ${document.chunk_count} chunks` : ""}</span><Button onClick={() => deleteDocument(document.id)} disabled={busy} padding="0.35rem 0.6rem">Delete</Button></div>
                {document.failure_reason && <p className="mt-1 text-red-300">{document.failure_reason}</p>}
              </Surface>
            ))}
          </div>
        </Surface>
      </div>
    </main>
  );
}
