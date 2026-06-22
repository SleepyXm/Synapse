"use client";

import { useState } from "react";
import { Model } from "../types/models";

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
      <input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="Search a model to compare..."
        className="w-full bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder:text-gray-500 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/50 transition"
      />
      {loading && (
        <p className="text-xs text-gray-500 mt-1 px-1">Searching...</p>
      )}
      {models.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-black/90 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelect(model.id)}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-teal-500/20 transition truncate"
            >
              {model.id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}