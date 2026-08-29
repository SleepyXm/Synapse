"use client";

import { useEffect, useState } from "react";
import {
  createLLMCustomisation,
  deleteLLMCustomisation,
  getLLMCustomisations,
  LLMCustomisation,
  updateLLMCustomisation,
} from "@/app/components/handlers/chat";
import { Button, Input, Surface, Textarea } from "@/app/UI";
import { ModelSettings } from "@/app/components/hooks/interactive";

type ToolingProps = {
  settings: ModelSettings;
  setSettings: React.Dispatch<React.SetStateAction<ModelSettings>>;
  customisationId: string;
  setCustomisationId: React.Dispatch<React.SetStateAction<string>>;
};

export default function Tooling({
  settings,
  setSettings,
  customisationId,
  setCustomisationId,
}: ToolingProps) {
  const [customisations, setCustomisations] = useState<LLMCustomisation[]>([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getLLMCustomisations()
      .then(setCustomisations)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load prompts"));
  }, []);

  const selected = customisations.find((item) => item.id === customisationId);

  const startNewPrompt = () => {
    setEditingId(null);
    setName("");
    setSystemPrompt("");
    setError("");
  };

  const startEditing = (item: LLMCustomisation) => {
    setEditingId(item.id);
    setName(item.name);
    setSystemPrompt(item.system_prompt);
    setError("");
  };

  const savePrompt = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      setError("Give the prompt a name and some instructions.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const saved = editingId
        ? await updateLLMCustomisation(editingId, name, systemPrompt)
        : await createLLMCustomisation(name, systemPrompt);
      setCustomisations((current) => [
        ...current.filter((item) => item.id !== saved.id),
        saved,
      ]);
      setCustomisationId(saved.id);
      setShowPrompts(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save prompt");
    } finally {
      setBusy(false);
    }
  };

  const removePrompt = async (item: LLMCustomisation) => {
    if (!window.confirm(`Delete “${item.name}”?`)) return;
    try {
      setBusy(true);
      setError("");
      await deleteLLMCustomisation(item.id);
      setCustomisations((current) => current.filter((entry) => entry.id !== item.id));
      if (customisationId === item.id) setCustomisationId("default");
      if (editingId === item.id) startNewPrompt();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete prompt");
    } finally {
      setBusy(false);
    }
  };

  const updateSetting = <K extends keyof ModelSettings>(key: K, value: ModelSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <Surface
      opacity={0.35}
      blur="md"
      padding="1rem"
      shadow
      width="25vw"
      height="94vh"
      className="hidden md:flex flex-col transition-all duration-300 mt-20 overflow-y-auto"
    >
      <h3 className="text-lg font-bold text-white text-center mb-4">Model Settings</h3>

      <div className="flex flex-col gap-5 text-white">
        <div className="flex flex-col gap-2">
          <span className="text-sm">System prompt</span>
          <button
            type="button"
            onClick={() => {
              startNewPrompt();
              setShowPrompts(true);
            }}
            className="rounded-lg border border-white/15 bg-white/5 p-3 text-left transition hover:border-teal-300/60 hover:bg-white/10"
          >
            <span className="block text-sm font-semibold text-teal-300">
              {selected?.name ?? "Default"}
            </span>
            <span className="mt-1 block line-clamp-2 text-xs text-white/55">
              {selected?.system_prompt ?? "Synapse's default assistant instructions."}
            </span>
          </button>
        </div>

        <SettingSlider label="Temperature" value={settings.temperature} min={0} max={2} step={0.05} onChange={(value) => updateSetting("temperature", value)} />
        <SettingSlider label="Top P" value={settings.top_p} min={0} max={1} step={0.01} onChange={(value) => updateSetting("top_p", value)} />
        <SettingSlider label="Max Tokens" value={settings.max_tokens} min={64} max={50000} step={64} onChange={(value) => updateSetting("max_tokens", value)} />
        <SettingSlider label="Presence Penalty" value={settings.presence_penalty} min={-2} max={2} step={0.1} onChange={(value) => updateSetting("presence_penalty", value)} />
        <SettingSlider label="Frequency Penalty" value={settings.frequency_penalty} min={-2} max={2} step={0.1} onChange={(value) => updateSetting("frequency_penalty", value)} />
      </div>

      {showPrompts && (
        <Surface
          opacity={0.7}
          padding="1.5rem"
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowPrompts(false)}
        >
          <Surface
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-dialog-title"
            tone="deep"
            opacity={1}
            borderOpacity={0.15}
            radius="0.75rem"
            shadow
            width="100%"
            maxWidth="48rem"
            className="grid max-h-[80vh] grid-cols-2 overflow-hidden text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overflow-y-auto border-r border-white/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="prompt-dialog-title" className="font-semibold">System prompts</h2>
                <button type="button" onClick={startNewPrompt} className="text-sm text-teal-300 hover:text-teal-200">+ New</button>
              </div>

              <div className="flex flex-col gap-2">
                {customisations.map((item) => (
                  <div key={item.id} className={`rounded-lg border p-3 ${customisationId === item.id ? "border-teal-300 bg-teal-300/10" : "border-white/10"}`}>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => {
                        setCustomisationId(item.id);
                        setShowPrompts(false);
                      }}
                    >
                      <span className="block text-sm font-semibold">{item.name}</span>
                      <span className="mt-1 block line-clamp-2 text-xs text-white/50">{item.system_prompt}</span>
                    </button>
                    {!item.builtin && (
                      <div className="mt-2 flex gap-3 text-xs">
                        <button type="button" onClick={() => startEditing(item)} className="text-teal-300 hover:text-teal-200">Edit</button>
                        <button type="button" onClick={() => void removePrompt(item)} className="text-red-300 hover:text-red-200">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">{editingId ? "Edit prompt" : "New prompt"}</h3>
                <button type="button" onClick={() => setShowPrompts(false)} aria-label="Close prompt manager" className="text-white/60 hover:text-white">✕</button>
              </div>
              <label className="mb-1 block text-xs text-white/60" htmlFor="prompt-name">Name</label>
              <Input
                id="prompt-name"
                value={name}
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                tone="light"
                opacity={0.05}
                borderOpacity={0.1}
                focus="border"
                padding="0.5rem"
                className="mb-3 text-sm"
                placeholder="Legal analyst"
              />
              <label className="mb-1 block text-xs text-white/60" htmlFor="system-prompt">Prompt</label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                maxLength={8000}
                rows={12}
                onChange={(event) => setSystemPrompt(event.target.value)}
                tone="light"
                opacity={0.05}
                borderOpacity={0.1}
                focus="border"
                padding="0.75rem"
                className="resize-y text-sm"
                placeholder="Tell the model how it should behave…"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-white/40">{systemPrompt.length}/8000</span>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void savePrompt()}
                  variant="primary"
                  padding="0.5rem 1rem"
                  className="text-sm font-semibold"
                >
                  {busy ? "Saving…" : editingId ? "Save changes" : "Save and use"}
                </Button>
              </div>
              {error && <p className="mt-3 text-xs text-red-300" aria-live="polite">{error}</p>}
            </div>
          </Surface>
        </Surface>
      )}
    </Surface>
  );
}

function SettingSlider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm">
        <span>{props.label}</span>
        <span className="text-teal-300">{props.value}</span>
      </div>
      <input type="range" min={props.min} max={props.max} step={props.step} value={props.value} onChange={(event) => props.onChange(Number(event.target.value))} className="w-full" />
    </div>
  );
}
