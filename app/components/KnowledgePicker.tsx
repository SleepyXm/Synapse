"use client";

import { useEffect, useState } from "react";
import { KnowledgeBase, listKnowledgeBases } from "@/app/handlers/knowledge";

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function KnowledgePicker({ selected, onChange, disabled = false, compact = false }: Props) {
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listKnowledgeBases()
      .then((items) => { if (active) setBases(items); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load knowledge bases.");
      });
    return () => { active = false; };
  }, []);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  if (error) return <p className="text-xs text-red-300">{error}</p>;
  if (bases.length === 0) {
    return <p className="text-xs text-white/45">No knowledge bases yet.</p>;
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-2"}>
      {bases.map((base) => (
        <label
          key={base.id}
          className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80"
          title={base.description}
        >
          <input
            type="checkbox"
            checked={selected.includes(base.id)}
            disabled={disabled}
            onChange={() => toggle(base.id)}
            className="mt-0.5"
          />
          <span>
            <span className="block text-white">{base.name}</span>
            <span className="text-white/45">{base.ready_documents} ready document{base.ready_documents === 1 ? "" : "s"}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
