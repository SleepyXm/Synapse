"use client";

import { useState } from "react";
import { Model } from "@/app/components/types/models";
import { Input, Surface } from "@/app/UI";

type MiniModelSearchProps = {
  onSelect: (modelId: string) => void;
};

export default function MiniModelSearch({ onSelect }: MiniModelSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchModels = async (value: string) => {
    if (!value.trim()) {
      setModels([]);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/models?search=${encodeURIComponent(value)}&sort=trending&withCount=false`);
      if (!res.ok) throw new Error("Failed to fetch models");
      const data: { models: Model[] } = await res.json();
      setModels(data.models?.slice(0, 6) ?? []);
    } catch {
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchModels(value);
  };

  const handleSelect = (modelId: string) => {
    onSelect(modelId);
    setSearchTerm(modelId);
    setModels([]);
  };

  return (
    <div className="relative w-full">
      <Input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Search a model to compare..."
        tone="light"
        opacity={0.1}
        borderOpacity={0.2}
        radius="0.75rem"
        padding="0.5rem 0.75rem"
        focus="ring"
        width="100%"
        className="text-sm placeholder:text-gray-500 transition"
      />
      {loading && (
        <p className="text-xs text-gray-500 mt-1 px-1">Searching...</p>
      )}
      {models.length > 0 && (
        <Surface opacity={0.9} borderOpacity={0.1} radius="0.75rem" shadow width="100%" className="absolute z-50 mt-1 overflow-hidden">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelect(model.id)}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-teal-500/20 transition truncate"
            >
              {model.id}
            </button>
          ))}
        </Surface>
      )}
    </div>
  );
}
