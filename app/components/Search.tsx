"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Model } from "@/app/components/types/models";
import Image from "next/image";
import { Button, Input, Select, Surface, surfaceProps } from "@/app/UI";

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
          searchTerm,
        )}&sort=${sortBy}&withCount=true`,
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

  const explorerSurface = surfaceProps(
    {
      opacity: 0.2,
      blur: "md",
      radius: "1rem",
      padding: "1rem",
      shadow: true,
    },
    "overflow-hidden w-xl",
    { width: "fit-content", maxWidth: "100%" },
  );

  return (
    <motion.div
      tabIndex={0}
      {...explorerSurface}
      layout
      transition={{ duration: 0.2, ease: "easeInOut"}}
    >
      <h2 className="text-xl font-bold mb-4 text-white text-center">
        Open-Source Model Finder
      </h2>

      {/* Search + Sort Controls */}
      <div className="mb-4 flex justify-center w-full px-2">
        <Surface
          opacity={0.35}
          borderOpacity={0.1}
          blur="md"
          radius="1rem"
          padding="0.5rem"
          shadow
          width="100%"
          maxWidth="42rem"
          className="flex flex-col sm:flex-row gap-2 items-center focus-within:ring-2 focus-within:ring-emerald-400 ease-in-out duration-450"
          tabIndex={-1}
          onClick={(e) => {
            const input = e.currentTarget.querySelector(
              "input",
            ) as HTMLInputElement;
            input?.focus();
          }}
        >
          <Input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            tone="transparent"
            radius="0.375rem"
            padding="0.25rem 0.5rem"
            fullWidth={false}
            className="flex-1 text-sm placeholder:text-gray-400 w-full sm:w-auto"
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            tone="dark"
            opacity={0.4}
            borderOpacity={0.15}
            radius="0.375rem"
            padding="0.25rem 0.5rem"
            fullWidth={false}
            className="text-sm hover:border-white/25 transition w-full sm:w-auto"
          >
            <option value="trending">Trending</option>
            <option value="downloads">Downloads</option>
            <option value="likes">Likes</option>
            <option value="updated">Recently Updated</option>
          </Select>

          <Button
            onClick={fetchModels}
            variant="action"
            height="2.25rem"
            padding="0 0.75rem"
            className="w-full sm:w-auto"
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
          </Button>
        </Surface>
      </div>

      {loading && <p>Loading models...</p>}
      {/* Grid of models */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {models.map((model) => (
          <Surface
            key={model.id}
            opacity={0.35}
            borderOpacity={0.1}
            radius="1rem"
            padding="0.75rem"
            shadow
            className="flex flex-col hover:border-teal-400 transition ease-in-out duration-350"
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
          </Surface>
        ))}
      </div>
    </motion.div>
  );
}
