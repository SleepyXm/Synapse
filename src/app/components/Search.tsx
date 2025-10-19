"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Model } from "../types/models";
import Image from "next/image"

export default function ModelExplorer() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  // Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("trending");

  function formatParams(num: number): string {
    if (!num) return "N/A";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    return num.toString();
  }

  // Utility to get difficulty rating 1–10
  function paramRating(num: number): number {
    if (!num) return 0;
    if (num < 1e9) return 1; // <1B
    if (num < 6e9) return 3; // <6B
    if (num < 10e9) return 5; // <10B
    if (num < 37.5e9) return 7; // <27B
    return 10; // 10B+
  }

  // Utility to get difficulty color
  function ratingColor(rating: number): string {
    if (rating <= 5) return "#34ff7eff";
    if (rating <= 7) return "#fdc662ff";
    return "#f30051ff";
  }

  const fetchModels = async () => {
    if (!searchTerm.trim()) {
      setModels([]);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/models?search=${encodeURIComponent(
          searchTerm
        )}&sort=${sortBy}&withCount=true`
      );

      if (!res.ok) throw new Error("Failed to fetch models");

      const data: { models: Model[] } = await res.json();
      setModels(data.models || []);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      tabIndex={0}
      className="p-4 bg-black/20 backdrop-blur rounded-2xl shadow-2xl overflow-hidden mr-24"
      layout
      transition={{ duration: 0.2, ease: "easeInOut" }}
      style={{ width: "fit-content", maxWidth: "100%" }}
    >
      <h2 className="text-xl font-bold mb-4 text-white text-center">
        Open-Source Model Finder
      </h2>

      {/* Search + Sort Controls */}
      <div className="mb-4 flex justify-center">
        <div
          className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/60 backdrop-blur p-2 shadow-2xl flex gap-2 items-center focus-within:ring-2 focus-within:ring-emerald-400 ease-in-out duration-450"
          tabIndex={-1} // not strictly necessary, but good if you want focus styles
          onClick={(e) => {
            // focus the input when container is clicked
            const input = e.currentTarget.querySelector(
              "input"
            ) as HTMLInputElement;
            input?.focus();
          }}
        >
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 text-white px-2 py-1 rounded-md"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-black/40 border border-white/15 text-white text-sm rounded-md px-2 py-1 hover:border-white/25 transition"
          >
            <option value="trending">Trending</option>
            <option value="downloads">Downloads</option>
            <option value="likes">Likes</option>
            <option value="updated">Recently Updated</option>
          </select>

          <button
            onClick={() => {
              fetchModels();
            }}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-blue-200 text-black hover:bg-teal-500 transition"
          >
            Search
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>

      {loading && <p>Loading models...</p>}
      {/* Grid of models */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {models.map((model) => (
          <div
            key={model.id}
            className="flex flex-col border border-white/10 rounded-2xl bg-black/60 p-3 shadow-2xl hover:border-teal-400 transition ease-in-out duration-350"
          >
            <Image
              src={model.authorData.avatarUrl}
              alt={model.authorData.fullname}
              width={40}
              height={40}
              className="rounded-full mb-2"
            />
            <a
              href={`/model/${model.id}`}
              className="font-bold text-white hover:text-teal-500 transition-colors mb-1"
            >
              {model.id}
            </a>
            <div className="text-sm text-gray-300 mb-1">
              by{" "}
              <span style={{ color: "#21aaffff" }} className="font-semibold">
                {model.authorData.fullname}
              </span>
            </div>
            <div className="text-sm text-gray-300 mb-1">
              {model.downloads.toLocaleString()} downloads
            </div>
            <div className="text-sm text-gray-300">
              Param count:{" "}
              <span
                className="font-bold"
                style={{ color: ratingColor(paramRating(model.numParameters)) }}
              >
                {formatParams(model.numParameters)}
              </span>
            </div>
            <div className="text-sm text-gray-300 mb-1">
              Type: {model.pipeline_tag}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
