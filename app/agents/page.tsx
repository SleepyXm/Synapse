"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import KnowledgePicker from "@/app/components/KnowledgePicker";
import Popup from "@/app/components/errorpopup";
import { Agent, AgentInput, createAgent, deleteAgent, listAgents, updateAgent } from "@/app/handlers/agents";
import { useHfTokens } from "@/app/handlers/tokenhandler";
import { DEFAULT_MODEL_SETTINGS } from "@/app/hooks/interactive";

const emptyForm = (token = ""): AgentInput => ({
  name: "",
  description: "",
  instructions: "Answer precisely. Distinguish retrieved evidence from your interpretation.",
  model_id: "openai/gpt-oss-120b",
  hf_token_name: token,
  tool_ids: [],
  knowledge_base_ids: [],
  settings: { ...DEFAULT_MODEL_SETTINGS, temperature: 0.2, top_p: 0.9, max_tokens: 2048 },
  limits: { max_steps: 6, timeout_seconds: 120 },
});

export default function AgentsPage() {
  const { listHfTokens } = useHfTokens();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [form, setForm] = useState<AgentInput>(() => emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => setAgents(await listAgents()), []);

  useEffect(() => {
    const token = listHfTokens()[0] ?? "";
    setForm((current) => ({ ...current, hf_token_name: current.hf_token_name || token }));
    refresh().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load agents."));
  }, [listHfTokens, refresh]);

  const selectAgent = (agent: Agent) => {
    setEditingID(agent.id);
    setForm({
      name: agent.name,
      description: agent.description,
      instructions: agent.instructions,
      model_id: agent.model_id,
      hf_token_name: agent.hf_token_name,
      tool_ids: [...agent.tool_ids],
      knowledge_base_ids: [...agent.knowledge_base_ids],
      settings: { ...agent.settings },
      limits: { ...agent.limits },
    });
  };

  const setKnowledge = (ids: string[]) => {
    setForm((current) => ({
      ...current,
      knowledge_base_ids: ids,
      tool_ids: ids.length > 0 ? ["knowledge.search"] : [],
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editingID) await updateAgent(editingID, form);
      else await createAgent(form);
      await refresh();
      setEditingID(null);
      setForm(emptyForm(listHfTokens()[0] ?? ""));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save agent.");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-teal-300/60";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 text-white">
      {error && <Popup message={error} onClose={() => setError("")} />}
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-teal-200/70">Agents</p>
        <h1 className="mt-2 text-3xl font-semibold">Save a bounded model configuration</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">An agent fixes the model, instructions, knowledge access, and tool limits. Knowledge search is the only callable tool in this first pass.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Saved agents</h2>
            <button onClick={() => { setEditingID(null); setForm(emptyForm(listHfTokens()[0] ?? "")); }} className="text-xs text-teal-200">New</button>
          </div>
          <div className="mt-3 space-y-2">
            {agents.map((agent) => (
              <button key={agent.id} onClick={() => selectAgent(agent)} className={`w-full rounded-xl border p-3 text-left ${editingID === agent.id ? "border-teal-300/60 bg-teal-300/10" : "border-white/10 bg-white/5"}`}>
                <span className="block text-sm">{agent.name}</span>
                <span className="mt-1 line-clamp-2 block text-xs text-white/45">{agent.description}</span>
              </button>
            ))}
            {agents.length === 0 && <p className="text-xs text-white/40">No saved agents.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-white/55">Name<input className={`${inputClass} mt-1`} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} required /></label>
              <label className="text-xs text-white/55">Model ID<input className={`${inputClass} mt-1`} value={form.model_id} onChange={(event) => setForm({ ...form, model_id: event.target.value })} required /></label>
            </div>
            <label className="block text-xs text-white/55">Description<textarea className={`${inputClass} mt-1 min-h-20`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength={500} required /></label>
            <label className="block text-xs text-white/55">Instructions<textarea className={`${inputClass} mt-1 min-h-32`} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} required /></label>
            <label className="block text-xs text-white/55">Hugging Face token<select className={`${inputClass} mt-1`} value={form.hf_token_name} onChange={(event) => setForm({ ...form, hf_token_name: event.target.value })} required><option value="">Select token</option>{listHfTokens().map((token) => <option key={token} value={token}>{token}</option>)}</select></label>

            <fieldset>
              <legend className="text-sm font-medium">Knowledge access</legend>
              <p className="mb-3 mt-1 text-xs text-white/45">Attaching knowledge automatically approves knowledge.search for this agent.</p>
              <KnowledgePicker selected={form.knowledge_base_ids} onChange={setKnowledge} />
            </fieldset>

            <fieldset className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <legend className="col-span-full text-sm font-medium">Run limits and settings</legend>
              <label className="text-xs text-white/55">Temperature<input type="number" min="0" max="2" step="0.1" className={`${inputClass} mt-1`} value={form.settings.temperature} onChange={(event) => setForm({ ...form, settings: { ...form.settings, temperature: Number(event.target.value) } })} /></label>
              <label className="text-xs text-white/55">Max tokens<input type="number" min="1" className={`${inputClass} mt-1`} value={form.settings.max_tokens} onChange={(event) => setForm({ ...form, settings: { ...form.settings, max_tokens: Number(event.target.value) } })} /></label>
              <label className="text-xs text-white/55">Tool steps<input type="number" min="1" max="10" className={`${inputClass} mt-1`} value={form.limits.max_steps} onChange={(event) => setForm({ ...form, limits: { ...form.limits, max_steps: Number(event.target.value) } })} /></label>
              <label className="text-xs text-white/55">Timeout (seconds)<input type="number" min="1" max="600" className={`${inputClass} mt-1`} value={form.limits.timeout_seconds} onChange={(event) => setForm({ ...form, limits: { ...form.limits, timeout_seconds: Number(event.target.value) } })} /></label>
            </fieldset>

            <div className="flex justify-between gap-3">
              {editingID ? <button type="button" onClick={() => deleteAgent(editingID).then(refresh).then(() => { setEditingID(null); setForm(emptyForm(listHfTokens()[0] ?? "")); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not delete agent."))} className="rounded-xl border border-red-300/30 px-4 py-2 text-sm text-red-200">Delete</button> : <span />}
              <button disabled={busy} className="rounded-xl bg-teal-200 px-5 py-2 text-sm text-black disabled:opacity-50">{editingID ? "Save changes" : "Create agent"}</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
